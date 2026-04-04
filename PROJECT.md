# Arcturus Community Java Review

## Scope

- Branch reviewed: `develop`
- Source scope: `src/main/java/**/*.java`
- Non-Java files were intentionally excluded from this review.
- Database behavior, configuration behavior, packet behavior, and room/runtime behavior are described only where they are visible from Java code.
- A dedicated packet/protocol review lives in `PACKETS.md` so this document can stay focused on whole-project architecture and subsystem responsibilities.

## Purpose

- This file is meant to be a comparison baseline against the client project's future `PROJECT.md`.
- The goal is not only to describe what exists, but to make later alignment work easier.
- The emphasis is therefore on structure, responsibilities, runtime behavior, coupling, correctness risks, and refactor pressure.

## Reading Guide

- Start with `Executive Summary` for the highest-level view.
- Use `Confirmed Defects` and `Probable Behavior Risks` for concrete refactor targets.
- Use `Package Review` sections for subsystem-by-subsystem understanding.
- Use `Comparison Checklist` near the end when comparing this project to the client version.
- Use `PACKETS.md` for the full inbound/outbound protocol and packet-handler review.

## Executive Summary

- The project is a large Java-based Habbo server/emulator organized around a strong global singleton pattern.
- `Emulator` is the composition root, service locator, lifecycle owner, and global utility bucket.
- `GameEnvironment` is the hotel-domain composition root and constructs most feature managers.
- The runtime heart of the product is the room engine: `Room`, `RoomCycleManager`, `RoomUnit`, `RoomItemManager`, `RoomUnitManager`, `RoomSpecialTypes`, and `RoomManager`.
- The main interactive gameplay layers are built on top of rooms, items, users, pets, games, and WIRED.
- The item system is one of the most central and most coupled areas in the codebase.
- The catalog, moderation tool, achievement manager, and command system are all manager-heavy and contain broad orchestration responsibilities.
- The project has a mature feature surface, but a high degree of architectural drift.
- Package names often no longer match actual responsibilities.
- Many classes directly mix domain logic, packet emission, and SQL access.
- The project contains a meaningful plugin/event layer, but it still depends on broad global state and reflective dispatch.
- The threading model is mixed: scheduled executors, room ticks, wired ticks, ad hoc delayed runnables, and direct persistence from domain objects all coexist.
- WIRED is one of the more modern-looking parts of the project because it has a typed event/context engine and a dedicated tick service.
- The packet layer is clear and structurally understandable, but still relies on a giant manual registry and several brittle parsing choices.
- Later alignment work with a client codebase will almost certainly focus on packet behavior, room runtime, item behavior, permissions, navigator, catalog purchase behavior, and moderation features.

## Highest Priority Findings

1. `Emulator` is a god object and the main global coupling point across almost every subsystem.
2. `GameEnvironment` is a second service locator inside the hotel domain and reinforces broad runtime coupling.
3. `Room` remains the central runtime aggregate, but it is still too large and owns too many lifecycle concerns.
4. `ItemManager` is a major hotspot because items touch catalog, rooms, guilds, pets, games, wired, permissions, users, and moderation-adjacent behavior.
5. `CatalogManager` contains a large orchestration surface and an especially high-complexity purchase path.
6. `ModToolManager` combines tickets, chat logs, room actions, sanctions, bans, and metadata loading into one large service.
7. `AchievementManager` mixes definition loading, reward logic, packet emission, inventory mutation, and persistence.
8. `CommandHandler` is a global static command router that scans many command classes and coordinates permissions, plugins, and logging.
9. The database layer is intentionally thin, but the consequence is SQL distributed through many managers and even domain objects.
10. Domain objects frequently persist themselves, which makes thread ownership and transaction boundaries harder to reason about.
11. Several confirmed defects exist in guilds, guides, moderation, navigation, packet callback unregistering, word filtering, and tile copying.
12. The packet layer is understandable, but packet registration, parsing, and RCON transport choices create clear refactor pressure.
13. The project has extensive feature coverage and a rich event surface, but it pays for that with high incidental complexity.
14. The best long-term refactor direction is to reduce global state, narrow manager responsibilities, centralize persistence boundaries, and separate runtime orchestration from serialization and side effects.

## Confirmed Defects

1. `GuildMember.compareTo` always returns `0`.
File: `src/main/java/com/eu/habbo/habbohotel/guilds/GuildMember.java:61-63`
Impact: All guild members compare as equal, so any sort depending on `Comparable<GuildMember>` is a no-op — the collection order is determined entirely by insertion order rather than any meaningful ranking.

2. `GuardianTicket.calculateVerdict` is a hardcoded placeholder.
File: `src/main/java/com/eu/habbo/habbohotel/guides/GuardianTicket.java:158-160`
Impact: Guardian verdict calculation always resolves to `BADLY`, regardless of submitted votes.

3. `GuideTour.finish` contains only TODO comments.
File: `src/main/java/com/eu/habbo/habbohotel/guides/GuideTour.java:27-30`
Impact: Expected completion behavior for recommendations and stored messages is missing.

4. Guild member paging uses the SQL `LIMIT` count argument as if it were an end index.
File: `src/main/java/com/eu/habbo/habbohotel/guilds/GuildManager.java:392-396`
Impact: Page sizes grow with page number instead of staying fixed, causing incorrect pagination behavior.

5. `GuildManager.getMostViewed()` sorts ascending by view count.
File: `src/main/java/com/eu/habbo/habbohotel/guilds/GuildManager.java:658-668`
Impact: A method named `getMostViewed` actually trends toward least-viewed-first ordering before truncation.

6. `SearchResultList.serialize()` mutates its own room list while serializing.
File: `src/main/java/com/eu/habbo/habbohotel/navigation/SearchResultList.java:47-57`
Impact: Serialization has side effects, which can permanently shrink result lists and create surprising reuse behavior.

7. `ModToolManager.createOfflineUserBan()` uses `executeQuery()` for an insert statement.
File: `src/main/java/com/eu/habbo/habbohotel/modtool/ModToolManager.java:359-381`
Impact: Generated-key retrieval is implemented through the wrong JDBC execution path and is fragile or outright incorrect depending on driver behavior.

8. `WordFilter.filter(String, Habbo)` detects words case-insensitively via `StringUtils.containsIgnoreCase`, then calls `String.replace("(?i)" + word.key, word.replacement)`.
File: `src/main/java/com/eu/habbo/habbohotel/modtool/WordFilter.java:149-155`
Impact: `String.replace()` treats its first argument as a literal string, not a regex. The literal string `"(?i)word"` never appears in any real message, so the replacement silently does nothing. Detection fires correctly (the word is found and mute logic runs), but the actual text censoring is entirely skipped — banned words pass through the filter unchanged.

9. `PacketManager.unregisterCallables(Integer header)` clears the entire callable registry.
File: `src/main/java/com/eu/habbo/messages/PacketManager.java:161-164`
Impact: Unregistering callables for one header removes callables for all headers.
Note: The two-argument variant `unregisterCallables(Integer header, ICallable callable)` is correct — it removes only the specified callable for the given header. Only the single-argument overload is broken.
Note: This is covered in detail again in `PACKETS.md`.

10. `RoomTile` copy construction shares the original `units` set.
File: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomTile.java:33-48`
Impact: `tile.copy()` is called by `RoomLayout.getRoute()` during A* pathfinding specifically to avoid mutating the live room grid. However, the copy constructor assigns `this.units = tile.units` — a reference copy, not a deep copy. All other fields (x, y, z, stackHeight, state, gCosts, hCosts) are correctly copied. The shared `units` reference means any modification to the copied tile's occupancy during pathfinding also mutates the original room tile's occupancy set.

11. `RoomTile.hasUnits()` mutates the unit collection during what reads like a pure query.
File: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomTile.java:183-188`
Impact: `hasUnits()` is a lazy-cleanup method: it calls `units.removeIf(unit -> !unit.getCurrentLocation().equals(this))` to evict stale references before returning. This is a cleanup operation disguised as a predicate. Combined with defect #10, calling `hasUnits()` on a pathfinding copy tile will permanently remove units from the original room's tile occupancy set — the stale-reference cleanup runs on the shared set. This also suggests the room engine has incomplete movement-notification paths that leave stale entries in the units collection.

12. `Game.onEnd()` awards `GamePlayerExperience` to `roomOwner` inside the winner loop, not the winner.
File: `src/main/java/com/eu/habbo/habbohotel/games/Game.java:152-159`
Impact: For every winner on the winning team, the room owner receives one `GamePlayerExperience` achievement progress tick. The actual winner receives nothing. If the room owner is also a winner, they receive multiple ticks (one per winner). Winners who are not the room owner receive no achievement progress at all.

13. `RoomOpenComposer` (758) sends an empty packet body.
File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/RoomOpenComposer.java`
Call site: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomManager.java:650`
Impact: The client's parser for header 758 (`RoomReadyMessageParser`) expects `String modelName` followed by `int roomId`. The empty body means the client cannot determine which room model to render during room entry.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 6.

14. `TradeCompleteComposer` uses `Outgoing.UnknownTradeComposer` (3128) instead of `Outgoing.TradeCompleteComposer` (2369).
File: `src/main/java/com/eu/habbo/messages/outgoing/trading/TradeCompleteComposer.java:10`
Impact: The client registers its trade-completion parser on header 2369. Sending 3128 means the client may never process the trade-completion event, leaving the trade UI in a stale state after a successful trade.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 12.

15. `FloorItemUpdateComposer` (3776) always sends `0` for the usability/interactivity field.
File: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/FloorItemUpdateComposer.java:24`
Impact: After any `updateItem()` call, the client loses the correct interaction cursor for that item. `AddFloorItemComposer` and `RoomFloorItemsComposer` correctly send `1` (usable) or `2` (interactive), but updates always reset to `0`. Over 100 call sites are affected.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 4.

16. `GuildConfirmRemoveMemberEvent.java:22` has an operator precedence bug causing NPE.
File: `src/main/java/com/eu/habbo/messages/incoming/guilds/GuildConfirmRemoveMemberEvent.java:22`
Impact: `member != null && member.getRank().equals(OWNER) || member.getRank().equals(ADMIN)` evaluates as `(null-check && OWNER) || ADMIN`. When `member` is null, the `||` branch calls `member.getRank()` without null protection, causing a NullPointerException. Attempting to remove a non-existent guild member crashes the handler.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 24.

17. `EffectsListAddComposer` (2867) sends 4 fields per effect, but the client expects 6.
File: `src/main/java/com/eu/habbo/messages/outgoing/inventory/EffectsListAddComposer.java`
Impact: Missing `remainingQuantity` and `secondsRemaining` fields. The client parser expects 6 fields per effect entry (matching `UserEffectsListComposer`), so the short write either causes a parse error or reads into adjacent packet data.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 17.

18. `UserEffectsListComposer` (340) computes remaining time with an inverted formula.
File: `src/main/java/com/eu/habbo/messages/outgoing/inventory/UserEffectsListComposer.java:43`
Impact: Calculates `(now - activationTimestamp) + duration` instead of `duration - (now - activationTimestamp)`. The result grows over time instead of counting down, so the client displays an ever-increasing remaining duration for activated effects.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 18.

19. `RoomTrade.java:138` sends room unit ID instead of user ID in TradeClosedComposer.
File: `src/main/java/com/eu/habbo/habbohotel/rooms/RoomTrade.java:138`
Impact: Uses `getRoomUnit().getId()` (transient, per-room-visit ID) instead of `getHabboInfo().getId()` (persistent user ID). The client expects a Habbo user ID to identify which trader caused the trade close. A room unit ID will not match any known user in the client's user tracking.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 13.

20. `PrivateRoomsComposer` (52) contains hardcoded placeholder data and returns null on exception.
File: `src/main/java/com/eu/habbo/messages/outgoing/navigator/PrivateRoomsComposer.java:36-45`
Impact: Contains meaningless placeholder strings (`"A"`, `"B"`, `"C"`, `"D"`, `"E"`) and arbitrary integers. The composer catches exceptions and returns `null`, which causes an NPE when the caller writes the response to the network channel.
Note: Detailed analysis in `PACKETS.md` → `Packet Misuse Audit`, item 27.

## Probable Behavior Risks

1. `AchievementManager.createUserEntry()` inserts initial progress `1` into `users_achievements`, but the caller immediately sets the in-memory state to `0`.
File: `src/main/java/com/eu/habbo/habbohotel/achievements/AchievementManager.java:86-87, 205-210`
Risk: At the moment of first achievement creation, the DB row holds `progress = 1` while the live object holds `progress = 0`. In the happy path this resolves itself on the next save, but if the session ends between the insert and the save the DB will permanently show `1` while the correct initial value is `0`. Any future load from DB will appear as if the first step was already taken.

2. `CatalogLimitedConfiguration.generateNumbers(int starting, int amount)` loops with `for (int i = starting; i <= amount; i++)` and then does `this.totalSet += amount`.
File: `src/main/java/com/eu/habbo/habbohotel/catalog/CatalogLimitedConfiguration.java:59-79`
Risk: The parameter name `amount` implies a count, but the loop uses it as an end index. The count actually generated is `(amount - starting + 1)`, not `amount`. `totalSet` therefore overcounts when `starting > 1` — e.g., generating the second batch from `starting=11` to `amount=20` produces 10 numbers but adds `20` to `totalSet`. This causes the limited item's available-count bookkeeping to diverge from reality across multiple `generateNumbers` calls.

3. `CalendarManager.claimCalendarReward(...)` selects a random reward entry from the campaign reward map instead of directly indexing by day.
File: `src/main/java/com/eu/habbo/habbohotel/campaign/calendar/CalendarManager.java:114-136`
Risk: If rewards are supposed to be day-specific, the current logic does not enforce that.

4. Packet parsing in `ClientMessage` swallows most decode errors and falls back to default values.
File: `src/main/java/com/eu/habbo/messages/ClientMessage.java:35-70`
Risk: Malformed packets can quietly become valid-looking values instead of explicit failures.
Note: Detailed packet implications are documented in `PACKETS.md`.

5. `GameMessageRateLimit` drops only when `count > MAX_COUNTER`, which effectively permits one extra packet beyond the apparent threshold.
File: `src/main/java/com/eu/habbo/networking/gameserver/decoders/GameMessageRateLimit.java:38-43`
Risk: The practical limit is slightly different from what the code communicates.
Note: Detailed packet implications are documented in `PACKETS.md`.

Note: Additional packet-layer defects exist that are not listed here because they belong squarely in the protocol layer. See `PACKETS.md` → `Confirmed Packet-Layer Defects` for:
- Charset-dependent string encoding in `ClientMessage` and `ServerMessage` (defects 3–4)
- `ByteBuf` heap-backing assumptions in `GameByteDecryption` and `GameByteEncryption` (defects 6–7)
- RCON framing and charset defects (defects 8–9)
- `IsFirstLoginOfDayComposer` package mislabeling (defect 10)

Note: A comprehensive packet misuse audit covering 38 findings across all subsystems is documented in `PACKETS.md` → `Packet Misuse Audit`. The audit covers wrong header usage, field count mismatches, dead-code composers, missing feedback packets, and semantic misuse of packets across item state, room entry, trading, effects, guilds, navigator, catalog, roller, and messenger subsystems.

## Architectural Backbone

### Composition Root

- `Emulator` is the top-level bootstrap class.
- It initializes configuration, crypto configuration, database access, threading, plugin manager, server instances, and the game environment.
- It also owns shutdown sequencing and many global getters.
- This makes it both the startup entrypoint and a long-lived service locator.

### Hotel Composition Root

- `GameEnvironment` is the hotel-domain bootstrapper.
- It constructs and exposes item, room, navigator, permission, guild, catalog, poll, guide, pet, and other domain managers.
- It acts like a hotel-local dependency container, but still depends heavily on `Emulator`.

### Runtime Core

- The room engine is the main runtime execution model.
- `Room` is the aggregate root for loaded room state.
- `RoomCycleManager` is the repeated 500ms loop.
- `RoomUnit` is the shared live-entity model for users, bots, and pets.
- `RoomUnitManager` owns live entity collections and entry/exit behavior.
- `RoomItemManager` handles room furniture state.
- `RoomSpecialTypes` indexes special furniture and WIRED state.

### Domain Building Blocks

- `Habbo` is the live online user/session object.
- `HabboInfo` and `HabboStats` hold persistent profile and gameplay state.
- `HabboInventory` composes item, pet, bot, badge, effect, and wardrobe components.
- `HabboItem` is the runtime item instance model shared between inventory and rooms.
- `Pet` is a full runtime actor layered over room units.
- `Bot` is another full runtime actor layered over room units.

### Automation and Games

- Room games are handled through `Game` and game-specific subclasses.
- Seven concrete game types exist: Battle Banzai (tile-control flood-fill), Freeze (snowball/explosion), Football (goal scoring), Tag (tagger-chase movement base), IceTag (skate-effect variant), BunnyrunGame (bunny-pole variant), RollerskateGame (roller-effect variant), and WiredGame (always-running pseudo-game for wired team-effect scenarios).
- Furniture interactions drive much of gameplay behavior.
- WIRED adds a more explicit automation engine on top of furniture, room events, and user/item state.

### Extensibility

- Plugins are loaded through `PluginManager`.
- Events exist across emulator lifecycle, users, rooms, guilds, marketplace, trading, furniture, wired, and games.
- This is useful for extension points, but does not remove the core system's reliance on global state.

### Persistence Style

- `Database` and `DatabasePool` are intentionally thin.
- SQL is spread through managers, runtime classes, helper objects, and log-entry objects.
- There is no strong repository layer separating domain logic from persistence concerns.

### Packet Layer

- The game packet layer is centrally managed through `PacketManager`, `MessageHandler`, `MessageComposer`, `ClientMessage`, and `ServerMessage`.
- The Netty pipeline lives under `networking.gameserver`.
- A full packet review is documented in `PACKETS.md`.

## Package Topology

### Root Packages Under `com.eu.habbo`

- `com.eu.habbo` - bootstrap and service location.
- `com.eu.habbo.core` - config, schedulers, logging, console commands, and maintenance tasks.
- `com.eu.habbo.crypto` - DH, RSA, RC4, and crypto helpers for protocol handshake.
- `com.eu.habbo.database` - Hikari-backed datasource wrapper and thin DB utilities.
- `com.eu.habbo.habbohotel` - domain model and almost all hotel/game features.
- `com.eu.habbo.messages` - inbound/outbound packet system and RCON message base classes.
- `com.eu.habbo.networking` - Netty servers and transport handlers.
- `com.eu.habbo.plugin` - plugin loader and event system.
- `com.eu.habbo.threading` - shared executor services and a very large runnable collection.
- `com.eu.habbo.util` - misc helpers for packets, figures, badge imaging, logging filters, crypto, and path math.

## Package Review

### `com.eu.habbo`

Role:
- Top-level bootstrap and global runtime access point.

Key class:
- `Emulator.java` - Main bootstrap, service registry, lifecycle owner, and utility surface.

What it owns:
- Server startup.
- Global singletons.
- Shutdown flow.
- Access to configuration, database, threading, plugin manager, hotel environment, and servers.

Strengths:
- Startup order is explicit.
- Centralized access makes legacy code easy to wire.

Weaknesses:
- Global mutable state is extremely broad.
- Testing and isolated reasoning are harder.
- Cross-package coupling is high because nearly everything reaches back to `Emulator`.

Refactor pressure:
- Very high.
- This class is the main source of service-locator coupling.

File inventory:
- `Emulator.java` - Main bootstrap, global service registry, lifecycle/shutdown coordinator, and utility holder.

### `com.eu.habbo.core`

Role:
- Mixed infrastructure package containing configuration, schedulers, logging, maintenance tasks, and console commands.

Observed character:
- This package contains both real infrastructure and leftover domain logic.
- It is not cleanly cohesive.

Key classes:
- `ConfigurationManager.java` - Loads config from file/env/DB and saves it back to DB.
- `TextsManager.java` - Loads DB-backed text strings.
- `Scheduler.java` - Base class for self-rescheduling recurring tasks.
- `CleanerThread.java` - Periodic system maintenance and cleanup coordinator.
- `DatabaseLogger.java` - Deferred DB logger.

Strengths:
- Centralized config/text loading.
- Reusable recurring scheduler pattern.
- Clear console-command registry.

Weaknesses:
- Contains a mix of infrastructure and feature logic.
- `Logging.java` indicates legacy retention.
- The maintenance thread acts as a catch-all orchestrator.

Refactor pressure:
- Moderate to high.
- The package should ideally be split into configuration, scheduling, logging, and maintenance modules.

File inventory:
- `CleanerThread.java` - Periodic maintenance loop for cleanup, cache clearing, scheduler flushing, and daily resets.
- `CommandLog.java` - Deferred DB log entry for command execution auditing.
- `ConfigurationManager.java` - Loads config from file/env/DB and persists config back to DB.
- `CreditsScheduler.java` - Recurring auto-credit reward scheduler.
- `CryptoConfig.java` - Immutable holder for protocol crypto settings/keys.
- `DatabaseLoggable.java` - Interface for batched/deferred database log records.
- `DatabaseLogger.java` - Queue-backed flusher for `DatabaseLoggable` records.
- `Disposable.java` - Simple disposal lifecycle contract.
- `Easter.java` - Built-in seasonal/event hook wired into the plugin event system.
- `ErrorLog.java` - Deferred DB log entry for emulator errors and stack traces.
- `GotwPointsScheduler.java` - Recurring scheduler for seasonal/GOTW point rewards.
- `Logging.java` - Deprecated legacy logging facade.
- `PixelScheduler.java` - Recurring auto-pixel reward scheduler. Grants currency type 0 (pixels, also called duckets in classic Habbo) to online users based on rank and club status.
- `PointsScheduler.java` - Recurring auto-points reward scheduler.
- `RoomUserPetComposer.java` - Helper/composer related to room pet user state output.
- `Scheduler.java` - Self-rescheduling base runnable for recurring jobs.

Scheduler infrastructure pattern:
- All four currency schedulers (`CreditsScheduler`, `PixelScheduler`, `PointsScheduler`, `GotwPointsScheduler`) share the same common pattern.
- Each holds static `HC_MODIFIER`, `IGNORE_HOTEL_VIEW`, and `IGNORE_IDLED` fields loaded from config.
- Each exposes a `reloadConfig()` method allowing live enable/disable without restarting.
- The base `Scheduler` self-reschedules by calling `Emulator.getThreading().run(this, interval * 1000L)` at the end of each run, using a config-driven interval.
- `GotwPointsScheduler` contains a TODO comment flagging it as a candidate for plugin-scope logic rather than core emulator scope.
- `TextsManager.java` - DB-backed text/message lookup manager.

Console command inventory:
- `ConsoleCommand.java` - Console command registry and dispatcher.
- `ConsoleInfoCommand.java` - Console command for runtime/server info.
- `ConsoleReconnectCameraCommand.java` - Console command to reconnect the camera client.
- `ConsoleShutdownCommand.java` - Console command to shut down the emulator.
- `ConsoleTestCommand.java` - Console command for testing/debug behavior.
- `ShowInteractionsCommand.java` - Console command to list registered interactions.
- `ShowRCONCommands.java` - Console command to list available RCON commands.
- `ThankyouArcturusCommand.java` - Informational/legacy console command.

### `com.eu.habbo.crypto`

Role:
- Protocol-crypto implementation for login and stream encryption.

Key classes:
- `HabboDiffieHellman.java` - DH key exchange wrapper.
- `HabboRSACrypto.java` - RSA helper implementation.
- `HabboRC4.java` - Stream cipher used after handshake.
- `HabboEncryption.java` - Holder for protocol crypto primitives.

Strengths:
- Compact and understandable in scope.
- Purpose is narrow.

Weaknesses:
- Crypto code is custom and protocol-specific.
- Tight coupling to the packet pipeline.

Refactor pressure:
- Low to moderate if behavior is stable.
- High only if protocol alignment with the client requires it.

File inventory:
- `HabboDiffieHellman.java` - Diffie-Hellman key exchange wrapper for protocol handshake.
- `HabboEncryption.java` - Aggregates RSA and DH handshake helpers.
- `HabboRC4.java` - RC4 stream cipher used for packet encryption/decryption.
- `HabboRSACrypto.java` - Custom RSA encrypt/decrypt/sign/verify implementation.
- `exceptions/HabboCryptoException.java` - Exception type for protocol crypto failures.
- `utils/BigIntegerUtils.java` - Helper for unsigned `BigInteger` byte conversion.

### `com.eu.habbo.database`

Role:
- Thin datasource and prepared-statement support layer.

Key classes:
- `Database.java` - Datasource owner and helper wrapper.
- `DatabasePool.java` - HikariCP configuration/bootstrap.

Strengths:
- Small and easy to understand.
- Avoids over-abstraction.

Weaknesses:
- Too thin to create useful persistence boundaries.
- Encourages SQL spread across unrelated parts of the codebase.

Refactor pressure:
- Moderate.
- The issue is less the classes themselves and more the missing repository/service boundaries around them.

File inventory:
- `Database.java` - Datasource owner and helper for parameterized prepared statements.
- `DatabasePool.java` - HikariCP bootstrap/configuration wrapper.

### `com.eu.habbo.networking`

Role:
- Netty transport layer for the game server, camera client, and RCON server.

Sub-areas:
- Game server.
- Camera integration.
- RCON.

General observations:
- The game server path is the most structured transport path.
- The camera client is more ad hoc.
- RCON is operationally useful but comparatively weak on transport guarantees.

File inventory:
- `Server.java` - Abstract Netty server base class.

Camera inventory:
- `camera/CameraClient.java` - Outbound Netty client for the external camera service.
- `camera/CameraDecoder.java` - Frames raw camera protocol messages.
- `camera/CameraHandler.java` - Reads framed camera messages and dispatches them.
- `camera/CameraIncomingMessage.java` - Base class for inbound camera messages with typed readers.
- `camera/CameraMessage.java` - Shared base for camera message buffers/headers.
- `camera/CameraOutgoingMessage.java` - Base class for outbound camera message composition.
- `camera/CameraPacketHandler.java` - Maps camera packet IDs to handler classes and invokes them.
- `camera/messages/CameraOutgoingHeaders.java` - Camera protocol header constants for outbound messages.
- `camera/messages/incoming/CameraAuthenticationTicketEvent.java` - Inbound camera message carrying an auth/game ticket.
- `camera/messages/incoming/CameraLoginStatusEvent.java` - Inbound camera login result/status message.
- `camera/messages/incoming/CameraResultURLEvent.java` - Inbound camera render completion with resulting image URL.
- `camera/messages/incoming/CameraRoomThumbnailGeneratedEvent.java` - Inbound notification that a room thumbnail was generated.
- `camera/messages/incoming/CameraUpdateNotification.java` - Inbound camera service update/broadcast notification.
- `camera/messages/outgoing/CameraLoginComposer.java` - Outbound camera login request.
- `camera/messages/outgoing/CameraRenderImageComposer.java` - Outbound request to render/store a camera image.

Game server inventory:
- `gameserver/GameServer.java` - Main Habbo game socket server and Netty pipeline owner.
- `gameserver/GameServerAttributes.java` - Netty channel attribute keys for client and RC4 state.
- `gameserver/decoders/GameByteDecoder.java` - Converts framed bytes into `ClientMessage` objects.
- `gameserver/decoders/GameByteDecryption.java` - Applies inbound RC4 decryption to packet bytes.
- `gameserver/decoders/GameByteFrameDecoder.java` - Length-field frame decoder with max packet guard.
- `gameserver/decoders/GameClientMessageLogger.java` - Debug logger for incoming client packets.
- `gameserver/decoders/GameMessageHandler.java` - Registers clients and dispatches incoming packets.
- `gameserver/decoders/GameMessageRateLimit.java` - Per-packet-ID rate limiter for incoming messages.
- `gameserver/decoders/GamePolicyDecoder.java` - Handles Flash cross-domain policy requests.
- `gameserver/encoders/GameByteEncryption.java` - Applies outbound RC4 encryption to packet bytes.
- `gameserver/encoders/GameServerMessageEncoder.java` - Encodes `ServerMessage` objects to bytes.
- `gameserver/encoders/GameServerMessageLogger.java` - Debug logger for outgoing server packets.
- `gameserver/handlers/IdleTimeoutHandler.java` - Ping/pong keepalive and idle timeout handler.

RCON inventory:
- `rconserver/RCONServer.java` - Netty RCON server and remote command registry.
- `rconserver/RCONServerHandler.java` - RCON connection filter, JSON parser, and request dispatcher.

### `com.eu.habbo.messages`

Role:
- Packet and message model for the Habbo protocol plus RCON message base classes.

High-level note:
- This is one of the most important cross-cutting packages.
- A full dedicated analysis is in `PACKETS.md`.

Key classes:
- `PacketManager.java` - Central packet registry and dispatcher.
- `ClientMessage.java` - Inbound packet reader.
- `ServerMessage.java` - Outbound packet builder.
- `MessageHandler.java` - Inbound handler base class.
- `MessageComposer.java` - Outbound composer base class.

File inventory:
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
- `outgoing/MessageComposer.java` - Base class for lazily composed outbound packets.
- `outgoing/Outgoing.java` - Numeric outgoing packet ID catalog.
- `rcon/RCONMessage.java` - Base JSON message type for remote command handling.

Packet-specific conclusion:
- The package is structurally coherent, but manual registration, silent parsing fallbacks, and RCON transport choices create clear cleanup opportunities.

### `com.eu.habbo.plugin`

Role:
- Plugin loading and event-dispatch layer.

What it provides:
- A runtime plugin loader.
- Event base types.
- Annotation-based event handlers.
- Many event families spanning users, rooms, marketplace, guilds, games, furniture, sanctions, and support.

Strengths:
- Large extension surface.
- Good feature coverage across hotel actions.

Weaknesses:
- The event system still depends on global state.
- It supplements the core architecture rather than decoupling it.
- Several internal features are wired through the same mechanism, so plugin infrastructure and core integration are intertwined.

Refactor pressure:
- Moderate.
- The event model is useful, but its execution semantics and ownership boundaries could be cleaner.

Core files:
- `Event.java` - Base cancellable plugin event.
- `EventHandler.java` - Annotation for event handler methods.
- `EventListener.java` - Marker interface for plugin listeners.
- `EventPriority.java` - Declared event priority enum.
- `HabboPlugin.java` - Base class for dynamically loaded plugins.
- `HabboPluginConfiguration.java` - DTO for plugin metadata.
- `PluginManager.java` - Plugin loader, built-in event registrar, and event dispatcher.

Event families:
- `events.emulator` - Lifecycle and packet-related emulator events.
- `events.users` - User, login, command, room-entry, and social events.
- `events.users.achievements` - Achievement progress and level-up events.
- `events.users.calendar` - Calendar reward-claim events.
- `events.users.catalog` - Catalog purchase events.
- `events.users.friends` - Friendship and friend-chat events.
- `events.users.subscriptions` - Subscription create/extend/expire events.
- `events.rooms` - Room load/unload and room vote events.
- `events.roomunit` - Movement target/look-at events.
- `events.guilds` - Guild membership and guild-setting events.
- `events.guilds.forums` - Guild forum thread/comment creation events.
- `events.games` - Game lifecycle and join/leave events.
- `events.bots` - Bot chat, placement, pickup, and save events.
- `events.furniture` - Furniture placement, movement, toggle, rotate, and redeem events.
- `events.furniture.wired` - Wired stack trigger/execute/failure events.
- `events.inventory` - Inventory item add/remove events.
- `events.marketplace` - Marketplace offer, cancel, and sold events.
- `events.navigator` - Navigator room/result events.
- `events.sanctions` - Sanction events.
- `events.support` - Support ticket and moderation action events.
- `events.trading` - Trade confirmation events.
- `events.pets` - Pet events.

Notable event files:
- `events/emulator/OutgoingPacketEvent.java` - Outgoing packet interception hook.
- `events/emulator/SSOAuthenticationEvent.java` - Login hook before session acceptance.
- `events/users/UserLoginEvent.java` - Main post-login user event.
- `events/rooms/RoomLoadedEvent.java` - Room lifecycle event used by room loading flows.
- `events/furniture/wired/WiredStackExecutedEvent.java` - Important hook around WIRED execution.
- `events/support/SupportTicketStatusChangedEvent.java` - Moderation-ticket transition hook.
- `events/pets/PetEvent.java` - Base pet extension event.
- `events/pets/PetTalkEvent.java` - Pet speech event.

### `com.eu.habbo.threading`

Role:
- Shared executor infrastructure plus a very large set of delayed runnables.

Character of the package:
- This began as infrastructure but now also houses many feature-specific actions.
- That makes ownership harder to reason about.

Key files:
- `ThreadPooling.java` - Main facade over the scheduled executor.
- `HabboExecutorService.java` - Executor subclass with post-execution logging.
- `RejectedExecutionHandlerImpl.java` - Logs rejected tasks.

Strengths:
- Simple common delayed-task mechanism.
- Easy to schedule many small game or room tasks.

Weaknesses:
- The package is heavily polluted by feature runnables.
- Thread ownership of domain state becomes harder to track.
- Some persistence happens through background runnables from domain objects.

Representative runnable families:
- Packet dispatch worker.
- Room movement helpers.
- Pet and bot follow tasks.
- Teleport and hopper action chains.
- Game-specific delayed actions.
- Moderation issue persistence.
- Wired timers and repeats.

Runnable scope note:
- The `runnables/` subdirectory contains 50+ classes. Only a representative subset is listed here.
- Full enumeration is omitted because the set is large, the pattern is repetitive (construct, acquire state, act, release), and the individual classes are narrow enough to be self-describing by name.
- Key categories, with examples:

Animation and movement: `RoomUnitWalkToLocation`, `RoomUnitWalkToRoomUnit`, `RoomUnitTeleport`, `BotFollowHabbo`, `PetFollowHabbo`, `BackgroundAnimation`
Game mechanics: `BanzaiRandomTeleport`, `CannonKickAction`, `CannonResetCooldownAction`, `KickBallAction`
Room and item management: `RemoveFloorItemTask`, `RoomTrashing`, `ClearRentedSpace`
Pets: `PetClearPosture`, `PetEatAction`, `RoomUnitRidePet`
Gifts and inventory: `OpenGift`, `HabboGiveHandItemToHabbo`
Moderation and guides: `GuardianVotingFinish`, `GuardianTicketFindMoreSlaves`, `GuardianNotAccepted`, `GuideFindNewHelper`
Database: `QueryDeleteHabboItem`, `QueryDeleteHabboItems`, `InsertModToolIssue`, `UpdateModToolIssue`
Infrastructure: `ChannelReadHandler`, `ShutdownEmulator`
WIRED: `WiredRepeatEffectTask`, `WiredResetTimers`

Observation:
- The executor layer itself is small.
- The real issue is that threading behavior is spread across many domain concerns with no unified ownership model.

### `com.eu.habbo.util`

Role:
- Catch-all support package for packet formatting, hex helpers, figure parsing, log filtering, badge imaging, crypto helpers, and path rotation math.

Character:
- Typical miscellaneous utility package.
- Useful, but not tightly cohesive.

Important utilities:
- `PacketUtils.java` - Packet formatting for debug output.
- `FigureUtil.java` - Figure-string parsing and merging.
- `BadgeImager.java` - Guild badge image generation/cache support.
- `SqlExceptionFilter.java` - Logback SQL filter.
- `Rotation.java` - Path/rotation math helper.

File inventory:
- `ANSI.java` - ANSI color constants used for console/debug logging.
- `DebugUtils.java` - Stack-trace helper for identifying callers.
- `HexUtils.java` - Hex encode/decode helpers plus random hex generation.
- `PacketUtils.java` - Formats packet buffers into readable debug strings.
- `callback/HTTPPostError.java` - Legacy HTTP callback helper for error/status posting.
- `callback/HTTPPostStatus.java` - Legacy HTTP callback helper for status posting.
- `callback/HTTPVersionCheck.java` - Legacy/commented-out HTTP version check callback task.
- `crypto/ZIP.java` - Small inflater helper for compressed byte arrays.
- `figure/FigureUtil.java` - Helpers for parsing, merging, and validating figure strings.
- `imager/badges/BadgeImager.java` - Internal guild badge image cache/reload/generation utility.
- `logback/SqlExceptionFilter.java` - Logback filter that selects SQL exception log events.
- `pathfinding/Rotation.java` - Calculates facing/rotation between two tile coordinates.

## Hotel Domain Deep Dive

### `com.eu.habbo.habbohotel`

Role:
- Main hotel-domain package.
- Contains the hotel composition root plus all game, room, user, social, item, moderation, and automation subsystems.

Central file:
- `GameEnvironment.java` - Central bootstrapper/service locator that constructs, exposes, and disposes hotel managers and schedulers.

Observed structure:
- The package is split into feature folders instead of technical layers.
- This makes it easy to locate domain features, but service boundaries are inconsistent.
- Most subsystems depend on `Emulator`, `GameEnvironment`, `Habbo`, `Room`, `HabboItem`, or some combination of them.

Major hotel domains:
- `achievements`
- `bots`
- `campaign`
- `catalog`
- `commands`
- `crafting`
- `gameclients`
- `games`
- `guides`
- `guilds`
- `hotelview`
- `items`
- `messenger`
- `modtool`
- `navigation`
- `permissions`
- `pets`
- `polls`
- `rooms`
- `users`
- `wired`

Architectural observation:
- Even though these packages are conceptually separate, runtime coupling between them is very high.
- `items`, `rooms`, `users`, and `messages` form the main interaction spine.

File inventory:
- `GameEnvironment.java` - Central bootstrapper/service locator that constructs, exposes, and disposes hotel managers and schedulers.

### `com.eu.habbo.habbohotel.achievements`

Role:
- Achievement definition loading, user progression, reward granting, and talent-track handling.

Key classes:
- `AchievementManager.java` - Loads achievements/talent tracks, progresses users, grants rewards, sends packets, and persists progress.
- `Achievement.java` - Achievement definition with levels and category.
- `AchievementLevel.java` - Per-level threshold and reward structure.
- `TalentTrackLevel.java` - Talent-track-specific level definition.

Important interactions:
- Depends on users through `Habbo` and `HabboStats`.
- Sends outgoing packets directly.
- Grants badges, points, items, and perks.
- Is triggered by commands, games, guides, purchases, and login flows.

Design observations:
- This package is feature-rich but orchestration-heavy.
- It mixes definition loading, runtime mutation, persistence, and serialization side effects.
- Offline progress handling and online progress handling coexist in the same manager.

Refactor pressure:
- High.
- Candidate split:
- definition repository/loading
- progression service
- reward service
- packet notification adapter

File inventory:
- `Achievement.java` - Achievement definition with category and per-level thresholds/rewards.
- `AchievementCategories.java` - Enum of high-level achievement categories.
- `AchievementLevel.java` - Single achievement level record with progress and reward metadata.
- `AchievementManager.java` - Loads achievements/talent tracks, progresses users, grants rewards, sends packets, and persists progress.
- `TalentTrackLevel.java` - Talent-track level definition with required achievements and item/badge/perk rewards.
- `TalentTrackType.java` - Enum of supported talent-track types.

### `com.eu.habbo.habbohotel.bots`

Role:
- Runtime bot domain and bot inventory/placement management.

Key classes:
- `Bot.java` - Base bot entity with chat, movement, room presence, following, effects, and DB persistence.
- `BotManager.java` - Registers bot types, creates bots, and handles room placement, pickup, loading, and deletion.
- `ButlerBot.java` - Specialized response bot.
- `VisitorBot.java` - Room-visit-reporting bot.

Important interactions:
- Tied to rooms and room units.
- Tied to user inventory and catalog purchase flows.
- Uses delayed runnables for follow and room actions.

Design observations:
- Bots behave like runtime actors, not static data objects.
- Specialized bot behavior is implemented through inheritance rather than strategy objects.

Refactor pressure:
- Moderate.
- The base bot is broad but understandable.
- Type-specific behavior could be made more data- or strategy-driven if desired.

File inventory:
- `Bot.java` - Base bot entity with chat, movement, room presence, following, effects, and DB persistence.
- `BotManager.java` - Registers bot types, creates bots, and handles room placement, pickup, loading, and deletion.
- `ButlerBot.java` - Specialized bot that reacts to keywords and serves hand items to nearby users.
- `VisitorBot.java` - Specialized bot that reports recent room-visit history to users.

### `com.eu.habbo.habbohotel.campaign.calendar`

Role:
- Advent/calendar campaigns and reward-claim logic.

Key classes:
- `CalendarManager.java` - Loads active campaigns and validates/executes claims.
- `CalendarCampaign.java` - Campaign definition and reward map.
- `CalendarRewardObject.java` - Reward object that grants currencies/items/badges/subscription state.
- `CalendarRewardClaimed.java` - User claim history record.

Important interactions:
- Reads and updates user stats.
- Grants items, badges, currencies, and subscriptions.
- Fires plugin reward-claim events.

Reward distribution:
- `CalendarRewardObject.give()` supports multiple reward types per reward row: credits, pixels, points, badge codes, subscription grants (including `HABBO_CLUB`), and item delivery to inventory.
- The `HC_MODIFIER` multiplier applies to pixel rewards only, scaling the amount for active club members.
- Each delivered item fires a plugin reward-claim event and sends an inventory notification to the recipient.

Design observations:
- Small package with straightforward purpose.
- Most complexity is in claim validation and reward application.
- The reward-selection logic is a likely place for alignment checks versus the client project.
- The random reward selection in `CalendarManager.claimCalendarReward()` (see `Probable Behavior Risks` #3) means day-specific reward mapping is not enforced at the emulator level — whether this matches the client's expectation is a key comparison point.

Refactor pressure:
- Moderate.
- Strong candidate for day-based reward semantics review when compared with the client system.

File inventory:
- `CalendarCampaign.java` - Calendar campaign model with schedule, image, and reward collection.
- `CalendarManager.java` - Loads active campaigns/rewards and validates and processes reward claims.
- `CalendarRewardClaimed.java` - Claimed-calendar-reward history record for a user/day/campaign.
- `CalendarRewardObject.java` - Concrete reward bundle that grants currencies, badges, subscriptions, and items.

### `com.eu.habbo.habbohotel.catalog`

Role:
- Commerce subsystem for pages, offers, purchases, limiteds, vouchers, target offers, club offers, and marketplace integration.

Key classes:
- `CatalogManager.java` - Main catalog loader and commerce service.
- `CatalogPage.java` - Base page model and serializer contract.
- `CatalogItem.java` - Offer definition and limited/bundle serializer.
- `CatalogLimitedConfiguration.java` - Limited stock tracking.
- `ClubOffer.java` - Club-related commercial offer.
- `TargetOffer.java` - Targeted offer payload.
- `Voucher.java` - Voucher definition and history.

Important interactions:
- Depends on items, users, inventory, badges, pets, bots, guilds, subscriptions, and packets.
- Writes purchase logs and interacts with marketplace and limited stock.
- Heavily connected to item creation and post-purchase fulfillment.

Design observations:
- One of the largest business-logic packages in the project.
- `CatalogManager` is an orchestration-heavy service with broad side effects.
- Page-layout classes are much cleaner because they mainly serialize UI data.

Refactor pressure:
- Very high.
- The purchase pipeline is a prime candidate for decomposition into validation, fulfillment, settlement, and notification stages.

Core file inventory:
- `CatalogFeaturedPage.java` - Featured catalog slot payload/serializer for front-page promotions.
- `CatalogItem.java` - Catalog offer definition with pricing, bundle resolution, limited handling, and serialization.
- `CatalogLimitedConfiguration.java` - Tracks available limited numbers and persists limited stock state.
- `CatalogManager.java` - Main catalog loader and commerce service for pages, items, offers, vouchers, and purchases.
- `CatalogPage.java` - Abstract catalog page model with tree structure, items, includes, and serializer contract.
- `CatalogPageLayouts.java` - Enum of supported catalog page layout identifiers.
- `CatalogPageType.java` - Enum distinguishing page types such as normal vs builder.
- `CatalogPurchaseLogEntry.java` - Async purchase log entry written to shop-purchase logs.
- `ClothItem.java` - Clothing catalog entry mapping a name to avatar set IDs.
- `ClubOffer.java` - Habbo Club/VIP offer definition and serializer.
- `TargetOffer.java` - Time-limited targeted offer payload with pricing and purchase-limit metadata.
- `Voucher.java` - Voucher definition with redemption rules and history loading/persistence.
- `VoucherHistoryEntry.java` - Voucher redemption history record.

Catalog layout inventory:
- `BadgeDisplayLayout.java` - Catalog page serializer for badge-display layout.
- `BotsLayout.java` - Catalog page serializer for bot-purchase layout.
- `BuildersClubAddonsLayout.java` - Catalog page serializer for Builders Club add-ons.
- `BuildersClubFrontPageLayout.java` - Catalog page serializer for Builders Club front page.
- `BuildersClubLoyaltyLayout.java` - Catalog page serializer for Builders Club loyalty page.
- `CatalogRootLayout.java` - Synthetic root page serializer used as the catalog tree root.
- `ClubBuyLayout.java` - Catalog page serializer for club-buy layout.
- `ClubGiftsLayout.java` - Catalog page serializer for club-gifts layout.
- `ColorGroupingLayout.java` - Catalog page serializer for grouped color-selection pages.
- `Default_3x3Layout.java` - Default 3x3 catalog page serializer.
- `FrontPageFeaturedLayout.java` - Catalog page serializer for featured front-page content.
- `FrontpageLayout.java` - Catalog page serializer for the standard front page.
- `GuildForumLayout.java` - Catalog page serializer for guild-forum purchases/content.
- `GuildFrontpageLayout.java` - Catalog page serializer for guild front page.
- `GuildFurnitureLayout.java` - Catalog page serializer for guild furniture pages.
- `InfoDucketsLayout.java` - Informational catalog page serializer for duckets (pixels, currency type 0).
- `InfoLoyaltyLayout.java` - Informational catalog page serializer for loyalty info.
- `InfoMonkeyLayout.java` - Informational catalog page serializer for monkey content.
- `InfoNikoLayout.java` - Informational catalog page serializer for Niko content.
- `InfoPetsLayout.java` - Informational catalog page serializer for pets.
- `InfoRentablesLayout.java` - Informational catalog page serializer for rentables.
- `LoyaltyVipBuyLayout.java` - Catalog page serializer for loyalty VIP purchase flow.
- `MadMoneyLayout.java` - Catalog page serializer for Mad Money content.
- `MarketplaceLayout.java` - Catalog page serializer for marketplace browsing.
- `MarketplaceOwnItems.java` - Catalog page serializer for a user’s own marketplace items.
- `PetCustomizationLayout.java` - Catalog page serializer for pet-customization pages.
- `Pets2Layout.java` - Catalog page serializer for pets layout variant 2.
- `Pets3Layout.java` - Catalog page serializer for pets layout variant 3.
- `PetsLayout.java` - Catalog page serializer for standard pet pages.
- `ProductPage1Layout.java` - Catalog page serializer for product-page layout variant 1.
- `RecentPurchasesLayout.java` - Catalog page serializer for recent-purchase history.
- `RecyclerInfoLayout.java` - Catalog page serializer for recycler information.
- `RecyclerLayout.java` - Catalog page serializer for recycler interaction.
- `RecyclerPrizesLayout.java` - Catalog page serializer for recycler prize display.
- `RoomAdsLayout.java` - Catalog page serializer for room-advertisement content.
- `RoomBundleLayout.java` - Catalog page serializer for room bundles.
- `SingleBundle.java` - Catalog page serializer for single-bundle offers.
- `SoldLTDItemsLayout.java` - Catalog page serializer for sold limited items.
- `SpacesLayout.java` - Catalog page serializer for spaces/walls/floors landscapes.
- `TraxLayout.java` - Catalog page serializer for Trax/sound-machine pages.
- `TrophiesLayout.java` - Catalog page serializer for trophy pages.
- `VipBuyLayout.java` - Catalog page serializer for VIP-buy flow.

Marketplace inventory:
- `MarketPlace.java` - Static marketplace service for listing, selling, buying, canceling, and settling offers.
- `MarketPlaceOffer.java` - Marketplace offer record with item, price, state, and persistence behavior.
- `MarketPlaceState.java` - Enum of marketplace offer states such as open, sold, and closed.

### `com.eu.habbo.habbohotel.commands`

Role:
- Chat-command layer used by staff/admin and feature commands.

Key classes:
- `Command.java` - Abstract base type for chat commands.
- `CommandHandler.java` - Global command parser/dispatcher with permissions, plugins, and logging.

Important interactions:
- Depends on permissions, room state, user state, catalog refresh, hotelview refresh, moderation, and plugin hooks.
- Many commands are thin wrappers over existing managers.

Design observations:
- The framework is simple and works, but it is global, static, and broad.
- Command registration is centralized in code and requires manual upkeep.
- Command dispatch is linear over registered command definitions.

Refactor pressure:
- High for maintainability.
- Lower for functional correctness unless command behavior mismatches the client system.

Framework files:
- `Command.java` - Abstract base type for chat commands.
- `CommandHandler.java` - Global command parser/dispatcher with permission checks, plugin hooks, and logging.

Command inventory by family:

Informational and administrative:
- `AboutCommand.java` - Shows emulator/server about information.
- `ArcturusCommand.java` - Handles Arcturus-branded informational/admin output.
- `CommandsCommand.java` - Lists commands available to the user.
- `PluginsCommand.java` - Shows or manages plugin-related information.
- `ShutdownCommand.java` - Triggers server shutdown flow.
- `TestCommand.java` - Test/debug command for ad hoc behavior.
- `UserInfoCommand.java` - Displays information about a user.
- `WordQuizCommand.java` - Starts or manages a word-quiz feature.
- `EventCommand.java` - Manages or announces event-related state.
- `HappyHourCommand.java` - Toggles or manages happy-hour style bonuses.
- `EnableCommand.java` - Enables a feature or user/room state.
- `ControlCommand.java` - Toggles or grants a control-related state in room/user context.
- `ConnectCameraCommand.java` - Triggers camera-related connection or UI behavior.
- `ChangeNameCommand.java` - Renames the user or triggers name-change flow.
- `HabnamCommand.java` - Executes Habnam-related avatar/effect behavior.
- `MultiCommand.java` - Sends a multi-state/test packet; appears to be a stub/debug command.

Alerts and communication:
- `AlertCommand.java` - Sends a direct staff/user alert.
- `BlockAlertCommand.java` - Toggles whether hotel alerts are blocked.
- `HotelAlertCommand.java` - Broadcasts a hotel-wide alert.
- `HotelAlertLinkCommand.java` - Broadcasts a hotel-wide alert containing a link.
- `RoomAlertCommand.java` - Sends an alert to everyone in the current room.
- `StaffAlertCommand.java` - Sends an alert to online staff.
- `SayCommand.java` - Forces or sends a room say message.
- `SayAllCommand.java` - Makes everyone in room say a message.
- `ShoutCommand.java` - Forces or sends a room shout message.
- `ShoutAllCommand.java` - Makes everyone in room shout a message.
- `ChatTypeCommand.java` - Changes chat bubble/type behavior.

Movement, pose, and room-presence manipulation:
- `CoordsCommand.java` - Shows current room coordinates/position details.
- `DiagonalCommand.java` - Toggles diagonal movement behavior.
- `FastwalkCommand.java` - Toggles faster walking.
- `InvisibleCommand.java` - Toggles room invisibility.
- `FacelessCommand.java` - Toggles a faceless avatar state.
- `MoonwalkCommand.java` - Toggles moonwalk behavior.
- `SitCommand.java` - Forces sit pose.
- `SitDownCommand.java` - Makes the user sit down.
- `StandCommand.java` - Returns the user to standing pose.
- `LayCommand.java` - Forces lay pose.
- `TeleportCommand.java` - Toggles or performs teleport behavior.
- `TransformCommand.java` - Changes avatar transformation/effect state.
- `HandItemCommand.java` - Sets a carried hand item.
- `RoomEffectCommand.java` - Applies a room-wide avatar effect.
- `RoomDanceCommand.java` - Applies a room-wide dance.
- `RoomItemCommand.java` - Gives or removes a room-wide hand item.
- `MimicCommand.java` - Mimics another user’s behavior or output.
- `StalkCommand.java` - Follows or locates another user’s room presence.

Room moderation and room control:
- `EjectAllCommand.java` - Ejects everyone from the current room.
- `PickallCommand.java` - Picks up all furniture in the current room.
- `ReloadRoomCommand.java` - Reloads current room state.
- `UnloadRoomCommand.java` - Unloads a room from memory.
- `RoomKickCommand.java` - Kicks all or specified users from the room.
- `RoomMuteCommand.java` - Mutes the room or its occupants.
- `HideWiredCommand.java` - Toggles visibility of wired items.
- `FreezeCommand.java` - Freezes a user’s movement.
- `FreezeBotsCommand.java` - Freezes bots in the room.
- `MuteBotsCommand.java` - Mutes bots in the room.
- `MutePetsCommand.java` - Mutes pets in the room.
- `PetInfoCommand.java` - Displays information about a pet.

Economy, inventory, rewards, and rank:
- `CreditsCommand.java` - Gives or adjusts credits.
- `PixelCommand.java` - Gives or adjusts pixels (currency type 0, also called duckets in classic Habbo).
- `PointsCommand.java` - Gives or adjusts activity points.
- `MassCreditsCommand.java` - Gives credits to many users.
- `MassPixelsCommand.java` - Gives pixels (currency type 0) to all online users.
- `MassPointsCommand.java` - Gives points to many users.
- `GiftCommand.java` - Gives a gift/item reward.
- `RoomGiftCommand.java` - Applies gift-giving behavior room-wide.
- `MassGiftCommand.java` - Gives gifts to many users.
- `RedeemCommand.java` - Redeems a voucher/code.
- `SubscriptionCommand.java` - Grants or adjusts subscription state.
- `BadgeCommand.java` - Gives a badge.
- `TakeBadgeCommand.java` - Removes a badge.
- `MassBadgeCommand.java` - Gives a badge to many users.
- `RoomBadgeCommand.java` - Gives a badge to room occupants.
- `RoomCreditsCommand.java` - Gives credits to room occupants.
- `RoomPixelsCommand.java` - Gives pixels (currency type 0) to room occupants.
- `RoomPointsCommand.java` - Gives points to room occupants.
- `RoomBundleCommand.java` - Gives a bundle to room occupants.
- `PromoteTargetOfferCommand.java` - Promotes or activates a target offer.
- `GiveRankCommand.java` - Changes a user’s rank.
- `AllowTradingCommand.java` - Toggles a user’s trading permission.

Moderation and sanctions:
- `BanCommand.java` - Issues an account ban.
- `IPBanCommand.java` - Issues an IP ban.
- `MachineBanCommand.java` - Issues a machine-ID ban.
- `SuperbanCommand.java` - Issues a stronger or longer ban.
- `UnbanCommand.java` - Removes an existing ban.
- `MuteCommand.java` - Mutes a user.
- `UnmuteCommand.java` - Unmutes a user.
- `SoftKickCommand.java` - Soft-kicks or disconnects a user without a hard ban.
- `DisconnectCommand.java` - Disconnects a user session.
- `FilterWordCommand.java` - Adds, removes, or manages filtered words.

User movement toward others:
- `PullCommand.java` - Pulls another user to the command user.
- `PushCommand.java` - Pushes another user away or around.
- `SuperPullCommand.java` - Stronger pull behavior for another user.
- `SummonCommand.java` - Summons another user.
- `SummonRankCommand.java` - Summons users of a given rank.

Inventory cleanup and removal:
- `EmptyInventoryCommand.java` - Empties a user inventory.
- `EmptyBotsInventoryCommand.java` - Empties bot inventory.
- `EmptyPetsInventoryCommand.java` - Empties pet inventory.
- `TrashCommand.java` - Trashes or removes targeted inventory/room items.

Reload and update commands:
- `UpdateAchievements.java` - Reloads achievement definitions.
- `UpdateBotsCommand.java` - Reloads bot definitions/configuration.
- `UpdateCalendarCommand.java` - Reloads calendar campaigns.
- `UpdateCatalogCommand.java` - Reloads catalog data and broadcasts catalog refresh packets.
- `UpdateChatBubblesCommand.java` - Reloads room chat-bubble definitions.
- `UpdateConfigCommand.java` - Reloads server configuration.
- `UpdateGuildPartsCommand.java` - Reloads guild-related assets/data.
- `UpdateHotelViewCommand.java` - Reloads hotel-view content.
- `UpdateItemsCommand.java` - Reloads item/furniture definitions.
- `UpdateNavigatorCommand.java` - Reloads navigator data.
- `UpdatePermissionsCommand.java` - Reloads rank/permission definitions.
- `UpdatePetDataCommand.java` - Reloads pet data/commands.
- `UpdatePluginsCommand.java` - Reloads plugins.
- `UpdatePollsCommand.java` - Reloads polls.
- `UpdateTextsCommand.java` - Reloads externalized text strings.
- `UpdateWordFilterCommand.java` - Reloads word-filter configuration.
- `UpdateYoutubePlaylistsCommand.java` - Reloads YouTube playlist data.
- `AddYoutubePlaylistCommand.java` - Adds a YouTube playlist entry.

### `com.eu.habbo.habbohotel.crafting`

Role:
- Crafting recipes, altars, ingredient graphs, and limited craftable output management.

Design observations:
- Small and coherent package.
- Most complexity lives in recipe matching and limited stock persistence.

File inventory:
- `CraftingAltar.java` - Associates an altar item with recipes and ingredient-matching logic.
- `CraftingManager.java` - Loads altar/recipe mappings and persists limited recipe remaining counts.
- `CraftingRecipe.java` - Crafting recipe definition with reward, secret flag, ingredients, and remaining stock.

### `com.eu.habbo.habbohotel.gameclients`

Role:
- Game session representation and active client registry.

Key classes:
- `GameClient.java` - Netty-backed client session wrapper with encryption, packet sending, and attached `Habbo`.
- `GameClientManager.java` - Active-session registry with lookups and broadcast helpers.

Observations:
- Small but critical package.
- Bridges networking, packets, and hotel runtime.

File inventory:
- `GameClient.java` - Netty-backed client session wrapper with encryption, packet sending, and attached `Habbo`.
- `GameClientManager.java` - Active-session registry with lookups and broadcast helpers.

### `com.eu.habbo.habbohotel.games`

Role:
- Room-game abstractions and game implementations.

Key classes:
- `Game.java` - Main lifecycle abstraction.
- `GamePlayer.java` - Per-user game state.
- `GameTeam.java` - Team abstraction.
- `GameState.java` - Lifecycle enum.
- `GameTeamColors.java` - Team-color enum.

Important interactions:
- Strongly tied to room items and room unit behavior.
- Achievements, wired, and highscores are directly integrated.

Design observations:
- The base class is powerful but broad.
- Concrete games are item-driven and room-driven rather than isolated simulation modules.

File inventory:
- `Game.java` - Abstract room-game lifecycle with teams, players, start/stop/end hooks, scoring, and achievement wiring.
- `GamePlayer.java` - Per-user game state with team and score tracking.
- `GameState.java` - Enum for game lifecycle states.
- `GameTeam.java` - Team container for members and team-scoring behavior.
- `GameTeamColors.java` - Enum for team colors/types.
- `battlebanzai/BattleBanzaiGame.java` - Battle Banzai game loop with tile locking, flood-fill scoring, spheres, gates, and scoreboards.
- `battlebanzai/BattleBanzaiGamePlayer.java` - Battle Banzai-specific player type.
- `battlebanzai/BattleBanzaiGameTeam.java` - Battle Banzai team behavior for effects and gate refresh.
- `freeze/FreezeGame.java` - Freeze game loop with snowballs, explosions, power-ups, exits, tiles, and scoreboards.
- `freeze/FreezeGamePlayer.java` - Freeze-specific player state including lives, snowballs, protection, frozen state, and effects.
- `freeze/FreezeGameTeam.java` - Freeze team behavior for effects and gate refresh.
- `football/FootballGame.java` - Lightweight football scoring hook that updates scoreboards and football achievements.
- `tag/BunnyrunGame.java` - Bunnyrun tag-game variant with pole type and avatar effects.
- `tag/IceTagGame.java` - Ice-tag variant with skate/tagger effects and pole type.
- `tag/RollerskateGame.java` - Rollerskate tag-game variant without poles and with roller effects.
- `tag/TagGame.java` - Shared tag-game base driven by room movement/look events and tagger assignment.
- `tag/TagGamePlayer.java` - Tag-game-specific player type.
- `wired/WiredGame.java` - Always-running pseudo-game used for wired/team-effect scenarios rather than a normal timer-based game. Unlike real games it has no timer expiry; it exists solely so WIRED triggers (`triggerTeamWins`) can reference a game context when applying team-color effects in automation flows.

### `com.eu.habbo.habbohotel.guides`

Role:
- Guide helper sessions and guardian moderation flow.

Key classes:
- `GuideManager.java` - In-memory guide and guardian coordinator.
- `GuideTour.java` - Active guide session aggregate.
- `GuardianTicket.java` - Guardian vote and bully-report handling.

Important interactions:
- Achievements.
- Modtool escalation.
- Packets/composers.
- Timed runnables.

Design observations:
- Small package but partially incomplete.
- This area contains at least two clearly unfinished code paths.

File inventory:
- `GuideChatMessage.java` - Simple DTO for a guide-session chat line.
- `GuideManager.java` - In-memory coordinator for guide helpers, tours, guardians, and ticket lifecycle.
- `GuideRecommendStatus.java` - Enum for post-guide recommendation state.
- `GuideTour.java` - Active helper/noob guide session aggregate with messages and achievement hooks.
- `GuardianTicket.java` - Guardian voting ticket for bully reports with escalation to modtool.
- `GuardianVote.java` - Per-guardian vote state holder and ordering helper.
- `GuardianVoteType.java` - Enum for guardian vote states and verdict values.

### `com.eu.habbo.habbohotel.guilds`

Role:
- Guild lifecycle, membership, guild badge parts, room/guild linkage, and guild forum data.

Key classes:
- `GuildManager.java` - Main guild service.
- `Guild.java` - Guild aggregate/model.
- `GuildMember.java` - Guild membership projection.
- `ForumThread.java` - Guild forum thread aggregate.
- `ForumThreadComment.java` - Guild forum comment aggregate.

Important interactions:
- Users and `HabboStats`.
- Rooms and room ownership.
- Guild-linked furniture.
- Forums and navigation-like views.

Design observations:
- Guilds and forums are heavily SQL-backed.
- Caching and persistence sit close to the domain objects.
- Membership and forum behavior are richer than the package size first suggests.

Refactor pressure:
- High.
- Strong candidate for separation into guild-core, membership, badge/assets, and forum services.

File inventory:
- `Guild.java` - Guild aggregate/model with deferred database update behavior.
- `GuildManager.java` - Main guild service for CRUD, membership, cache, views, and guild-item linkage.
- `GuildMember.java` - DTO/projection for a guild member row plus rank/status mapping.
- `GuildMembershipStatus.java` - Enum for member/pending/not-member states.
- `GuildPart.java` - Badge-part DTO loaded from guild element metadata.
- `GuildPartType.java` - Enum for guild badge/base/color part categories.
- `GuildRank.java` - Enum for owner/admin/member/requested/deleted guild ranks.
- `GuildState.java` - Enum for guild openness/join policy.
- `SettingsState.java` - Enum for guild forum permission scope settings.
- `forums/ForumThread.java` - Guild forum thread aggregate with static cache, lazy comments, and persistence.
- `forums/ForumThreadComment.java` - Guild forum comment aggregate with moderation state and persistence.
- `forums/ForumThreadState.java` - Enum for forum thread/comment moderation state.
- `forums/ForumView.java` - DTO tracking recent forum views by user and guild.

### `com.eu.habbo.habbohotel.hotelview`

Role:
- Hotel landing/news/hall-of-fame presentation data.

Design observations:
- Read-heavy package.
- Lighter than most others.
- Still configured from Java-visible DB and config flows.

File inventory:
- `HallOfFame.java` - Loader/cache for hotelview hall-of-fame winners.
- `HallOfFameWinner.java` - DTO for a hall-of-fame winner entry.
- `HotelViewManager.java` - Small container/loader for hotelview subsystems.
- `NewsList.java` - Loader/cache for recent hotelview news widgets.
- `NewsWidget.java` - DTO for one hotelview news card/widget.

### `com.eu.habbo.habbohotel.items`

Role:
- Core furniture-definition and interaction platform for the entire hotel runtime.

Why this package matters:
- This is one of the most important packages in the project.
- It is effectively the bridge between room mechanics, catalog outputs, guild mechanics, pets, games, WIRED, and many user actions.

Key classes:
- `ItemManager.java` - Core item registry, loader, factory, and item-related persistence service.
- `Item.java` - Base furniture definition.
- `ItemInteraction.java` - Mapping from interaction key to runtime item class.
- `YoutubeManager.java` - YouTube playlist integration for TV items.

Important interactions:
- Rooms and room item state.
- Users and inventory.
- Guilds and guild furniture.
- Pets and pet items.
- Games and team furniture.
- WIRED triggers, conditions, effects, extras, and highscores.

Design observations:
- This is a platform subsystem, not a small domain.
- Many interaction classes are narrow and easy to reason about individually.
- The overall package is still highly coupled because furniture is used as the execution vehicle for many hotel features.

Refactor pressure:
- Very high around `ItemManager`.
- Moderate to low around many individual interaction classes.

Core file inventory:
- `CrackableReward.java` - Crackable item reward definition and reward pool metadata.
- `FurnitureType.java` - Enum describing base furniture categories/codes.
- `ICycleable.java` - Marker/interface for cycleable furniture behavior.
- `IEventTriggers.java` - Interface for item event-trigger behavior contracts.
- `Item.java` - Base furniture definition loaded from `items_base`.
- `ItemInteraction.java` - Mapping from interaction key to concrete `HabboItem` class.
- `ItemManager.java` - Core item registry, loader, factory, and item-related persistence service.
- `NewUserGift.java` - DTO for new-user gift configuration rows.
- `PostItColor.java` - Enum/helper for post-it color handling.
- `RandomStateParams.java` - Helper/parameter model for random-state furniture.
- `RedeemableSubscriptionType.java` - Enum for redeemable subscription reward types.
- `SoundTrack.java` - DTO for jukebox/soundtrack metadata.
- `YoutubeManager.java` - Loader/cache for YouTube playlists used by TV furniture.

Core interaction inventory:
- `InteractionDefault.java` - Default base implementation for most room furniture behavior.
- `InteractionWired.java` - Abstract base for all wired trigger/effect/condition/extra furniture.
- `InteractionWiredCondition.java` - Base class for wired condition boxes and config UI.
- `InteractionWiredEffect.java` - Base class for wired effect boxes and config UI.
- `InteractionWiredExtra.java` - Base class for wired extras/modifiers.
- `InteractionWiredHighscore.java` - Highscore wired furniture base behavior.
- `InteractionWiredTrigger.java` - Base class for wired trigger boxes and config UI.
- `InteractionGuildFurni.java` - Guild-linked furniture that serializes guild badge/colors.
- `InteractionGuildGate.java` - Gate whose access is tied to guild membership/rights.
- `InteractionYoutubeTV.java` - Furniture that plays configured YouTube videos/playlists.
- `InteractionGift.java` - Wrapped gift furniture and gift-opening behavior.
- `InteractionTrophy.java` - Trophy furniture holding inscription/text data.
- `InteractionPoster.java` - Poster furniture using poster-specific extra data.
- `InteractionPostIt.java` - Editable sticky-note/post-it furniture.
- `InteractionBadgeDisplay.java` - Furniture that displays a selected badge.
- `InteractionMannequin.java` - Furniture that stores and displays outfits.
- `InteractionExternalImage.java` - Furniture that displays an externally referenced image.
- `InteractionRoomAds.java` - Furniture tied to room advertisement/background features.
- `InteractionBackgroundToner.java` - Furniture that manages room background tone settings.
- `InteractionMoodLight.java` - Moodlight/dimmer furniture for room lighting settings.

Utility and room-movement interaction inventory:
- `InteractionGate.java` - Standard passable gate furniture.
- `InteractionOneWayGate.java` - Gate allowing one-direction traversal.
- `InteractionHabboClubGate.java` - Club-only gate furniture.
- `InteractionEffectGate.java` - Gate furniture that applies avatar effects on use.
- `InteractionTeleport.java` - Teleporter furniture linking to another teleporter.
- `InteractionTeleportTile.java` - Teleport tile triggered by stepping.
- `InteractionHabboClubTeleportTile.java` - Club-only teleport tile furniture.
- `InteractionPressurePlate.java` - Pressure plate that triggers on stepped avatars/items.
- `InteractionGroupPressurePlate.java` - Group-scoped pressure plate variant.
- `InteractionRoller.java` - Roller furniture that moves items/units over tiles.
- `InteractionStackHelper.java` - Invisible/helper furniture used for stacking support.
- `InteractionMultiHeight.java` - Furniture with multiple selectable stack heights.
- `InteractionRandomState.java` - Furniture that cycles or selects random states.
- `InteractionCustomValues.java` - Furniture whose behavior relies on custom extra values.
- `InteractionSwitch.java` - Generic toggle switch furniture.
- `InteractionSwitchRemoteControl.java` - Remote-controlled switch furniture.
- `InteractionEffectToggle.java` - Toggleable furniture specialized around effect state changes.
- `InteractionTileEffectProvider.java` - Furniture that provides tile effects to nearby tiles.
- `InteractionEffectTile.java` - Tile that applies effects when stepped on.
- `InteractionGroupEffectTile.java` - Group-scoped effect tile variant.
- `InteractionMuteArea.java` - Area furniture that suppresses room chat.
- `InteractionBuildArea.java` - Area furniture defining a build/editable zone.
- `InteractionRentableSpace.java` - Furniture defining a rentable room sub-area.
- `InteractionObstacle.java` - Obstacle furniture affecting movement/pathing.
- `InteractionTrap.java` - Trap furniture that impacts avatars on interaction/walk.
- `InteractionStickyPole.java` - Pole furniture with sticky traversal/attachment behavior.
- `InteractionSnowboardSlope.java` - Furniture supporting snowboard slope movement.
- `InteractionTileWalkMagic.java` - Magic walk tile altering movement behavior.
- `InteractionTent.java` - Tent furniture with occupancy/chat/privacy behavior.
- `InteractionPushable.java` - Furniture that can be pushed around the room.
- `InteractionPyramid.java` - Pyramid gameplay furniture affecting stacking/movement.

Single-purpose interaction inventory:
- `InteractionVendingMachine.java` - Standard vending machine furniture.
- `InteractionNoSidesVendingMachine.java` - Vending machine variant without side constraints.
- `InteractionEffectVendingMachine.java` - Vending machine that dispenses avatar effects.
- `InteractionEffectVendingMachineNoSides.java` - Side-insensitive effect vending machine variant.
- `InteractionHanditem.java` - Furniture that gives an avatar a hand item.
- `InteractionHanditemTile.java` - Tile variant that gives a hand item on walk/use.
- `InteractionEffectGiver.java` - Furniture that grants an avatar effect.
- `InteractionGymEquipment.java` - Furniture for gym/exercise avatar interactions.
- `InteractionInformationTerminal.java` - Terminal furniture for information popups/interactions.
- `InteractionTalkingFurniture.java` - Furniture that says predefined text/messages.
- `InteractionLoveLock.java` - Furniture for paired/love-lock style state or text behavior.
- `InteractionClothing.java` - Furniture for clothing/change-look interactions.
- `InteractionColorPlate.java` - Color plate tile/furniture interaction.
- `InteractionColorWheel.java` - Color wheel furniture for randomized/color behavior.
- `InteractionCannon.java` - Cannon furniture that launches/moves avatars.
- `InteractionBlackHole.java` - Special-effect furniture with black-hole style behavior.
- `InteractionVoteCounter.java` - Furniture for counting/displaying votes.
- `InteractionVikingCotie.java` - Specialized game/event furniture for Viking Cotie behavior.
- `InteractionRoomOMatic.java` - Automation/room utility furniture.
- `InteractionWater.java` - Water furniture/tile behavior.
- `InteractionWaterItem.java` - Generic furniture that behaves differently in water contexts.
- `InteractionHopper.java` - Furniture that stores/transforms items like a hopper.
- `InteractionCostumeHopper.java` - Hopper variant tied to costume-changing flow.
- `InteractionHabboClubHopper.java` - Club-only hopper furniture.

Crackable and reward interaction inventory:
- `InteractionCrackable.java` - Crackable furniture that progresses toward rewards.
- `InteractionCrackableMaster.java` - Master/controller variant for crackable furniture.
- `InteractionMonsterCrackable.java` - Monster-themed crackable/reward furniture.
- `InteractionFXBox.java` - Effect/reward box furniture.
- `InteractionFireworks.java` - Furniture that triggers fireworks effects.
- `InteractionRedeemableSubscriptionBox.java` - Box that redeems into subscription rewards.

Pet-related interaction inventory:
- `pets/InteractionMonsterPlantSeed.java` - Seed furniture used to create/grow monster plants.
- `pets/InteractionNest.java` - Nest furniture for pet placement/breeding context.
- `pets/InteractionPetBreedingNest.java` - Main pet breeding nest logic and offspring creation flow.
- `pets/InteractionPetDrink.java` - Pet drink bowl/consumable furniture.
- `pets/InteractionPetFood.java` - Pet food bowl/consumable furniture.
- `pets/InteractionPetToy.java` - Pet toy furniture for training/play actions.
- `pets/InteractionPetTrampoline.java` - Pet trampoline training/play furniture.
- `pets/InteractionPetTree.java` - Pet tree/climbing furniture.

Totem interaction inventory:
- `totems/InteractionTotemHead.java` - Totem head furniture behavior.
- `totems/InteractionTotemLegs.java` - Totem legs furniture behavior.
- `totems/InteractionTotemPlanet.java` - Totem planet furniture that awards or enables effects.
- `totems/TotemColor.java` - Enum for totem color categories.
- `totems/TotemPlanetType.java` - Enum for totem planet/effect groupings.
- `totems/TotemType.java` - Enum for totem part types.

Game furniture inventory:
- `games/InteractionGameGate.java` - Shared base for team/game gate furniture.
- `games/InteractionGameScoreboard.java` - Shared base for game scoreboards.
- `games/InteractionGameTeamItem.java` - Shared base for team-colored game furniture.
- `games/InteractionGameTimer.java` - Shared game timer/controller furniture for room game sessions.
- `games/battlebanzai/InteractionBattleBanzaiPuck.java` - Battle Banzai puck/ball gameplay item.
- `games/battlebanzai/InteractionBattleBanzaiSphere.java` - Battle Banzai sphere gameplay item.
- `games/battlebanzai/InteractionBattleBanzaiTeleporter.java` - Random teleporter used in Battle Banzai.
- `games/battlebanzai/InteractionBattleBanzaiTile.java` - Core color-changing Battle Banzai floor tile.
- `games/battlebanzai/gates/InteractionBattleBanzaiGate.java` - Base gate for Battle Banzai team entrances.
- `games/battlebanzai/gates/InteractionBattleBanzaiGateBlue.java` - Blue Battle Banzai team gate.
- `games/battlebanzai/gates/InteractionBattleBanzaiGateGreen.java` - Green Battle Banzai team gate.
- `games/battlebanzai/gates/InteractionBattleBanzaiGateRed.java` - Red Battle Banzai team gate.
- `games/battlebanzai/gates/InteractionBattleBanzaiGateYellow.java` - Yellow Battle Banzai team gate.
- `games/battlebanzai/scoreboards/InteractionBattleBanzaiScoreboard.java` - Base scoreboard for Battle Banzai team points.
- `games/battlebanzai/scoreboards/InteractionBattleBanzaiScoreboardBlue.java` - Blue Battle Banzai scoreboard.
- `games/battlebanzai/scoreboards/InteractionBattleBanzaiScoreboardGreen.java` - Green Battle Banzai scoreboard.
- `games/battlebanzai/scoreboards/InteractionBattleBanzaiScoreboardRed.java` - Red Battle Banzai scoreboard.
- `games/battlebanzai/scoreboards/InteractionBattleBanzaiScoreboardYellow.java` - Yellow Battle Banzai scoreboard.
- `games/freeze/InteractionFreezeBlock.java` - Freeze gameplay block/obstacle furniture.
- `games/freeze/InteractionFreezeExitTile.java` - Freeze exit tile furniture.
- `games/freeze/InteractionFreezeTile.java` - Core Freeze floor tile that changes state on play.
- `games/freeze/gates/InteractionFreezeGate.java` - Base gate for Freeze team entrances.
- `games/freeze/gates/InteractionFreezeGateBlue.java` - Blue Freeze team gate.
- `games/freeze/gates/InteractionFreezeGateGreen.java` - Green Freeze team gate.
- `games/freeze/gates/InteractionFreezeGateRed.java` - Red Freeze team gate.
- `games/freeze/gates/InteractionFreezeGateYellow.java` - Yellow Freeze team gate.
- `games/freeze/scoreboards/InteractionFreezeScoreboard.java` - Base scoreboard for Freeze team points.
- `games/freeze/scoreboards/InteractionFreezeScoreboardBlue.java` - Blue Freeze scoreboard.
- `games/freeze/scoreboards/InteractionFreezeScoreboardGreen.java` - Green Freeze scoreboard.
- `games/freeze/scoreboards/InteractionFreezeScoreboardRed.java` - Red Freeze scoreboard.
- `games/freeze/scoreboards/InteractionFreezeScoreboardYellow.java` - Yellow Freeze scoreboard.
- `games/football/InteractionFootball.java` - Core football/ball gameplay furniture.
- `games/football/InteractionFootballGate.java` - Football game gate/team entrance furniture.
- `games/football/goals/InteractionFootballGoal.java` - Base football goal furniture.
- `games/football/goals/InteractionFootballGoalBlue.java` - Blue football goal.
- `games/football/goals/InteractionFootballGoalGreen.java` - Green football goal.
- `games/football/goals/InteractionFootballGoalRed.java` - Red football goal.
- `games/football/goals/InteractionFootballGoalYellow.java` - Yellow football goal.
- `games/football/scoreboards/InteractionFootballScoreboard.java` - Base football scoreboard furniture.
- `games/football/scoreboards/InteractionFootballScoreboardBlue.java` - Blue football scoreboard.
- `games/football/scoreboards/InteractionFootballScoreboardGreen.java` - Green football scoreboard.
- `games/football/scoreboards/InteractionFootballScoreboardRed.java` - Red football scoreboard.
- `games/football/scoreboards/InteractionFootballScoreboardYellow.java` - Yellow football scoreboard.
- `games/tag/InteractionTagField.java` - Base field tile for tag-style games.
- `games/tag/InteractionTagPole.java` - Base pole/startpoint furniture for tag-style games.
- `games/tag/bunnyrun/InteractionBunnyrunField.java` - Bunny Run field tile variant.
- `games/tag/bunnyrun/InteractionBunnyrunPole.java` - Bunny Run pole/startpoint variant.
- `games/tag/icetag/InteractionIceTagField.java` - Ice Tag field tile variant.
- `games/tag/icetag/InteractionIceTagPole.java` - Ice Tag pole/startpoint variant.
- `games/tag/rollerskate/InteractionRollerskateField.java` - Rollerskate field tile variant.

Wired item inventory:
- `wired/WiredSettings.java` - Parsed wired configuration payload holder.
- `wired/WiredTriggerReset.java` - Helper/reset runnable or state utility for repeating wired triggers.
- `wired/interfaces/InteractionWiredMatchFurniSettings.java` - Contract for wired items that store furni match/snapshot settings.
- `wired/extra/WiredBlob.java` - Generic blob/config payload helper for wired data.
- `wired/extra/WiredExtraOrEval.java` - Wired extra that changes condition evaluation to OR mode.
- `wired/extra/WiredExtraRandom.java` - Wired extra that randomizes selected effect/condition application.
- `wired/extra/WiredExtraUnseen.java` - Wired extra that avoids repeating already-used targets until reset.
- `wired/triggers/WiredTriggerAtSetTime.java` - Trigger that fires at a configured short interval/time.
- `wired/triggers/WiredTriggerAtTimeLong.java` - Trigger that fires at a configured long interval/time.
- `wired/triggers/WiredTriggerBotReachedFurni.java` - Trigger that fires when a bot reaches selected furni.
- `wired/triggers/WiredTriggerBotReachedHabbo.java` - Trigger that fires when a bot reaches an avatar.
- `wired/triggers/WiredTriggerCollision.java` - Trigger that fires on avatar collision/contact.
- `wired/triggers/WiredTriggerFurniStateToggled.java` - Trigger that fires when selected furniture changes state.
- `wired/triggers/WiredTriggerGameEnds.java` - Trigger that fires when a room game ends.
- `wired/triggers/WiredTriggerGameStarts.java` - Trigger that fires when a room game starts.
- `wired/triggers/WiredTriggerHabboEntersRoom.java` - Trigger that fires when an avatar enters the room.
- `wired/triggers/WiredTriggerHabboSaysKeyword.java` - Trigger that fires when an avatar says configured text.
- `wired/triggers/WiredTriggerHabboWalkOffFurni.java` - Trigger that fires when an avatar walks off selected furni.
- `wired/triggers/WiredTriggerHabboWalkOnFurni.java` - Trigger that fires when an avatar walks onto selected furni.
- `wired/triggers/WiredTriggerRepeater.java` - Repeating periodic wired trigger.
- `wired/triggers/WiredTriggerRepeaterLong.java` - Long-period repeating wired trigger.
- `wired/triggers/WiredTriggerScoreAchieved.java` - Trigger that fires when a target score is reached.
- `wired/triggers/WiredTriggerTeamLoses.java` - Trigger that fires when a team loses.
- `wired/triggers/WiredTriggerTeamWins.java` - Trigger that fires when a team wins.
- `wired/conditions/WiredConditionDateRangeActive.java` - Condition that passes only inside a configured date range.
- `wired/conditions/WiredConditionFurniHaveFurni.java` - Condition requiring selected furni to contain furni.
- `wired/conditions/WiredConditionFurniHaveHabbo.java` - Condition requiring selected furni to have avatars on them.
- `wired/conditions/WiredConditionFurniTypeMatch.java` - Condition matching furni types against configured list.
- `wired/conditions/WiredConditionGroupMember.java` - Condition requiring triggerer to be in the room guild/group.
- `wired/conditions/WiredConditionHabboCount.java` - Condition checking user count in the room.
- `wired/conditions/WiredConditionHabboHasEffect.java` - Condition requiring triggerer to have an effect.
- `wired/conditions/WiredConditionHabboHasHandItem.java` - Condition requiring triggerer to hold a hand item.
- `wired/conditions/WiredConditionHabboWearsBadge.java` - Condition requiring triggerer to wear a badge.
- `wired/conditions/WiredConditionLessTimeElapsed.java` - Condition checking that less than X time has elapsed.
- `wired/conditions/WiredConditionMatchStatePosition.java` - Condition matching furni state/position snapshot.
- `wired/conditions/WiredConditionMoreTimeElapsed.java` - Condition checking that more than X time has elapsed.
- `wired/conditions/WiredConditionMovementValidation.java` - Condition validating movement path/state before effect execution.
- `wired/conditions/WiredConditionNotFurniHaveFurni.java` - Negated condition for furni-on-furni presence.
- `wired/conditions/WiredConditionNotFurniHaveHabbo.java` - Negated condition for avatars on selected furni.
- `wired/conditions/WiredConditionNotFurniTypeMatch.java` - Negated condition for furni type matching.
- `wired/conditions/WiredConditionNotHabboCount.java` - Negated condition for room user count.
- `wired/conditions/WiredConditionNotHabboHasEffect.java` - Negated condition for avatar effect.
- `wired/conditions/WiredConditionNotHabboWearsBadge.java` - Negated condition for worn badge.
- `wired/conditions/WiredConditionNotInGroup.java` - Condition requiring triggerer not to be in room guild/group.
- `wired/conditions/WiredConditionNotInTeam.java` - Condition requiring triggerer not to be on a game team.
- `wired/conditions/WiredConditionNotMatchStatePosition.java` - Negated match-snapshot/state-position condition.
- `wired/conditions/WiredConditionNotTriggerOnFurni.java` - Negated condition for triggerer standing on selected furni.
- `wired/conditions/WiredConditionTeamMember.java` - Condition requiring triggerer to be on a game team.
- `wired/conditions/WiredConditionTriggerOnFurni.java` - Condition requiring triggerer to be on selected furni.
- `wired/effects/WiredEffectAlert.java` - Effect that sends an alert-style message.
- `wired/effects/WiredEffectBotClothes.java` - Effect that changes bot clothing/look.
- `wired/effects/WiredEffectBotFollowHabbo.java` - Effect that makes a bot follow an avatar.
- `wired/effects/WiredEffectBotGiveHandItem.java` - Effect that makes a bot give a hand item.
- `wired/effects/WiredEffectBotTalk.java` - Effect that makes a bot speak.
- `wired/effects/WiredEffectBotTalkToHabbo.java` - Effect that makes a bot talk directly to an avatar.
- `wired/effects/WiredEffectBotTeleport.java` - Effect that teleports a bot.
- `wired/effects/WiredEffectBotWalkToFurni.java` - Effect that moves a bot toward selected furniture.
- `wired/effects/WiredEffectChangeFurniDirection.java` - Effect that rotates selected furniture.
- `wired/effects/WiredEffectGiveEffect.java` - Effect that gives an avatar a visual effect.
- `wired/effects/WiredEffectGiveHandItem.java` - Effect that gives an avatar a hand item.
- `wired/effects/WiredEffectGiveHotelviewBonusRarePoints.java` - Effect that awards hotelview bonus-rare points.
- `wired/effects/WiredEffectGiveHotelviewHofPoints.java` - Effect that awards hall-of-fame points.
- `wired/effects/WiredEffectGiveRespect.java` - Effect that grants respect to avatars.
- `wired/effects/WiredEffectGiveReward.java` - Effect that awards configured item/reward outcomes.
- `wired/effects/WiredEffectGiveScore.java` - Effect that awards game score.
- `wired/effects/WiredEffectGiveScoreToTeam.java` - Effect that awards game score to a team.
- `wired/effects/WiredEffectJoinTeam.java` - Effect that places triggerer on a team.
- `wired/effects/WiredEffectKickHabbo.java` - Effect that kicks the triggerer/target avatar.
- `wired/effects/WiredEffectLeaveTeam.java` - Effect that removes triggerer from a team.
- `wired/effects/WiredEffectMatchFurni.java` - Effect that matches selected furni to saved snapshot state.
- `wired/effects/WiredEffectMoveFurniAway.java` - Effect that moves furni away from trigger/target.
- `wired/effects/WiredEffectMoveFurniTo.java` - Effect that moves furni to specific positions.
- `wired/effects/WiredEffectMoveFurniTowards.java` - Effect that moves furni toward trigger/target.
- `wired/effects/WiredEffectMoveRotateFurni.java` - Effect that moves and/or rotates furniture.
- `wired/effects/WiredEffectMuteHabbo.java` - Effect that mutes an avatar.
- `wired/effects/WiredEffectResetTimers.java` - Effect that resets wired timers/cooldowns.
- `wired/effects/WiredEffectTeleport.java` - Effect that teleports avatars to selected furni/tiles.
- `wired/effects/WiredEffectToggleFurni.java` - Effect that toggles selected furniture states.
- `wired/effects/WiredEffectToggleRandom.java` - Effect that toggles a random selected furniture item.
- `wired/effects/WiredEffectTriggerStacks.java` - Effect that triggers another wired stack.
- `wired/effects/WiredEffectWhisper.java` - Effect that sends a whisper-style room message.

### `com.eu.habbo.habbohotel.messenger`

Role:
- Friend graph, friend requests, buddy state, and private-message behavior.

Key classes:
- `Messenger.java` - Friend list/friend request manager with online-state propagation and DB helpers.
- `MessengerBuddy.java` - Friend projection plus delivery behavior.
- `Message.java` - Persistable private message record.

Important interactions:
- Users, online session state, modtool chat review, achievements, and word filtering.

Design observations:
- Mixes stateful session management and static-ish DB helper behavior.
- Online/offline branching is spread across methods.

Refactor pressure:
- High enough to matter if client behavior differs in social features.

File inventory:
- `FriendRequest.java` - DTO for an incoming friend request entry.
- `Message.java` - Runnable record for optionally persisting a private message.
- `Messenger.java` - Friend list/friend request manager with online-state propagation and DB helpers.
- `MessengerBuddy.java` - Friend projection with relation/category/presence state and message delivery logic.
- `MessengerCategory.java` - DTO for messenger friend categories.

### `com.eu.habbo.habbohotel.modtool`

Role:
- Moderation hub covering tickets, bans, chat logs, sanctions, word filtering, and room/user actions.

Key classes:
- `ModToolManager.java` - Main moderation service.
- `ModToolIssue.java` - Moderation ticket model.
- `ModToolBan.java` - Persisted ban record.
- `ModToolSanctions.java` - Sanction escalation manager.
- `WordFilter.java` - Word filter and moderation bridge.

Important interactions:
- Users.
- Rooms.
- Messenger/private logs.
- Support tickets and sanctions.
- Plugin events.

Design observations:
- One of the broadest service packages in the codebase.
- Operationally powerful, but responsibility boundaries are very wide.
- Word filtering is bundled directly into the moderation area, which increases cross-feature coupling.

Refactor pressure:
- Very high.

File inventory:
- `CfhActionType.java` - Enum for call-for-help action behavior.
- `CfhCategory.java` - Aggregate for call-for-help categories and their topics.
- `CfhTopic.java` - DTO/model for a call-for-help topic and default sanction.
- `ModToolBan.java` - Persisted ban record with insert-on-run behavior.
- `ModToolBanType.java` - Enum for account/IP/machine/super ban scope.
- `ModToolCategory.java` - Moderation/support issue category with configured presets.
- `ModToolChatLog.java` - DTO for moderation chat log messages.
- `ModToolChatRecordDataContext.java` - Enum/model describing chat record context.
- `ModToolChatRecordDataType.java` - Enum/model describing chat record data type.
- `ModToolChatlogType.java` - Enum for room/private/etc moderation chatlog sources.
- `ModToolIssue.java` - Moderation ticket DTO/serializer with async DB update hook.
- `ModToolIssueChatlogType.java` - Enum for issue-associated chatlog source selection.
- `ModToolManager.java` - Main moderation service for tickets, logs, bans, alerts, room actions, and metadata.
- `ModToolPreset.java` - DTO for support preset text/action templates.
- `ModToolRoomVisit.java` - DTO grouping room-visit data and optional chat logs.
- `ModToolSanctionItem.java` - DTO for one applied sanction row.
- `ModToolSanctionLevelItem.java` - DTO for one configured sanction escalation level.
- `ModToolSanctions.java` - Manager for sanction escalation, persistence, and action execution.
- `ModToolTicketState.java` - Enum for moderation ticket state.
- `ModToolTicketType.java` - Enum for moderation ticket/report type.
- `ScripterEvent.java` - Event payload emitted when scripting abuse is detected.
- `ScripterManager.java` - Utility that raises scripter events and optional moderation tickets.
- `WordFilter.java` - Word filtering, auto-reporting, hide-message checks, and moderation integration.
- `WordFilterWord.java` - DTO for one word-filter rule row.

### `com.eu.habbo.habbohotel.navigation`

Role:
- Navigator metadata, room list composition, and search result shaping.

Key classes:
- `NavigatorManager.java` - Metadata loader and room-result dispatcher.
- `NavigatorFilter.java` - Base reflective filter implementation.
- `SearchResultList.java` - Result-list model/serializer.

Important interactions:
- Rooms and room search results.
- User settings and saved searches.
- Permissions for visibility.

Design observations:
- More of a composition layer than a domain-heavy model.
- Reflection is used to bridge filter metadata to room attributes.
- Serialization mutability issue exists in `SearchResultList`.

File inventory:
- `DisplayMode.java` - Enum for navigator list collapsed/visible state.
- `DisplayOrder.java` - Enum for navigator result sorting mode.
- `EventCategory.java` - Enum/model for navigator event categories.
- `ListMode.java` - Enum for navigator rendering mode.
- `NavigatorFavoriteFilter.java` - Navigator filter producing favorites-only results.
- `NavigatorFilter.java` - Abstract navigator filter with reflection-based room filtering logic.
- `NavigatorFilterComparator.java` - Enum for string comparison behavior in navigator filters.
- `NavigatorFilterField.java` - Metadata holder mapping navigator filter keys to `Room` getters/DB query hints.
- `NavigatorHotelFilter.java` - Navigator filter for hotel-wide popular/category room results.
- `NavigatorManager.java` - Loader for navigator metadata and dispatcher for room/category result lists.
- `NavigatorPublicCategory.java` - DTO/aggregate for one official/public navigator category and its rooms.
- `NavigatorPublicFilter.java` - Navigator filter for official/public categories and rooms.
- `NavigatorRoomAdsFilter.java` - Navigator filter for promoted room-ads results.
- `NavigatorSavedSearch.java` - DTO/model for a saved navigator search.
- `NavigatorUserFilter.java` - Navigator filter for user-centric tabs like my rooms/favorites/history.
- `SearchAction.java` - Enum for navigator result actions such as none/more/back.
- `SearchResultList.java` - Serializable navigator result-list model with room ordering/visibility logic.

### `com.eu.habbo.habbohotel.permissions`

Role:
- Rank model, permission lookups, permission settings, and runtime permission checks.

Key classes:
- `PermissionsManager.java` - Loader/checker for ranks and permission tables.
- `Rank.java` - Rank aggregate with permission map and related metadata.

Observations:
- Smaller and cleaner than many other packages.
- Still global in usage because nearly every behavioral package depends on permission checks.

File inventory:
- `Permission.java` - Permission key constants plus value object for one permission setting.
- `PermissionsManager.java` - Loader/checker for ranks, permission tables, badges, and special enables.
- `PermissionSetting.java` - Enum for disallowed/allowed/room-owner permission modes.
- `Rank.java` - Rank aggregate with loaded permission map, variables, badge, and allowance checks.

### `com.eu.habbo.habbohotel.polls`

Role:
- Poll definitions, question trees, and poll completion lookup.

Observations:
- Small package with focused responsibility.
- Mainly metadata loading plus light user-completion queries.

File inventory:
- `Poll.java` - Poll aggregate holding title, thanks message, reward badge, and top-level questions.
- `PollManager.java` - Loader/cache for polls and question trees plus completion lookup.
- `PollQuestion.java` - Serializable poll question node with options and nested subquestions.

### `com.eu.habbo.habbohotel.pets`

Role:
- Pet metadata, runtime AI/state, commands, and breeding support.

Key classes:
- `Pet.java` - Core pet runtime model.
- `PetManager.java` - Metadata loader/factory/registry.
- `PetBehaviorManager.java` - Newer behavior/state-machine helper.
- `PetStatsManager.java` - Stat threshold and decay helper.

Important interactions:
- Room units and room cycle.
- Inventory and item interactions.
- Pet items and breeding furniture.

Design observations:
- The package shows signs of partial refactoring.
- Managers exist for behavior and stats, but `Pet` still owns most runtime logic.

Refactor pressure:
- High around `Pet.java`.
- Lower around the smaller metadata classes.

Core file inventory:
- `Pet.java` - Core pet runtime model: stats, AI/task loop, room-unit integration, speech, XP/respect, and DB persistence.
- `PetAction.java` - Abstract base for pet command/action handlers.
- `PetBehaviorManager.java` - Newer pet behavior state-machine helper for autonomous actions and state transitions.
- `PetBreedingReward.java` - Data model for pet breeding reward definitions and rarity mapping.
- `PetCommand.java` - Pet command metadata tying command IDs/settings to concrete `PetAction` behavior.
- `PetData.java` - Pet-type metadata holder for commands, vocals, allowed items, and action presets.
- `PetGestures.java` - Enum of pet gesture/status keys used during runtime updates.
- `PetManager.java` - Pet metadata loader/factory/registry for races, commands, vocals, breeding data, and pet creation.
- `PetMood.java` - Enum describing derived pet mood states from stat thresholds.
- `PetRace.java` - Data object for pet race/breed appearance metadata.
- `PetStatsManager.java` - Centralized pet stat decay/recovery/threshold helper.
- `PetTasks.java` - Enum of high-level pet tasks/command states.
- `PetVocal.java` - Simple value object for a pet vocal/message entry.
- `PetVocalsType.java` - Enum of pet vocal categories.
- `RideablePet.java` - Pet subtype that adds rider/saddle/ride permission state.
- `HorsePet.java` - Rideable horse variant with horse-specific look/saddle persistence fields.
- `MonsterplantPet.java` - Special monsterplant pet with growth, death timer, breeding, and custom look serialization.
- `GnomePet.java` - Gnome/leprechaun pet variant with custom look data and achievement hooks.
- `IPetLook.java` - Interface for pets that expose custom look serialization.
- `breeding/PetBreedingSession.java` - Runtime session object for two-pet breeding, confirmation, timeout, and cancellation.

Pet action inventory:
- `actions/ActionBeg.java` - Pet command handler that makes the pet beg.
- `actions/ActionBounce.java` - Pet command handler that performs a bounce or jump-style action.
- `actions/ActionBreed.java` - Pet command handler that initiates breeding-related behavior.
- `actions/ActionBreatheFire.java` - Pet command handler that triggers a flame posture.
- `actions/ActionChickenDance.java` - Pet command handler that starts a chicken-dance animation.
- `actions/ActionCount.java` - Pet command handler that performs a counting animation.
- `actions/ActionCroak.java` - Pet command handler that makes the pet croak.
- `actions/ActionDance.java` - Pet command handler that starts a dance posture.
- `actions/ActionDip.java` - Pet command handler that performs a dip animation.
- `actions/ActionDown.java` - Pet command handler that makes the pet lie or rest down.
- `actions/ActionDrink.java` - Pet command handler that sends the pet to drink.
- `actions/ActionEat.java` - Pet command handler that sends the pet to eat.
- `actions/ActionFlatten.java` - Pet command handler that applies a flattened posture.
- `actions/ActionFollow.java` - Pet command handler that makes the pet follow a habbo.
- `actions/ActionFollowLeft.java` - Pet command handler that follows offset to the left of a habbo.
- `actions/ActionFollowRight.java` - Pet command handler that follows offset to the right of a habbo.
- `actions/ActionFree.java` - Pet command handler that frees the pet from its current commanded task.
- `actions/ActionHang.java` - Pet command handler that seeks a tree-like item and applies a hanging posture.
- `actions/ActionHere.java` - Pet command handler that calls the pet to the owner or habbo.
- `actions/ActionHighJump.java` - Pet command handler that triggers a high-jump animation.
- `actions/ActionJump.java` - Pet command handler that triggers a jump animation.
- `actions/ActionMambo.java` - Pet command handler that triggers a mambo dance posture.
- `actions/ActionMoveForward.java` - Pet command handler that advances the pet forward.
- `actions/ActionNest.java` - Pet command handler that sends the pet to rest in a nest.
- `actions/ActionPlay.java` - Pet command handler that sends the pet to play with compatible toys.
- `actions/ActionPlayDead.java` - Pet command handler that makes the pet play dead.
- `actions/ActionPlayFootball.java` - Pet command handler that starts football-play behavior.
- `actions/ActionRelax.java` - Pet command handler that applies a relaxed posture.
- `actions/ActionRingOfFire.java` - Pet command handler that performs the ring-of-fire action.
- `actions/ActionRoll.java` - Pet command handler that makes the pet roll.
- `actions/ActionSilent.java` - Pet command handler that mutes the pet’s speech.
- `actions/ActionSit.java` - Pet command handler that makes the pet sit.
- `actions/ActionSpeak.java` - Pet command handler that makes the pet speak.
- `actions/ActionSpin.java` - Pet command handler that spins the pet.
- `actions/ActionStand.java` - Pet command handler that returns the pet to standing posture.
- `actions/ActionStay.java` - Pet command handler that locks the pet in place for a stay command.
- `actions/ActionSwing.java` - Pet command handler that performs a swinging/tree interaction.
- `actions/ActionSwitch.java` - Pet command handler that toggles or switches a nearby target or item state.
- `actions/ActionTeleport.java` - Pet command handler that teleports the pet.
- `actions/ActionTorch.java` - Pet command handler that performs a torch or special action.
- `actions/ActionTripleJump.java` - Pet command handler that performs a triple-jump sequence.
- `actions/ActionTurnLeft.java` - Pet command handler that rotates the pet left.
- `actions/ActionTurnRight.java` - Pet command handler that rotates the pet right.
- `actions/ActionWagTail.java` - Pet command handler that applies a wag-tail posture.
- `actions/ActionWave.java` - Pet command handler that makes the pet wave.
- `actions/ActionWings.java` - Pet command handler that applies a wings posture or effect.

### `com.eu.habbo.habbohotel.rooms`

Role:
- Main runtime engine for loaded rooms.

Why this package matters:
- This is the operational core of the emulator.
- Many later client-alignment questions will likely reduce to room behavior, room serialization, room item state, and room unit movement.

Key classes:
- `Room.java` - Aggregate root and lifecycle owner for loaded rooms.
- `RoomManager.java` - Global room cache/loader and enter/leave coordinator.
- `RoomCycleManager.java` - 500ms room loop.
- `RoomUnit.java` - Shared live entity model.
- `RoomUnitManager.java` - Live entity collection manager.
- `RoomItemManager.java` - Room item load/update/query manager.
- `RoomSpecialTypes.java` - Special furniture index, especially important for WIRED.
- `RoomLayout.java` and `RoomTileManager.java` - Pathing and tile state support.

Important interactions:
- Items.
- Users.
- Pets.
- Bots.
- Games.
- WIRED.
- Navigator and room metadata.
- Room packets/composers.

Design observations:
- This is a room-centric, tick-driven runtime.
- `Room` still owns too much orchestration.
- The package contains the main execution hot paths in the application.

Refactor pressure:
- Extremely high.

Core room inventory:
- `Room.java` - Aggregate room root coordinating lifecycle, load/unload, scheduling, managers, and runtime delegation.
- `RoomBan.java` - Value object for room-ban records and expiry tracking.
- `RoomCategory.java` - Navigator/category metadata for grouping rooms.
- `RoomChatBubbleManager.java` - Manager or registry for available room chat bubble definitions.
- `RoomChatManager.java` - Room chat runtime: talk/shout/whisper, flood control, muting, and word filter handling.
- `RoomChatMessage.java` - Runtime chat message model for users, bots, and pets.
- `RoomChatMessageBubbles.java` - Enum or lookup type for chat bubble styles.
- `RoomChatType.java` - Enum describing chat delivery scope/type.
- `RoomCycleManager.java` - The 500ms room loop that processes users, bots, pets, rollers, and scheduled work.
- `RoomGameManager.java` - Room-local wrapper for active games and game registration or lookup.
- `RoomItemManager.java` - Room furniture manager for loading, querying, indexing, updating, and removing items.
- `RoomLayout.java` - Parsed room model/heightmap holder with door info and pathfinder ownership.
- `RoomManager.java` - Global room cache/loader and enter/leave/orchestration service.
- `RoomMessagingManager.java` - Lightweight broadcaster for room-wide composers, pet chat, bot chat, and alerts.
- `RoomMoodlightData.java` - Parsed moodlight preset/configuration model.
- `RoomPromotion.java` - Active room-promotion data model.
- `RoomPromotionManager.java` - Room-local helper for promotion state and promotion messaging concerns.
- `RoomRightsManager.java` - Rights, bans, and guild-rights manager for ownership, rights grants, bans, and refresh.
- `RoomRightLevels.java` - Enum or value type for room rights levels and comparisons.
- `RoomRollerManager.java` - Roller runtime that moves units/furniture and emits roller update packets.
- `RoomSpecialTypes.java` - Specialized room index for rollers, pet items, game items, and WIRED items/extras.
- `RoomState.java` - Enum of room access states such as open, locked, password, and invisible.
- `RoomTile.java` - Tile model containing base/stack height, state, unit occupancy, and pathfinding costs.
- `RoomTileManager.java` - Tile/heightmap manager that computes walkability, stack height, tile state, and sit/lay rules.
- `RoomTileState.java` - Enum of tile states such as open, blocked, sit, lay, and invalid.
- `RoomTrade.java` - Runtime room trade session between two users.
- `RoomTradeManager.java` - Room-local registry of active trades with lookup/start/stop helpers.
- `RoomTradeUser.java` - Per-user trade state wrapper inside a room trade session.
- `RoomUnit.java` - Shared live entity model for habbos, bots, and pets including movement/path/status/effects.
- `RoomUnitEffect.java` - Enum or value holder for room-unit effect identifiers.
- `RoomUnitManager.java` - Live unit manager for habbos, bots, pets, queues, idle/dance/effect/teleport, and entry/exit side effects.
- `RoomUnitStatus.java` - Enum of room-unit statuses/postures used by movement and rendering.
- `RoomUnitType.java` - Enum distinguishing user, bot, pet, and unknown room-unit types.
- `RoomUserAction.java` - Enum or value type for room user actions or animations.
- `RoomUserRotation.java` - Enum or value type for body/head orientation in room space.
- `RoomWordQuizManager.java` - Room-local state holder for word quiz votes and synchronization.
- `TraxManager.java` - Jukebox/TRAX runtime handling playlists, playback progression, and disc inventory interaction.
- `CustomRoomLayout.java` - Room layout variant loaded from custom layout storage.
- `FurnitureMovementError.java` - Enum describing why a furniture move or placement is invalid.

Pathfinding inventory:
- `pathfinding/Pathfinder.java` - Pathfinding interface used by room layouts and room units.
- `pathfinding/impl/AdjacentTileFinder.java` - Neighbor expansion and cost calculation helper for pathfinding.
- `pathfinding/impl/PathFinderException.java` - Runtime exception wrapper for pathfinder failures.
- `pathfinding/impl/PathfinderConstants.java` - Config key/constants holder for pathfinder timeout behavior.
- `pathfinding/impl/PathfinderContext.java` - Request context object carrying room, goal, retry flags, and tile cache.
- `pathfinding/impl/PathfinderImpl.java` - A*-style room pathfinder with timeout checks, walkthrough retry, and height validation.
- `pathfinding/impl/Rotation.java` - Utility for deriving direction or rotation from tile movement.
- `pathfinding/impl/TileValidator.java` - Validation utilities for blocked tiles, unit occupancy, and list transitions.

### `com.eu.habbo.habbohotel.users`

Role:
- Online user/session model, persistent profile state, inventory aggregate, and subscription behavior.

Key classes:
- `Habbo.java` - Live online user/session aggregate.
- `HabboInfo.java` - Persistent identity/session profile.
- `HabboStats.java` - Larger persistent gameplay/settings profile.
- `HabboInventory.java` - Inventory aggregate.
- `HabboManager.java` - Online user registry and loader.

Important interactions:
- Rooms and room units.
- Messenger.
- Inventory.
- Catalog purchases.
- Permissions.
- Moderation and sanctions.
- Navigator settings.

Design observations:
- There is a real split between live session and persisted profile state.
- However, persistence still bleeds into these objects heavily.
- `Habbo` plus `HabboInfo` plus `HabboStats` are central identity objects in almost every feature.

Refactor pressure:
- Very high if future alignment requires session/profile separation or stronger service boundaries.

Core file inventory:
- `DanceType.java` - Enum for user dance states.
- `Habbo.java` - Live online user/session aggregate with disconnect flow, room-unit ownership, and messaging helpers.
- `HabboBadge.java` - Badge runtime/persistence model for user badges.
- `HabboGender.java` - Enum for avatar gender.
- `HabboInfo.java` - Persistent identity/session profile including room membership, riding, currencies, and rank.
- `HabboInventory.java` - Inventory aggregate composing item, pet, bot, badge, effect, and wardrobe components.
- `HabboItem.java` - Core item instance model used both in inventory and in-room furniture runtime.
- `HabboManager.java` - Global online habbo registry, SSO loader, offline lookup, and admin utility operations.
- `HabboNavigatorPersonalDisplayMode.java` - Per-search/personal navigator display mode data model.
- `HabboNavigatorWindowSettings.java` - User navigator window/UI configuration holder.
- `HabboStats.java` - Large persistent gameplay/settings profile including achievements, mutes, guilds, subscriptions, and counters.
- `SignType.java` - Enum for room sign/hand-sign values.
- `cache/HabboOfferPurchase.java` - Cached per-user state for target/offer purchases and update tracking.

Clothing validation inventory:
- `clothingvalidation/ClothingValidationManager.java` - Loads and validates figure data and applies clothing restrictions.
- `clothingvalidation/Figuredata.java` - Root figure-data model used for clothing validation.
- `clothingvalidation/FiguredataPalette.java` - Palette model for figure-data color groups.
- `clothingvalidation/FiguredataPaletteColor.java` - Color entry model within a figure-data palette.
- `clothingvalidation/FiguredataSettype.java` - Figure-data set-type model describing avatar part groups.
- `clothingvalidation/FiguredataSettypeSet.java` - Figure-data set entry within a set-type, with part and club constraints.

Inventory component inventory:
- `inventory/BadgesComponent.java` - Inventory subcomponent for loading, adding, removing, and persisting user badges.
- `inventory/BotsComponent.java` - Inventory subcomponent for user-owned bots outside rooms.
- `inventory/EffectsComponent.java` - Inventory/equipment subcomponent for avatar effects and activation state.
- `inventory/ItemsComponent.java` - Inventory subcomponent for furniture items, add/remove events, and disposal persistence.
- `inventory/PetsComponent.java` - Inventory subcomponent for pets stored outside rooms and persisted on disposal.
- `inventory/WardrobeComponent.java` - Inventory/UI subcomponent for saved looks or wardrobe slots.

Subscription inventory:
- `subscriptions/HcPayDayLogEntry.java` - Persistence object for HC payday reward log records.
- `subscriptions/Subscription.java` - Base subscription model with lifecycle hooks and duration/active state.
- `subscriptions/SubscriptionHabboClub.java` - Habbo Club subscription implementation covering create, extend, expire, payday, and gifts.
- `subscriptions/SubscriptionManager.java` - Subscription type registry and loader for per-user subscription instances.
- `subscriptions/SubscriptionScheduler.java` - Periodic scheduler that expires active subscriptions and triggers HC payday processing.

### `com.eu.habbo.habbohotel.wired`

Role:
- Typed automation engine layered on top of room, item, user, and game behavior.

Why this package matters:
- WIRED is one of the most distinctive systems in the project.
- It also appears to be one of the more modernized parts of the architecture.

Key classes:
- `WiredManager.java` - Static lifecycle and event bridge facade.
- `WiredEngine.java` - Main typed execution engine.
- `WiredEvent.java` - Typed event object.
- `WiredContext.java` - Execution context.
- `RoomWiredStackIndex.java` - Stack-building and caching support.
- `WiredTickService.java` - Global 50ms timer for repeaters/tickables.

Important interactions:
- Rooms.
- Room special-item indexes.
- Furniture interactions.
- Games.
- User movement and room-entry events.

Design observations:
- More modern than many other subsystems.
- Uses explicit API contracts and context objects.
- Still coexists with older furniture-centric wired behavior and migration glue.

Refactor pressure:
- Moderate.
- Not because it is poor, but because it likely needs continued consolidation of older paths.

File inventory:
- `WiredChangeDirectionSetting.java` - Enum or value set for direction-change effect configuration.
- `WiredConditionOperator.java` - Enum for combining wired conditions with AND/OR semantics.
- `WiredConditionType.java` - Enum of legacy wired condition types.
- `WiredEffectType.java` - Enum of legacy wired effect types.
- `WiredGiveRewardItem.java` - Data model for a reward entry configured on reward-giving wired boxes.
- `WiredMatchFurniSetting.java` - Enum or value set for furniture-matching effect/condition settings.
- `WiredTriggerType.java` - Enum of legacy wired trigger types.
- `api/IWiredCondition.java` - Contract for typed wired conditions evaluated against a `WiredContext`.
- `api/IWiredEffect.java` - Contract for typed wired effects including delay, cooldown, and optional simulation support.
- `api/IWiredTrigger.java` - Contract for typed wired triggers that declare listened event type and match logic.
- `api/WiredStack.java` - Immutable trigger+conditions+effects(+extras) stack model for tile-based wired execution.
- `core/DefaultWiredServices.java` - Default effect-side service adapter that mutates room/user/item runtime.
- `core/RoomWiredStackIndex.java` - Builds and caches wired stacks from `RoomSpecialTypes` by room/event type.
- `core/WiredContext.java` - Immutable execution context exposing room, actor, source item, targets, services, stack, and state.
- `core/WiredEngine.java` - Main typed wired execution engine with trigger matching, condition evaluation, effect execution, recursion, and rate limits.
- `core/WiredEvent.java` - Immutable typed event object replacing legacy `Object[]` event payloads.
- `core/WiredLimitException.java` - Exception used to abort wired execution when step or loop protections are exceeded.
- `core/WiredManager.java` - Static facade for engine lifecycle, event bridge methods, tick registration, reward handling, and cache invalidation.
- `core/WiredServices.java` - Side-effect abstraction used by effects to mutate room state without hard-coding room internals.
- `core/WiredSimulation.java` - Simulation/prevalidation tracker for movement-oriented full-execution wired effects.
- `core/WiredStackIndex.java` - Interface for retrieving wired stacks matching a room and event type.
- `core/WiredState.java` - Per-execution state object tracking run ID, step budget, abort state, and elapsed time.
- `core/WiredTargets.java` - Mutable execution target set for users/items selected for an effect run.
- `highscores/WiredHighscoreClearType.java` - Enum for how or when a wired highscore table is cleared.
- `highscores/WiredHighscoreDataEntry.java` - Per-entry score data model used by wired highscores.
- `highscores/WiredHighscoreManager.java` - Loader/saver/coordinator for wired highscore tables and midnight reset scheduling.
- `highscores/WiredHighscoreMidnightUpdater.java` - Scheduled task that triggers daily highscore resets and reschedules itself.
- `highscores/WiredHighscoreRow.java` - Row model representing a rendered or persisted highscore row.
- `highscores/WiredHighscoreScoreType.java` - Enum for the scoring mode used by a wired highscore.
- `migrate/WiredEvents.java` - Factory/adapter layer that converts room activity and legacy trigger calls into typed `WiredEvent`s.
- `tick/WiredTickService.java` - Central single-thread 50ms ticker for all registered wired timers or repeaters across rooms.
- `tick/WiredTickable.java` - Contract for room-bound wired items that receive centralized timed ticks.

## Runtime Interaction Map

### Main Hot Path

1. Network packet arrives.
2. Packet is decoded and dispatched.
3. Handler resolves `Habbo`, room, or manager state.
4. Handler mutates users, rooms, items, or inventory.
5. Outgoing composers are emitted.
6. Plugin events may run around many of these steps.
7. Persistence may occur immediately, on disposal, or through scheduled runnables.

### Most Central Class Relationships

- `Emulator` -> everything global.
- `GameEnvironment` -> hotel-domain managers.
- `Habbo` -> `HabboInfo`, `HabboStats`, `HabboInventory`, `Messenger`, `RoomUnit`.
- `Room` -> room managers, room items, room units, room layout, special types.
- `HabboItem` -> room behavior, inventory state, item interactions.
- `ItemManager` -> definitions, factories, interaction types, rewards, YouTube, music, crackables.
- `RoomSpecialTypes` -> games, rollers, pet items, wired items.
- `WiredManager` -> room events, item-driven automation, tick service.

### Main Cross-Cutting Concerns

- Permissions.
- Packet serialization.
- DB access.
- Plugin events.
- Delayed tasks.
- Runtime versus persistent user state.

## Code Quality Themes

### Strengths

- The project has very broad gameplay and hotel feature coverage.
- Package names usually make feature location straightforward.
- The room engine has a strong conceptual center.
- The plugin/event surface is extensive.
- The packet layer is recognizable and internally consistent.
- Many smaller interaction classes are narrow and readable.
- WIRED shows evidence of more modern architectural thinking.

### Weaknesses

- Global state is pervasive.
- Manager classes often own too many responsibilities.
- SQL is distributed throughout the codebase.
- Domain logic, packet emission, and persistence are frequently mixed.
- Several packages have architectural drift.
- Feature flags and config fan-out rely heavily on static/global access.
- Thread ownership is often implicit rather than explicit.
- Some parts of the codebase remain placeholder or partially completed.

### Refactor Priorities By Impact

1. Reduce `Emulator` and `GameEnvironment` service-locator coupling.
2. Decompose `CatalogManager` purchase flow.
3. Decompose `ItemManager` responsibilities.
4. Separate room lifecycle, room runtime tick, and room persistence more clearly.
5. Split moderation concerns inside `ModToolManager`.
6. Separate achievement progression from reward fulfillment and packet emission.
7. Make packet registration and callback registration safer and less manual.
8. Consolidate persistence boundaries instead of letting runtime objects write directly.
9. Continue consolidating legacy WIRED paths into typed WIRED engine flows.
10. Normalize pagination, sorting, and collection mutation behavior in guilds and navigator.

## Comparison Checklist For Client Review

Use this checklist when comparing this codebase against the client project’s `PROJECT.md`.

### Bootstrap and Global Architecture

- Does the client project still use a top-level `Emulator`-style service locator?
- Does it still have a `GameEnvironment` composition root?
- Is startup order functionally identical?
- Are config reload and plugin reload behaviors the same?

### Packets and Protocol

- Do packet IDs align?
- Do no-auth packet boundaries align?
- Do handshake, ping/pong, and encryption flows align?
- Do RCON expectations align?
- Compare against `PACKETS.md` directly for this section.

### Room Runtime

- Does the room cycle still run at the same cadence?
- Are room entry, movement, roller, and item walk-on/off semantics aligned?
- Is room unload/load behavior the same?
- Do room rights, bans, queueing, and visibility rules align?

### Item and Interaction Platform

- Are the same interaction classes present?
- Are guild, WIRED, game, pet, and YouTube furniture behaviors aligned?
- Are crackables, trophies, post-its, moodlights, and room ads aligned?

### Users and Inventory

- Are `Habbo`, `HabboInfo`, and `HabboStats` responsibilities the same?
- Are badge, effect, wardrobe, bot, and pet inventory semantics aligned?
- Are subscriptions and HC payday flows aligned?

### Social Systems

- Messenger, friend requests, and private-message behavior.
- Guild membership, guild forum, and guild furniture behavior.
- Guide and guardian flows.

### Commerce and Rewards

- Catalog pages and layout names.
- Purchase validation and fulfillment behavior.
- Limited stock logic.
- Calendar rewards.
- Achievement reward behavior.
- Marketplace rules.

### Moderation

- Ban, mute, sanction, and ticket behaviors.
- Word filter semantics.
- Chatlog access and room-visit tracking.

### Games and WIRED

- Team assignment and game-start/end semantics.
- Battle Banzai, Freeze, Football, and Tag variants.
- WIRED stack composition and effect semantics.
- Wired highscores and timers.

### Known Mismatch Risks To Watch Closely

- Pagination and sorting logic in guilds and navigator.
- Achievement initialization and progression counts.
- Calendar reward day mapping.
- Word filter behavior.
- Packet callback registration/unregistration behavior.
- Room tile occupancy/pathfinding semantics.
- Game achievement reward targeting.

## Client Comparison Results

This section documents findings from comparing the Arcturus-Community server against the decompiled Habbo Flash client at [SWF-Source-Clean-MS](https://github.com/Domexx/SWF-Source-Clean-MS).

### Client Identification

- Repository: `Domexx/SWF-Source-Clean-MS`
- Language: ActionScript 3 (Flash SWF decompile)
- Revision: `PRODUCTION-201611291003-338511768`
- The server's `Incoming.java` and `Outgoing.java` both reference the same production revision in their file comments, confirming both projects target the same protocol version.

### Client Architecture Overview

The client is built around a component-based module system where each major subsystem is an independent `Habbo*Com.as` component (e.g., `HabboCatalogCom.as`, `HabboNavigatorCom.as`, `HabboModerationCom.as`). These are instantiated and wired together at startup.

Key architectural elements:

- **Communication layer**: `com.sulake.habbo.communication` contains `HabboCommunicationManager.as` plus `HabboMessages.as`, which is the master packet registry mapping all numeric header IDs to parser/composer classes.
- **Two-layer room engine**: The client separates a generic rendering engine (`com.sulake.room`) from Habbo-specific room logic (`com.sulake.habbo.room`). The server has a single flat `rooms` package combining both concerns.
- **Furniture logic model**: The client uses `FurnitureLogic` subclasses to define furniture behavior. The server uses `Interaction*` classes. Both serve the same purpose but inheritance hierarchies differ.
- **Wire format**: The client's `EvaWireFormat.as` implements the same 4-byte-length + 2-byte-header framing that the server's Netty pipeline (`GameByteFrameDecoder` / `GameByteDecoder`) uses.
- **Crypto**: The client has `DiffieHellman.as` and `ArcFour.as` under `com.sulake.habbo.communication.encryption`, matching the server's `HabboDiffieHellman.java` and `HabboRC4.java`.

### Protocol Alignment Status

**Confirmed aligned.** Both projects target `PRODUCTION-201611291003-338511768`. Header IDs in the server's `Incoming.java` (382 constants) and `Outgoing.java` (489 constants) match the numeric registrations in the client's `HabboMessages.as` (~470 outgoing registrations, ~520 incoming registrations).

The count asymmetry is expected:
- The server has more outgoing constants because it includes disabled (`-1`) entries and SnowStorm skeleton headers.
- The client has more incoming registrations because it registers parsers for packets the server does not yet send (e.g., SnowStorm game state, NUX flows, campaign/competition, video ads).

~90% of client class names are obfuscated as `_Str_XXXX` patterns. Only numeric header IDs are reliable for cross-reference; class names cannot be used for matching.

### Crypto and Handshake Alignment

The DH+RSA handshake flow matches exactly between client and server:

| Step | Client | Server Header |
|------|--------|---------------|
| 1. Client sends crypto init | Outgoing | `Incoming.InitCryptoEvent = 4000` |
| 2. Server responds with signed DH params | Incoming | `Outgoing.InitDiffieHandshakeComposer = 3110` |
| 3. Client sends public key | Outgoing | `Incoming.GenerateSecretKeyEvent = 773` |
| 4. Server sends its public key | Incoming | `Outgoing.CompleteDiffieHandshakeComposer = 3885` |
| 5. Client sends machine ID | Outgoing | `Incoming.MachineIDEvent = 2490` |
| 6. Client sends SSO ticket | Outgoing | `Incoming.SecureLoginEvent = 2419` |
| 7. Server confirms login | Incoming | `Outgoing.SecureLoginOKComposer = 2491` |

Both sides support optional RC4 stream encryption. The client checks `_cipher != null` before encrypting/decrypting, matching the server's conditional pipeline insertion of `GameByteEncryption`/`GameByteDecryption`.

### Per-Subsystem Alignment Findings

#### Room Engine

Confirmed aligned across all core room packets:
- Heightmap, model, floor/wall items, user list, user status
- Walk, chat (talk/shout/whisper), typing, actions, dance, effects
- Item add/remove/update, roller movement
- Room entry, room data, room settings, room rights

The client's two-layer room architecture (`com.sulake.room` + `com.sulake.habbo.room`) is a rendering concern only. Protocol-visible behavior is identical.

#### Catalog and Commerce

All catalog packets confirmed aligned:
- Catalog index, page request, item purchase, gift purchase
- Club offers, voucher redemption, targeted offers
- Marketplace list/buy/sell/cancel/configure
- Pet breeds, recycler

#### Navigator

Both old navigator and new navigator packets confirmed aligned:
- Room search, category listing, saved searches
- Public rooms, popular rooms, friend rooms
- Room creation, deletion, favorites

#### Moderation

Full mod tool packet alignment confirmed:
- Mod tool init, room/user info, chatlogs, room-user chatlogs
- Issue lifecycle (pick, close, release, change topic)
- Alert, kick, sanction (mute, ban, trade-lock)
- Bully reports, call-for-help topics

#### WIRED

All WIRED packets confirmed aligned:
- Trigger/effect/condition data composers
- Save trigger/effect/condition events
- Reward alert, apply snapshot

#### Game Center

Game center packets confirmed aligned:
- Game list, account info, game status
- Join/load/leave game

#### Trading

All 10 trading events confirmed aligned:
- Start, offer, accept, unaccept, confirm, cancel, close
- Multiple-item offer

#### Guilds and Forums

Full guild and forum packet alignment confirmed.

#### Inventory

All inventory packets confirmed aligned:
- Items, badges, bots, pets, effects
- Add/remove/update operations

#### Social (Friends/Messenger)

Friend and messenger packets confirmed aligned:
- Friend list, requests, accept/decline
- Private messages, follow/stalk
- Room invites, search

### Disabled Packet Inventory

#### Server Incoming Disabled (`-1` in `Incoming.java`)

These 6 headers are registered with ID `-1`, meaning the server will never receive them even though the client may send them:

1. `ModToolWarnEvent` - Moderator warning; client has a warn UI but server ignores the packet.
2. `ModToolBanEvent` - Mod ban via mod tool; server uses `ModToolSanctionBanEvent` instead.
3. `SearchRoomsByTagEvent` - Tag search; the new navigator handles this differently.
4. `ModToolRequestRoomUserChatlogEvent` - Room-user chatlog; server may use alternate chatlog paths.
5. `RequestAchievementConfigurationEvent` - Achievement config request; server sends config proactively during login.
6. `HotelViewClaimBadgeRewardEvent` - Hotel view badge claim; feature may be unimplemented.

#### Server Outgoing Disabled (`-1` in `Outgoing.java`)

These 10 headers are registered with ID `-1`, meaning the server will never send them even though the client may have parsers:

1. `PublicRoomsComposer` - Legacy public rooms list.
2. `RemoveFriendComposer` - Standalone friend removal packet.
3. `RoomEntryInfoComposer` - Room entry info; server uses other room data packets.
4. `UserBCLimitsComposer` - Builders Club limits.
5. `QuestionInfoComposer` - Question/info payload.
6. `UnknownGuildForumComposer6` - Unknown guild forum packet.
7. `UnknownGuildForumComposer7` - Unknown guild forum packet.
8. `RoomUserQuestionAnsweredComposer` - Room question answer feedback.
9. `HotelViewCustomTimerComposer` - Hotel view custom timer.
10. `InventoryAddEffectComposer` - Individual effect add; server uses full list refresh instead.

### SnowStorm: Largest Implementation Gap

The client contains a **full SnowStorm implementation** under `src/snowwar/` with dozens of classes covering game state, arena rendering, projectile physics, player management, and team scoring.

The server has:
- 27 incoming headers for SnowStorm (25 are unnamed `UNKNOWN_SNOWSTORM_60xx` placeholders)
- 30 outgoing headers with 25 skeleton composer classes under `outgoing/unknown/` (all are empty placeholders)
- **No game logic implementation whatsoever**

SnowStorm is the single largest feature gap between client and server. The client is fully capable of playing SnowStorm; the server cannot support it.

### Guide and Guardian: Partially Broken

Two confirmed implementation issues exist in the guide/guardian system:

1. `GuideTour.finish()` (`GuideTour.java:27-30`) contains only TODO comments. Guide sessions cannot complete properly.
2. `GuardianTicket.calculateVerdict()` (`GuardianTicket.java:158-160`) always returns `BADLY` regardless of submitted votes. Guardian moderation verdicts are non-functional.

The client has complete guide and guardian UI flows that expect these features to work.

### Client-Only Subsystems

The following client subsystems have **no server counterpart**:

| Client Subsystem | Location | Notes |
|-----------------|----------|-------|
| Campaign/Competition | `com.sulake.habbo.campaign` | Server has no campaign management |
| NUX (New User Experience) | Various NUX components | Server sends `UserNuxEvent` but has minimal NUX orchestration |
| Sound/Jukebox audio | `com.sulake.habbo.sound` | Client handles audio playback locally; server only manages playlist data |
| Landing View | `com.sulake.habbo.landingview` | Client-side UI composition; server sends data but has no view logic |
| Video Ads | `HabboAdManagerCom` + `org/openvideoads/` | Client-side ad integration; no server participation |

These are expected client-only concerns. The server does not need to implement them because they are rendering, audio, or UI composition responsibilities.

### Architecture Comparison Summary

| Aspect | Server (Java) | Client (AS3) |
|--------|--------------|--------------|
| Module system | Service-locator (`Emulator` + `GameEnvironment`) | Component-based (`Habbo*Com.as` modules) |
| Room engine | Single flat `rooms` package | Two-layer: generic `com.sulake.room` + Habbo-specific `com.sulake.habbo.room` |
| Furniture model | `Interaction*` classes | `FurnitureLogic` subclasses |
| Packet registry | Manual registration in `PacketManager` | Declarative mapping in `HabboMessages.as` |
| Wire format | Netty pipeline with length-field framing | `EvaWireFormat.as` with identical framing |
| Crypto | `HabboDiffieHellman` + `HabboRC4` | `DiffieHellman.as` + `ArcFour.as` |
| Game logic | Server-side (rooms, items, WIRED, games, commerce) | **None** — client is purely rendering/UI/protocol |
| Persistence | Distributed SQL through managers and domain objects | **None** — client has no database |

The critical compatibility surface is **protocol alignment**, which is confirmed. Architecture differences are internal to each project and do not affect interoperability as long as packet IDs, field order, and field types match.

### Builders Club: Stub / Non-Functional

The client has a working Builders Club subsystem. The server has only stubs.

#### What the client has

- **Catalog widgets**: `BuilderAddonsCatalogWidget.as` and `BuilderLoyaltyCatalogWidget.as` for BC catalog pages.
- **3 outgoing (client-to-server) packets**: `BuildersClubPlaceRoomItemMessageComposer`, `BuildersClubPlaceWallItemMessageComposer`, `BuildersClubQueryFurniCountMessageComposer`.
- **2 incoming (server-to-client) packets**: `BuildersClubFurniCountMessageEvent` (furni limits response), `BuildersClubSubscriptionStatusMessageEvent` (subscription status).
- **Perk system**: Client reads the `BUILDER_AT_WORK` perk to enable/disable the BC furniture placement toolbar.
- BC was a separate subscription from HC/VIP. The client's `HabboClubLevelEnum.as` defines three levels (none/HC/VIP); BC operates through its own packet channel, not through the purse.

#### What the server has

| Component | Status | Details |
|-----------|--------|---------|
| Catalog layouts | Stub | `BuildersClubAddonsLayout`, `BuildersClubFrontPageLayout`, `BuildersClubLoyaltyLayout` — render page chrome but no purchase flow |
| Login BC status | Hardcoded | `BuildersClubExpiredComposer` (ID 1452) always sends "expired" with `Integer.MAX_VALUE, 0, 100, Integer.MAX_VALUE, 0` |
| BC furni limits | Dead code | `UserBCLimitsComposer` exists but packet ID is `-1` (never sent) |
| BC furni placement | Missing | No `Incoming.java` constants for any of the 3 client-to-server BC packets |
| Subscription type | Partial | `RedeemableSubscriptionType.BUILDERS_CLUB` enum exists; crackables can award it; but no `SubscriptionBuildersClub` class is registered in `SubscriptionManager` — it falls back to generic `Subscription.class` with no lifecycle hooks |
| Bubble alerts | Unused | 9 BC-related `BubbleAlertKeys` defined but never triggered by any code |
| `BUILDER_AT_WORK` perk | Hardcoded `true` | `UserPerksComposer` sends this as always enabled for all users regardless of subscription |

#### What would be needed to make it functional

1. Create `SubscriptionBuildersClub` extending `Subscription` with `onCreated`/`onExtended`/`onExpired` hooks.
2. Register it in `SubscriptionManager.init()`.
3. Assign a real packet ID to `UserBCLimitsComposer`.
4. Add `Incoming.java` constants for the 3 client-to-server BC packets.
5. Implement handlers for `BuildersClubPlaceRoomItemEvent`, `BuildersClubPlaceWallItemEvent`, `BuildersClubQueryFurniCountEvent`.
6. Make `BuildersClubExpiredComposer` dynamic (read actual subscription data instead of hardcoded values).
7. Make the `BUILDER_AT_WORK` perk conditional on actual BC subscription status.
8. Wire up the 9 bubble alert keys to actual BC lifecycle events.

### Updated Known Mismatch Risks

In addition to the risks listed in the original comparison checklist, the client comparison revealed these specific risks:

1. **SnowStorm**: Client expects full game support; server has only placeholder headers.
2. **Builders Club**: Client has full BC UI, 3 outgoing and 2 incoming packets, and catalog widgets; server has only hardcoded stubs and dead-code composers.
3. **Guide system completion**: Client expects `finish()` to work; server has a TODO stub.
4. **Guardian verdicts**: Client expects meaningful verdict calculation; server always returns `BADLY`.
5. **NUX orchestration**: Client may expect a richer tutorial flow than the server provides.
6. **Disabled incoming packets**: 6 client-sent packets are silently dropped by the server.
7. **Disabled outgoing packets**: 10 server-side composers are never sent despite client parsers existing.

## Final Assessment

- This is a feature-rich, mature, and heavily battle-worn Java emulator codebase.
- Its strongest qualities are breadth of hotel/game functionality, a recognizable room-centric runtime model, and a large extension/event surface.
- Its weakest qualities are global coupling, oversized managers, thin persistence abstraction, mixed runtime and persistence responsibilities, and several confirmed correctness issues.
- The client comparison confirms that **protocol alignment is solid** for `PRODUCTION-201611291003-338511768`. Header IDs match across all major subsystems.
- The largest implementation gaps are SnowStorm (completely unimplemented), guide session completion (TODO stub), and guardian verdict calculation (hardcoded placeholder).
- The best way to compare it against a client project later is not only to diff feature lists, but to compare behavior at these levels:
  - packet contract
  - room cycle semantics
  - item interaction semantics
  - user/profile state model
  - moderation and permissions behavior
  - purchase and reward fulfillment logic
  - WIRED execution semantics

- `PROJECT.md` should therefore be treated as a behavior and architecture baseline, not just a package inventory.
- `PACKETS.md` should be used alongside it whenever protocol alignment is part of the comparison.
