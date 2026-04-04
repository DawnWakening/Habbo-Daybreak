# Arcturus Community Packet Review

## Scope

- Branch reviewed: `develop`
- Source scope:
- `src/main/java/com/eu/habbo/messages/**/*.java`
- `src/main/java/com/eu/habbo/networking/gameserver/**/*.java`
- directly related packet/session classes used in packet flow
- `src/main/java/com/eu/habbo/habbohotel/gameclients/*.java`
- `src/main/java/com/eu/habbo/threading/runnables/ChannelReadHandler.java`
- `src/main/java/com/eu/habbo/networking/rconserver/*.java`

- Non-Java files were intentionally excluded.
- This file focuses on packet/protocol architecture, packet flow, handler/composer structure, and packet-layer correctness risks.

## Purpose

- This document is the packet/protocol baseline for later comparison against the client project.
- It should be read together with `PROJECT.md`.
- Use this file when the comparison question is about packet IDs, packet semantics, auth boundaries, login flow, packet families, or composer coverage.

## Executive Summary

- The packet system follows a classic Habbo-emulator design: one handler class per incoming packet and one composer class per outgoing packet.
- Transport is Netty-based and passes through a clear decode -> rate-limit -> dispatch -> encode pipeline.
- `PacketManager` is the main protocol brain.
- Authentication boundaries are enforced centrally through `@NoAuthMessage`.
- Encryption is negotiated in-band through Diffie-Hellman and then implemented with RC4 handlers dynamically inserted into the pipeline.
- The packet layer is large but understandable.
- The main weaknesses are maintainability and robustness rather than total opacity.
- The biggest issues are the giant manual registry in `PacketManager`, silent packet-read fallbacks in `ClientMessage`, brittle callback unregistering, and weak RCON framing/auth assumptions.

## Protocol Architecture Overview

### Core Model

- Incoming game traffic is modeled as `ClientMessage`.
- Outgoing game traffic is modeled as `ServerMessage`.
- Business logic for incoming packets is implemented through subclasses of `MessageHandler`.
- Business logic for outgoing packets is implemented through subclasses of `MessageComposer`.
- Packet IDs live in `Incoming.java` and `Outgoing.java`.
- Packet-name lookup for logging/debugging is built through reflection in `PacketNames.java`.

### Main Protocol Classes

- `PacketManager.java` - Central incoming registry, auth gate, ratelimit, logging, and dispatch.
- `ClientMessage.java` - Inbound packet wrapper with typed body readers.
- `ServerMessage.java` - Outgoing packet builder with header and length framing.
- `incoming/MessageHandler.java` - Base class for all incoming packet handlers.
- `outgoing/MessageComposer.java` - Base class for lazily composed outbound packets.
- `PacketNames.java` - Reflective packet-id to symbolic-name lookup map.
- `NoAuthMessage.java` - Annotation marking handlers allowed before login.
- `ICallable.java` - Hook interface for pre-handle packet callbacks.

### Packet Registry Strategy

- Incoming packets are manually registered by numeric header inside `PacketManager`.
- Registration is split by feature area through methods like `registerHandshake`, `registerCatalog`, `registerRooms`, and `registerUsers`.
- Handlers are stored as `Class<? extends MessageHandler>` and instantiated reflectively per packet.

Implications:
- Registry ownership is very explicit.
- Merge conflicts are more likely as packet coverage grows.
- Missing registration is easy to introduce.
- Per-packet reflective construction increases indirection and makes dependency injection harder.

### Outgoing Composer Strategy

- Outgoing packets are built by constructing a `MessageComposer` and calling `compose()`.
- `MessageComposer` lazily caches the built `ServerMessage`.
- Most composers follow a simple pattern:
- call `response.init(Outgoing.SomePacket)`
- append fields in packet order
- return `response`

Implications:
- The composer pattern is easy to read.
- Serialization logic is very discoverable.
- The packet layer scales better on the outgoing side than on the incoming registry side.

## Netty Transport Pipeline

### Game Server Pipeline Order

`GameServer.initializePipeline()` builds the child pipeline in this order:

1. `LoggingHandler`
2. `GamePolicyDecoder`
3. `GameByteFrameDecoder`
4. `GameByteDecoder`
5. optional `GameClientMessageLogger`
6. `IdleTimeoutHandler`
7. `GameMessageRateLimit`
8. `GameMessageHandler`
9. `GameServerMessageEncoder`
10. optional `GameServerMessageLogger`

After Diffie-Hellman completes, the pipeline gains:

- `GameByteEncryption`
- `GameByteDecryption`

These are inserted with `addFirst(...)`, so encryption and decryption occur before the standard framing and encoding flow.

### Transport Responsibilities By Stage

- `GamePolicyDecoder` handles Flash-era policy requests.
- `GameByteFrameDecoder` strips the 4-byte packet length prefix.
- `GameByteDecoder` turns a framed byte buffer into a `ClientMessage`.
- `IdleTimeoutHandler` tracks pong messages and periodically sends ping messages.
- `GameMessageRateLimit` performs cheap per-header rate limiting.
- `GameMessageHandler` routes packets into `PacketManager` directly or through the thread pool.
- `GameServerMessageEncoder` writes composed `ServerMessage` bytes to the channel.

### Frame Format

Observed game packet structure:

- 4-byte packet length
- 2-byte packet header
- variable-length payload

`GameByteFrameDecoder` strips the length.
`GameByteDecoder` reads the 2-byte header and copies the remaining payload into a new buffer.

### Maximum Frame Size

- `GameByteFrameDecoder` sets `MAX_PACKET_LENGTH = 417792`.
- The comment ties this to maximum camera PNG size plus some overhead.

Implication:
- The transport layer explicitly expects large camera-related packets.

## Session and Dispatch Flow

### Session Ownership

- `GameClientManager` owns active sessions in a `ConcurrentMap<ChannelId, GameClient>`.
- `GameMessageHandler.channelRegistered()` asks `GameClientManager` to create and attach a `GameClient`.
- The `GameClient` is stored in the channel attribute `GameServerAttributes.CLIENT`.

### `GameClient`

`GameClient` holds:

- the Netty channel
- optional `HabboEncryption`
- attached authenticated `Habbo`
- handshake-complete state
- machine ID
- incoming packet counters
- per-handler timestamp map for handler-level ratelimiting

It is the bridge between transport and domain state.

### Dispatch Path

1. `GameMessageHandler.channelRead()` receives a decoded `ClientMessage`.
2. It wraps the work in `ChannelReadHandler`.
3. Dispatch is either:
- synchronous via `handler.run()`
- asynchronous via `Emulator.getThreading().run(handler)` if multithreaded packet handling is enabled
4. `ChannelReadHandler` retrieves the `GameClient` from channel attributes.
5. It calls `PacketManager.handlePacket(client, message)`.
6. It always releases the packet buffer in `finally`.

Implication:
- Packet buffer lifecycle is centrally handled.
- Multithreaded packet handling introduces concurrency pressure into downstream room/user/item logic.

## Authentication Boundary

### Central Gate

Inside `PacketManager.handlePacket(...)`:

- if `client.getHabbo() == null`
- and the handler class is not annotated with `@NoAuthMessage`
- the packet is rejected

This is the main auth boundary for game packets.

### No-Auth Handlers

Observed no-auth handshake handlers:

- `ReleaseVersionEvent`
- `InitDiffieHandshakeEvent`
- `CompleteDiffieHandshakeEvent`
- `MachineIDEvent`
- `SecureLoginEvent`

Implication:
- Login and crypto negotiation are allowed before a `Habbo` object is attached.
- Everything else is expected to be post-auth unless explicitly marked.

### Important Note About `UsernameEvent`

- `UsernameEvent` is not a no-auth handler.
- That implies it is part of post-login initialization rather than raw authentication.

## Handshake and Encryption Flow

### Handshake Components

- `ReleaseVersionEvent.java` - Consumes release/version handshake data.
- `InitDiffieHandshakeEvent.java` - Starts DH handshake and sends signed params.
- `CompleteDiffieHandshakeEvent.java` - Completes DH key exchange and installs RC4 handlers.
- `MachineIDEvent.java` - Reads or replaces client machine id.
- `SecureLoginEvent.java` - Authenticates SSO login and sends login bootstrap packets.

### Start of Handshake

`InitDiffieHandshakeEvent.handle()`:

- verifies that `client.getEncryption()` exists
- disconnects if crypto state is missing
- sends `InitDiffieHandshakeComposer` with signed prime and signed generator

### Completion of Handshake

`CompleteDiffieHandshakeEvent.handle()`:

- verifies that encryption exists
- reads the client public key from the packet string
- computes the shared key through Diffie-Hellman
- marks the client handshake as finished
- sends `CompleteDiffieHandshakeComposer` with server public key
- stores `HabboRC4` instances in channel attributes
- inserts `GameByteDecryption` and `GameByteEncryption` at the front of the pipeline

### Encryption Implementation

`GameByteDecryption`:

- reads all available bytes into a new buffer
- applies `CRYPTO_CLIENT.parse(data.array())`
- passes the decrypted bytes onward

`GameByteEncryption`:

- reads all available outbound bytes into a new buffer
- releases the original buffer
- applies `CRYPTO_SERVER.parse(data.array())`
- writes encrypted bytes onward

### Encryption Caveats

- Both handlers operate on `data.array()`.
- That assumes a heap-backed `ByteBuf` with accessible backing array.
- It works with current usage, but it tightly couples the implementation to buffer assumptions.

### Forced Encryption Mode

`SecureLoginEvent` checks:

- `encryption.forced`
- `Emulator.getCrypto().isEnabled()`
- `client.isHandshakeFinished()`

If encryption is forced and the handshake is incomplete, the connection is disposed.

## Login Flow

### `SecureLoginEvent`

`SecureLoginEvent.handle()` performs these major steps:

1. verifies the channel is still open
2. waits until `Emulator.isReady`
3. enforces forced-encryption policy if configured
4. reads the SSO token from the packet string and strips spaces
5. fires `SSOAuthenticationEvent`
6. loads the `Habbo` through `HabboManager`
7. attaches client and habbo to each other
8. calls `habbo.connect()`
9. validates rank/profile state
10. starts background or deferred habbo work through the thread pool
11. adds the habbo to the online registry
12. optionally validates look/clothing
13. sends a large login bootstrap batch of composers
14. sends additional achievement/moderation/navigation payloads
15. fires `UserLoginEvent`
16. optionally sends welcome alert and processes club/subscription side effects

### Login Bootstrap Payload Examples

Observed composers sent during login bootstrap include:

- `SecureLoginOKComposer`
- `UserHomeRoomComposer`
- `UserEffectsListComposer`
- `UserClothesComposer`
- `NewUserIdentityComposer`
- `UserPermissionsComposer`
- `AvailabilityStatusMessageComposer`
- `PingComposer`
- `EnableNotificationsComposer`
- `UserAchievementScoreComposer`
- `IsFirstLoginOfDayComposer`
- `MysteryBoxKeysComposer`
- `BuildersClubExpiredComposer`
- `CfhTopicsMessageComposer`
- `FavoriteRoomsCountComposer`
- `GameCenterGameListComposer`
- `GameCenterAccountInfoComposer`
- `UserClubComposer`
- `ModToolComposer` when permissions allow it

Observation:
- The login bootstrap is large and product-specific.
- This will be an important area to compare against the client project later.

## Keepalive and Liveness

### `IdleTimeoutHandler`

Behavior:

- schedules a recurring ping task
- updates `lastPongTime` whenever an incoming packet has header `Incoming.PongEvent`
- closes the channel if pong timeout is exceeded
- sends `PingComposer` through `GameClient`

Implication:
- Keepalive is packet-aware rather than relying only on TCP idle state.
- Ping and pong behavior are part of protocol alignment.

## Rate Limiting

### Transport-Level Header Limiting

`GameMessageRateLimit`:

- resets packet counters once per second
- counts messages by packet ID per client
- drops packets when the counter is above `MAX_COUNTER`

Characteristics:

- cheap and generic
- silent drop behavior
- no feedback packet
- no metrics or sanctions visible here

### Handler-Level Semantic Limiting

`MessageHandler.getRatelimit()` defaults to `0`.
When a handler overrides it:

- `PacketManager` tracks last execution time per handler class per client
- packets inside the limit window are rejected

Implication:
- The system supports feature-specific ratelimiting without having to create a separate transport handler.

### Limiting Concerns

- Silent drops are hard to debug.
- With multithreaded packet handling, semantic order may still become complex even when ratelimited.

## Packet Logging and Debugging

### Packet Name Resolution

`PacketNames.initialize()` reflects over `Incoming.class` and `Outgoing.class`.

- public static final int fields become packet names
- duplicate positive IDs are logged as warnings
- negative IDs are skipped

### Pipeline Loggers

- `GameClientMessageLogger` logs inbound packets.
- `GameServerMessageLogger` logs outbound packets.
- They are only inserted if `PacketManager.DEBUG_SHOW_PACKETS` is true.

### Selective Packet Logging

`PacketManager.onConfigurationUpdated(...)` reads `debug.show.headers` and builds a list of packet IDs for additional logging.

When a matching packet is received and the session is authenticated:

- username
- packet ID
- formatted packet body

are logged.

Implication:
- There are two layers of logging:
- broad pipeline-level debug logging
- selective per-header logging

## RCON Messaging Model

### Separation From Game Packets

- RCON is not part of the Habbo binary packet protocol.
- It is a separate TCP/JSON control channel.
- It does not use `ClientMessage`, `ServerMessage`, `MessageHandler`, or `MessageComposer`.

### `RCONServer`

- Maintains a map of string command keys to `RCONMessage` subclasses.
- Uses Gson for JSON parsing and response serialization.
- Loads allowed addresses from `rcon.allowed`.
- Registers commands like:
- `alertuser`
- `disconnect`
- `givebadge`
- `givecredits`
- `givepixels`
- `givepoints`
- `hotelalert`
- `sendgift`
- `sendroombundle`
- `setrank`
- `updatewordfilter`
- `updatecatalog`
- `executecommand`
- `progressachievement`
- `updateuser`
- `friendrequest`
- `imagehotelalert`
- `imagealertuser`
- `stalkuser`
- `staffalert`
- `modticket`
- `talkuser`
- `changeroomowner`
- `muteuser`
- `giverespect`
- `ignoreuser`
- `setmotto`
- `giveuserclothing`
- `modifysubscription`
- `changeusername`

### `RCONServerHandler`

Behavior:

- checks remote IP on `channelRegistered`
- closes immediately if the address is not allowlisted
- on read, treats the received bytes as one full JSON message
- parses `key` and `data`
- delegates to `RCONServer.handle(...)`
- writes a JSON response string
- closes the connection

### RCON Caveats

- This is request-per-connection style behavior.
- There is no framing protocol beyond assuming one request body per read.
- It depends on IP allowlisting rather than explicit auth tokens or TLS inside the shown code.

Note: Domain-layer defects (guilds, guides, moderation, navigation, games, tiles) are documented in `PROJECT.md` → `Confirmed Defects`. This section covers only defects whose root cause is in the packet or transport layer.

## Confirmed Packet-Layer Defects

1. `PacketManager.unregisterCallables(Integer header)` clears the full callable map.
File: `src/main/java/com/eu/habbo/messages/PacketManager.java:161-164`
Impact: Removing callbacks for one packet unregisters callbacks for all packets.
Note: The two-argument overload `unregisterCallables(Integer header, ICallable callable)` at lines 155-159 is correct — it removes only the named callable for the given header. Only the single-argument form is broken.

2. `ClientMessage` silently returns default values on read failures.
File: `src/main/java/com/eu/habbo/messages/ClientMessage.java:35-70`
Impact: Malformed packet bodies can be treated as valid `0`, `false`, or empty-string values.

3. `ClientMessage.readString()` uses platform-default charset.
File: `src/main/java/com/eu/habbo/messages/ClientMessage.java:62-68`
Impact: Packet string decoding behavior changes based on the JVM's default locale/encoding. On systems where the default charset is not UTF-8 (e.g., some Windows environments or non-UTF-8 Linux locales), non-ASCII characters in incoming strings (usernames, chat messages, room names) will be decoded incorrectly and silently. The correct fix is to use `StandardCharsets.UTF_8` explicitly.

4. `ServerMessage.appendString()` uses platform-default charset.
File: `src/main/java/com/eu/habbo/messages/ServerMessage.java:56-66`
Impact: Outgoing string encoding has the same implicit environment dependency. If the server's default charset differs from what the client expects (UTF-8), strings in outgoing packets — including usernames, room descriptions, and catalog text — will be garbled for non-ASCII content on affected environments.

5. `GameMessageRateLimit` effectively allows one more packet than `MAX_COUNTER` suggests.
File: `src/main/java/com/eu/habbo/networking/gameserver/decoders/GameMessageRateLimit.java:38-43`
Impact: The threshold is off by one relative to the comment/intent.

6. `GameByteDecryption` assumes accessible backing arrays.
File: `src/main/java/com/eu/habbo/networking/gameserver/decoders/GameByteDecryption.java:17-25`
Impact: The implementation is tightly coupled to heap-backed `ByteBuf` behavior.

7. `GameByteEncryption` assumes accessible backing arrays.
File: `src/main/java/com/eu/habbo/networking/gameserver/encoders/GameByteEncryption.java:13-27`
Impact: Same buffer-model coupling exists on outbound encryption.

8. `RCONServerHandler` treats whatever bytes were read as one full JSON request.
File: `src/main/java/com/eu/habbo/networking/rconserver/RCONServerHandler.java:35-59`
Impact: Partial reads or coalesced messages are not explicitly framed or handled.

9. `RCONServerHandler` also uses default charset when reading and writing request/response text.
File: `src/main/java/com/eu/habbo/networking/rconserver/RCONServerHandler.java:38-55`
Impact: RCON text encoding is implicitly environment-dependent. RCON commands or responses containing non-ASCII content (e.g., hotel names, alert text) will be mangled on non-UTF-8 systems. Since RCON is typically used by admin tools, this is a silent correctness risk in hotel administration workflows.

10. `IsFirstLoginOfDayComposer.java` is misplaced under `incoming/handshake`.
Path: `src/main/java/com/eu/habbo/messages/incoming/handshake/IsFirstLoginOfDayComposer.java`
Impact: The class extends `MessageComposer` and sends an outgoing packet via `Outgoing.IsFirstLoginOfDayComposer` — it is an outgoing composer by type and behavior, not an incoming handler. Placing it under `incoming/handshake` is a mislabeling that breaks the structural contract of the package layout and makes it invisible to any tool or audit that searches the `outgoing/` tree for composer coverage.

## Probable Packet-Layer Risks

1. Manual packet registration in `PacketManager` is brittle and hard to audit as the codebase evolves.
2. Reflection-based handler construction makes dependency injection and testing harder.
3. Unknown and placeholder packets are mixed into production-facing ID catalogs.
4. Some packet names and class names contain typos, which makes cross-project alignment harder. Known examples: `UnkownPetPackageComposer.java` (missing 'n' in Unknown), `RequestUserCitizinShipEvent.java` (misspelled "Citizenship").
5. RCON security posture appears weak if network boundaries are not tightly controlled.

## Incoming Packet Domains

### Core Packet Infrastructure

- `ClientMessage.java` - Inbound packet wrapper with typed body readers.
- `ICallable.java` - Hook interface for pre-handle packet callbacks.
- `ISerialize.java` - Interface for objects that serialize themselves into `ServerMessage`.
- `NoAuthMessage.java` - Annotation marking handlers allowed before login.
- `PacketManager.java` - Central incoming registry, auth gate, ratelimit, logging, and dispatch.
- `PacketNames.java` - Reflective packet-id to symbolic-name lookup map.
- `ServerMessage.java` - Outgoing packet builder with header and length framing.
- `ServerMessageException.java` - Runtime exception for outbound packet build failures.
- `incoming/Incoming.java` - Numeric incoming packet ID catalog.
- `incoming/MessageHandler.java` - Base class for all incoming packet handlers.

### Incoming Achievement Packets

- `achievements/RequestAchievementConfigurationEvent.java` - Requests achievement configuration data.
- `achievements/RequestAchievementsEvent.java` - Requests user achievement list/progress.

### Incoming Ambassador Packets

- `ambassadors/AmbassadorAlertCommandEvent.java` - Handles ambassador alert command packets.
- `ambassadors/AmbassadorVisitCommandEvent.java` - Handles ambassador visit command packets.

### Incoming Camera Packets

- `camera/CameraPurchaseEvent.java` - Handles camera purchase requests.
- `camera/CameraPublishToWebEvent.java` - Handles web publish requests for camera output.
- `camera/CameraRoomPictureEvent.java` - Handles room picture capture/upload requests.
- `camera/CameraRoomThumbnailEvent.java` - Handles room thumbnail submission.
- `camera/RequestCameraConfigurationEvent.java` - Requests camera pricing/configuration.

### Incoming Catalog Packets

- `catalog/CatalogBuyClubDiscountEvent.java` - Buys a club discount offer.
- `catalog/CatalogBuyItemAsGiftEvent.java` - Buys a catalog item as a gift.
- `catalog/CatalogBuyItemEvent.java` - Buys a catalog item.
- `catalog/CatalogRequestClubDiscountEvent.java` - Requests club discount data.
- `catalog/CatalogSearchedItemEvent.java` - Performs a catalog item search.
- `catalog/CatalogSelectClubGiftEvent.java` - Selects a club gift.
- `catalog/CheckPetNameEvent.java` - Validates a pet name.
- `catalog/JukeBoxRequestTrackCodeEvent.java` - Requests jukebox track code metadata.
- `catalog/JukeBoxRequestTrackDataEvent.java` - Requests jukebox track data.
- `catalog/PurchaseTargetOfferEvent.java` - Purchases a targeted offer.
- `catalog/RedeemVoucherEvent.java` - Redeems a voucher code.
- `catalog/RequestCatalogIndexEvent.java` - Requests catalog index/tree.
- `catalog/RequestCatalogModeEvent.java` - Requests catalog mode/setup payload.
- `catalog/RequestCatalogPageEvent.java` - Requests one catalog page.
- `catalog/RequestClubDataEvent.java` - Requests club subscription data.
- `catalog/RequestClubGiftsEvent.java` - Requests available club gifts.
- `catalog/RequestDiscountEvent.java` - Requests discount data.
- `catalog/RequestGiftConfigurationEvent.java` - Requests gift configuration data.
- `catalog/RequestMarketplaceConfigEvent.java` - Requests marketplace configuration.
- `catalog/RequestPetBreedsEvent.java` - Requests pet breed list.
- `catalog/TargetOfferStateEvent.java` - Updates or requests targeted-offer state.

Marketplace subdomain:
- `catalog/marketplace/BuyItemEvent.java` - Buys a marketplace listing.
- `catalog/marketplace/RequestCreditsEvent.java` - Requests marketplace credit info or fees.
- `catalog/marketplace/RequestItemInfoEvent.java` - Requests marketplace item details.
- `catalog/marketplace/RequestOffersEvent.java` - Requests marketplace offers.
- `catalog/marketplace/RequestOwnItemsEvent.java` - Requests user marketplace listings.
- `catalog/marketplace/RequestSellItemEvent.java` - Starts marketplace sell flow.
- `catalog/marketplace/SellItemEvent.java` - Posts an item for sale.
- `catalog/marketplace/TakeBackItemEvent.java` - Cancels or reclaims a listing.

Recycler subdomain:
- `catalog/recycler/OpenRecycleBoxEvent.java` - Opens recycler reward box.
- `catalog/recycler/RecycleEvent.java` - Submits items to recycler.
- `catalog/recycler/ReloadRecyclerEvent.java` - Refreshes recycler state.
- `catalog/recycler/RequestRecyclerLogicEvent.java` - Requests recycler rules/state.

### Incoming Crafting Packets

- `crafting/CraftingAddRecipeEvent.java` - Adds or unlocks a crafting recipe.
- `crafting/CraftingCraftItemEvent.java` - Crafts a normal recipe.
- `crafting/CraftingCraftSecretEvent.java` - Crafts a secret recipe.
- `crafting/RequestCraftingRecipesAvailableEvent.java` - Requests craftable/available recipes.
- `crafting/RequestCraftingRecipesEvent.java` - Requests recipe definitions.

### Incoming Event Calendar Packets

- `events/calendar/AdventCalendarForceOpenEvent.java` - Force-opens a calendar day.
- `events/calendar/AdventCalendarOpenDayEvent.java` - Opens a calendar day.

### Incoming Floorplan Editor Packets

- `floorplaneditor/FloorPlanEditorRequestBlockedTilesEvent.java` - Requests blocked tile data.
- `floorplaneditor/FloorPlanEditorRequestDoorSettingsEvent.java` - Requests door settings.
- `floorplaneditor/FloorPlanEditorSaveEvent.java` - Saves edited floorplan data.

### Incoming Friends Packets

- `friends/AcceptFriendRequestEvent.java` - Accepts a friend request.
- `friends/ChangeRelationEvent.java` - Changes a friend relation value.
- `friends/DeclineFriendRequestEvent.java` - Declines friend requests.
- `friends/FindNewFriendsEvent.java` - Triggers friend suggestion search.
- `friends/FriendPrivateMessageEvent.java` - Sends a messenger private message.
- `friends/FriendRequestEvent.java` - Sends a friend request.
- `friends/InviteFriendsEvent.java` - Sends room/activity invitations to friends.
- `friends/RemoveFriendEvent.java` - Removes a friend.
- `friends/RequestFriendRequestsEvent.java` - Requests pending friend requests.
- `friends/RequestFriendsEvent.java` - Requests friend list data.
- `friends/RequestInitFriendsEvent.java` - Requests messenger init payload.
- `friends/SearchUserEvent.java` - Searches for users.
- `friends/StalkFriendEvent.java` - Follows or locates a friend.

### Incoming Game Center Packets

- `gamecenter/GameCenterEvent.java` - Miscellaneous game-center action packet.
- `gamecenter/GameCenterJoinGameEvent.java` - Joins a game.
- `gamecenter/GameCenterLeaveGameEvent.java` - Leaves a game.
- `gamecenter/GameCenterLoadGameEvent.java` - Loads a selected game.
- `gamecenter/GameCenterRequestAccountStatusEvent.java` - Requests game-center account status.
- `gamecenter/GameCenterRequestGamesEvent.java` - Requests game list.
- `gamecenter/GameCenterRequestGameStatusEvent.java` - Requests status for a game/session.

### Incoming Guardian Packets

- `guardians/GuardianAcceptRequestEvent.java` - Accepts a guardian case/request.
- `guardians/GuardianNoUpdatesWantedEvent.java` - Opts out of guardian updates.
- `guardians/GuardianVoteEvent.java` - Submits guardian moderation vote.

### Incoming Guide Packets

- `guides/GuideCancelHelpRequestEvent.java` - Cancels a guide help request.
- `guides/GuideCloseHelpRequestEvent.java` - Closes a guide session/request.
- `guides/GuideHandleHelpRequestEvent.java` - Accepts or handles a guide request.
- `guides/GuideInviteUserEvent.java` - Invites a user in guide workflow.
- `guides/GuideRecommendHelperEvent.java` - Recommends a helper.
- `guides/GuideReportHelperEvent.java` - Reports a helper.
- `guides/GuideUserMessageEvent.java` - Sends a message in guide chat.
- `guides/GuideUserTypingEvent.java` - Sends typing status in guide chat.
- `guides/GuideVisitUserEvent.java` - Visits a guide/user target.
- `guides/RequestGuideAssistanceEvent.java` - Requests guide assistance.
- `guides/RequestGuideToolEvent.java` - Opens or requests guide tool data.

### Incoming Guild Packets

Guild core:
- `guilds/GetHabboGuildBadgesMessageEvent.java` - Requests guild badges for visible users.
- `guilds/GuildAcceptMembershipEvent.java` - Accepts a guild join request.
- `guilds/GuildChangeBadgeEvent.java` - Changes guild badge design.
- `guilds/GuildChangeColorsEvent.java` - Changes guild colors.
- `guilds/GuildChangeNameDescEvent.java` - Changes guild name/description.
- `guilds/GuildChangeSettingsEvent.java` - Changes guild settings/permissions.
- `guilds/GuildConfirmRemoveMemberEvent.java` - Confirms guild member removal.
- `guilds/GuildDeclineMembershipEvent.java` - Declines a guild join request.
- `guilds/GuildDeleteEvent.java` - Deletes a guild.
- `guilds/GuildRemoveAdminEvent.java` - Removes guild admin rights.
- `guilds/GuildRemoveFavoriteEvent.java` - Removes favorite guild marker.
- `guilds/GuildRemoveMemberEvent.java` - Removes a guild member.
- `guilds/GuildSetAdminEvent.java` - Grants guild admin rights.
- `guilds/GuildSetFavoriteEvent.java` - Marks a guild as favorite.
- `guilds/RequestGuildBuyEvent.java` - Creates or buys a guild.
- `guilds/RequestGuildBuyRoomsEvent.java` - Requests rooms eligible for guild attachment.
- `guilds/RequestGuildFurniWidgetEvent.java` - Requests guild furni widget data.
- `guilds/RequestGuildInfoEvent.java` - Requests guild info.
- `guilds/RequestGuildJoinEvent.java` - Joins or requests to join a guild.
- `guilds/RequestGuildManageEvent.java` - Requests guild management payload.
- `guilds/RequestGuildMembersEvent.java` - Requests guild member list/filter page.
- `guilds/RequestGuildPartsEvent.java` - Requests guild badge/color part options.
- `guilds/RequestOwnGuildsEvent.java` - Requests user’s own guild list.

Guild forums:
- `guilds/forums/GuildForumDataEvent.java` - Requests forum metadata.
- `guilds/forums/GuildForumListEvent.java` - Requests forum list.
- `guilds/forums/GuildForumModerateMessageEvent.java` - Moderates a forum message.
- `guilds/forums/GuildForumModerateThreadEvent.java` - Moderates a forum thread.
- `guilds/forums/GuildForumPostThreadEvent.java` - Creates a thread or posts a reply.
- `guilds/forums/GuildForumThreadsEvent.java` - Requests thread list.
- `guilds/forums/GuildForumThreadsMessagesEvent.java` - Requests posts in a thread.
- `guilds/forums/GuildForumThreadUpdateEvent.java` - Updates thread state/details.
- `guilds/forums/GuildForumUpdateSettingsEvent.java` - Updates forum settings.

### Incoming Handshake Packets

- `handshake/CompleteDiffieHandshakeEvent.java` - Completes DH key exchange and installs RC4 handlers.
- `handshake/InitDiffieHandshakeEvent.java` - Starts DH handshake and sends signed params.
- `handshake/IsFirstLoginOfDayComposer.java` - Misplaced outbound composer stored under incoming package.
- `handshake/MachineIDEvent.java` - Reads or replaces client machine id.
- `handshake/PingEvent.java` - Responds to ping logic.
- `handshake/ReleaseVersionEvent.java` - Consumes release-version handshake data.
- `handshake/SecureLoginEvent.java` - Authenticates SSO login and sends login bootstrap packets.
- `handshake/UsernameEvent.java` - Performs post-login initialization tied to username/session state.

### Incoming Helper Packets

- `helper/MySanctionStatusEvent.java` - Requests current sanction status.
- `helper/RequestTalentTrackEvent.java` - Requests talent-track data.

### Incoming Hotel View Packets

- `hotelview/HotelViewClaimBadgeRewardEvent.java` - Claims a hotel-view badge reward.
- `hotelview/HotelViewDataEvent.java` - Requests hotel-view data payload.
- `hotelview/HotelViewEvent.java` - Opens hotel view / landing screen.
- `hotelview/HotelViewRequestBadgeRewardEvent.java` - Requests badge reward availability/data.
- `hotelview/HotelViewRequestBonusRareEvent.java` - Requests bonus rare status/data.
- `hotelview/HotelViewRequestLTDAvailabilityEvent.java` - Requests LTD availability.
- `hotelview/HotelViewRequestSecondsUntilEvent.java` - Requests hotel-view countdown data.
- `hotelview/RequestNewsListEvent.java` - Requests hotel news list.

### Incoming Inventory Packets

- `inventory/RequestInventoryBadgesEvent.java` - Requests badge inventory.
- `inventory/RequestInventoryBotsEvent.java` - Requests bot inventory.
- `inventory/RequestInventoryItemsEvent.java` - Requests furni inventory.
- `inventory/RequestInventoryPetsEvent.java` - Requests pet inventory.

### Incoming Moderation Packets

- `modtool/ModToolAlertEvent.java` - Sends moderator alert/caution.
- `modtool/ModToolChangeRoomSettingsEvent.java` - Changes room settings from mod tool.
- `modtool/ModToolCloseTicketEvent.java` - Closes a moderation ticket.
- `modtool/ModToolIssueChangeTopicEvent.java` - Changes moderation issue topic.
- `modtool/ModToolIssueDefaultSanctionEvent.java` - Applies default sanction to issue.
- `modtool/ModToolKickEvent.java` - Kicks a user via mod tool.
- `modtool/ModToolPickTicketEvent.java` - Picks up a moderation ticket.
- `modtool/ModToolReleaseTicketEvent.java` - Releases a moderation ticket.
- `modtool/ModToolRequestIssueChatlogEvent.java` - Requests issue chatlog.
- `modtool/ModToolRequestRoomChatlogEvent.java` - Requests room chatlog.
- `modtool/ModToolRequestRoomInfoEvent.java` - Requests room info for moderation.
- `modtool/ModToolRequestRoomUserChatlogEvent.java` - Requests room-user chatlog.
- `modtool/ModToolRequestRoomVisitsEvent.java` - Requests a user’s room visits.
- `modtool/ModToolRequestUserChatlogEvent.java` - Requests user chatlog.
- `modtool/ModToolRequestUserInfoEvent.java` - Requests moderated user info.
- `modtool/ModToolRoomAlertEvent.java` - Sends a room-wide mod alert.
- `modtool/ModToolSanctionAlertEvent.java` - Applies alert sanction.
- `modtool/ModToolSanctionBanEvent.java` - Applies ban sanction.
- `modtool/ModToolSanctionMuteEvent.java` - Applies mute sanction.
- `modtool/ModToolSanctionTradeLockEvent.java` - Applies trade-lock sanction.
- `modtool/ModToolWarnEvent.java` - Sends moderator warning.
- `modtool/ReportBullyEvent.java` - Files a bullying report.
- `modtool/ReportCommentEvent.java` - Reports a forum comment.
- `modtool/ReportEvent.java` - Files a generic abuse report.
- `modtool/ReportFriendPrivateChatEvent.java` - Reports a private chat.
- `modtool/ReportPhotoEvent.java` - Reports a photo.
- `modtool/ReportThreadEvent.java` - Reports a forum thread.
- `modtool/RequestReportRoomEvent.java` - Requests room report form/context.
- `modtool/RequestReportUserBullyingEvent.java` - Requests bullying-report context.
- `modtool/StartSafetyQuizEvent.java` - Starts safety-quiz flow.

### Incoming Navigator Packets

- `navigator/AddSavedSearchEvent.java` - Adds a saved navigator search.
- `navigator/DeleteSavedSearchEvent.java` - Deletes a saved navigator search.
- `navigator/NavigatorCategoryListModeEvent.java` - Changes navigator category list mode.
- `navigator/NavigatorCollapseCategoryEvent.java` - Collapses a navigator category.
- `navigator/NavigatorUncollapseCategoryEvent.java` - Expands a navigator category.
- `navigator/NewNavigatorActionEvent.java` - Handles generic new-navigator actions.
- `navigator/RequestCanCreateRoomEvent.java` - Checks room creation permission.
- `navigator/RequestCreateRoomEvent.java` - Creates a room.
- `navigator/RequestDeleteRoomEvent.java` - Deletes a room.
- `navigator/RequestHighestScoreRoomsEvent.java` - Requests top-score rooms.
- `navigator/RequestMyRoomsEvent.java` - Requests own rooms.
- `navigator/RequestNavigatorSettingsEvent.java` - Requests navigator settings.
- `navigator/RequestNewNavigatorDataEvent.java` - Requests new-navigator bootstrap data.
- `navigator/RequestNewNavigatorRoomsEvent.java` - Requests new-navigator search results.
- `navigator/RequestPopularRoomsEvent.java` - Requests popular rooms.
- `navigator/RequestPromotedRoomsEvent.java` - Requests promoted rooms.
- `navigator/RequestPublicRoomsEvent.java` - Requests public-room list.
- `navigator/RequestRoomCategoriesEvent.java` - Requests room categories.
- `navigator/RequestTagsEvent.java` - Requests room tags.
- `navigator/SaveWindowSettingsEvent.java` - Saves navigator window settings.
- `navigator/SearchRoomsByTagEvent.java` - Searches rooms by tag.
- `navigator/SearchRoomsEvent.java` - Performs generic room search.
- `navigator/SearchRoomsFriendsNowEvent.java` - Searches rooms where friends are now.
- `navigator/SearchRoomsFriendsOwnEvent.java` - Searches rooms owned by friends.
- `navigator/SearchRoomsInGroupEvent.java` - Searches guild/group rooms.
- `navigator/SearchRoomsMyFavouriteEvent.java` - Searches favorite rooms.
- `navigator/SearchRoomsVisitedEvent.java` - Searches recently visited rooms.
- `navigator/SearchRoomsWithRightsEvent.java` - Searches rooms where user has rights.

### Incoming Poll Packets

- `polls/AnswerPollEvent.java` - Submits poll answers.
- `polls/CancelPollEvent.java` - Cancels/closes poll interaction.
- `polls/GetPollDataEvent.java` - Requests poll questions/data.

### Incoming Room Packets

Room core:
- `rooms/HandleDoorbellEvent.java` - Accepts/rejects room doorbell requests.
- `rooms/RequestHeightmapEvent.java` - Requests room heightmap.
- `rooms/RequestRoomDataEvent.java` - Requests room metadata.
- `rooms/RequestRoomHeightmapEvent.java` - Requests room heightmap payload.
- `rooms/RequestRoomLoadEvent.java` - Requests entry/load of a room.
- `rooms/RequestRoomRightsEvent.java` - Requests room rights list.
- `rooms/RequestRoomSettingsEvent.java` - Requests room settings.
- `rooms/RequestRoomWordFilterEvent.java` - Requests room word filter.
- `rooms/RoomBackgroundEvent.java` - Changes room background/wallpaper.
- `rooms/RoomFavoriteEvent.java` - Adds room to favorites.
- `rooms/RoomMuteEvent.java` - Toggles room mute state.
- `rooms/RoomPlacePaintEvent.java` - Places floor/wall paint.
- `rooms/RoomRemoveAllRightsEvent.java` - Removes all room rights.
- `rooms/RoomRemoveRightsEvent.java` - Removes selected room rights.
- `rooms/RoomRequestBannedUsersEvent.java` - Requests room banned-user list.
- `rooms/RoomSettingsSaveEvent.java` - Saves room settings.
- `rooms/RoomStaffPickEvent.java` - Marks/unmarks room as staff pick.
- `rooms/RoomUnFavoriteEvent.java` - Removes room from favorites.
- `rooms/RoomVoteEvent.java` - Votes on a room.
- `rooms/RoomWordFilterModifyEvent.java` - Modifies room word filter.
- `rooms/SetHomeRoomEvent.java` - Sets the user’s home room.

Room bot packets:
- `rooms/bots/BotPickupEvent.java` - Picks up a room bot.
- `rooms/bots/BotPlaceEvent.java` - Places a room bot.
- `rooms/bots/BotSaveSettingsEvent.java` - Saves room bot settings.
- `rooms/bots/BotSettingsEvent.java` - Requests/edits room bot settings.

Room item packets:
- `rooms/items/AdvertisingSaveEvent.java` - Saves ad item settings/content.
- `rooms/items/CloseDiceEvent.java` - Resets/closes a dice item.
- `rooms/items/FootballGateSaveLookEvent.java` - Saves football gate look.
- `rooms/items/MannequinSaveLookEvent.java` - Saves mannequin outfit.
- `rooms/items/MannequinSaveNameEvent.java` - Saves mannequin name.
- `rooms/items/MoodLightSaveSettingsEvent.java` - Saves moodlight settings.
- `rooms/items/MoodLightSettingsEvent.java` - Updates moodlight configuration.
- `rooms/items/MoodLightTurnOnEvent.java` - Toggles moodlight on/off.
- `rooms/items/MoveWallItemEvent.java` - Moves a wall item.
- `rooms/items/PostItDeleteEvent.java` - Deletes a sticky note.
- `rooms/items/PostItPlaceEvent.java` - Places a sticky note.
- `rooms/items/PostItRequestDataEvent.java` - Requests sticky-note data.
- `rooms/items/PostItSaveDataEvent.java` - Saves sticky-note data.
- `rooms/items/RedeemClothingEvent.java` - Redeems clothing item data.
- `rooms/items/RedeemItemEvent.java` - Redeems a consumable or reward item.
- `rooms/items/RoomPickupItemEvent.java` - Picks up a room item.
- `rooms/items/RoomPlaceItemEvent.java` - Places an item in a room.
- `rooms/items/RotateMoveItemEvent.java` - Moves/rotates a floor item.
- `rooms/items/SavePostItStickyPoleEvent.java` - Saves sticky-pole/post-it pole data.
- `rooms/items/SetStackHelperHeightEvent.java` - Sets stack-helper height.
- `rooms/items/ToggleFloorItemEvent.java` - Uses/toggles a floor item.
- `rooms/items/ToggleWallItemEvent.java` - Uses/toggles a wall item.
- `rooms/items/TriggerColorWheelEvent.java` - Activates a color wheel item.
- `rooms/items/TriggerDiceEvent.java` - Rolls/activates dice.
- `rooms/items/TriggerOneWayGateEvent.java` - Activates one-way gate.
- `rooms/items/UseRandomStateItemEvent.java` - Uses random-state furniture.

Jukebox subdomain:
- `rooms/items/jukebox/JukeBoxAddSoundTrackEvent.java` - Adds a song to jukebox playlist.
- `rooms/items/jukebox/JukeBoxEventOne.java` - Unknown/special jukebox interaction packet.
- `rooms/items/jukebox/JukeBoxEventTwo.java` - Unknown/special jukebox interaction packet.
- `rooms/items/jukebox/JukeBoxRemoveSoundTrackEvent.java` - Removes a song from jukebox playlist.
- `rooms/items/jukebox/JukeBoxRequestPlayListEvent.java` - Requests jukebox playlist.

Love lock subdomain:
- `rooms/items/lovelock/LoveLockStartConfirmEvent.java` - Confirms love-lock start flow.

Rentable-space subdomain:
- `rooms/items/rentablespace/RentSpaceCancelEvent.java` - Cancels rentable-space flow.
- `rooms/items/rentablespace/RentSpaceEvent.java` - Rents a rentable space/item slot.

YouTube subdomain:
- `rooms/items/youtube/YoutubeRequestPlaylistChange.java` - Changes selected YouTube playlist/video.
- `rooms/items/youtube/YoutubeRequestPlaylists.java` - Requests YouTube display playlists.
- `rooms/items/youtube/YoutubeRequestStateChange.java` - Changes YouTube widget playback state.

Pet packets:
- `rooms/pets/BreedMonsterplantsEvent.java` - Starts monsterplant breeding.
- `rooms/pets/CompostMonsterplantEvent.java` - Composts a monsterplant.
- `rooms/pets/ConfirmPetBreedingEvent.java` - Confirms pet breeding result/action.
- `rooms/pets/HorseRemoveSaddleEvent.java` - Removes horse saddle.
- `rooms/pets/MovePetEvent.java` - Moves a pet.
- `rooms/pets/PetPackageNameEvent.java` - Names a boxed/package pet.
- `rooms/pets/PetPickupEvent.java` - Picks up a pet.
- `rooms/pets/PetPlaceEvent.java` - Places a pet in a room.
- `rooms/pets/PetRideEvent.java` - Starts riding a pet.
- `rooms/pets/PetRideSettingsEvent.java` - Changes riding settings.
- `rooms/pets/PetUseItemEvent.java` - Uses an item on a pet.
- `rooms/pets/RequestPetInformationEvent.java` - Requests pet info.
- `rooms/pets/RequestPetTrainingPanelEvent.java` - Requests pet training panel.
- `rooms/pets/ScratchPetEvent.java` - Scratches/interacts with a pet.
- `rooms/pets/StopBreedingEvent.java` - Stops breeding process.
- `rooms/pets/ToggleMonsterplantBreedableEvent.java` - Toggles monsterplant breedability.

Promotion packets:
- `rooms/promotions/BuyRoomPromotionEvent.java` - Buys room promotion.
- `rooms/promotions/RequestPromotionRoomsEvent.java` - Requests rooms eligible for promotion.
- `rooms/promotions/UpdateRoomPromotionEvent.java` - Updates room promotion message/data.

Room user packets:
- `rooms/users/IgnoreRoomUserEvent.java` - Ignores a room user.
- `rooms/users/RequestRoomUserTagsEvent.java` - Requests a room user’s tags.
- `rooms/users/RoomUserActionEvent.java` - Performs a room avatar action.
- `rooms/users/RoomUserBanEvent.java` - Bans a room user.
- `rooms/users/RoomUserDanceEvent.java` - Changes dance state.
- `rooms/users/RoomUserDropHandItemEvent.java` - Drops carried hand item.
- `rooms/users/RoomUserGiveHandItemEvent.java` - Gives a hand item to another user.
- `rooms/users/RoomUserGiveRespectEvent.java` - Gives respect in-room.
- `rooms/users/RoomUserGiveRightsEvent.java` - Gives room rights to a user.
- `rooms/users/RoomUserKickEvent.java` - Kicks a room user.
- `rooms/users/RoomUserLookAtPoint.java` - Turns avatar toward a room point.
- `rooms/users/RoomUserMuteEvent.java` - Mutes a room user.
- `rooms/users/RoomUserRemoveRightsEvent.java` - Removes room rights from a user.
- `rooms/users/RoomUserShoutEvent.java` - Sends shout chat.
- `rooms/users/RoomUserSignEvent.java` - Performs sign/emote packet.
- `rooms/users/RoomUserSitEvent.java` - Toggles sit state.
- `rooms/users/RoomUserStartTypingEvent.java` - Sends typing-on state.
- `rooms/users/RoomUserStopTypingEvent.java` - Sends typing-off state.
- `rooms/users/RoomUserTalkEvent.java` - Sends normal room chat.
- `rooms/users/RoomUserWalkEvent.java` - Handles avatar movement/pathfinding target selection.
- `rooms/users/RoomUserWhisperEvent.java` - Sends whisper chat.
- `rooms/users/UnIgnoreRoomUserEvent.java` - Unignores a room user.
- `rooms/users/UnbanRoomUserEvent.java` - Unbans a room user.

### Incoming Trading Packets

- `trading/TradeAcceptEvent.java` - Accepts trade window.
- `trading/TradeCancelEvent.java` - Cancels trade.
- `trading/TradeCancelOfferItemEvent.java` - Removes an offered trade item.
- `trading/TradeCloseEvent.java` - Closes trade session/window.
- `trading/TradeConfirmEvent.java` - Confirms final trade.
- `trading/TradeOfferItemEvent.java` - Offers one item into trade.
- `trading/TradeOfferMultipleItemsEvent.java` - Offers multiple items into trade.
- `trading/TradeStartEvent.java` - Starts a trade with another user.
- `trading/TradeUnAcceptEvent.java` - Revokes trade acceptance.

### Incoming Unknown Packets

- `unknown/RequestResolutionEvent.java` - Unknown/resolution-related client capability packet.
- `unknown/UnknownEvent1.java` - Placeholder unknown incoming packet.
- `unknown/UnknownEvent2.java` - Placeholder unknown incoming packet.

### Incoming User Packets

- `users/ActivateEffectEvent.java` - Activates an effect.
- `users/ChangeChatBubbleEvent.java` - Changes selected chat bubble.
- `users/ChangeNameCheckUsernameEvent.java` - Checks username availability.
- `users/ConfirmChangeNameEvent.java` - Confirms a name change.
- `users/EnableEffectEvent.java` - Enables/disables an effect.
- `users/PickNewUserGiftEvent.java` - Picks a new-user gift.
- `users/RequestClubCenterEvent.java` - Requests club-center data.
- `users/RequestMeMenuSettingsEvent.java` - Requests me-menu settings.
- `users/RequestProfileFriendsEvent.java` - Requests profile friends list.
- `users/RequestUserCitizinShipEvent.java` - Requests citizenship data.
- `users/RequestUserClubEvent.java` - Requests user club data.
- `users/RequestUserCreditsEvent.java` - Requests user credits.
- `users/RequestUserDataEvent.java` - Requests current user data.
- `users/RequestUserProfileEvent.java` - Requests another user profile.
- `users/RequestUserWardrobeEvent.java` - Requests wardrobe data.
- `users/RequestWearingBadgesEvent.java` - Requests equipped badges.
- `users/SaveBlockCameraFollowEvent.java` - Saves camera-follow preference.
- `users/SaveIgnoreRoomInvitesEvent.java` - Saves ignore-room-invites preference.
- `users/SaveMottoEvent.java` - Saves user motto.
- `users/SavePreferOldChatEvent.java` - Saves old-chat preference.
- `users/SaveUserVolumesEvent.java` - Saves client volume settings.
- `users/SaveWardrobeEvent.java` - Saves wardrobe slots.
- `users/UpdateUIFlagsEvent.java` - Saves UI flag settings.
- `users/UserActivityEvent.java` - Sends user activity/idle state packet.
- `users/UserNuxEvent.java` - Handles NUX/tutorial action packet.
- `users/UserSaveLookEvent.java` - Saves avatar look.
- `users/UserWearBadgeEvent.java` - Equips a badge.

### Incoming WIRED Packets

- `wired/WiredApplySetConditionsEvent.java` - Applies stored wired match settings to furniture.
- `wired/WiredConditionSaveDataEvent.java` - Saves wired condition config.
- `wired/WiredEffectSaveDataEvent.java` - Saves wired effect config.
- `wired/WiredSaveException.java` - Exception type for wired save failures.
- `wired/WiredTriggerSaveDataEvent.java` - Saves wired trigger config.

## Outgoing Packet Domains

### Outgoing Core Infrastructure

- `outgoing/MessageComposer.java` - Base class for lazily composed outbound packets.
- `outgoing/Outgoing.java` - Numeric outgoing packet ID catalog.

### Outgoing Achievement Packets

- `achievements/AchievementListComposer.java` - Sends achievement list.
- `achievements/AchievementProgressComposer.java` - Sends achievement progress update.
- `achievements/AchievementUnlockedComposer.java` - Announces achievement unlock.

### Outgoing Camera Packets

- `camera/CameraCompetitionStatusComposer.java` - Sends camera competition status.
- `camera/CameraPriceComposer.java` - Sends camera pricing.
- `camera/CameraPublishWaitMessageComposer.java` - Tells client to wait for publish processing.
- `camera/CameraPurchaseSuccesfullComposer.java` - Confirms camera purchase success.
- `camera/CameraRoomThumbnailSavedComposer.java` - Confirms room thumbnail saved.
- `camera/CameraURLComposer.java` - Sends camera image URL.

### Outgoing Catalog Packets

- `catalog/AlertLimitedSoldOutComposer.java` - Alerts limited item sold out.
- `catalog/AlertPurchaseFailedComposer.java` - Alerts purchase failure.
- `catalog/AlertPurchaseUnavailableComposer.java` - Alerts unavailable purchase.
- `catalog/CatalogModeComposer.java` - Sends catalog mode/config.
- `catalog/CatalogPageComposer.java` - Sends one catalog page.
- `catalog/CatalogPagesListComposer.java` - Sends catalog page listing.
- `catalog/CatalogSearchResultComposer.java` - Sends catalog search results.
- `catalog/CatalogUpdatedComposer.java` - Notifies catalog refresh/update.
- `catalog/ClubCenterDataComposer.java` - Sends club-center data.
- `catalog/ClubDataComposer.java` - Sends club subscription data.
- `catalog/ClubGiftsComposer.java` - Sends available club gifts.
- `catalog/DiscountComposer.java` - Sends discount offer data.
- `catalog/GiftConfigurationComposer.java` - Sends gifting configuration.
- `catalog/GiftReceiverNotFoundComposer.java` - Reports missing gift recipient.
- `catalog/NotEnoughPointsTypeComposer.java` - Reports insufficient currency by type.
- `catalog/PetBoughtNotificationComposer.java` - Confirms pet purchase.
- `catalog/PetBreedsComposer.java` - Sends available pet breeds.
- `catalog/PetNameErrorComposer.java` - Sends pet naming error.
- `catalog/PurchaseOKComposer.java` - Confirms purchase success.
- `catalog/RecyclerCompleteComposer.java` - Sends recycler completion result.
- `catalog/RecyclerLogicComposer.java` - Sends recycler rules/state.
- `catalog/RedeemVoucherErrorComposer.java` - Reports voucher redeem failure.
- `catalog/RedeemVoucherOKComposer.java` - Confirms voucher redeem success.
- `catalog/ReloadRecyclerComposer.java` - Refreshes recycler UI/state.
- `catalog/TargetedOfferComposer.java` - Sends targeted offer payload.

Marketplace packets:
- `catalog/marketplace/MarketplaceBuyErrorComposer.java` - Reports marketplace buy error.
- `catalog/marketplace/MarketplaceCancelSaleComposer.java` - Confirms sale cancellation.
- `catalog/marketplace/MarketplaceConfigComposer.java` - Sends marketplace config.
- `catalog/marketplace/MarketplaceItemInfoComposer.java` - Sends listing/item details.
- `catalog/marketplace/MarketplaceItemPostedComposer.java` - Confirms item posted for sale.
- `catalog/marketplace/MarketplaceOffersComposer.java` - Sends marketplace offers.
- `catalog/marketplace/MarketplaceOwnItemsComposer.java` - Sends user’s marketplace listings.
- `catalog/marketplace/MarketplaceSellItemComposer.java` - Opens/returns sell-item data.

### Outgoing Crafting Packets

- `crafting/CraftableProductsComposer.java` - Sends craftable product list.
- `crafting/CraftingRecipeComposer.java` - Sends one or more recipe definitions.
- `crafting/CraftingRecipesAvailableComposer.java` - Sends available recipe list.
- `crafting/CraftingResultComposer.java` - Sends crafting result.

### Outgoing Event Packets

Calendar:
- `events/calendar/AdventCalendarDataComposer.java` - Sends advent calendar state.
- `events/calendar/AdventCalendarProductComposer.java` - Sends opened advent reward details.

Mystic box:
- `events/mysticbox/MysticBoxCloseComposer.java` - Closes mystic box UI/state.
- `events/mysticbox/MysticBoxPrizeComposer.java` - Sends mystic box prize.
- `events/mysticbox/MysticBoxStartOpenComposer.java` - Starts mystic box opening flow.

Resolution:
- `events/resolution/NewYearResolutionCompletedComposer.java` - Announces completed resolution.
- `events/resolution/NewYearResolutionComposer.java` - Sends resolution event payload.
- `events/resolution/NewYearResolutionProgressComposer.java` - Sends resolution progress.

### Outgoing Floorplan Editor Packets

- `floorplaneditor/FloorPlanEditorBlockedTilesComposer.java` - Sends blocked tiles for floorplan editor.
- `floorplaneditor/FloorPlanEditorDoorSettingsComposer.java` - Sends door settings for floorplan editor.

### Outgoing Friends Packets

- `friends/FriendChatMessageComposer.java` - Sends messenger chat message.
- `friends/FriendFindingRoomComposer.java` - Sends friend-room lookup result.
- `friends/FriendNotificationComposer.java` - Sends friend toolbar/notification payload.
- `friends/FriendRequestComposer.java` - Sends incoming friend request.
- `friends/FriendRequestErrorComposer.java` - Sends friend-request failure.
- `friends/FriendsComposer.java` - Sends friend list.
- `friends/LoadFriendRequestsComposer.java` - Sends pending friend requests.
- `friends/MessengerInitComposer.java` - Sends messenger bootstrap payload.
- `friends/RemoveFriendComposer.java` - Removes friend from client list.
- `friends/RoomInviteComposer.java` - Sends room invite.
- `friends/RoomInviteErrorComposer.java` - Sends room-invite error.
- `friends/StalkErrorComposer.java` - Sends follow/stalk failure.
- `friends/UpdateFriendComposer.java` - Updates one friend entry.
- `friends/UserSearchResultComposer.java` - Sends user-search results.

### Outgoing Game Center Packets

- `gamecenter/GameCenterAccountInfoComposer.java` - Sends game-center account stats.
- `gamecenter/GameCenterAchievementsConfigurationComposer.java` - Sends game achievement config.
- `gamecenter/GameCenterGameComposer.java` - Sends one game definition/entry.
- `gamecenter/GameCenterGameListComposer.java` - Sends game list.

### Outgoing Generic Packets

- `generic/MinimailCountComposer.java` - Sends minimail unread count.
- `generic/PickMonthlyClubGiftNotificationComposer.java` - Prompts monthly club gift pickup.
- `generic/testcomposer.java` - Test/debug composer artifact.

Alerts subpackage:
- `generic/alerts/BotErrorComposer.java` - Sends bot-related error.
- `generic/alerts/BubbleAlertComposer.java` - Sends bubble/inline alert.
- `generic/alerts/BubbleAlertKeys.java` - Enum/constants for bubble alert keys.
- `generic/alerts/CustomNotificationComposer.java` - Sends custom notification payload.
- `generic/alerts/GenericAlertComposer.java` - Sends generic alert dialog.
- `generic/alerts/GenericErrorMessagesComposer.java` - Sends generic error-code payload.
- `generic/alerts/HotelClosedAndOpensComposer.java` - Announces hotel closed with reopen info.
- `generic/alerts/HotelClosesAndWillOpenAtComposer.java` - Announces scheduled hotel close/reopen.
- `generic/alerts/HotelWillCloseInMinutesAndBackInComposer.java` - Announces temporary closure countdown.
- `generic/alerts/HotelWillCloseInMinutesComposer.java` - Announces closure countdown.
- `generic/alerts/MessagesForYouComposer.java` - Sends messages-for-you alert list.
- `generic/alerts/PetErrorComposer.java` - Sends pet-related error.
- `generic/alerts/StaffAlertAndOpenHabboWayComposer.java` - Sends staff alert and opens Habbo Way.
- `generic/alerts/StaffAlertWIthLinkAndOpenHabboWayComposer.java` - Sends staff alert with link and Habbo Way action.
- `generic/alerts/StaffAlertWithLinkComposer.java` - Sends staff alert with link.
- `generic/alerts/UpdateFailedComposer.java` - Sends generic update failure response.

### Outgoing Guardian Packets

- `guardians/GuardianNewReportReceivedComposer.java` - Notifies guardian about new report.
- `guardians/GuardianVotingRequestedComposer.java` - Opens guardian voting flow.
- `guardians/GuardianVotingResultComposer.java` - Sends guardian vote result.
- `guardians/GuardianVotingTimeEnded.java` - Announces guardian voting timeout.
- `guardians/GuardianVotingVotesComposer.java` - Sends guardian votes/state.

### Outgoing Guide Packets

- `guides/BullyReportClosedComposer.java` - Notifies bully-report closure.
- `guides/GuideSessionAttachedComposer.java` - Attaches user to guide session.
- `guides/GuideSessionDetachedComposer.java` - Detaches user from guide session.
- `guides/GuideSessionEndedComposer.java` - Ends guide session.
- `guides/GuideSessionErrorComposer.java` - Sends guide session error.
- `guides/GuideSessionInvitedToGuideRoomComposer.java` - Invites guide/session participant to room.
- `guides/GuideSessionMessageComposer.java` - Sends guide chat message.
- `guides/GuideSessionPartnerIsPlayingComposer.java` - Sends partner-playing state.
- `guides/GuideSessionPartnerIsTypingComposer.java` - Sends partner typing state.
- `guides/GuideSessionRequesterRoomComposer.java` - Sends requester room info.
- `guides/GuideSessionStartedComposer.java` - Starts guide session.
- `guides/GuideToolsComposer.java` - Sends guide tools bootstrap.

### Outgoing Guild Packets

- `guilds/GuildAcceptMemberErrorComposer.java` - Reports guild membership-accept error.
- `guilds/GuildBoughtComposer.java` - Confirms guild creation/purchase.
- `guilds/GuildBuyRoomsComposer.java` - Sends rooms eligible for guild association.
- `guilds/GuildConfirmRemoveMemberComposer.java` - Confirms member-removal prompt/state.
- `guilds/GuildEditFailComposer.java` - Reports guild edit failure.
- `guilds/GuildFavoriteRoomUserUpdateComposer.java` - Updates favorite guild room user state.
- `guilds/GuildFurniWidgetComposer.java` - Sends guild furni widget data.
- `guilds/GuildInfoComposer.java` - Sends guild info.
- `guilds/GuildJoinErrorComposer.java` - Reports guild join failure.
- `guilds/GuildListComposer.java` - Sends guild list.
- `guilds/GuildManageComposer.java` - Sends guild management payload.
- `guilds/GuildMemberUpdateComposer.java` - Updates one guild member entry.
- `guilds/GuildMembersComposer.java` - Sends guild member list.
- `guilds/GuildPartsComposer.java` - Sends guild badge/color parts.
- `guilds/GuildRefreshMembersListComposer.java` - Refreshes guild member list.
- `guilds/RemoveGuildFromRoomComposer.java` - Removes guild association from room.

Guild forums:
- `guilds/forums/GuildForumAddCommentComposer.java` - Sends newly added forum comment.
- `guilds/forums/GuildForumCommentsComposer.java` - Sends forum comments list.
- `guilds/forums/GuildForumDataComposer.java` - Sends forum metadata.
- `guilds/forums/GuildForumListComposer.java` - Sends guild forum list.
- `guilds/forums/GuildForumsUnreadMessagesCountComposer.java` - Sends unread forum count.
- `guilds/forums/GuildForumThreadMessagesComposer.java` - Sends thread messages.
- `guilds/forums/GuildForumThreadsComposer.java` - Sends forum threads.
- `guilds/forums/PostUpdateMessageComposer.java` - Sends forum post update event.
- `guilds/forums/ThreadUpdatedMessageComposer.java` - Sends thread update event.

### Outgoing Habbo Way and NUX Packets

- `habboway/HabboWayQuizComposer1.java` - Sends Habbo Way quiz payload 1.
- `habboway/HabboWayQuizComposer2.java` - Sends Habbo Way quiz payload 2.
- `habboway/nux/NewUserGiftComposer.java` - Sends new-user gift UI/data.
- `habboway/nux/NewUserIdentityComposer.java` - Sends new-user identity/tutorial bootstrap.
- `habboway/nux/NuxAlertComposer.java` - Sends NUX/tutorial alert/action.

### Outgoing Handshake Packets

- `handshake/AvailabilityStatusMessageComposer.java` - Sends hotel availability status.
- `handshake/CompleteDiffieHandshakeComposer.java` - Sends server DH public key and encryption flag.
- `handshake/ConnectionErrorComposer.java` - Sends handshake/login-style connection error.
- `handshake/EnableNotificationsComposer.java` - Sends notification/bubble-alert enable flag.
- `handshake/InitDiffieHandshakeComposer.java` - Sends signed DH prime/generator.
- `handshake/MachineIDComposer.java` - Sends canonical machine id.
- `handshake/PingComposer.java` - Sends server ping.
- `handshake/PongComposer.java` - Sends server pong.
- `handshake/SecureLoginOKComposer.java` - Confirms successful login.

### Outgoing Hotel View Packets

- `hotelview/BonusRareComposer.java` - Sends bonus rare data.
- `hotelview/HallOfFameComposer.java` - Sends hall-of-fame standings.
- `hotelview/HotelViewBadgeButtonConfigComposer.java` - Sends badge button config.
- `hotelview/HotelViewCatalogPageExpiringComposer.java` - Sends expiring catalog-page info.
- `hotelview/HotelViewCommunityGoalComposer.java` - Sends community-goal state.
- `hotelview/HotelViewComposer.java` - Sends hotel-view landing payload.
- `hotelview/HotelViewConcurrentUsersComposer.java` - Sends concurrent-user count.
- `hotelview/HotelViewCustomTimerComposer.java` - Sends custom timer payload.
- `hotelview/HotelViewDataComposer.java` - Sends hotel-view data bundle.
- `hotelview/HotelViewExpiringCatalogPageCommposer.java` - Sends expiring-page payload; class name is misspelled.
- `hotelview/HotelViewHideCommunityVoteButtonComposer.java` - Hides community-vote button.
- `hotelview/HotelViewNextLTDAvailableComposer.java` - Sends next LTD availability time.
- `hotelview/HotelViewSecondsUntilComposer.java` - Sends countdown value.
- `hotelview/NewsListComposer.java` - Sends hotel news list.

### Outgoing Inventory Packets

- `inventory/AddBotComposer.java` - Adds a bot to inventory/client state.
- `inventory/AddHabboItemComposer.java` - Adds an item to inventory.
- `inventory/AddPetComposer.java` - Adds a pet to inventory.
- `inventory/EffectsListAddComposer.java` - Adds an effect to effect inventory.
- `inventory/EffectsListEffectEnableComposer.java` - Enables one effect entry.
- `inventory/EffectsListRemoveComposer.java` - Removes an effect entry.
- `inventory/InventoryAchievementsComposer.java` - Sends achievement inventory data.
- `inventory/InventoryBadgesComposer.java` - Sends badge inventory.
- `inventory/InventoryBotsComposer.java` - Sends bot inventory.
- `inventory/InventoryItemsComposer.java` - Sends item inventory.
- `inventory/InventoryPetsComposer.java` - Sends pet inventory.
- `inventory/InventoryRefreshComposer.java` - Refreshes inventory view.
- `inventory/InventoryUpdateItemComposer.java` - Updates one inventory item entry.
- `inventory/RemoveBotComposer.java` - Removes bot from inventory/client state.
- `inventory/RemoveHabboItemComposer.java` - Removes inventory item.
- `inventory/RemovePetComposer.java` - Removes pet from inventory/client state.
- `inventory/UserEffectsListComposer.java` - Sends current effect list.

### Outgoing Moderation Packets

- `modtool/BullyReportedMessageComposer.java` - Confirms bully report submission.
- `modtool/BullyReportRequestComposer.java` - Sends bully-report form data.
- `modtool/CfhTopicsMessageComposer.java` - Sends call-for-help topics.
- `modtool/HelperRequestDisabledComposer.java` - Announces helper requests disabled.
- `modtool/ModToolComposer.java` - Sends moderator tool bootstrap.
- `modtool/ModToolIssueChatlogComposer.java` - Sends issue chatlog.
- `modtool/ModToolIssueHandledComposer.java` - Announces handled issue.
- `modtool/ModToolIssueHandlerDimensionsComposer.java` - Sends moderator issue panel sizing/config.
- `modtool/ModToolIssueInfoComposer.java` - Sends issue detail payload.
- `modtool/ModToolIssueResponseAlertComposer.java` - Sends response alert to reporter/user.
- `modtool/ModToolIssueUpdateComposer.java` - Updates issue state.
- `modtool/ModToolReportReceivedAlertComposer.java` - Confirms report received.
- `modtool/ModToolRoomChatlogComposer.java` - Sends room chatlog.
- `modtool/ModToolRoomInfoComposer.java` - Sends room info to moderators.
- `modtool/ModToolSanctionInfoComposer.java` - Sends sanction info to user/mod.
- `modtool/ModToolUserChatlogComposer.java` - Sends user chatlog.
- `modtool/ModToolUserInfoComposer.java` - Sends user moderation info.
- `modtool/ModToolUserRoomVisitsComposer.java` - Sends room visit history.
- `modtool/ReportRoomFormComposer.java` - Sends room report form.

### Outgoing Mystery Box Packets

- `mysterybox/MysteryBoxKeysComposer.java` - Sends mystery-box key count/data.

### Outgoing Navigator Packets

- `navigator/CanCreateEventComposer.java` - Sends event-creation eligibility.
- `navigator/CanCreateRoomComposer.java` - Sends room-creation eligibility.
- `navigator/NewNavigatorCategoryUserCountComposer.java` - Sends per-category user counts.
- `navigator/NewNavigatorCollapsedCategoriesComposer.java` - Sends collapsed category list.
- `navigator/NewNavigatorEventCategoriesComposer.java` - Sends event categories.
- `navigator/NewNavigatorLiftedRoomsComposer.java` - Sends promoted/lifted rooms.
- `navigator/NewNavigatorMetaDataComposer.java` - Sends navigator metadata.
- `navigator/NewNavigatorSavedSearchesComposer.java` - Sends saved searches.
- `navigator/NewNavigatorSearchResultsComposer.java` - Sends navigator search results.
- `navigator/NewNavigatorSettingsComposer.java` - Sends navigator settings.
- `navigator/OpenRoomCreationWindowComposer.java` - Opens room creation UI.
- `navigator/PrivateRoomsComposer.java` - Sends private room list.
- `navigator/RoomCategoriesComposer.java` - Sends room categories.
- `navigator/RoomCreatedComposer.java` - Confirms room creation.
- `navigator/TagsComposer.java` - Sends popular tags.

### Outgoing Poll Packets

- `polls/PollQuestionsComposer.java` - Sends poll questions.
- `polls/PollStartComposer.java` - Starts poll UI.

### Outgoing Quest Packets

- `quests/QuestCompletedComposer.java` - Announces quest completion.
- `quests/QuestComposer.java` - Sends quest payload.
- `quests/QuestExpiredComposer.java` - Announces quest expiration.
- `quests/QuestionInfoComposer.java` - Sends question/info payload; likely partial or placeholder.
- `quests/QuestsComposer.java` - Sends quest list.

### Outgoing Room Packets

Room core:
- `rooms/BotForceOpenContextMenuComposer.java` - Forces bot context menu open.
- `rooms/BotSettingsComposer.java` - Sends bot settings UI data.
- `rooms/DoorbellAddUserComposer.java` - Adds user to doorbell list.
- `rooms/FavoriteRoomChangedComposer.java` - Updates favorite-room state.
- `rooms/FloodCounterComposer.java` - Sends chat flood timeout/counter.
- `rooms/ForwardToRoomComposer.java` - Forwards client to room.
- `rooms/FreezeLivesComposer.java` - Sends freeze-game lives/state.
- `rooms/HideDoorbellComposer.java` - Hides doorbell UI/state.
- `rooms/RoomAccessDeniedComposer.java` - Denies room entry.
- `rooms/RoomAddRightsListComposer.java` - Sends added rights list.
- `rooms/RoomBannedUsersComposer.java` - Sends banned-user list.
- `rooms/RoomChatSettingsComposer.java` - Sends room chat settings.
- `rooms/RoomDataComposer.java` - Sends room metadata/details.
- `rooms/RoomEditSettingsErrorComposer.java` - Reports room settings edit failure.
- `rooms/RoomEnterErrorComposer.java` - Reports room entry failure.
- `rooms/RoomEntryInfoComposer.java` - Sends room entry info; mapping likely partial/uncertain.
- `rooms/RoomFilterWordsComposer.java` - Sends room word filter contents.
- `rooms/RoomFloorThicknessUpdatedComposer.java` - Sends floor thickness update.
- `rooms/RoomHeightMapComposer.java` - Sends room heightmap.
- `rooms/RoomModelComposer.java` - Sends room model/layout data.
- `rooms/RoomMutedComposer.java` - Sends room muted state.
- `rooms/RoomNoRightsComposer.java` - Reports missing room rights.
- `rooms/RoomOpenComposer.java` - Announces room opening/entry state.
- `rooms/RoomOwnerComposer.java` - Sends room owner info.
- `rooms/RoomPaintComposer.java` - Sends room paint/wallpaper update.
- `rooms/RoomPaneComposer.java` - Sends room pane/window payload.
- `rooms/RoomQueueStatusMessage.java` - Sends room queue status.
- `rooms/RoomRelativeMapComposer.java` - Sends room relative map.
- `rooms/RoomRemoveRightsListComposer.java` - Sends removed rights list.
- `rooms/RoomRightsComposer.java` - Sends room rights info.
- `rooms/RoomRightsListComposer.java` - Sends room rights user list.
- `rooms/RoomScoreComposer.java` - Sends room score.
- `rooms/RoomSettingsComposer.java` - Sends room settings.
- `rooms/RoomSettingsSavedComposer.java` - Confirms room settings saved.
- `rooms/RoomSettingsUpdatedComposer.java` - Sends room settings update.
- `rooms/RoomThicknessComposer.java` - Sends room thickness settings.
- `rooms/UpdateStackHeightComposer.java` - Sends stack-height update.

Room item packets:
- `rooms/items/AddFloorItemComposer.java` - Adds a floor item to room.
- `rooms/items/AddWallItemComposer.java` - Adds a wall item to room.
- `rooms/items/FloorItemOnRollerComposer.java` - Animates floor item moving on roller.
- `rooms/items/FloorItemUpdateComposer.java` - Updates floor item state/position.
- `rooms/items/ItemExtraDataComposer.java` - Sends item extra-data update.
- `rooms/items/ItemIntStateComposer.java` - Sends integer item state update.
- `rooms/items/ItemsDataUpdateComposer.java` - Sends room items bulk data update.
- `rooms/items/ItemStateComposer.java` - Sends item state update.
- `rooms/items/MoodLightDataComposer.java` - Sends moodlight data.
- `rooms/items/PostItDataComposer.java` - Sends sticky-note data.
- `rooms/items/PostItStickyPoleOpenComposer.java` - Opens sticky-pole UI/data.
- `rooms/items/PresentItemOpenedComposer.java` - Sends opened present contents.
- `rooms/items/RemoveFloorItemComposer.java` - Removes floor item from room.
- `rooms/items/RemoveWallItemComposer.java` - Removes wall item from room.
- `rooms/items/RoomFloorItemsComposer.java` - Sends bulk floor item list.
- `rooms/items/RoomWallItemsComposer.java` - Sends bulk wall item list.
- `rooms/items/UpdateStackHeightTileHeightComposer.java` - Sends stack/tile height update.
- `rooms/items/WallItemUpdateComposer.java` - Updates wall item state/position.

Jukebox packets:
- `rooms/items/jukebox/JukeBoxPlayListAddSongComposer.java` - Adds song to jukebox playlist view.
- `rooms/items/jukebox/JukeBoxPlayListComposer.java` - Sends jukebox playlist.
- `rooms/items/jukebox/JukeBoxPlayListUpdatedComposer.java` - Updates jukebox playlist state.
- `rooms/items/jukebox/JukeBoxPlaylistFullComposer.java` - Reports full playlist.
- `rooms/items/jukebox/JukeBoxTrackCodeComposer.java` - Sends track code metadata.
- `rooms/items/jukebox/JukeBoxTrackDataComposer.java` - Sends track data.

Love lock packets:
- `rooms/items/lovelock/LoveLockFurniFinishedComposer.java` - Completes love-lock flow.
- `rooms/items/lovelock/LoveLockFurniFriendConfirmedComposer.java` - Confirms friend step in love-lock flow.
- `rooms/items/lovelock/LoveLockFurniStartComposer.java` - Starts love-lock flow.

Rentable-space packets:
- `rooms/items/rentablespaces/RentableSpaceInfoComposer.java` - Sends rentable-space info.
- `rooms/items/rentablespaces/RentableSpaceUnknown2Composer.java` - Unknown rentable-space packet.
- `rooms/items/rentablespaces/RentableSpaceUnknownComposer.java` - Unknown rentable-space packet.

YouTube packets:
- `rooms/items/youtube/YoutubeDisplayListComposer.java` - Sends YouTube playlist/video list.
- `rooms/items/youtube/YoutubeStateChangeComposer.java` - Sends YouTube state change.
- `rooms/items/youtube/YoutubeVideoComposer.java` - Sends active YouTube video data.

Pet packets:
- `rooms/pets/CantScratchPetNotOldEnoughComposer.java` - Rejects scratching too-young pet.
- `rooms/pets/PetInformationComposer.java` - Sends pet information panel.
- `rooms/pets/PetLevelUpComposer.java` - Announces pet level up.
- `rooms/pets/PetLevelUpdatedComposer.java` - Updates pet level state.
- `rooms/pets/PetPackageComposer.java` - Sends pet package/opening data.
- `rooms/pets/PetPackageNameValidationComposer.java` - Sends pet-package name validation result.
- `rooms/pets/PetStatusUpdateComposer.java` - Sends pet status update; mapping uncertain.
- `rooms/pets/PetTrainingPanelComposer.java` - Sends pet training panel.
- `rooms/pets/RoomPetComposer.java` - Adds/updates pet in room.
- `rooms/pets/RoomPetExperienceComposer.java` - Sends pet experience gain.
- `rooms/pets/RoomPetHorseFigureComposer.java` - Sends horse figure update.
- `rooms/pets/RoomPetRespectComposer.java` - Sends pet respect update.

Pet breeding packets:
- `rooms/pets/breeding/PetBreedingCompleted.java` - Announces breeding completion.
- `rooms/pets/breeding/PetBreedingFailedComposer.java` - Reports breeding failure.
- `rooms/pets/breeding/PetBreedingResultComposer.java` - Sends breeding result payload.
- `rooms/pets/breeding/PetBreedingStartComposer.java` - Starts breeding flow.
- `rooms/pets/breeding/PetBreedingStartFailedComposer.java` - Reports inability to start breeding.

Promotion packets:
- `rooms/promotions/PromoteOwnRoomsListComposer.java` - Sends own rooms available for promotion.
- `rooms/promotions/RoomPromotionMessageComposer.java` - Sends room promotion message/state.

Room user packets:
- `rooms/users/ChangeNameUpdatedComposer.java` - Updates room after user name change.
- `rooms/users/RoomUnitIdleComposer.java` - Sends room-unit idle status.
- `rooms/users/RoomUnitOnRollerComposer.java` - Animates room unit moved by roller.
- `rooms/users/RoomUserActionComposer.java` - Sends avatar action update.
- `rooms/users/RoomUserDanceComposer.java` - Sends dance state update.
- `rooms/users/RoomUserDataComposer.java` - Sends user entity data for room.
- `rooms/users/RoomUserEffectComposer.java` - Sends avatar effect update.
- `rooms/users/RoomUserHandItemComposer.java` - Sends carried hand item state.
- `rooms/users/RoomUserIgnoredComposer.java` - Updates ignored-user state.
- `rooms/users/RoomUserNameChangedComposer.java` - Announces room username change.
- `rooms/users/RoomUserReceivedHandItemComposer.java` - Sends received hand-item event.
- `rooms/users/RoomUserRemoveComposer.java` - Removes room user from view.
- `rooms/users/RoomUserRemoveRightsComposer.java` - Updates removed rights list in-room.
- `rooms/users/RoomUserRespectComposer.java` - Sends respect effect/result.
- `rooms/users/RoomUserShoutComposer.java` - Sends shout chat.
- `rooms/users/RoomUserStatusComposer.java` - Sends room user statuses.
- `rooms/users/RoomUserTagsComposer.java` - Sends room user tags.
- `rooms/users/RoomUserTalkComposer.java` - Sends normal room chat.
- `rooms/users/RoomUserTypingComposer.java` - Sends typing state.
- `rooms/users/RoomUserUnbannedComposer.java` - Announces user unbanned from room.
- `rooms/users/RoomUsersAddGuildBadgeComposer.java` - Adds guild badge data for room users.
- `rooms/users/RoomUsersComposer.java` - Sends room user list.
- `rooms/users/RoomUsersGuildBadgesComposer.java` - Sends visible room users’ guild badges.
- `rooms/users/RoomUserWhisperComposer.java` - Sends whisper chat.

### Outgoing Trading Packets

- `trading/OtherTradingDisabledComposer.java` - Reports other user cannot trade.
- `trading/TradeAcceptedComposer.java` - Updates trade accepted state.
- `trading/TradeCloseWindowComposer.java` - Closes trade window.
- `trading/TradeClosedComposer.java` - Announces trade closed/cancelled.
- `trading/TradeCompleteComposer.java` - Announces successful trade completion.
- `trading/TradeStartComposer.java` - Opens trade session.
- `trading/TradeStartFailComposer.java` - Reports trade-start failure.
- `trading/TradeUpdateComposer.java` - Updates trade offers/state.
- `trading/TradingWaitingConfirmComposer.java` - Sends waiting-for-confirm state.
- `trading/YouTradingDisabledComposer.java` - Reports caller cannot trade.

### Outgoing Unknown Packets

These classes indicate unresolved, reverse-engineered, or placeholder protocol coverage and should be treated as packet-mapping risk during client comparison.

- `unknown/BuildersClubExpiredComposer.java` - Placeholder/uncertain builders-club-expired packet.
- `unknown/CloseWebPageComposer.java` - Placeholder close-web-page packet.
- `unknown/CompetitionEntrySubmitResultComposer.java` - Placeholder competition-submit result.
- `unknown/ConvertedForwardToRoomComposer.java` - Placeholder room-forward packet.
- `unknown/EpicPopupFrameComposer.java` - Placeholder popup-frame packet.
- `unknown/ErrorLoginComposer.java` - Placeholder login-error packet.
- `unknown/ExtendClubMessageComposer.java` - Placeholder extend-club packet.
- `unknown/HabboMallComposer.java` - Placeholder mall/shop packet.
- `unknown/IgnoredUsersComposer.java` - Placeholder ignored-users list packet.
- `unknown/MessengerErrorComposer.java` - Placeholder messenger-error packet.
- `unknown/MinimailNewMessageComposer.java` - Placeholder minimail new-message packet.
- `unknown/ModToolComposerOne.java` - Placeholder/partial modtool packet.
- `unknown/ModToolSanctionDataComposer.java` - Placeholder sanction-data packet.
- `unknown/MostUselessErrorAlertComposer.java` - Placeholder generic error packet.
- `unknown/MysteryPrizeComposer.java` - Placeholder mystery-prize packet.
- `unknown/RemoveRoomEventComposer.java` - Placeholder room-event removal packet.
- `unknown/RentableItemBuyOutPriceComposer.java` - Placeholder rentable-item buyout packet.
- `unknown/RoomAdErrorComposer.java` - Placeholder room ad error packet.
- `unknown/RoomCategoryUpdateMessageComposer.java` - Placeholder room-category update packet.
- `unknown/RoomMessagesPostedCountComposer.java` - Placeholder room-post-count packet.
- `unknown/RoomUnknown3Composer.java` - Unknown room packet.
- `unknown/RoomUserQuestionAnsweredComposer.java` - Placeholder question-answered packet.
- `unknown/SnowWarsAddUserComposer.java` - Placeholder SnowWars packet.
- `unknown/SnowWarsCompose1.java` - Unknown SnowWars packet.
- `unknown/SnowWarsFullGameStatusComposer.java` - Placeholder SnowWars status packet.
- `unknown/SnowWarsGameStartedErrorComposer.java` - Placeholder SnowWars start error packet.
- `unknown/SnowWarsGenericErrorComposer.java` - Placeholder SnowWars error packet.
- `unknown/SnowWarsInitGameArena.java` - Placeholder SnowWars arena-init packet.
- `unknown/SnowWarsJoinErrorComposer.java` - Placeholder SnowWars join error packet.
- `unknown/SnowWarsLevelDataComposer.java` - Placeholder SnowWars level data packet.
- `unknown/SnowWarsLoadingArenaComposer.java` - Placeholder SnowWars loading packet.
- `unknown/SnowWarsLongDataComposer.java` - Placeholder SnowWars long-data packet.
- `unknown/SnowWarsOnGameEnding.java` - Placeholder SnowWars game-ending packet.
- `unknown/SnowWarsOnStageEnding.java` - Placeholder SnowWars stage-ending packet.
- `unknown/SnowWarsOnStageRunningComposer.java` - Placeholder SnowWars stage-running packet.
- `unknown/SnowWarsOnStageStartComposer.java` - Placeholder SnowWars stage-start packet.
- `unknown/SnowWarsPlayNowWindowComposer.java` - Placeholder SnowWars UI packet.
- `unknown/SnowWarsPreviousRoomComposer.java` - Placeholder SnowWars previous-room packet.
- `unknown/SnowWarsQuePositionComposer.java` - Placeholder SnowWars queue-position packet.
- `unknown/SnowWarsQuickJoinComposer.java` - Placeholder SnowWars quick-join packet.
- `unknown/SnowWarsRemoveUserComposer.java` - Placeholder SnowWars user-removal packet.
- `unknown/SnowWarsResetTimerComposer.java` - Placeholder SnowWars timer packet.
- `unknown/SnowWarsStartLobbyCounter.java` - Placeholder SnowWars lobby countdown packet.
- `unknown/SnowWarsUnknownComposer.java` - Unknown SnowWars packet.
- `unknown/SnowWarsUserChatComposer.java` - Placeholder SnowWars user-chat packet.
- `unknown/SnowWarsUserEnteredArenaComposer.java` - Placeholder SnowWars arena-entry packet.
- `unknown/SnowWarsUserExitArenaComposer.java` - Placeholder SnowWars arena-exit packet.
- `unknown/TalentTrackEmailFailedComposer.java` - Placeholder talent-track email failure packet.
- `unknown/TalentTrackEmailVerifiedComposer.java` - Placeholder talent-track email verified packet.
- `unknown/UnknownAdManagerComposer.java` - Unknown ad-manager packet.
- `unknown/UnknownAvatarEditorComposer.java` - Unknown avatar-editor packet.
- `unknown/UnknownCatalogPageOfferComposer.java` - Unknown catalog-page offer packet.
- `unknown/UnknownCompetitionComposer.java` - Unknown competition packet.
- `unknown/UnknownComposer4.java` - Unknown packet.
- `unknown/UnknownComposer8.java` - Unknown packet.
- `unknown/UnknownFurniModelComposer.java` - Unknown furniture-model packet.
- `unknown/UnknownGuild2Composer.java` - Unknown guild packet.
- `unknown/UnknownGuildComposer3.java` - Unknown guild packet.
- `unknown/UnknownHabboWayQuizComposer.java` - Unknown Habbo Way quiz packet.
- `unknown/UnknownHelperComposer.java` - Unknown helper packet.
- `unknown/UnknownHintComposer.java` - Unknown hint packet.
- `unknown/UnknownMessengerErrorComposer.java` - Unknown messenger error packet.
- `unknown/UnknownPollQuestionComposer.java` - Unknown poll packet.
- `unknown/UnknownRoomDesktopComposer.java` - Unknown room-desktop packet.
- `unknown/UnknownRoomViewerComposer.java` - Unknown room-viewer packet.
- `unknown/UnknownStatusComposer.java` - Unknown status/int packet.
- `unknown/UnknownTradeComposer.java` - Unknown trade packet.
- `unknown/UnkownPetPackageComposer.java` - Unknown pet-package packet; class name is misspelled.
- `unknown/UserClassificationComposer.java` - Placeholder user-classification packet.
- `unknown/VipTutorialsStartComposer.java` - Placeholder VIP tutorial packet.
- `unknown/WatchAndEarnRewardComposer.java` - Placeholder reward packet.
- `unknown/WelcomeGiftComposer.java` - Placeholder welcome-gift packet.
- `unknown/WelcomeGiftErrorComposer.java` - Placeholder welcome-gift error packet.

### Outgoing User Packets

- `users/AddUserBadgeComposer.java` - Adds a badge to user inventory/profile.
- `users/ChangeNameCheckResultComposer.java` - Sends name-check result.
- `users/ClubGiftReceivedComposer.java` - Confirms club gift received.
- `users/FavoriteRoomsCountComposer.java` - Sends favorite-room count.
- `users/MeMenuSettingsComposer.java` - Sends me-menu settings.
- `users/MutedWhisperComposer.java` - Sends muted-whisper feedback.
- `users/ProfileFriendsComposer.java` - Sends profile friends list.
- `users/UpdateUserLookComposer.java` - Updates user look/avatar.
- `users/UserAchievementScoreComposer.java` - Sends achievement score.
- `users/UserBadgesComposer.java` - Sends user badges.
- `users/UserBCLimitsComposer.java` - Sends Builders Club limits; ID mapping uncertain.
- `users/UserCitizinShipComposer.java` - Sends citizenship data.
- `users/UserClothesComposer.java` - Sends wardrobe/look inventory.
- `users/UserClubComposer.java` - Sends club subscription state.
- `users/UserCreditsComposer.java` - Sends user credits.
- `users/UserCurrencyComposer.java` - Sends currency balances.
- `users/UserDataComposer.java` - Sends core user data/profile block.
- `users/UserHomeRoomComposer.java` - Sends home-room IDs.
- `users/UserPerksComposer.java` - Sends perk flags.
- `users/UserPermissionsComposer.java` - Sends permission flags.
- `users/UserPointsComposer.java` - Sends points balances.
- `users/UserProfileComposer.java` - Sends a user profile.
- `users/UserWardrobeComposer.java` - Sends wardrobe slots.

Verification subpackage:
- `users/verification/VerifyMobileNumberComposer.java` - Sends mobile-number verification state.
- `users/verification/VerifyMobilePhoneCodeWindowComposer.java` - Opens mobile code-entry window.
- `users/verification/VerifyMobilePhoneDoneComposer.java` - Confirms mobile verification complete.
- `users/verification/VerifyMobilePhoneWindowComposer.java` - Opens mobile verification window.

### Outgoing WIRED Packets

- `wired/WiredConditionDataComposer.java` - Sends wired condition config.
- `wired/WiredEffectDataComposer.java` - Sends wired effect config.
- `wired/WiredOpenComposer.java` - Opens wired editor/view.
- `wired/WiredRewardAlertComposer.java` - Sends wired reward alert.
- `wired/WiredSavedComposer.java` - Confirms wired save.
- `wired/WiredTriggerDataComposer.java` - Sends wired trigger config.

## RCON Message Inventory

### Base Type

- `rcon/RCONMessage.java` - Base JSON message type for remote command handling.

### RCON Command Files

- `rcon/AlertUser.java` - Remote user alert command.
- `rcon/ChangeRoomOwner.java` - Remote room-owner change command.
- `rcon/ChangeUsername.java` - Remote username change command.
- `rcon/CreateModToolTicket.java` - Remote moderation ticket creation command.
- `rcon/DisconnectUser.java` - Remote user disconnect command.
- `rcon/ExecuteCommand.java` - Remote execution of an in-game/staff command.
- `rcon/ForwardUser.java` - Remote room-forward command.
- `rcon/FriendRequest.java` - Remote friend-request command.
- `rcon/GiveBadge.java` - Remote badge grant command.
- `rcon/GiveCredits.java` - Remote credit grant command.
- `rcon/GivePixels.java` - Remote pixel grant command.
- `rcon/GivePoints.java` - Remote point grant command.
- `rcon/GiveRespect.java` - Remote respect grant command.
- `rcon/GiveUserClothing.java` - Remote clothing grant command.
- `rcon/HotelAlert.java` - Remote hotel-wide alert command.
- `rcon/IgnoreUser.java` - Remote ignore-user command.
- `rcon/ImageAlertUser.java` - Remote image alert to a user.
- `rcon/ImageHotelAlert.java` - Remote hotel image alert.
- `rcon/ModifyUserSubscription.java` - Remote subscription modification command.
- `rcon/MuteUser.java` - Remote mute-user command.
- `rcon/ProgressAchievement.java` - Remote achievement-progress command.
- `rcon/SendGift.java` - Remote gift-send command.
- `rcon/SendRoomBundle.java` - Remote room-bundle grant command.
- `rcon/SetMotto.java` - Remote motto change command.
- `rcon/SetRank.java` - Remote rank-change command.
- `rcon/StaffAlert.java` - Remote staff alert command.
- `rcon/StalkUser.java` - Remote locate/follow user command.
- `rcon/TalkUser.java` - Remote make-user-talk command.
- `rcon/UpdateCatalog.java` - Remote catalog refresh command.
- `rcon/UpdateUser.java` - Remote user update command.
- `rcon/UpdateWordfilter.java` - Remote word-filter refresh command.

## Packet Comparison Checklist

Use this when comparing against the client project.

### Protocol Contract

- Do `Incoming.java` IDs align?
- Do `Outgoing.java` IDs align?
- Which IDs are `-1` or uncertain in either project?
- Which `unknown` packet classes have been resolved in one project but not the other?

### Authentication and Login

- Are the same packets allowed pre-auth?
- Does the handshake order match exactly?
- Is encryption forced, optional, or absent in the same way?
- Does login bootstrap send the same composer set in the same order?

### Session and Keepalive

- Is ping/pong behavior the same?
- Is idle disconnect timing the same?
- Is machine-ID handling the same?

### Rooms and Runtime Packets

- Do room load, room data, heightmap, rights, and room settings packets align?
- Do room user movement and chat packets align?
- Do room item and pet packets align?
- Do room promotion, guild badge, and queue packets align?

### Commerce and Inventory Packets

- Catalog page and purchase packets.
- Marketplace packets.
- Inventory list/update packets.
- Gift and voucher packets.

### Social and Moderation Packets

- Friends and private-message packets.
- Guide and guardian packets.
- Guild and guild forum packets.
- Moderation and sanction packets.

### WIRED and Game Packets

- Wired configuration/open/save packets.
- Game-center packets.
- Room game packets.
- Freeze/Banzai/football or other event-related packet coverage.

### Operational Interfaces

- Do RCON commands align?
- Are JSON field names and response status semantics aligned?
- Is IP allowlisting still the only gate?

## Client-Verified Protocol Alignment

This section documents findings from comparing the server's packet layer against the decompiled Habbo Flash client at [SWF-Source-Clean-MS](https://github.com/Domexx/SWF-Source-Clean-MS), targeting `PRODUCTION-201611291003-338511768`.

### Authoritative Client Packet Registry

The client's master packet registry is `HabboMessages.as` located within `com/sulake/habbo/communication/`. It contains the complete numeric header-to-class mapping for all packets. The registration block (approximately lines 988-2024) maps every header ID to its parser or composer class.

~90% of client class names are obfuscated as `_Str_XXXX` patterns (e.g., `_Str_8456`, `_Str_5765`). Only the numeric header IDs are reliable for cross-referencing between client and server. Attempting to match by class name is not viable.

### Wire Format Confirmation

The client's `EvaWireFormat.as` implements the same wire protocol as the server's Netty pipeline:

- **Frame format**: 4-byte big-endian length prefix + 2-byte big-endian header ID + variable-length payload
- **String encoding**: 2-byte length prefix + UTF-8 bytes
- **Integer encoding**: 4-byte big-endian signed int
- **Boolean encoding**: Single byte (0 or 1)
- **Short encoding**: 2-byte big-endian signed short

This matches the server's `GameByteFrameDecoder` (length stripping), `GameByteDecoder` (header + payload), `ClientMessage` (typed readers), and `ServerMessage` (typed writers).

### Header ID Alignment Status

**Confirmed aligned.** Server `Incoming.java` has 382 constants; client registers ~470 outgoing message composers. Server `Outgoing.java` has 489 constants; client registers ~520 incoming message parsers.

The count differences are explained by:
- Server disabled entries (`-1` IDs) that still occupy constant slots
- SnowStorm skeleton headers on the server side
- Client-only subsystem packets (campaign, NUX, video ads, sound) that the server does not handle
- Some client registrations mapping to server-unknown placeholder classes

### Verified Packet Tables By Domain

#### Handshake and Authentication

| Flow | Client Action | Server Incoming | Server Outgoing | Status |
|------|--------------|-----------------|-----------------|--------|
| Crypto init | Client sends | `InitCryptoEvent = 4000` | — | Aligned |
| DH params response | — | — | `InitDiffieHandshakeComposer = 3110` | Aligned |
| DH public key | Client sends | `GenerateSecretKeyEvent = 773` | — | Aligned |
| DH complete | — | — | `CompleteDiffieHandshakeComposer = 3885` | Aligned |
| Machine ID | Client sends | `MachineIDEvent = 2490` | — | Aligned |
| SSO login | Client sends | `SecureLoginEvent = 2419` | — | Aligned |
| Login OK | — | — | `SecureLoginOKComposer = 2491` | Aligned |
| Version/release | Client sends | `ReleaseVersionEvent = 4000`* | — | Aligned |

*Note: `ReleaseVersionEvent` shares header 4000 with `InitCryptoEvent` in some builds; the server handles this in `registerHandshake()`.

RC4 encryption is optional in both client and server. The client checks `_cipher != null` before applying stream cipher operations; the server conditionally inserts `GameByteEncryption`/`GameByteDecryption` pipeline handlers only after DH completes successfully.

#### Room Engine

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| Request heightmap | `RequestHeightmapEvent` | In | Aligned |
| Room heightmap data | `RoomHeightMapComposer` | Out | Aligned |
| Room model | `RoomModelComposer` | Out | Aligned |
| Floor items list | `RoomFloorItemsComposer` | Out | Aligned |
| Wall items list | `RoomWallItemsComposer` | Out | Aligned |
| Users list | `RoomUsersComposer` | Out | Aligned |
| User status update | `RoomUserStatusComposer` | Out | Aligned |
| Walk request | `RoomUserWalkEvent` | In | Aligned |
| Add floor item | `AddFloorItemComposer` | Out | Aligned |
| Remove floor item | `RemoveFloorItemComposer` | Out | Aligned |
| Update floor item | `FloorItemUpdateComposer` | Out | Aligned |
| Add wall item | `AddWallItemComposer` | Out | Aligned |
| Remove wall item | `RemoveWallItemComposer` | Out | Aligned |
| Room data | `RoomDataComposer` | Out | Aligned |
| Room settings | `RoomSettingsComposer` | Out | Aligned |
| Room rights | `RoomRightsComposer` | Out | Aligned |
| Chat (talk) | `RoomUserTalkComposer` | Out | Aligned |
| Chat (shout) | `RoomUserShoutComposer` | Out | Aligned |
| Chat (whisper) | `RoomUserWhisperComposer` | Out | Aligned |
| Roller movement | `FloorItemOnRollerComposer` / `RoomUnitOnRollerComposer` | Out | Aligned |

#### Catalog and Commerce

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| Catalog index | `CatalogPagesListComposer` | Out | Aligned |
| Catalog page | `CatalogPageComposer` | Out | Aligned |
| Buy item | `CatalogBuyItemEvent` | In | Aligned |
| Buy as gift | `CatalogBuyItemAsGiftEvent` | In | Aligned |
| Purchase OK | `PurchaseOKComposer` | Out | Aligned |
| Voucher redeem | `RedeemVoucherEvent` | In | Aligned |
| Marketplace config | `MarketplaceConfigComposer` | Out | Aligned |
| Marketplace offers | `MarketplaceOffersComposer` | Out | Aligned |
| Marketplace buy | `BuyItemEvent` (marketplace) | In | Aligned |
| Marketplace sell | `SellItemEvent` (marketplace) | In | Aligned |

#### Navigator

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| New nav data | `NewNavigatorMetaDataComposer` | Out | Aligned |
| Nav search results | `NewNavigatorSearchResultsComposer` | Out | Aligned |
| Nav settings | `NewNavigatorSettingsComposer` | Out | Aligned |
| Saved searches | `NewNavigatorSavedSearchesComposer` | Out | Aligned |
| Room categories | `RoomCategoriesComposer` | Out | Aligned |
| Create room | `RequestCreateRoomEvent` | In | Aligned |
| Room created | `RoomCreatedComposer` | Out | Aligned |

#### Moderation

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| Mod tool init | `ModToolComposer` | Out | Aligned |
| Room info | `ModToolRoomInfoComposer` | Out | Aligned |
| User info | `ModToolUserInfoComposer` | Out | Aligned |
| Room chatlog | `ModToolRoomChatlogComposer` | Out | Aligned |
| User chatlog | `ModToolUserChatlogComposer` | Out | Aligned |
| Issue info | `ModToolIssueInfoComposer` | Out | Aligned |
| Pick ticket | `ModToolPickTicketEvent` | In | Aligned |
| Close ticket | `ModToolCloseTicketEvent` | In | Aligned |
| Alert user | `ModToolAlertEvent` | In | Aligned |
| Kick user | `ModToolKickEvent` | In | Aligned |
| CFH topics | `CfhTopicsMessageComposer` | Out | Aligned |

#### WIRED

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| Trigger data | `WiredTriggerDataComposer` | Out | Aligned |
| Effect data | `WiredEffectDataComposer` | Out | Aligned |
| Condition data | `WiredConditionDataComposer` | Out | Aligned |
| Save trigger | `WiredTriggerSaveDataEvent` | In | Aligned |
| Save effect | `WiredEffectSaveDataEvent` | In | Aligned |
| Save condition | `WiredConditionSaveDataEvent` | In | Aligned |
| Reward alert | `WiredRewardAlertComposer` | Out | Aligned |
| Apply snapshot | `WiredApplySetConditionsEvent` | In | Aligned |
| Saved confirmation | `WiredSavedComposer` | Out | Aligned |

#### Game Center

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| Game list | `GameCenterGameListComposer` | Out | Aligned |
| Account info | `GameCenterAccountInfoComposer` | Out | Aligned |
| Join game | `GameCenterJoinGameEvent` | In | Aligned |
| Load game | `GameCenterLoadGameEvent` | In | Aligned |
| Leave game | `GameCenterLeaveGameEvent` | In | Aligned |
| Game status | `GameCenterRequestGameStatusEvent` | In | Aligned |

#### Trading

| Packet | Server Constant | Direction | Status |
|--------|----------------|-----------|--------|
| Start trade | `TradeStartEvent` | In | Aligned |
| Offer item | `TradeOfferItemEvent` | In | Aligned |
| Offer multiple | `TradeOfferMultipleItemsEvent` | In | Aligned |
| Accept | `TradeAcceptEvent` | In | Aligned |
| Unaccept | `TradeUnAcceptEvent` | In | Aligned |
| Confirm | `TradeConfirmEvent` | In | Aligned |
| Cancel | `TradeCancelEvent` | In | Aligned |
| Close | `TradeCloseEvent` | In | Aligned |
| Cancel offer | `TradeCancelOfferItemEvent` | In | Aligned |
| Trade started | `TradeStartComposer` | Out | Aligned |

### Disabled Packet Details

#### Server Incoming Disabled (`-1`)

6 incoming packet constants are set to `-1`, meaning the server silently ignores these packets even if the client sends them:

| Constant | Expected Client Behavior |
|----------|------------------------|
| `ModToolWarnEvent` | Client has moderator warn UI; server ignores |
| `ModToolBanEvent` | Client has mod ban button; server uses sanction path instead |
| `SearchRoomsByTagEvent` | Client may send tag searches; server handles via new navigator |
| `ModToolRequestRoomUserChatlogEvent` | Client requests room-user chatlog; server uses alternate paths |
| `RequestAchievementConfigurationEvent` | Client requests achievement config; server sends proactively |
| `HotelViewClaimBadgeRewardEvent` | Client claims hotel-view badge; feature not implemented |

#### Server Outgoing Disabled (`-1`)

10 outgoing packet constants are set to `-1`, meaning the server never sends these even though the client has parsers:

| Constant | Client Impact |
|----------|--------------|
| `PublicRoomsComposer` | Client parser exists but server never sends legacy public room list |
| `RemoveFriendComposer` | Client uses `UpdateFriendComposer` instead |
| `RoomEntryInfoComposer` | Client parser exists; server uses other room data packets |
| `UserBCLimitsComposer` | Client has Builders Club UI; server has no BC implementation |
| `QuestionInfoComposer` | Client parser exists; feature appears unused |
| `UnknownGuildForumComposer6` | Unknown purpose; never sent |
| `UnknownGuildForumComposer7` | Unknown purpose; never sent |
| `RoomUserQuestionAnsweredComposer` | Client has quiz feedback UI; server does not send |
| `HotelViewCustomTimerComposer` | Client has timer display; server does not send |
| `InventoryAddEffectComposer` | Client has individual effect add; server uses full list refresh |

### SnowStorm Packet Coverage Gap

The largest protocol gap is SnowStorm. Details:

**Server incoming (27 headers):**
- 2 named: `SnowStormGameStart`, `SnowStormGameEnd` (approximate)
- 25 unnamed: `UNKNOWN_SNOWSTORM_6001` through `UNKNOWN_SNOWSTORM_6025`
- None have handler implementations

**Server outgoing (30 headers):**
- 5 named with header IDs
- 25 skeleton composer classes under `outgoing/unknown/SnowWars*.java`
- All composers are empty placeholders with no `compose()` body

**Client:**
- Full SnowStorm implementation under `src/snowwar/` with game state management, arena rendering, projectile physics, player management, team scoring, and dozens of supporting classes
- All SnowStorm packet parsers/composers are registered in `HabboMessages.as`

**Impact:** The client can display SnowStorm UI and attempt to join games, but the server cannot process any SnowStorm game logic. Players will encounter non-functional behavior.

### Builders Club Packet Gap

Builders Club is a separate subscription system from HC/VIP. The client has a full BC packet set; the server has only stubs and dead code.

#### Client-to-Server (server has NO handlers)

| Client Packet | Purpose | Server `Incoming.java` | Status |
|--------------|---------|----------------------|--------|
| `BuildersClubPlaceRoomItemMessageComposer` | Place furni using BC credits | Not registered | **Missing** |
| `BuildersClubPlaceWallItemMessageComposer` | Place wall item using BC credits | Not registered | **Missing** |
| `BuildersClubQueryFurniCountMessageComposer` | Query remaining BC furni allowance | Not registered | **Missing** |

These 3 packets are sent by the client when BC placement mode is active. The server silently drops them because no `Incoming.java` constants exist.

#### Server-to-Client

| Server Composer | Packet ID | Client Parser | Status |
|----------------|-----------|--------------|--------|
| `BuildersClubExpiredComposer` | 1452 (active) | `BuildersClubSubscriptionStatusMessageEvent` | **Stub** — always sends hardcoded "expired" values |
| `UserBCLimitsComposer` | -1 (disabled) | `BuildersClubFurniCountMessageEvent` | **Dead code** — ID is `-1`, never sent |

#### Server Support Infrastructure (all stubs)

- 3 catalog page layouts (`BuildersClubAddonsLayout`, `BuildersClubFrontPageLayout`, `BuildersClubLoyaltyLayout`) — render page chrome only
- `RedeemableSubscriptionType.BUILDERS_CLUB` enum — exists but no `SubscriptionBuildersClub` class is registered
- 9 `BubbleAlertKeys` for BC lifecycle events — defined but never triggered
- `BUILDER_AT_WORK` perk in `UserPerksComposer` — hardcoded `true` for all users

**Impact:** The client can display BC catalog pages and the BC furniture placement toolbar (because `BUILDER_AT_WORK` is always `true`), but attempting to place furniture via BC credits produces no server response. The server always reports BC as expired on login.

### Class Name Obfuscation Note

When cross-referencing packets between client and server, be aware that:
- Client class names follow the pattern `_Str_XXXX` (e.g., `_Str_8456`, `_Str_5765`)
- These are decompiler-generated names from obfuscated SWF bytecode
- Only a small percentage of client classes retain meaningful names
- The **only reliable cross-reference key is the numeric header ID**
- Server class names (e.g., `SecureLoginEvent`, `RoomUsersComposer`) are human-readable and descriptive
- Do not attempt to match client `_Str_XXXX` names to server class names; use `HabboMessages.as` header ID registrations instead

## Packet Misuse Audit

A systematic audit of all outgoing composers and their call sites, checking for wrong header usage, incorrect wire formats, dead code, and semantic mismatches with the Flash client's expected protocol. Organized by subsystem.

### Item State Packets

1. **`ItemStateComposer` (2376) — Silent data loss on non-integer extradata.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/ItemStateComposer.java`
   The composer catches `NumberFormatException` and sends `0` whenever `extradata` is not a valid integer. Items with complex extradata (maps, strings, multi-part) silently lose their state on any toggle or interaction that routes through this composer.

2. **`ItemIntStateComposer` / `ItemStateComposer2` (3431) — WRONG HANDLER. Semantic mismatch.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/ItemIntStateComposer.java`
   Used exclusively by `InteractionOneWayGate` (lines 100, 109, 130). Header 3431 maps to `DiceValueMessageEvent` in the client (`_Str_8183`), NOT `OneWayDoorStatusMessageEvent`. The correct header for one-way gates is 2376 (`ItemStateComposer`), which maps to `OneWayDoorStatusMessageEvent` (`_Str_7657`). This works only because both client handlers (`onDiceValue` and `onOneWayDoorStatus` in `RoomMessageHandler.as`) are functionally identical — both read `{int id, int value}` and call `updateObjectFurniture(roomId, id, null, null, value, new LegacyStuffData())`. The gate is also internally inconsistent: `InteractionOneWayGate.java` sends header 3431 directly, but `OneWayGateActionOne.java` uses `room.updateItemState()` which sends header 2376 — the same gate uses two different client handlers depending on code path. See `PACKET-MISALIGNMENT.md` §1 for full analysis.

3. **`ItemExtraDataComposer` (2547) — Underutilized.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/ItemExtraDataComposer.java`
   Rich extradata update composer. Used only by `InteractionMuteArea`. Many items with complex extradata (map type, string type, vote result type) rely on the heavier `FloorItemUpdateComposer` instead of this targeted composer, sending unnecessary fields on every state change.

4. **`FloorItemUpdateComposer` (3776) — Usability flag always zero. BUG.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/FloorItemUpdateComposer.java:24`
   The composer always writes `0` for the usability/interactivity field. By contrast, `AddFloorItemComposer` and `RoomFloorItemsComposer` send context-appropriate values (`1` = usable, `2` = interactive/rights-required). After any `updateItem()` call, the client loses the correct interaction cursor for that item. Over 100 call sites across the codebase route through `updateItem()`, meaning this affects virtually every item state change, movement, rotation, and WIRED trigger.

5. **`ItemsDataUpdateComposer` (1453) — Narrow usage.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/ItemsDataUpdateComposer.java`
   Batch extradata update. Only used by `BattleBanzaiTilesFlicker`. The composer itself is correctly implemented, but no other subsystem uses it despite many cases where batch updates would be more efficient than individual `FloorItemUpdateComposer` calls.

### Room Entry Packets

6. **`RoomOpenComposer` (758) — Empty body. DEFINITE BUG.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomOpenComposer.java`
   Call site: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomManager.java:650`
   The composer sends an empty packet body. The client's parser for header 758 (`RoomReadyMessageParser`) expects `String modelName` followed by `int roomId`. Without these fields, the client cannot determine which room model to render. This is a confirmed protocol violation.

7. **`RoomEntryInfoComposer` (header -1) — Disabled and never sent. MISSING.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomEntryInfoComposer.java`
   The composer exists but its header is set to `-1` (disabled). The client may need this packet during room entry initialization to set up owner status and room entry context. The packet is never sent in any room entry flow.

8. **`RoomNoRightsComposer` (2392) — Never used. DEAD CODE.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomNoRightsComposer.java`
   The server always sends `RoomRightsComposer` with level `NONE` (0) instead of the purpose-built no-rights packet. The client may handle these differently — `RoomNoRightsComposer` could clear rights UI elements more definitively than a rights-level-zero message.

9. **`RoomPaneComposer` (749) — Possible header collision.**
   File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomPaneComposer.java`
   Sends only `(roomId, isOwner)`. Header 749 may map to `RoomVisualizationSettingsComposer` in some client builds, which expects wall/floor/landscape thickness data. If so, the client would parse the room ID and owner flag as visualization parameters.

10. **`RoomQueueStatusMessage` (2208) — Dead code with hardcoded test values.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomQueueStatusMessage.java`
    Contains hardcoded placeholder data ("Waiting queue for this room is active", target=100). Never instantiated anywhere in the codebase.

11. **`RoomUnknown3Composer` (1033) — Dead code.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomUnknown3Composer.java`
    Never instantiated. Purpose unknown.

### Trading Packets

12. **`TradeCompleteComposer` — Wrong header constant. BUG.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/trading/TradeCompleteComposer.java:10`
    Uses `Outgoing.UnknownTradeComposer` (3128) instead of `Outgoing.TradeCompleteComposer` (2369). The client registers its trade-completion parser on header 2369. Sending 3128 means the client may never recognize that a trade completed successfully, potentially leaving the trade UI in a stale state.

13. **`RoomTrade.java:138` — Wrong ID type in TradeClosedComposer. BUG.**
    File: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomTrade.java:138`
    Uses `getRoomUnit().getId()` (transient room unit ID, assigned per room visit) instead of `getHabboInfo().getId()` (persistent user ID) when sending `TradeClosedComposer` for item validation failure. The client expects a Habbo user ID to identify which trader caused the close. A room unit ID will either not match any known user or incorrectly match a different user.

14. **`TradeClosedComposer` — Misleading name, correct function.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/trading/TradeClosedComposer.java`
    Class is named `TradeClosedComposer` but uses `Outgoing.TradeStoppedComposer` (1373). The naming is misleading but functionally correct — the client's parser for 1373 handles trade-close/stop events.

15. **`YouTradingDisabledComposer` and `OtherTradingDisabledComposer` — Dead code.**
    Files: `src/main/java/com/eu/habbo/messages/outgoing/trading/YouTradingDisabledComposer.java`, `OtherTradingDisabledComposer.java`
    Neither is ever instantiated. All trading-disabled feedback is handled by `TradeStartFailComposer`.

16. **`TradeCloseEvent.java:23` — Double stop call.**
    File: `src/main/java/com/eu/habbo/messages/incoming/trading/TradeCloseEvent.java:23`
    `trade.stopTrade(habbo)` internally calls `room.stopTrade(trade)`, then the event handler calls `room.stopTrade(trade)` again. The second call is redundant and may cause double-processing if `stopTrade` has side effects beyond idempotent removal.

### Effects Packets

17. **`EffectsListAddComposer` (2867) — Field count mismatch. BUG.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/inventory/EffectsListAddComposer.java`
    Sends 4 fields per effect entry, but `UserEffectsListComposer` (340) sends 6 fields per entry. Both packets describe effects to the same client parser family. The missing fields are `remainingQuantity` and `secondsRemaining`. The client parser likely expects 6 fields and will either read into adjacent data or desync its buffer position.

18. **`UserEffectsListComposer` (340) — Wrong time formula. BUG.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/inventory/UserEffectsListComposer.java:43`
    Computes seconds remaining as `(now - activationTimestamp) + duration`, which grows over time. The correct formula is `duration - (now - activationTimestamp)`. This means the client displays an ever-increasing remaining time instead of a countdown.

### Room User Packets

19. **`RoomUserStatusComposer` (1640) — Mutates state during composition. SIDE EFFECT.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/users/RoomUserStatusComposer.java:58,79`
    The composer updates `previousLocation` on room units during serialization. This makes the compose operation non-idempotent — calling it twice changes the data. If the packet is re-sent (e.g., for a late joiner), the previous-location tracking will be incorrect.

20. **`RoomUserNameChangedComposer` (2182) — Abused for chat prefix display.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/users/RoomUserNameChangedComposer.java`
    Used to temporarily change the displayed username to include a rank prefix during chat. A subsequent packet reverts the name. If the revert packet is lost or the connection drops between the two packets, the user's displayed name will appear permanently prefixed with rank text.

21. **`RoomUserStatusComposer` — Duplicate code paths.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/users/RoomUserStatusComposer.java:40-59,61-81`
    Two nearly identical serialization blocks exist: one iterating `roomUnits`, one iterating `habbos`. Both produce the same wire format with the same mutation side effects. This duplication increases maintenance risk.

### Guild and Forum Packets

22. **`GuildForumThreadMessagesComposer` (1862) — Misleading name.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/guilds/forums/GuildForumThreadMessagesComposer.java`
    Despite its name, this composer sends thread header metadata (author, title, timestamps, flags), not thread messages/comments. The actual message content composer is separate.

23. **`GuildEditFailComposer.MAX_GUILDS_JOINED` — Error code defined but never sent.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/guilds/GuildEditFailComposer.java`
    The `MAX_GUILDS_JOINED` error code constant exists but no server logic validates or enforces a maximum guilds limit. Users can join unlimited guilds without triggering this error.

24. **`GuildConfirmRemoveMemberEvent.java:22` — Null pointer exception due to operator precedence. BUG.**
    File: `src/main/java/com/eu/habbo/messages/incoming/guilds/GuildConfirmRemoveMemberEvent.java:22`
    Expression: `member != null && member.getRank().equals(GuildRank.OWNER) || member.getRank().equals(GuildRank.ADMIN)`.
    Due to Java operator precedence (`&&` binds tighter than `||`), this evaluates as `(member != null && member.getRank().equals(OWNER)) || member.getRank().equals(ADMIN)`. When `member` is null, the first clause is false, then the `||` evaluates `member.getRank()` without a null guard, causing an NPE.

25. **`GuildDeleteEvent.java:35` — Potential NPE on room lookup.**
    File: `src/main/java/com/eu/habbo/messages/incoming/guilds/GuildDeleteEvent.java:35`
    `getRoom(guild.getRoomId())` can return null if the guild's room is not currently loaded. The result is used immediately with `.sendComposer()` without a null check.

26. **`UnknownGuild2Composer` (1459) and `UnknownGuildComposer3` (876) — Dead code.**
    Files: `src/main/java/com/eu/habbo/messages/outgoing/guilds/UnknownGuild2Composer.java`, `UnknownGuildComposer3.java`
    Never instantiated anywhere in the codebase.

### Navigator and Catalog Packets

27. **`PrivateRoomsComposer` (52) — Hardcoded garbage data. BUG.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/navigator/PrivateRoomsComposer.java:36-45`
    Contains placeholder strings `"A"`, `"B"`, `"C"`, `"D"`, `"E"` and arbitrary integer values that serve no real purpose. The composer also returns `null` on exception, which will cause an NPE when the caller attempts to write the response to the channel.

28. **`NotEnoughPointsTypeComposer` (3914) — Never sent for catalog purchases. MISSING FEEDBACK.**
    File: `src/main/java/com/eu/habbo/habbohotel/catalog/CatalogManager.java:886-888`
    When a user cannot afford a catalog item, the purchase handler silently returns without sending any feedback packet. `NotEnoughPointsTypeComposer` exists and is correctly implemented but is only used for camera purchases. Catalog purchases fail silently from the user's perspective.

29. **`AlertLimitedSoldOutComposer` (377) — Misused for crafting failures.**
    File: Used in `CraftingEvent.java`, `CraftSecretEvent.java`, and `ExecuteCraftingRecipeEvent.java`
    All three crafting event handlers send `AlertLimitedSoldOutComposer` when crafting fails. The client displays a "limited edition sold out" dialog instead of a crafting-specific error message. This is a UX mismatch — the user sees a catalog-related error during a crafting workflow.

30. **`NewNavigatorCategoryUserCountComposer` (1455) — Dead code with fake data.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/navigator/NewNavigatorCategoryUserCountComposer.java`
    Contains hardcoded values (always 0 users, 200 max). Never instantiated.

31. **`SearchResultList.serialize()` — Destructive side effect during serialization.**
    File: `src/main/java/com/eu/habbo/habbohotel/navigation/SearchResultList.java:47-57`
    Already documented as Confirmed Defect #6 in PROJECT.md. Permanently removes invisible rooms from the source list during serialization, meaning subsequent serializations of the same list return fewer results.

32. **`OldPublicRoomsComposer` (2726) — Dead constant, no class.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/Outgoing.java`
    The constant exists in `Outgoing.java` but no corresponding composer class exists. Pure dead code.

### Roller Packets

33. **`ObjectOnRollerComposer` (3207) — Correct implementation.**
    Files: `FloorItemOnRollerComposer.java`, `RoomUnitOnRollerComposer.java`
    Both composers correctly use header 3207 and produce wire format matching the client's `SlideObjectBundleMessageParser`. No misuse found.

34. **Missing slide type 3 (teleport slide).**
    The server never sends slide type 3 (teleport/instant-move). Only type 0 (item slide) and type 2 (avatar slide) are used. Teleporter transitions appear as normal roller animations instead of instant teleport visuals.

35. **Roller ID inconsistency between item and unit composers.**
    `FloorItemOnRollerComposer` uses `-1` to indicate no roller, `RoomUnitOnRollerComposer` uses `0`. Both values are accepted by the client, but the inconsistency could cause issues if the client ever changes its "no roller" sentinel.

### Messenger Packets

36. **`MessengerErrorComposer` (896) and `UnknownMessengerErrorComposer` (3359) — Dead code.**
    Files: `src/main/java/com/eu/habbo/messages/outgoing/friends/MessengerErrorComposer.java`, `UnknownMessengerErrorComposer.java`
    Neither is ever instantiated. No messenger error feedback is sent to the client for any messenger operation failure (friend request rejected, message send failure, etc.).

37. **`RemoveFriendComposer` constant (Outgoing.RemoveFriendComposer = -1) — Dead constant.**
    File: `src/main/java/com/eu/habbo/messages/outgoing/Outgoing.java`
    The `Outgoing.RemoveFriendComposer` constant is `-1` (disabled). The actual `RemoveFriendComposer` class works correctly because it internally uses `Outgoing.UpdateFriendComposer` (2800) with a remove-type flag. The dead constant is misleading but not a functional bug.

### Other Behavioral Issues

38. **Auto-idle does not broadcast if user is dancing.**
    File: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomCycleManager.java:239-241`
    When a user goes idle while dancing, the idle status is set internally but the idle status update is not broadcast to other room users. When the user later stops dancing, other clients may not see the idle state correctly, causing a visual desync.

## Final Assessment

- The packet layer is large, broad, and feature-complete enough to support most of the hotel runtime surface.
- It is one of the most comparison-critical parts of the codebase.
- The architecture is understandable and structurally conventional for this kind of project.
- The biggest concerns are not conceptual complexity so much as maintenance risk and protocol drift risk.
- **Client comparison confirms full protocol alignment** for `PRODUCTION-201611291003-338511768`. Header IDs match across all verified subsystems including handshake, rooms, catalog, navigator, moderation, WIRED, games, trading, guilds, and inventory.
- The main protocol gaps are:
  - SnowStorm (27 incoming + 30 outgoing headers with no implementation)
  - 6 disabled incoming headers (client packets silently dropped)
  - 10 disabled outgoing headers (client parsers that never receive data)
- The wire format (`EvaWireFormat.as`) is confirmed identical to the server's Netty framing.
- The `HabboMessages.as` file in the client repository is the authoritative reference for all header ID assignments.
- When comparing against the client project, focus first on:
  - packet ID catalogs
  - handshake/auth/login bootstrap behavior
  - room/user/item packet families
  - unknown packet coverage
  - RCON command semantics (client-only; RCON is a server operational interface)

- If those differ, most higher-level behavior differences will trace back to them quickly.
