# Packet Misalignment Audit

Comprehensive audit of outgoing packet header alignment between the Arcturus-Community
server and the 2016 Habbo client (`SWF-Source-Clean-MS`).

**Server**: `Outgoing.java` — 489 constants (480 unique header IDs; 10 disabled at `-1`)
**Client**: `HabboMessages.as` — 501 `INCOMING_PACKETS` entries

---

## Summary

| Category | Count |
|---|---|
| Total server Outgoing constants | 489 |
| Unique server header IDs (excluding -1) | 470 |
| Total client INCOMING_PACKETS entries | 501 |
| Headers shared by both | 465 |
| Server headers NOT in client | 5 |
| Client headers NOT in server | 27 |
| Unused Outgoing constants (never referenced by any composer) | 61 |
| Duplicate header IDs in Outgoing.java | 0 (only `-1` dupes among disabled) |
| **Confirmed semantic mismatches (wrong handler routed)** | **1** |
| **Server sends to unregistered client header (dropped packets)** | **3** |
| **Composer uses hardcoded header bypassing Outgoing constant** | **1 (active)** |
| Naming-only mismatches (functionally correct) | ~10 |

---

## 1. CONFIRMED MISMATCH: OneWayGate Uses DiceValue Header

**Severity: Medium** — Functionally works due to identical handler code, but semantically wrong.

### Problem

`InteractionOneWayGate.java` sends `ItemIntStateComposer` which uses header `3431`
(`Outgoing.ItemStateComposer2`). On the client, header `3431` is registered as
`DiceValueMessageEvent` and handled by `onDiceValue()`.

The correct header for one-way gates is `2376` (`Outgoing.ItemStateComposer`), which the
client registers as `OneWayDoorStatusMessageEvent` and handles with `onOneWayDoorStatus()`.

### Why It Still Works

Both `onDiceValue()` and `onOneWayDoorStatus()` in `RoomMessageHandler.as` call the same
method with the same signature:

```actionscript
// onDiceValue (lines 1202-1218) — header 3431
this._roomCreator.updateObjectFurniture(this._currentRoomId, id, null, null, value, stuffData);

// onOneWayDoorStatus (lines 1220-1236) — header 2376
this._roomCreator.updateObjectFurniture(this._currentRoomId, id, null, null, status, stuffData);
```

Both parsers read `int id, int value/status` — identical wire format. The visual result is
the same, but the packet routes through the wrong handler.

### Affected Code

| File | Line(s) | What it does |
|---|---|---|
| `InteractionOneWayGate.java` | 100 | `room.sendComposer(new ItemIntStateComposer(this.getId(), 0).compose())` — gate closing |
| `InteractionOneWayGate.java` | 109 | `room.sendComposer(new ItemIntStateComposer(this.getId(), 1).compose())` — gate opening |
| `InteractionOneWayGate.java` | 130 | `room.sendComposer(new ItemIntStateComposer(this.getId(), 0).compose())` — onPickUp reset |

### Fix

Replace `ItemIntStateComposer` with `ItemStateComposer` in all three locations. This routes
the packet through header `2376` → `OneWayDoorStatusMessageEvent` → `onOneWayDoorStatus()`.

Alternatively, `room.updateItemState(this)` (in `RoomItemManager.java:846`) already sends
`ItemStateComposer` correctly — the `OneWayGateActionOne` runnable uses this path and is correct.

### Cross-Reference: Dice Routing

Dice state updates also use `room.updateItemState()` → `ItemStateComposer` (header `2376`) →
routes through `OneWayDoorStatusMessageEvent` → `onOneWayDoorStatus()`. This is the inverse
mismatch — dice updates go through the OneWayDoor handler instead of the Dice handler. Again,
functionally identical but semantically swapped.

The dice final value is sent via `room.updateItem()` → `FloorItemUpdateComposer` (header `3776`),
which is a general furniture update and works correctly.

### Internal Inconsistency

The one-way gate itself is internally inconsistent — it uses two different client handlers
depending on which code path runs:

| Code Path | Composer | Header | Client Handler |
|---|---|---|---|
| `InteractionOneWayGate.java:100,109,130` | `ItemIntStateComposer` | 3431 | `DiceValueMessageEvent` → `onDiceValue()` |
| `OneWayGateActionOne.java` → `HabboItemNewState` → `room.updateItemState()` | `ItemStateComposer` | 2376 | `OneWayDoorStatusMessageEvent` → `onOneWayDoorStatus()` |

Both work because the handlers are identical, but the same gate object sends its state
through two semantically different packets.

### Dice Never Uses Its Own Packet

Dice state updates (`InteractionDice.java:57`) use `room.updateItemState()` →
`ItemStateComposer` (header 2376) → routes through `OneWayDoorStatusMessageEvent` →
`onOneWayDoorStatus()`. The dice spinning state goes through the OneWayDoor handler,
not the DiceValue handler. The dice final value goes through `room.updateItem()` →
`FloorItemUpdateComposer` (header 3776), which is the generic floor item update.

Header 3431 (`DiceValueMessageEvent`) is never used for actual dice. It is only used by
`InteractionOneWayGate` — the "dice packet" is exclusively used for gates.

### Exhaustive Client Handler Analysis

All 20 furniture event classes and 31 engine event classes in the client were read and
their parsers analyzed. All handler methods in `RoomMessageHandler.as` (lines 1-1339) were
reviewed. The `onDiceValue`/`onOneWayDoorStatus` pair is the **only** case of functionally
identical client handlers in the entire room message handling system. No other handler pair
shares both identical wire format and identical handler logic.

A third handler, `onObjectDataUpdate` (header 2547 → `ObjectDataUpdateMessageEvent`), also
calls `updateObjectFurniture(roomId, id, null, null, state, data)`, but it parses a different
wire format (`string id` + complex `IStuffData`) so it is not interchangeable at the wire
level with the Dice/OneWayDoor pair.

### Colorwheel: No Issue

`InteractionColorWheel` was investigated as a potential mismatch candidate since it shares
`RandomDiceNumber` with dice. It is a wall item that correctly uses `WallItemUpdateComposer`
(header 2009 → `ItemUpdateMessageEvent` → `onItemUpdate()`) for both its spinning state and
result state. No semantic mismatch — it uses the correct generic wall item update path
throughout. The client has no special colorwheel handler; it treats it as a regular wall item.

### Files

- **Server**: `src/main/java/com/eu/habbo/habbohotel/items/interactions/InteractionOneWayGate.java`
- **Server**: `src/main/java/com/eu/habbo/habbohotel/items/interactions/InteractionColorWheel.java`
- **Server**: `src/main/java/com/eu/habbo/habbohotel/items/interactions/InteractionDice.java`
- **Server**: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/ItemIntStateComposer.java` (uses `Outgoing.ItemStateComposer2 = 3431`)
- **Server**: `src/main/java/com/eu/habbo/messages/outgoing/rooms/items/ItemStateComposer.java` (uses `Outgoing.ItemStateComposer = 2376`)
- **Server**: `src/main/java/com/eu/habbo/threading/runnables/OneWayGateActionOne.java` (correct path via `updateItemState`)
- **Server**: `src/main/java/com/eu/habbo/threading/runnables/RandomDiceNumber.java` (shared by dice and colorwheel)
- **Client**: `communication/messages/incoming/room/furniture/_Str_8183.as` (DiceValueMessageEvent, header 3431)
- **Client**: `communication/messages/incoming/room/furniture/_Str_7657.as` (OneWayDoorStatusMessageEvent, header 2376)
- **Client**: `communication/messages/parser/room/furniture/_Str_7612.as` (DiceValueMessageParser)
- **Client**: `communication/messages/parser/room/furniture/_Str_7431.as` (OneWayDoorStatusMessageParser)
- **Client**: `room/RoomMessageHandler.as:1202-1236` (both handlers — identical logic confirmed)

---

## 2. DROPPED PACKETS: Server Sends Headers Not Registered in Client

These packets are sent by active server code but the client has no handler registered for
the header ID. The client silently ignores them.

### 2a. `UpdateStackHeightTileHeightComposer` — Header 2816

**Severity: Low-Medium** — Stack height tile feedback is lost.

| | |
|---|---|
| Outgoing constant | `UpdateStackHeightTileHeightComposer = 2816` |
| Composer | `rooms/items/UpdateStackHeightTileHeightComposer.java` |
| Data format | `int itemId, int height` |
| Sender | `SetStackHelperHeightEvent.java:65` |
| Client registration | **None** — header 2816 not in INCOMING_PACKETS |

The server sends this when a user adjusts a stack helper's tile height. The client never
receives the feedback. The related `UpdateStackHeightComposer` (header 558) IS registered
and works correctly for the general stack height update.

### 2b. `RoomFloorThicknessUpdatedComposer` — Header 3786

**Severity: Low** — Floor/wall thickness settings feedback on room entry.

| | |
|---|---|
| Outgoing constant | `RoomFloorThicknessUpdatedComposer = 3786` |
| Composer | `rooms/RoomFloorThicknessUpdatedComposer.java` |
| Data format | `boolean hideWall, int floorSize, int wallSize` |
| Sender | `FloorPlanEditorRequestDoorSettingsEvent.java:14` |
| Client registration | **None** — 3786 is an OUTGOING packet in the client (`_Str_12273`), not incoming |

The server sends this when the floor plan editor is opened. The client has 3786 registered
as an *outgoing* packet (client-to-server), not an incoming one, so it silently drops this.
The `RoomThicknessComposer` (header 3547) sends similar data and IS properly registered.

### 2c. `TradeCompleteComposer` (via `UnknownTradeComposer`) — Header 3128

**Severity: Very Low** — The routing is unusual but effectively a no-op.

| | |
|---|---|
| Class name | `TradeCompleteComposer.java` |
| Actually uses | `Outgoing.UnknownTradeComposer = 3128` (NOT `Outgoing.TradeCompleteComposer = 2369`) |
| Sender | `RoomTrade.java:127` |
| Client handler at 3128 | `TradingNotOpenEvent` → logs "TRADING::TradingNotOpenEvent" and does nothing |

The `TradeCompleteComposer` class sends header 3128, which the client maps to `TradingNotOpenEvent`.
The client handler just logs a debug message and takes no action. Meanwhile,
`Outgoing.TradeCompleteComposer = 2369` is defined but never used by any composer class,
and header 2369 is not registered in the client either.

The trade completion itself works because `TradeCloseWindowComposer` (header 1001 →
`TradingCompletedEvent`) handles the actual UI closure.

---

## 3. HARDCODED HEADER BYPASSING Outgoing CONSTANT

### `GameCenterAchievementsConfigurationComposer` — Uses hardcoded 2265

| | |
|---|---|
| Outgoing constant | `AchievementsConfigurationComposer = 1689` (NEVER USED) |
| Actual header sent | `this.response.init(2265)` (hardcoded) |
| Header 2265 constant | `Outgoing.GameAchievementsListComposer = 2265` |
| Client at 2265 | `UserGameAchievementsMessageEvent` |
| Client at 1689 | `GameAchievementsMessageEvent` |
| Senders | `GameCenterRequestGamesEvent.java:9`, `GameCenterJoinGameEvent.java:16` |

The composer bypasses the Outgoing constant system entirely by hardcoding `2265`. This
means `Outgoing.AchievementsConfigurationComposer = 1689` is orphaned, and the packet goes
to `UserGameAchievementsMessageEvent` (at 2265) instead of `GameAchievementsMessageEvent`
(at 1689). Both are in the game achievements domain so this may be intentional, but it's
fragile — changing the Outgoing constant has no effect since the header is hardcoded.

**27 total composers use hardcoded headers** (mostly dead SnowWars code). Only this one is
actively called.

---

## 4. SERVER HEADERS NOT IN CLIENT (Complete List)

| Header | Outgoing Constant | Actually Sent? | Notes |
|---|---|---|---|
| 690 | `HotelViewCatalogPageExpiringComposer` | Composer exists, unused | Dead code |
| 2369 | `TradeCompleteComposer` | Constant unused; class uses 3128 | See §2c |
| 2816 | `UpdateStackHeightTileHeightComposer` | **Yes** | See §2a — dropped |
| 3379 | `HabboWayQuizComposer1` | Composer exists, unused | Dead code |
| 3786 | `RoomFloorThicknessUpdatedComposer` | **Yes** | See §2b — dropped |

---

## 5. CLIENT HEADERS NOT IN SERVER (27 entries)

These are client handler registrations with no corresponding Outgoing constant. The client
has a handler ready but the server never sends these packets.

| Header | Client Handler | Domain |
|---|---|---|
| 195 | `_Str_17034` | unknown |
| 416 | `_Str_17054` | unknown |
| 463 | `_Str_15969` | unknown |
| 600 | `_Str_17595` | unknown |
| 761 | `_Str_16789` | unknown |
| 872 | `_Str_16892` | unknown |
| 1660 | `_Str_16258` | unknown |
| 1730 | `_Str_16653` | unknown |
| 1982 | `_Str_17148` | unknown |
| 2142 | `_Str_18557` | unknown |
| 2313 | `_Str_16135` | unknown |
| 2494 | `_Str_18853` | unknown |
| 2668 | `_Str_17379` | unknown |
| 2756 | `_Str_18296` | unknown |
| 2819 | `_Str_16028` | unknown |
| 3035 | `JoiningQueueFailedMessageEvent` | game queue |
| 3099 | `_Str_16667` | unknown |
| 3138 | `_Str_18475` | unknown |
| 3191 | `_Str_17782` | unknown |
| 3560 | `_Str_8191` | unknown |
| 3684 | `_Str_16597` | unknown |
| 3863 | `_Str_18906` | unknown |
| 3915 | `_Str_15952` | unknown |
| 5007 | `SnowStormGenericErrorEvent` | snowstorm |
| 5100 | `SimpleAlertMessageParser` | alerts |
| 5200 | `StartRoomPollEvent` | polling |
| 5201 | `RoomPollResultEvent` | polling |

Most of these are newer client features not yet implemented in this server build.

---

## 6. UNUSED Outgoing CONSTANTS (61 total)

Constants defined in `Outgoing.java` but never referenced by any composer class.

### Disabled (header = -1, 10 constants)
`PublicRoomsComposer`, `RemoveFriendComposer`, `RoomEntryInfoComposer`, `UserBCLimitsComposer`,
`QuestionInfoComposer`, `UnknownGuildForumComposer6`, `UnknownGuildForumComposer7`,
`RoomUserQuestionAnsweredComposer`, `HotelViewCustomTimerComposer`, `InventoryAddEffectComposer`

### Orphaned (valid header, never used, 22 non-SnowStorm constants)
| Constant | Header | Notes |
|---|---|---|
| `ModToolComposerTwo` | 2335 | |
| `TradeCompleteComposer` | 2369 | Class uses `UnknownTradeComposer` instead |
| `GuildMembershipRequestedComposer` | 1180 | |
| `OldPublicRoomsComposer` | 2726 | |
| `GameCenterFeaturedPlayersComposer` | 3097 | |
| `AchievementsConfigurationComposer` | 1689 | Class uses hardcoded 2265 instead |
| `UnknownQuestComposer3` | 1122 | |
| `DailyQuestComposer` | 1878 | |
| `SubmitCompetitionRoomComposer` | 3841 | |
| `GameAchievementsListComposer` | 2265 | Used by hardcoded init, not by constant name |
| `Game2WeeklyLeaderboardComposer` | 2196 | |
| `Game2WeeklySmallLeaderboardComposer` | 3512 | |
| Various `UnknownComposer_*` | various | 12 unknown/placeholder constants |

### SnowStorm (29 constants)
All SnowStorm `Outgoing` constants are unused — the SnowStorm composers use hardcoded header
IDs that don't reference these constants. None of the SnowStorm composers are ever
instantiated anyway, so this is dead code.

---

## 7. NAMING MISMATCHES (Functionally Correct)

These pairs share the same header ID and data format, but the server and client use different
names. No functional issue — listed for documentation only.

| Header | Server Name | Client Name | Verdict |
|---|---|---|---|
| 1121 | `ReportRoomFormComposer` | `CallForHelpPendingCallsEvent` | Same data: int count + (string,string,string)[] |
| 1689 | `AchievementsConfigurationComposer` | `GameAchievementsMessageEvent` | Constant unused; see §3 |
| 69 | `UnknownRoomDesktopComposer` | `BotSkillListUpdateEvent` | Composer never instantiated |
| 904 | `UnknownComposer_1165` | `GameInviteMessageEvent` | Composer never instantiated |
| 1553 | `UnknownComposer_100` | `PetBreedingResultEvent` | Composer never instantiated |
| 3523 | `UnknownRoomViewerComposer` | `IdentityAccountsEvent` | Composer never instantiated |
| 563 | `UnknownComposer_2698` | `_Str_6232` (CheckNameResultEvent) | Naming only; data matches |
| 3738 | `NewUserIdentityComposer` | `NoobnessLevelMessageEvent` | Same packet, different name |
| 1001 | `TradeCloseWindowComposer` | `TradingCompletedEvent` | Same semantics |
| 3027 | `QuestExpiredComposer` | `QuestCancelledMessageEvent` | Same semantics |

---

## 8. METHODOLOGY

### Data Sources
- **Server Outgoing constants**: `src/main/java/com/eu/habbo/messages/outgoing/Outgoing.java` (557 lines, 489 constants)
- **Client incoming handler map**: `src/com/sulake/habbo/communication/HabboMessages.as` (501 INCOMING_PACKETS)
- **Server composers**: 435+ classes in `messages/outgoing/` using `this.response.init(Outgoing.*)`
- **Client handlers/parsers**: ActionScript classes in `communication/messages/incoming/` and `communication/messages/parser/`

### Process
1. Extracted all server Outgoing constants (name → header ID)
2. Extracted all client INCOMING_PACKETS entries (header ID → handler class)
3. Cross-referenced shared headers, identifying readable names and obfuscated `_Str_*` names
4. For obfuscated names, resolved to package paths via import statements
5. Checked all 489 Outgoing constants for usage outside `Outgoing.java`
6. Found all composers using hardcoded `this.response.init(NUMBER)` instead of constants
7. Verified which composers are actually instantiated (sent) vs dead code
8. For each mismatch candidate, read both server composer and client parser to compare data formats
9. Checked duplicate header IDs in `Outgoing.java`
10. Read all 20 furniture event classes and their parsers to find identical wire formats
11. Read all 31 engine event classes and their parsers for comparison
12. Read all handler methods in `RoomMessageHandler.as` (1339 lines) to find identical handler logic
13. Traced all server callers of `ItemIntStateComposer` and `ItemStateComposer` to map routing
14. Investigated shared code paths (e.g., `RandomDiceNumber` used by both dice and colorwheel)
15. Verified colorwheel uses correct wall item update path with no semantic mismatch
