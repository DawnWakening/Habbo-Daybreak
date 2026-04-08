# Server Packet Rename Plan

## Objective
Rename all server outgoing packet composers to match the client's incoming event naming convention. The client is the source of truth.

## Naming Rule
**Server packet ID → Client event name → New server name**
- `Outgoing.SecureLoginOKComposer = 2491` → `INCOMING_PACKETS[2491] = AuthenticationOKMessageEvent` → `AuthenticationOKMessageComposer.java`

Simply replace "Event" with "Composer", keeping the full name including "Message".

---

## Complete Mapping (Confirmed 1:1 Only)

### Handshake (9 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `SecureLoginOKComposer` | 2491 | `AuthenticationOKMessageEvent` | `AuthenticationOKMessageComposer` |
| `InitDiffieHandshakeComposer` | 1347 | `InitDiffieHandshakeEvent` | `InitDiffieHandshakeMessageComposer` |
| `CompleteDiffieHandshakeComposer` | 3885 | `CompleteDiffieHandshakeEvent` | `CompleteDiffieHandshakeMessageComposer` |
| `PongComposer` | 10 | `LatencyPingResponseMessageEvent` | `LatencyPingResponseMessageComposer` |
| `MachineIDComposer` | 1488 | `UniqueMachineIDEvent` | `UniqueMachineIDMessageComposer` |
| `AvailabilityStatusMessageComposer` | 2033 | `AvailabilityStatusMessageEvent` | `AvailabilityStatusMessageComposer` |
| `EnableNotificationsComposer` | 3284 | `InfoFeedEnableMessageEvent` | `InfoFeedEnableMessageComposer` |
| `ConnectionErrorComposer` | 1004 | `ErrorReportEvent` | `ErrorReportMessageComposer` |
| `PingComposer` | 3928 | `PingMessageEvent` | `PingMessageComposer` |

### Users (22 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `UserDataComposer` | 2725 | `UserObjectEvent` | `UserObjectMessageComposer` |
| `UserProfileComposer` | 3898 | `ExtendedProfileMessageEvent` | `ExtendedProfileMessageComposer` |
| `UserCreditsComposer` | 3475 | `CreditBalanceEvent` | `CreditBalanceMessageComposer` |
| `UserCurrencyComposer` | 2018 | `ActivityPointsMessageEvent` | `ActivityPointsMessageComposer` |
| `UserPointsComposer` | 2275 | `HabboActivityPointNotificationMessageEvent` | `HabboActivityPointNotificationMessageComposer` |
| `UserAchievementScoreComposer` | 1968 | `AchievementsScoreEvent` | `AchievementsScoreMessageComposer` |
| `UserBadgesComposer` | 1087 | `UserBadgesEvent` | `UserBadgesMessageComposer` |
| `UserClothesComposer` | 1450 | `FigureSetIdsEvent` | `FigureSetIdsMessageComposer` |
| `UserWardrobeComposer` | 3315 | `WardrobeMessageEvent` | `WardrobeMessageComposer` |
| `UserHomeRoomComposer` | 2875 | `NavigatorSettingsEvent` | `NavigatorSettingsMessageComposer` |
| `UserClubComposer` | 954 | `ScrSendUserInfoEvent` | `ScrSendUserInfoMessageComposer` |
| `UserCitizinShipComposer` | 1203 | `TalentTrackLevelMessageEvent` | `TalentTrackLevelMessageComposer` |
| `UserPerksComposer` | 2586 | `PerkAllowancesEvent` | `PerkAllowancesMessageComposer` |
| `UserPermissionsComposer` | 411 | `UserRightsMessageEvent` | `UserRightsMessageComposer` |
| `UpdateUserLookComposer` | 2429 | `FigureUpdateEvent` | `FigureUpdateMessageComposer` |
| `MeMenuSettingsComposer` | 513 | `AccountPreferencesEvent` | `AccountPreferencesMessageComposer` |
| `AddUserBadgeComposer` | 2493 | `BadgeReceivedEvent` | `BadgeReceivedMessageComposer` |
| `ChangeNameUpdateComposer` | 118 | `ChangeUserNameResultMessageEvent` | `ChangeUserNameResultMessageComposer` |
| `ClubGiftReceivedComposer` | 659 | `ClubGiftSelectedEvent` | `ClubGiftSelectedMessageComposer` |
| `FavoriteRoomsCountComposer` | 151 | `FavouritesEvent` | `FavouritesMessageComposer` |
| `MutedWhisperComposer` | 826 | `RemainingMutePeriodEvent` | `RemainingMutePeriodMessageComposer` |
| `ProfileFriendsComposer` | 2016 | `RelationshipStatusInfoEvent` | `RelationshipStatusInfoMessageComposer` |

### Friends (12 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `FriendsComposer` | 3130 | `FriendListFragmentMessageEvent` | `FriendListFragmentMessageComposer` |
| `FriendRequestComposer` | 2219 | `NewFriendRequestEvent` | `NewFriendRequestMessageComposer` |
| `FriendRequestErrorComposer` | 892 | `MessengerErrorEvent` | `MessengerErrorMessageComposer` |
| `MessengerInitComposer` | 1605 | `MessengerInitEvent` | `MessengerInitMessageComposer` |
| `LoadFriendRequestsComposer` | 280 | `FriendRequestsEvent` | `FriendRequestsMessageComposer` |
| `FriendChatMessageComposer` | 1587 | `NewConsoleMessageEvent` | `NewConsoleMessageMessageComposer` |
| `FriendFindingRoomComposer` | 1210 | `FindFriendsProcessResultEvent` | `FindFriendsProcessResultMessageComposer` |
| `FriendNotificationComposer` | 3082 | `FriendNotificationEvent` | `FriendNotificationMessageComposer` |
| `UpdateFriendComposer` | 2800 | `FriendListUpdateEvent` | `FriendListUpdateMessageComposer` |
| `StalkErrorComposer` | 3048 | `FollowFriendFailedEvent` | `FollowFriendFailedMessageComposer` |
| `RoomInviteComposer` | 3870 | `RoomInviteEvent` | `RoomInviteMessageComposer` |
| `RoomInviteErrorComposer` | 462 | `RoomInviteErrorEvent` | `RoomInviteErrorMessageComposer` |

### Inventory (17 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `InventoryItemsComposer` | 994 | `FurniListEvent` | `FurniListMessageComposer` |
| `InventoryPetsComposer` | 3522 | `PetInventoryEvent` | `PetInventoryMessageComposer` |
| `InventoryBotsComposer` | 3086 | `BotInventoryEvent` | `BotInventoryMessageComposer` |
| `InventoryBadgesComposer` | 717 | `BadgesEvent` | `BadgesMessageComposer` |
| `InventoryAchievementsComposer` | 2501 | `BadgePointLimitsEvent` | `BadgePointLimitsMessageComposer` |
| `InventoryRefreshComposer` | 3151 | `FurniListInvalidateEvent` | `FurniListInvalidateMessageComposer` |
| `InventoryItemUpdateComposer` | 104 | `FurniListAddOrUpdateEvent` | `FurniListAddOrUpdateMessageComposer` |
| `AddHabboItemComposer` | 2103 | `UnseenItemsEvent` | `UnseenItemsMessageComposer` |
| `AddPetComposer` | 2101 | `PetAddedToInventoryEvent` | `PetAddedToInventoryMessageComposer` |
| `AddBotComposer` | 1352 | `BotAddedToInventoryEvent` | `BotAddedToInventoryMessageComposer` |
| `RemoveHabboItemComposer` | 159 | `FurniListRemoveEvent` | `FurniListRemoveMessageComposer` |
| `RemovePetComposer` | 3253 | `PetRemovedFromInventoryEvent` | `PetRemovedFromInventoryMessageComposer` |
| `RemoveBotComposer` | 233 | `BotRemovedFromInventoryEvent` | `BotRemovedFromInventoryMessageComposer` |
| `UserEffectsListComposer` | 340 | `AvatarEffectsMessageEvent` | `AvatarEffectsMessageComposer` |
| `EffectsListAddComposer` | 2867 | `AvatarEffectAddedMessageEvent` | `AvatarEffectAddedMessageComposer` |
| `EffectsListEffectEnableComposer` | 1959 | `AvatarEffectActivatedMessageEvent` | `AvatarEffectActivatedMessageComposer` |
| `EffectsListRemoveComposer` | 2228 | `AvatarEffectExpiredMessageEvent` | `AvatarEffectExpiredMessageComposer` |

### Rooms (38 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `RoomDataComposer` | 687 | `GetGuestRoomResultEvent` | `GetGuestRoomResultMessageComposer` |
| `RoomOpenComposer` | 758 | `OpenConnectionMessageEvent` | `OpenConnectionMessageComposer` |
| `RoomSettingsComposer` | 1498 | `RoomSettingsDataEvent` | `RoomSettingsDataMessageComposer` |
| `RoomSettingsSavedComposer` | 948 | `RoomSettingsSavedEvent` | `RoomSettingsSavedMessageComposer` |
| `RoomSettingsUpdatedComposer` | 3297 | `RoomInfoUpdatedEvent` | `RoomInfoUpdatedMessageComposer` |
| `RoomEditSettingsErrorComposer` | 1555 | `RoomSettingsSaveErrorEvent` | `RoomSettingsSaveErrorMessageComposer` |
| `RoomEnterErrorComposer` | 899 | `CantConnectMessageEvent` | `CantConnectMessageComposer` |
| `RoomRightsComposer` | 780 | `YouAreControllerMessageEvent` | `YouAreControllerMessageComposer` |
| `RoomRightsListComposer` | 1284 | `FlatControllersEvent` | `FlatControllersMessageComposer` |
| `RoomAddRightsListComposer` | 2088 | `FlatControllerAddedEvent` | `FlatControllerAddedMessageComposer` |
| `RoomRemoveRightsListComposer` | 1327 | `FlatControllerRemovedEvent` | `FlatControllerRemovedMessageComposer` |
| `RoomBannedUsersComposer` | 1869 | `BannedUsersFromRoomEvent` | `BannedUsersFromRoomMessageComposer` |
| `RoomFilterWordsComposer` | 2937 | `RoomFilterSettingsMessageEvent` | `RoomFilterSettingsMessageComposer` |
| `RoomMutedComposer` | 2533 | `MuteAllInRoomEvent` | `MuteAllInRoomMessageComposer` |
| `RoomOwnerComposer` | 339 | `YouAreOwnerMessageEvent` | `YouAreOwnerMessageComposer` |
| `RoomPaneComposer` | 749 | `RoomEntryInfoMessageEvent` | `RoomEntryInfoMessageComposer` |
| `RoomModelComposer` | 2031 | `RoomReadyMessageEvent` | `RoomReadyMessageComposer` |
| `RoomHeightMapComposer` | 1301 | `FloorHeightMapEvent` | `FloorHeightMapMessageComposer` |
| `RoomRelativeMapComposer` | 2753 | `HeightMapEvent` | `HeightMapMessageComposer` |
| `RoomPaintComposer` | 2454 | `RoomPropertyMessageEvent` | `RoomPropertyMessageComposer` |
| `RoomScoreComposer` | 482 | `RoomRatingEvent` | `RoomRatingMessageComposer` |
| `RoomChatSettingsComposer` | 1191 | `RoomChatSettingsMessageEvent` | `RoomChatSettingsMessageComposer` |
| `RoomThicknessComposer` | 3547 | `RoomVisualizationSettingsEvent` | `RoomVisualizationSettingsMessageComposer` |
| `ForwardToRoomComposer` | 160 | `RoomForwardMessageEvent` | `RoomForwardMessageComposer` |
| `ConvertedForwardToRoomComposer` | 1331 | `ConvertedRoomIdEvent` | `ConvertedRoomIdMessageComposer` |
| `FavoriteRoomChangedComposer` | 2524 | `FavouriteChangedEvent` | `FavouriteChangedMessageComposer` |
| `FloodCounterComposer` | 566 | `FloodControlMessageEvent` | `FloodControlMessageComposer` |
| `DoorbellAddUserComposer` | 2309 | `DoorbellMessageEvent` | `DoorbellMessageComposer` |
| `HideDoorbellComposer` | 3783 | `FlatAccessibleMessageEvent` | `FlatAccessibleMessageComposer` |
| `RoomAccessDeniedComposer` | 878 | `FlatAccessDeniedMessageEvent` | `FlatAccessDeniedMessageComposer` |
| `RoomNoRightsComposer` | 2392 | `YouAreNotControllerMessageEvent` | `YouAreNotControllerMessageComposer` |
| `RoomCreatedComposer` | 1304 | `FlatCreatedEvent` | `FlatCreatedMessageComposer` |
| `RoomCategoriesComposer` | 1562 | `UserFlatCatsEvent` | `UserFlatCatsMessageComposer` |
| `RoomUserRemoveComposer` | 2661 | `UserRemoveMessageEvent` | `UserRemoveMessageComposer` |
| `RoomUserUnbannedComposer` | 3429 | `UserUnbannedFromRoomEvent` | `UserUnbannedFromRoomMessageComposer` |
| `TagsComposer` | 2012 | `PopularRoomTagsResultEvent` | `PopularRoomTagsResultMessageComposer` |
| `PrivateRoomsComposer` | 52 | `GuestRoomSearchResultEvent` | `GuestRoomSearchResultMessageComposer` |
| `OldPublicRoomsComposer` | 2726 | `OfficialRoomsEvent` | `OfficialRoomsMessageComposer` |

### Rooms/Users (20 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `RoomUsersComposer` | 374 | `UsersEvent` | `UsersMessageComposer` |
| `RoomUserStatusComposer` | 1640 | `UserUpdateEvent` | `UserUpdateMessageComposer` |
| `RoomUserDanceComposer` | 2233 | `DanceMessageEvent` | `DanceMessageComposer` |
| `RoomUserTalkComposer` | 1446 | `ChatMessageEvent` | `ChatMessageComposer` |
| `RoomUserShoutComposer` | 1036 | `ShoutMessageEvent` | `ShoutMessageComposer` |
| `RoomUserWhisperComposer` | 2704 | `WhisperMessageEvent` | `WhisperMessageComposer` |
| `RoomUserTypingComposer` | 1717 | `UserTypingMessageEvent` | `UserTypingMessageComposer` |
| `RoomUserEffectComposer` | 1167 | `AvatarEffectMessageEvent` | `AvatarEffectMessageComposer` |
| `RoomUserActionComposer` | 1631 | `ExpressionMessageEvent` | `ExpressionMessageComposer` |
| `RoomUserDataComposer` | 3920 | `UserChangeMessageEvent` | `UserChangeMessageComposer` |
| `RoomUserHandItemComposer` | 1474 | `CarryObjectMessageEvent` | `CarryObjectMessageComposer` |
| `RoomUserReceivedHandItemComposer` | 354 | `HandItemReceivedMessageEvent` | `HandItemReceivedMessageComposer` |
| `RoomUserRespectComposer` | 2815 | `RoomUserRespect` | `RoomUserRespectMessageComposer` |
| `RoomUserNameChangedComposer` | 2182 | `UserNameChangedMessageEvent` | `UserNameChangedMessageComposer` |
| `RoomUserRemoveRightsComposer` | 84 | `NoSuchFlatEvent` | `NoSuchFlatMessageComposer` |
| `RoomUserIgnoredComposer` | 207 | `IgnoreResultMessageEvent` | `IgnoreResultMessageComposer` |
| `RoomUserTagsComposer` | 1255 | `UserTagsMessageEvent` | `UserTagsMessageComposer` |
| `RoomUsersGuildBadgesComposer` | 2402 | `HabboGroupBadgesMessageEvent` | `HabboGroupBadgesMessageComposer` |
| `RoomUnitIdleComposer` | 1797 | `SleepMessageEvent` | `SleepMessageComposer` |
| `RoomUnitOnRollerComposer` | 3207 | `SlideObjectBundleMessageEvent` | `SlideObjectBundleMessageComposer` |

### Rooms/Items (17 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `AddFloorItemComposer` | 1534 | `ObjectAddMessageEvent` | `ObjectAddMessageComposer` |
| `AddWallItemComposer` | 2187 | `ItemAddMessageEvent` | `ItemAddMessageComposer` |
| `RemoveFloorItemComposer` | 2703 | `ObjectRemoveMessageEvent` | `ObjectRemoveMessageComposer` |
| `RemoveWallItemComposer` | 3208 | `ItemRemoveMessageEvent` | `ItemRemoveMessageComposer` |
| `FloorItemUpdateComposer` | 3776 | `ObjectUpdateMessageEvent` | `ObjectUpdateMessageComposer` |
| `WallItemUpdateComposer` | 2009 | `ItemUpdateMessageEvent` | `ItemUpdateMessageComposer` |
| `RoomFloorItemsComposer` | 1778 | `ObjectsMessageEvent` | `ObjectsMessageComposer` |
| `RoomWallItemsComposer` | 1369 | `ItemsEvent` | `ItemsMessageComposer` |
| `ItemStateComposer` | 2376 | `OneWayDoorStatusMessageEvent` | `OneWayDoorStatusMessageComposer` |
| `ItemExtraDataComposer` | 2547 | `ObjectDataUpdateMessageEvent` | `ObjectDataUpdateMessageComposer` |
| `ItemsDataUpdateComposer` | 1453 | `ObjectsDataUpdateMessageEvent` | `ObjectsDataUpdateMessageComposer` |
| `PostItDataComposer` | 2202 | `ItemDataUpdateMessageEvent` | `ItemDataUpdateMessageComposer` |
| `PostItStickyPoleOpenComposer` | 2366 | `RequestSpamWallPostItMessageEvent` | `RequestSpamWallPostItMessageComposer` |
| `PresentItemOpenedComposer` | 56 | `PresentOpenedMessageEvent` | `PresentOpenedMessageComposer` |
| `MoodLightDataComposer` | 2710 | `RoomDimmerPresetsEvent` | `RoomDimmerPresetsMessageComposer` |
| `UpdateStackHeightComposer` | 558 | `HeightMapUpdateMessageEvent` | `HeightMapUpdateMessageComposer` |
| `UpdateStackHeightTileHeightComposer` | 2816 | `CustomStackingHeightUpdateMessageEvent` | `CustomStackingHeightUpdateMessageComposer` |

### Rooms/Pets (14 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `PetInformationComposer` | 2901 | `PetInfoMessageEvent` | `PetInfoMessageComposer` |
| `PetStatusUpdateComposer` | 1907 | `PetStatusUpdateEvent` | `PetStatusUpdateMessageComposer` |
| `PetLevelUpComposer` | 859 | `PetLevelNotificationEvent` | `PetLevelNotificationMessageComposer` |
| `PetLevelUpdatedComposer` | 2824 | `PetLevelUpdateEvent` | `PetLevelUpdateMessageComposer` |
| `PetTrainingPanelComposer` | 1164 | `PetTrainingPanelEvent` | `PetTrainingPanelMessageComposer` |
| `PetPackageComposer` | 1723 | `FurnitureAliasesMessageEvent` | `FurnitureAliasesMessageComposer` |
| `PetPackageNameValidationComposer` | 546 | `OpenPetPackageResultMessageEvent` | `OpenPetPackageResultMessageComposer` |
| `PetNameErrorComposer` | 1503 | `ApproveNameMessageEvent` | `ApproveNameMessageComposer` |
| `CantScratchPetNotOldEnoughComposer` | 1130 | `PetRespectFailedEvent` | `PetRespectFailedMessageComposer` |
| `RoomPetComposer` | 1924 | `PetFigureUpdateEvent` | `PetFigureUpdateMessageComposer` |
| `RoomPetExperienceComposer` | 2156 | `PetExperienceEvent` | `PetExperienceMessageComposer` |
| `RoomPetRespectComposer` | 2788 | `PetRespectNotificationEvent` | `PetRespectNotificationMessageComposer` |
| `PetBreedsComposer` | 3331 | `SellablePetPalettesMessageEvent` | `SellablePetPalettesMessageComposer` |
| `PetBoughtNotificationComposer` | 1111 | `PetReceivedMessageEvent` | `PetReceivedMessageComposer` |

### Rooms/Pets/Breeding (4 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `PetBreedingResultComposer` | 634 | `ConfirmBreedingRequestEvent` | `ConfirmBreedingRequestMessageComposer` |
| `PetBreedingStartComposer` | 1746 | `PetBreedingEvent` | `PetBreedingMessageComposer` |
| `PetBreedingFailedComposer` | 1625 | `ConfirmBreedingResultEvent` | `ConfirmBreedingResultMessageComposer` |
| `PetBreedingStartFailedComposer` | 2621 | `GoToBreedingNestFailureEvent` | `GoToBreedingNestFailureMessageComposer` |

### Catalog (22 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `CatalogPageComposer` | 804 | `CatalogPageMessageEvent` | `CatalogPageMessageComposer` |
| `CatalogPagesListComposer` | 1032 | `CatalogPagesListEvent` | `CatalogPagesListMessageComposer` |
| `CatalogSearchResultComposer` | 3388 | `ProductOfferEvent` | `ProductOfferMessageComposer` |
| `CatalogUpdatedComposer` | 1866 | `CatalogPublishedMessageEvent` | `CatalogPublishedMessageComposer` |
| `CatalogModeComposer` | 3828 | `BuildersClubFurniCountMessageEvent` | `BuildersClubFurniCountMessageComposer` |
| `PurchaseOKComposer` | 869 | `PurchaseOKMessageEvent` | `PurchaseOKMessageComposer` |
| `RedeemVoucherOKComposer` | 3336 | `VoucherRedeemOkMessageEvent` | `VoucherRedeemOkMessageComposer` |
| `RedeemVoucherErrorComposer` | 714 | `VoucherRedeemErrorMessageEvent` | `VoucherRedeemErrorMessageComposer` |
| `GiftConfigurationComposer` | 2234 | `GiftWrappingConfigurationEvent` | `GiftWrappingConfigurationMessageComposer` |
| `GiftReceiverNotFoundComposer` | 1517 | `GiftReceiverNotFoundEvent` | `GiftReceiverNotFoundMessageComposer` |
| `NotEnoughPointsTypeComposer` | 3914 | `NotEnoughBalanceMessageEvent` | `NotEnoughBalanceMessageComposer` |
| `AlertLimitedSoldOutComposer` | 377 | `LimitedEditionSoldOutEvent` | `LimitedEditionSoldOutMessageComposer` |
| `AlertPurchaseFailedComposer` | 1404 | `PurchaseErrorMessageEvent` | `PurchaseErrorMessageComposer` |
| `AlertPurchaseUnavailableComposer` | 3770 | `PurchaseNotAllowedMessageEvent` | `PurchaseNotAllowedMessageComposer` |
| `ClubDataComposer` | 2405 | `HabboClubOffersMessageEvent` | `HabboClubOffersMessageComposer` |
| `ClubCenterDataComposer` | 3277 | `ScrSendKickbackInfoMessageEvent` | `ScrSendKickbackInfoMessageComposer` |
| `ClubGiftsComposer` | 619 | `ClubGiftInfoEvent` | `ClubGiftInfoMessageComposer` |
| `DiscountComposer` | 2347 | `BundleDiscountRulesetMessageEvent` | `BundleDiscountRulesetMessageComposer` |
| `TargetedOfferComposer` | 119 | `TargetedOfferEvent` | `TargetedOfferMessageComposer` |
| `RecyclerCompleteComposer` | 468 | `RecyclerFinishedEvent` | `RecyclerFinishedMessageComposer` |
| `RecyclerLogicComposer` | 3164 | `RecyclerPrizesEvent` | `RecyclerPrizesMessageComposer` |
| `ReloadRecyclerComposer` | 3433 | `RecyclerStatusEvent` | `RecyclerStatusMessageComposer` |

### Catalog/Marketplace (8 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `MarketplaceConfigComposer` | 1823 | `MarketplaceConfigurationEvent` | `MarketplaceConfigurationMessageComposer` |
| `MarketplaceOffersComposer` | 680 | `MarketPlaceOffersEvent` | `MarketPlaceOffersMessageComposer` |
| `MarketplaceOwnItemsComposer` | 3884 | `MarketPlaceOwnOffersEvent` | `MarketPlaceOwnOffersMessageComposer` |
| `MarketplaceItemInfoComposer` | 725 | `MarketplaceItemStatsEvent` | `MarketplaceItemStatsMessageComposer` |
| `MarketplaceItemPostedComposer` | 1359 | `MarketplaceMakeOfferResult` | `MarketplaceMakeOfferResultMessageComposer` |
| `MarketplaceBuyErrorComposer` | 2032 | `MarketplaceBuyOfferResultEvent` | `MarketplaceBuyOfferResultMessageComposer` |
| `MarketplaceCancelSaleComposer` | 3264 | `MarketplaceCancelOfferResultEvent` | `MarketplaceCancelOfferResultMessageComposer` |
| `MarketplaceSellItemComposer` | 54 | `MarketplaceCanMakeOfferResult` | `MarketplaceCanMakeOfferResultMessageComposer` |

### Navigator (12 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `NewNavigatorMetaDataComposer` | 3052 | `NavigatorMetaDataEvent` | `NavigatorMetaDataMessageComposer` |
| `NewNavigatorSearchResultsComposer` | 2690 | `NavigatorSearchResultBlocksEvent` | `NavigatorSearchResultBlocksMessageComposer` |
| `NewNavigatorSettingsComposer` | 518 | `NewNavigatorPreferencesEvent` | `NewNavigatorPreferencesMessageComposer` |
| `NewNavigatorCollapsedCategoriesComposer` | 1543 | `CollapsedCategoriesEvent` | `CollapsedCategoriesMessageComposer` |
| `NewNavigatorSavedSearchesComposer` | 3984 | `NavigatorSavedSearchesEvent` | `NavigatorSavedSearchesMessageComposer` |
| `NewNavigatorLiftedRoomsComposer` | 3104 | `NavigatorLiftedRoomsEvent` | `NavigatorLiftedRoomsMessageComposer` |
| `NewNavigatorEventCategoriesComposer` | 3244 | `UserEventCatsEvent` | `UserEventCatsMessageComposer` |
| `NewNavigatorCategoryUserCountComposer` | 1455 | `CategoriesWithVisitorCountEvent` | `CategoriesWithVisitorCountMessageComposer` |
| `CanCreateRoomComposer` | 378 | `CanCreateRoomEvent` | `CanCreateRoomMessageComposer` |
| `CanCreateEventComposer` | 2599 | `CanCreateRoomEventEvent` | `CanCreateRoomEventMessageComposer` |
| `PromoteOwnRoomsListComposer` | 2468 | `RoomAdPurchaseInfoEvent` | `RoomAdPurchaseInfoMessageComposer` |
| `RemoveRoomEventComposer` | 3479 | `RoomEventCancelEvent` | `RoomEventCancelMessageComposer` |

### HotelView (12 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `HotelViewComposer` | 122 | `CloseConnectionMessageEvent` | `CloseConnectionMessageComposer` |
| `HotelViewDataComposer` | 1745 | `CurrentTimingCodeMessageEvent` | `CurrentTimingCodeMessageComposer` |
| `HotelViewCommunityGoalComposer` | 2525 | `CommunityGoalProgressMessageEvent` | `CommunityGoalProgressMessageComposer` |
| `HotelViewConcurrentUsersComposer` | 2737 | `ConcurrentUsersGoalProgressMessageEvent` | `ConcurrentUsersGoalProgressMessageComposer` |
| `HotelViewBadgeButtonConfigComposer` | 2998 | `IsBadgeRequestFulfilledEvent` | `IsBadgeRequestFulfilledMessageComposer` |
| `HotelViewCatalogPageExpiringComposer` | 690 | `CatalogPageExpirationEvent` | `CatalogPageExpirationMessageComposer` |
| `HotelViewNextLTDAvailableComposer` | 44 | `LimitedOfferAppearingNextMessageEvent` | `LimitedOfferAppearingNextMessageComposer` |
| `HotelViewSecondsUntilComposer` | 3926 | `SecondsUntilMessageEvent` | `SecondsUntilMessageComposer` |
| `BonusRareComposer` | 1533 | `BonusRareInfoMessageEvent` | `BonusRareInfoMessageComposer` |
| `HallOfFameComposer` | 3005 | `CommunityGoalHallOfFameMessageEvent` | `CommunityGoalHallOfFameMessageComposer` |
| `NewsWidgetsComposer` | 286 | `PromoArticlesMessageEvent` | `PromoArticlesMessageComposer` |
| `HotelViewExpiringCatalogPageCommposer` | 2515 | `CatalogPageWithEarliestExpiryMessageEvent` | `CatalogPageWithEarliestExpiryMessageComposer` |

### Wired (6 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `WiredTriggerDataComposer` | 383 | `WiredTriggerDataEvent` | `WiredTriggerDataMessageComposer` |
| `WiredEffectDataComposer` | 1434 | `WiredEffectDataEvent` | `WiredEffectDataMessageComposer` |
| `WiredConditionDataComposer` | 1108 | `WiredConditionDataEvent` | `WiredConditionDataMessageComposer` |
| `WiredSavedComposer` | 1155 | `WiredSavedEvent` | `WiredSavedMessageComposer` |
| `WiredRewardAlertComposer` | 178 | `WiredRewardResultMessageEvent` | `WiredRewardResultMessageComposer` |
| `WiredOpenComposer` | 1830 | `OpenEvent` | `OpenMessageComposer` |

### Polls (5 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `PollStartComposer` | 3785 | `PollOfferEvent` | `PollOfferMessageComposer` |
| `PollQuestionsComposer` | 2997 | `PollContentsEvent` | `PollContentsMessageComposer` |
| `SimplePollStartComposer` | 2665 | `QuestionEvent` | `QuestionMessageComposer` |
| `SimplePollAnswerComposer` | 2589 | `QuestionAnsweredEvent` | `QuestionAnsweredMessageComposer` |
| `SimplePollAnswersComposer` | 1066 | `QuestionFinishedEvent` | `QuestionFinishedMessageComposer` |

### Trading (9 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `TradeStartComposer` | 2505 | `TradingOpenEvent` | `TradingOpenMessageComposer` |
| `TradeCloseWindowComposer` | 1001 | `TradingCompletedEvent` | `TradingCompletedMessageComposer` |
| `TradeStoppedComposer` | 1373 | `TradingCloseEvent` | `TradingCloseMessageComposer` |
| `TradeStartFailComposer` | 217 | `TradingOpenFailedEvent` | `TradingOpenFailedMessageComposer` |
| `TradeAcceptedComposer` | 2568 | `TradingAcceptEvent` | `TradingAcceptMessageComposer` |
| `TradeUpdateComposer` | 2024 | `TradingItemListEvent` | `TradingItemListMessageComposer` |
| `TradingWaitingConfirmComposer` | 2720 | `TradingConfirmationEvent` | `TradingConfirmationMessageComposer` |
| `OtherTradingDisabledComposer` | 1254 | `TradingOtherNotAllowedEvent` | `TradingOtherNotAllowedMessageComposer` |
| `YouTradingDisabledComposer` | 3058 | `TradingYouAreNotAllowedEvent` | `TradingYouAreNotAllowedMessageComposer` |

### Achievements (4 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `AchievementListComposer` | 305 | `AchievementsEvent` | `AchievementsMessageComposer` |
| `AchievementProgressComposer` | 2107 | `AchievementEvent` | `AchievementMessageComposer` |
| `AchievementUnlockedComposer` | 806 | `HabboAchievementNotificationMessageEvent` | `HabboAchievementNotificationMessageComposer` |
| `AchievementsConfigurationComposer` | 1689 | `GameAchievementsMessageEvent` | `GameAchievementsMessageComposer` |

### Talent Track (4 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `TalentTrackComposer` | 3406 | `TalentTrackMessageEvent` | `TalentTrackMessageComposer` |
| `TalentLevelUpdateComposer` | 638 | `TalentLevelUpEvent` | `TalentLevelUpMessageComposer` |
| `TalentTrackEmailVerifiedComposer` | 612 | `EmailStatusResultEvent` | `EmailStatusResultMessageComposer` |
| `TalentTrackEmailFailedComposer` | 1815 | `ChangeEmailResultEvent` | `ChangeEmailResultMessageComposer` |

### Guilds (17 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `GuildListComposer` | 420 | `GuildMembershipsMessageEvent` | `GuildMembershipsMessageComposer` |
| `GuildInfoComposer` | 1702 | `HabboGroupDetailsMessageEvent` | `HabboGroupDetailsMessageComposer` |
| `GuildMembersComposer` | 1200 | `GuildMembersEvent` | `GuildMembersMessageComposer` |
| `GuildMemberUpdateComposer` | 265 | `GuildMembershipUpdatedMessageEvent` | `GuildMembershipUpdatedMessageComposer` |
| `GuildManageComposer` | 3965 | `GuildEditInfoMessageEvent` | `GuildEditInfoMessageComposer` |
| `GuildPartsComposer` | 2238 | `GuildEditorDataMessageEvent` | `GuildEditorDataMessageComposer` |
| `GuildBoughtComposer` | 2808 | `GuildCreatedMessageEvent` | `GuildCreatedMessageComposer` |
| `GuildBuyRoomsComposer` | 2159 | `GuildCreationInfoMessageEvent` | `GuildCreationInfoMessageComposer` |
| `GuildJoinErrorComposer` | 762 | `HabboGroupJoinFailedMessageEvent` | `HabboGroupJoinFailedMessageComposer` |
| `GuildAcceptMemberErrorComposer` | 818 | `GuildMemberMgmtFailedMessageEvent` | `GuildMemberMgmtFailedMessageComposer` |
| `GuildConfirmRemoveMemberComposer` | 1876 | `GuildMemberFurniCountInHQMessageEvent` | `GuildMemberFurniCountInHQMessageComposer` |
| `GuildEditFailComposer` | 3988 | `GuildEditFailedMessageEvent` | `GuildEditFailedMessageComposer` |
| `GuildFavoriteRoomUserUpdateComposer` | 3403 | `FavoriteMembershipUpdateMessageEvent` | `FavoriteMembershipUpdateMessageComposer` |
| `GuildRefreshMembersListComposer` | 2445 | `GuildMembershipRejectedMessageEvent` | `GuildMembershipRejectedMessageComposer` |
| `RemoveGuildFromRoomComposer` | 3129 | `HabboGroupDeactivatedMessageEvent` | `HabboGroupDeactivatedMessageComposer` |
| `GuildFurniWidgetComposer` | 3293 | `GuildFurniContextMenuInfoMessageEvent` | `GuildFurniContextMenuInfoMessageComposer` |
| `GuildMembershipRequestedComposer` | 1180 | `GroupMembershipRequestedMessageEvent` | `GroupMembershipRequestedMessageComposer` |

### Guild Forums (9 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `GuildForumListComposer` | 3001 | `ForumsListMessageEvent` | `ForumsListMessageComposer` |
| `GuildForumDataComposer` | 3011 | `ForumDataMessageEvent` | `ForumDataMessageComposer` |
| `GuildForumThreadsComposer` | 1073 | `GuildForumThreadsEvent` | `GuildForumThreadsMessageComposer` |
| `GuildForumThreadMessagesComposer` | 1862 | `PostThreadMessageEvent` | `PostThreadMessageMessageComposer` |
| `GuildForumCommentsComposer` | 509 | `ThreadMessagesMessageEvent` | `ThreadMessagesMessageComposer` |
| `GuildForumAddCommentComposer` | 2049 | `PostMessageMessageEvent` | `PostMessageMessageComposer` |
| `GuildForumsUnreadMessagesCountComposer` | 2379 | `UnreadForumsCountMessageEvent` | `UnreadForumsCountMessageComposer` |
| `PostUpdateMessageComposer` | 324 | `UpdateMessageMessageEvent` | `UpdateMessageMessageComposer` |
| `ThreadUpdateMessageComposer` | 2528 | `UpdateThreadMessageEvent` | `UpdateThreadMessageComposer` |

### Guides (11 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `GuideSessionAttachedComposer` | 1591 | `GuideSessionAttachedMessageEvent` | `GuideSessionAttachedMessageComposer` |
| `GuideSessionDetachedComposer` | 138 | `GuideSessionDetachedMessageEvent` | `GuideSessionDetachedMessageComposer` |
| `GuideSessionStartedComposer` | 3209 | `GuideSessionStartedMessageEvent` | `GuideSessionStartedMessageComposer` |
| `GuideSessionEndedComposer` | 1456 | `GuideSessionEndedMessageEvent` | `GuideSessionEndedMessageComposer` |
| `GuideSessionErrorComposer` | 673 | `GuideSessionErrorMessageEvent` | `GuideSessionErrorMessageComposer` |
| `GuideSessionMessageComposer` | 841 | `GuideSessionMessageMessageEvent` | `GuideSessionMessageMessageComposer` |
| `GuideSessionRequesterRoomComposer` | 1847 | `GuideSessionRequesterRoomMessageEvent` | `GuideSessionRequesterRoomMessageComposer` |
| `GuideSessionInvitedToGuideRoomComposer` | 219 | `GuideSessionInvitedToGuideRoomMessageEvent` | `GuideSessionInvitedToGuideRoomMessageComposer` |
| `GuideSessionPartnerIsTypingComposer` | 1016 | `GuideSessionPartnerIsTypingMessageEvent` | `GuideSessionPartnerIsTypingMessageComposer` |
| `GuideSessionPartnerIsPlayingComposer` | 448 | `YouArePlayingGameMessageEvent` | `YouArePlayingGameMessageComposer` |
| `GuideToolsComposer` | 1548 | `GuideOnDutyStatusMessageEvent` | `GuideOnDutyStatusMessageComposer` |

### Guardians (5 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `GuardianNewReportReceivedComposer` | 735 | `ChatReviewSessionOfferedToGuideMessageEvent` | `ChatReviewSessionOfferedToGuideMessageComposer` |
| `GuardianVotingRequestedComposer` | 143 | `ChatReviewSessionStartedMessageEvent` | `ChatReviewSessionStartedMessageComposer` |
| `GuardianVotingVotesComposer` | 1829 | `ChatReviewSessionVotingStatusMessageEvent` | `ChatReviewSessionVotingStatusMessageComposer` |
| `GuardianVotingResultComposer` | 3276 | `ChatReviewSessionResultsMessageEvent` | `ChatReviewSessionResultsMessageComposer` |
| `GuardianVotingTimeEnded` | 30 | `ChatReviewSessionDetachedMessageEvent` | `ChatReviewSessionDetachedMessageComposer` |

### HabboWay/NUX (4 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `NuxAlertComposer` | 2023 | `InClientLinkMessageEvent` | `InClientLinkMessageComposer` |
| `NewUserGiftComposer` | 3575 | `NewUserExperienceGiftOfferEvent` | `NewUserExperienceGiftOfferMessageComposer` |
| `NewUserIdentityComposer` | 3738 | `NoobnessLevelMessageEvent` | `NoobnessLevelMessageComposer` |
| `VipTutorialsStartComposer` | 2278 | `CitizenshipVipOfferPromoEnabledEvent` | `CitizenshipVipOfferPromoEnabledMessageComposer` |

### Events/Calendar (2 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `AdventCalendarDataComposer` | 2531 | `CampaignCalendarDataMessageEvent` | `CampaignCalendarDataMessageComposer` |
| `AdventCalendarProductComposer` | 2551 | `CampaignCalendarDoorOpenedMessageEvent` | `CampaignCalendarDoorOpenedMessageComposer` |

### Generic/Alerts (19 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `GenericAlertComposer` | 3801 | `HabboBroadcastMessageEvent` | `HabboBroadcastMessageComposer` |
| `BubbleAlertComposer` | 1992 | `NotificationDialogMessageEvent` | `NotificationDialogMessageComposer` |
| `CustomNotificationComposer` | 909 | `CustomUserNotificationMessageEvent` | `CustomUserNotificationMessageComposer` |
| `GenericErrorMessages` | 1600 | `GenericErrorEvent` | `GenericErrorMessageComposer` |
| `HotelClosedAndOpensComposer` | 3728 | `HotelClosedAndOpensEvent` | `HotelClosedAndOpensMessageComposer` |
| `HotelClosesAndWillOpenAtComposer` | 2771 | `HotelClosesAndWillOpenAtEvent` | `HotelClosesAndWillOpenAtMessageComposer` |
| `HotelWillCloseInMinutesComposer` | 1050 | `HotelWillCloseInMinutesEvent` | `HotelWillCloseInMinutesMessageComposer` |
| `HotelWillCloseInMinutesAndBackInComposer` | 1350 | `MaintenanceStatusMessageEvent` | `MaintenanceStatusMessageComposer` |
| `StaffAlertAndOpenHabboWayComposer` | 1683 | `UserBannedMessageEvent` | `UserBannedMessageComposer` |
| `StaffAlertWithLinkComposer` | 2030 | `ModeratorMessageEvent` | `ModeratorMessageComposer` |
| `StaffAlertWIthLinkAndOpenHabboWayComposer` | 1890 | `ModeratorCautionEvent` | `ModeratorCautionMessageComposer` |
| `UpdateFailedComposer` | 156 | `WiredValidationErrorEvent` | `WiredValidationErrorMessageComposer` |
| `PickMonthlyClubGiftNotificationComposer` | 2188 | `ClubGiftNotificationEvent` | `ClubGiftNotificationMessageComposer` |
| `MinimailCountComposer` | 2803 | `MiniMailUnreadCountEvent` | `MiniMailUnreadCountMessageComposer` |
| `MessagesForYouComposer` | 2035 | `MOTDNotificationEvent` | `MOTDNotificationMessageComposer` |
| `PetErrorComposer` | 2913 | `PetPlacingErrorEvent` | `PetPlacingErrorMessageComposer` |
| `BotErrorComposer` | 639 | `BotErrorEvent` | `BotErrorMessageComposer` |
| `EpicPopupFrameComposer` | 3945 | `EpicPopupMessageEvent` | `EpicPopupMessageComposer` |
| `MostUselessErrorAlertComposer` | 662 | `PollErrorEvent` | `PollErrorMessageComposer` |

### Crafting (4 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `CraftableProductsComposer` | 1000 | `CraftableProductsEvent` | `CraftableProductsMessageComposer` |
| `CraftingRecipeComposer` | 2774 | `CraftingRecipeEvent` | `CraftingRecipeMessageComposer` |
| `CraftingResultComposer` | 618 | `CraftingResultEvent` | `CraftingResultMessageComposer` |
| `CraftingComposerFour` | 2124 | `CraftingRecipesAvailableEvent` | `CraftingRecipesAvailableMessageComposer` |

### Camera (6 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `CameraCompetitionStatusComposer` | 133 | `CompetitionStatusMessageEvent` | `CompetitionStatusMessageComposer` |
| `CameraPriceComposer` | 3878 | `InitCameraMessageEvent` | `InitCameraMessageComposer` |
| `CameraPublishWaitMessageComposer` | 2057 | `CameraPublishStatusMessageEvent` | `CameraPublishStatusMessageComposer` |
| `CameraPurchaseSuccesfullComposer` | 2783 | `CameraPurchaseOKMessageEvent` | `CameraPurchaseOKMessageComposer` |
| `CameraRoomThumbnailSavedComposer` | 3595 | `ThumbnailStatusMessageEvent` | `ThumbnailStatusMessageComposer` |
| `CameraURLComposer` | 3696 | `CameraStorageUrlMessageEvent` | `CameraStorageUrlMessageComposer` |

### MysteryBox (2 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `MysteryBoxKeysComposer` | 2833 | `MysteryBoxKeysMessageEvent` | `MysteryBoxKeysMessageComposer` |
| `MysticBoxPrizeComposer` | 3712 | `GotMysteryBoxPrizeMessageEvent` | `GotMysteryBoxPrizeMessageComposer` |

### GameCenter (13 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `GameCenterAccountInfoComposer` | 2893 | `Game2AccountGameStatusMessageEvent` | `Game2AccountGameStatusMessageComposer` |
| `GameCenterGameListComposer` | 222 | `GameListMessageEvent` | `GameListMessageComposer` |
| `GameCenterGameComposer` | 3805 | `GameStatusMessageEvent` | `GameStatusMessageComposer` |
| `GameCenterFeaturedPlayersComposer` | 3097 | `WeeklyGameRewardWinnersEvent` | `WeeklyGameRewardWinnersMessageComposer` |
| `BaseJumpJoinQueueComposer` | 2260 | `JoinedQueueMessageEvent` | `JoinedQueueMessageComposer` |
| `BaseJumpLeaveQueueComposer` | 1477 | `LeftQueueMessageEvent` | `LeftQueueMessageComposer` |
| `BaseJumpLoadGameComposer` | 3654 | `LoadGameMessageEvent` | `LoadGameMessageMessageComposer` |
| `BaseJumpLoadGameURLComposer` | 2624 | `LoadGameUrlMessageEvent` | `LoadGameUrlMessageComposer` |
| `BaseJumpUnloadGameComposer` | 1715 | `UnloadGameMessageEvent` | `UnloadGameMessageComposer` |
| `Game2WeeklyLeaderboardComposer` | 2196 | `Game2WeeklyLeaderboardEvent` | `Game2WeeklyLeaderboardMessageComposer` |
| `Game2WeeklySmallLeaderboardComposer` | 3512 | `WeeklyCompetitiveLeaderboardEvent` | `WeeklyCompetitiveLeaderboardMessageComposer` |
| `UnknowComposer_1390` | 2270 | `Game2WeeklyFriendsLeaderboardEvent` | `Game2WeeklyFriendsLeaderboardMessageComposer` |
| `GameAchievementsListComposer` | 2265 | `UserGameAchievementsMessageEvent` | `UserGameAchievementsMessageComposer` |

### ModTool (17 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `ModToolUserInfoComposer` | 2866 | `ModeratorUserInfoEvent` | `ModeratorUserInfoMessageComposer` |
| `ModToolRoomChatlogComposer` | 3434 | `RoomChatlogEvent` | `RoomChatlogMessageComposer` |
| `ModToolUserChatlogComposer` | 3377 | `UserChatlogEvent` | `UserChatlogMessageComposer` |
| `ModToolRoomInfoComposer` | 1333 | `ModeratorRoomInfoEvent` | `ModeratorRoomInfoMessageComposer` |
| `ModToolIssueInfoComposer` | 3609 | `IssueInfoMessageEvent` | `IssueInfoMessageComposer` |
| `ModToolIssueChatlogComposer` | 607 | `CfhChatlogEvent` | `CfhChatlogMessageComposer` |
| `ModToolSanctionInfoComposer` | 2221 | `SanctionStatusEvent` | `SanctionStatusMessageComposer` |
| `ModToolSanctionDataComposer` | 2782 | `CfhSanctionMessageEvent` | `CfhSanctionMessageComposer` |
| `ModToolIssueHandledComposer` | 934 | `IssueCloseNotificationMessageEvent` | `IssueCloseNotificationMessageComposer` |
| `ModToolIssueUpdateComposer` | 3150 | `IssuePickFailedMessageEvent` | `IssuePickFailedMessageComposer` |
| `ModToolIssueResponseAlertComposer` | 3796 | `CallForHelpReplyMessageEvent` | `CallForHelpReplyMessageComposer` |
| `ModToolReportReceivedAlertComposer` | 3635 | `CallForHelpResultMessageEvent` | `CallForHelpResultMessageComposer` |
| `ModToolComposer` | 2696 | `ModeratorInitMessageEvent` | `ModeratorInitMessageComposer` |
| `ModToolComposerOne` | 3192 | `IssueDeletedMessageEvent` | `IssueDeletedMessageComposer` |
| `ModToolComposerTwo` | 2335 | `ModeratorActionResultMessageEvent` | `ModeratorActionResultMessageComposer` |
| `ModToolIssueHandlerDimensionsComposer` | 1576 | `ModeratorToolPreferencesEvent` | `ModeratorToolPreferencesMessageComposer` |
| `CfhTopicsMessageComposer` | 325 | `CfhTopicsInitEvent` | `CfhTopicsInitMessageComposer` |

### Quests (7 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `QuestsComposer` | 3625 | `QuestsMessageEvent` | `QuestsMessageComposer` |
| `QuestComposer` | 230 | `QuestMessageEvent` | `QuestMessageComposer` |
| `QuestCompletedComposer` | 949 | `QuestCompletedMessageEvent` | `QuestCompletedMessageComposer` |
| `QuestExpiredComposer` | 3027 | `QuestCancelledMessageEvent` | `QuestCancelledMessageComposer` |
| `DailyQuestComposer` | 1878 | `QuestDailyMessageEvent` | `QuestDailyMessageComposer` |
| `IsFirstLoginOfDayComposer` | 793 | `IsFirstLoginOfDayEvent` | `IsFirstLoginOfDayMessageComposer` |
| `UnknownQuestComposer3` | 1122 | `SeasonalQuestsMessageEvent` | `SeasonalQuestsMessageComposer` |

### Verification/Gifts (6 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `VerifyMobilePhoneWindowComposer` | 2890 | `PhoneCollectionStateMessageEvent` | `PhoneCollectionStateMessageComposer` |
| `VerifyMobilePhoneCodeWindowComposer` | 800 | `TryPhoneNumberResultMessageEvent` | `TryPhoneNumberResultMessageComposer` |
| `VerifyMobilePhoneDoneComposer` | 91 | `TryVerificationCodeResultMessageEvent` | `TryVerificationCodeResultMessageComposer` |
| `VerifyMobileNumberComposer` | 3639 | `NewUserExperienceNotCompleteEvent` | `NewUserExperienceNotCompleteMessageComposer` |
| `WelcomeGiftComposer` | 2707 | `WelcomeGiftStatusEvent` | `WelcomeGiftStatusMessageComposer` |
| `WelcomeGiftErrorComposer` | 2293 | `WelcomeGiftChangeEmailResultEvent` | `WelcomeGiftChangeEmailResultMessageComposer` |

### Jukebox (8 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `JukeBoxPlayListComposer` | 34 | `JukeboxSongDisksMessageEvent` | `JukeboxSongDisksMessageComposer` |
| `JukeBoxNowPlayingMessageComposer` | 469 | `NowPlayingMessageEvent` | `NowPlayingMessageComposer` |
| `JukeBoxPlaylistFullComposer` | 105 | `JukeboxPlayListFullMessageEvent` | `JukeboxPlayListFullMessageComposer` |
| `JukeBoxPlayListUpdatedComposer` | 1748 | `PlayListMessageEvent` | `PlayListMessageComposer` |
| `JukeBoxPlayListAddSongComposer` | 1140 | `PlayListSongAddedMessageEvent` | `PlayListSongAddedMessageComposer` |
| `JukeBoxMySongsComposer` | 2602 | `UserSongDisksInventoryMessageEvent` | `UserSongDisksInventoryMessageComposer` |
| `JukeBoxTrackDataComposer` | 3365 | `TraxSongInfoMessageEvent` | `TraxSongInfoMessageComposer` |
| `JukeBoxTrackCodeComposer` | 1381 | `OfficialSongIdMessageEvent` | `OfficialSongIdMessageComposer` |

### Youtube (3 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `YoutubeDisplayListComposer` | 1112 | `YoutubeDisplayPlaylistsEvent` | `YoutubeDisplayPlaylistsMessageComposer` |
| `YoutubeMessageComposer2` | 1411 | `YoutubeDisplayVideoMessageEvent` | `YoutubeDisplayVideoMessageComposer` |
| `YoutubeMessageComposer3` | 1554 | `YoutubeControlVideoMessageEvent` | `YoutubeControlVideoMessageComposer` |

### LoveLock (3 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `LoveLockFurniStartComposer` | 3753 | `FriendFurniStartConfirmationMessageEvent` | `FriendFurniStartConfirmationMessageComposer` |
| `LoveLockFurniFriendConfirmedComposer` | 382 | `FriendFurniOtherLockConfirmedMessageEvent` | `FriendFurniOtherLockConfirmedMessageComposer` |
| `LoveLockFurniFinishedComposer` | 770 | `FriendFurniCancelLockMessageEvent` | `FriendFurniCancelLockMessageComposer` |

### Misc/Other (44 files)
| Old Name | Packet ID | Client Event | New Name |
|----------|-----------|--------------|----------|
| `IgnoredUsersComposer` | 126 | `IgnoredUsersMessageEvent` | `IgnoredUsersMessageComposer` |
| `UserClassificationComposer` | 966 | `UserClassificationMessageEvent` | `UserClassificationMessageComposer` |
| `HabboMallComposer` | 1237 | `TargetedOfferNotFoundEvent` | `TargetedOfferNotFoundMessageComposer` |
| `ErrorLoginComposer` | 4000 | `DisconnectReasonEvent` | `DisconnectReasonMessageComposer` |
| `CloseWebPageComposer` | 426 | `RestoreClientMessageEvent` | `RestoreClientMessageComposer` |
| `UnknownStatusComposer` | 1243 | `AccountSafetyLockStatusChangeMessageEvent` | `AccountSafetyLockStatusChangeMessageComposer` |
| `UnknownHintComposer` | 1787 | `ElementPointerMessageEvent` | `ElementPointerMessageComposer` |
| `UnknownGuild2Composer` | 1459 | `GroupDetailsChangedMessageEvent` | `GroupDetailsChangedMessageComposer` |
| `UnknownGuildComposer3` | 876 | `ExtendedProfileChangedMessageEvent` | `ExtendedProfileChangedMessageComposer` |
| `UnknownMessengerErrorComposer` | 3359 | `InstantMessageErrorEvent` | `InstantMessageErrorMessageComposer` |
| `UnknownRoomViewerComposer` | 3523 | `IdentityAccountsEvent` | `IdentityAccountsMessageComposer` |
| `UnknownRoomDesktopComposer` | 69 | `BotSkillListUpdateEvent` | `BotSkillListUpdateMessageComposer` |
| `UnknownFurniModelComposer` | 1501 | `PostItPlacedEvent` | `PostItPlacedMessageComposer` |
| `UnknownAdManagerComposer` | 1808 | `InterstitialMessageEvent` | `InterstitialMessageComposer` |
| `UnknownCatalogPageOfferComposer` | 1889 | `SeasonalCalendarDailyOfferMessageEvent` | `SeasonalCalendarDailyOfferMessageComposer` |
| `UnknownHabboWayQuizComposer` | 2772 | `QuizResultsMessageEvent` | `QuizResultsMessageComposer` |
| `UnknownHelperComposer` | 77 | `CallForHelpPendingCallsDeletedMessageEvent` | `CallForHelpPendingCallsDeletedMessageComposer` |
| `UnknownCompetitionComposer` | 3506 | `CompetitionVotingInfoMessageEvent` | `CompetitionVotingInfoMessageComposer` |
| `RentableSpaceInfoComposer` | 3559 | `RentableSpaceStatusMessageEvent` | `RentableSpaceStatusMessageComposer` |
| `RentableSpaceUnknownComposer` | 2046 | `RentableSpaceRentOkMessageEvent` | `RentableSpaceRentOkMessageComposer` |
| `RentableSpaceUnknown2Composer` | 1868 | `RentableSpaceRentFailedMessageEvent` | `RentableSpaceRentFailedMessageComposer` |
| `RentableItemBuyOutPriceComposer` | 35 | `FurniRentOrBuyoutOfferMessageEvent` | `FurniRentOrBuyoutOfferMessageComposer` |
| `BuildersClubExpiredComposer` | 1452 | `BuildersClubSubscriptionStatusMessageEvent` | `BuildersClubSubscriptionStatusMessageComposer` |
| `ExtendClubMessageComposer` | 3964 | `HabboClubExtendOfferMessageEvent` | `HabboClubExtendOfferMessageComposer` |
| `CompetitionEntrySubmitResultComposer` | 1177 | `CompetitionEntrySubmitResultEvent` | `CompetitionEntrySubmitResultMessageComposer` |
| `SubmitCompetitionRoomComposer` | 3841 | `IsUserPartOfCompetitionMessageEvent` | `IsUserPartOfCompetitionMessageComposer` |
| `RoomCategoryUpdateMessageComposer` | 3896 | `ShowEnforceRoomCategoryDialogEvent` | `ShowEnforceRoomCategoryDialogMessageComposer` |
| `RoomEventMessageComposer` | 1840 | `RoomEventEvent` | `RoomEventMessageComposer` |
| `RoomMessagesPostedCountComposer` | 1634 | `RoomMessageNotificationMessageEvent` | `RoomMessageNotificationMessageComposer` |
| `RoomQueueStatusMessage` | 2208 | `RoomQueueStatusMessageEvent` | `RoomQueueStatusMessageComposer` |
| `RoomUnknown3Composer` | 1033 | `YouAreSpectatorMessageEvent` | `YouAreSpectatorMessageComposer` |
| `RoomAdErrorComposer` | 1759 | `RoomAdErrorEvent` | `RoomAdErrorMessageComposer` |
| `OpenRoomCreationWindowComposer` | 2064 | `NoOwnedRoomsAlertMessageEvent` | `NoOwnedRoomsAlertMessageComposer` |
| `ReportRoomFormComposer` | 1121 | `CallForHelpPendingCallsMessageEvent` | `CallForHelpPendingCallsMessageComposer` |
| `HelperRequestDisabledComposer` | 1651 | `CallForHelpDisabledNotifyMessageEvent` | `CallForHelpDisabledNotifyMessageComposer` |
| `BullyReportRequestComposer` | 3463 | `GuideReportingStatusMessageEvent` | `GuideReportingStatusMessageComposer` |
| `BullyReportedMessageComposer` | 3285 | `GuideTicketCreationResultMessageEvent` | `GuideTicketCreationResultMessageComposer` |
| `BullyReportClosedComposer` | 2674 | `GuideTicketResolutionMessageEvent` | `GuideTicketResolutionMessageComposer` |
| `NewYearResolutionComposer` | 66 | `AchievementResolutionsMessageEvent` | `AchievementResolutionsMessageComposer` |
| `NewYearResolutionProgressComposer` | 3370 | `AchievementResolutionProgressMessageEvent` | `AchievementResolutionProgressMessageComposer` |
| `NewYearResolutionCompletedComposer` | 740 | `AchievementResolutionCompletedMessageEvent` | `AchievementResolutionCompletedMessageComposer` |
| `WatchAndEarnRewardComposer` | 2125 | `OfferRewardDeliveredMessageEvent` | `OfferRewardDeliveredMessageComposer` |
| `LeprechaunStarterBundleComposer` | 2380 | `OpenPetPackageRequestedMessageEvent` | `OpenPetPackageRequestedMessageComposer` |
| `MinimailNewMessageComposer` | 1911 | `MiniMailNewMessageEvent` | `MiniMailNewMessageMessageComposer` |
| `BotSettingsComposer` | 1618 | `BotCommandConfigurationEvent` | `BotCommandConfigurationMessageComposer` |
| `BotForceOpenContextMenuComposer` | 296 | `BotForceOpenContextMenuEvent` | `BotForceOpenContextMenuMessageComposer` |
| `ItemStateComposer2` | 3431 | `DiceValueMessageEvent` | `DiceValueMessageComposer` |
| `FloorPlanEditorDoorSettingsComposer` | 1664 | `RoomEntryTileMessageEvent` | `RoomEntryTileMessageComposer` |
| `FloorPlanEditorBlockedTilesComposer` | 3990 | `RoomOccupiedTilesMessageEvent` | `RoomOccupiedTilesMessageComposer` |
| `UnknownComposer_100` | 1553 | `PetBreedingResultEvent` | `PetBreedingResultMessageComposer` |
| `UnknownComposer_1111` | 1551 | `FaqSearchResultsMessageEvent` | `FaqSearchResultsMessageComposer` |
| `UnknownComposer_1165` | 904 | `GameInviteMessageEvent` | `GameInviteMessageComposer` |
| `UnknownComposer_137` | 2897 | `RoomSettingsErrorEvent` | `RoomSettingsErrorMessageComposer` |
| `UnknownComposer_152` | 3954 | `CompetitionRoomsDataMessageEvent` | `CompetitionRoomsDataMessageComposer` |
| `UnknownComposer_1577` | 2641 | `WeeklyGameRewardEvent` | `WeeklyGameRewardMessageComposer` |
| `UnknownComposer_1741` | 2246 | `Game2GameDirectoryStatusMessageEvent` | `Game2GameDirectoryStatusMessageComposer` |
| `UnknownComposer_1744` | 2873 | `TradingNoSuchItemEvent` | `TradingNoSuchItemMessageComposer` |
| `UnknownComposer_1965` | 3292 | `FaqTextMessageEvent` | `FaqTextMessageComposer` |
| `UnknownComposer_2563` | 1774 | `UseObjectMessageEvent` | `UseObjectMessageComposer` |
| `UnknownComposer_2601` | 1663 | `HotelMergeNameChangeEvent` | `HotelMergeNameChangeMessageComposer` |
| `UnknownComposer_2621` | 1927 | `RoomThumbnailUpdateResultEvent` | `RoomThumbnailUpdateResultMessageComposer` |
| `UnknownComposer_2698` | 563 | `CheckUserNameResultMessageEvent` | `CheckUserNameResultMessageComposer` |
| `UnknownComposer8` | 3441 | `PetSupplementedNotificationEvent` | `PetSupplementedNotificationMessageComposer` |
| `HabboWayQuizComposer2` | 2927 | `QuizDataMessageEvent` | `QuizDataMessageComposer` |
| `UnknownAvatarEditorComposer` | 3473 | `AvatarEffectSelectedMessageEvent` | `AvatarEffectSelectedMessageComposer` |
| `PetBreedingCompleted` | 2527 | `NestBreedingSuccessEvent` | `NestBreedingSuccessMessageComposer` |

---

## Packets NOT Being Renamed (47 total)

### No Valid Packet ID (-1) — 10 files
| Name | Packet ID | Reason |
|------|-----------|--------|
| `PublicRoomsComposer` | -1 | No valid packet ID, marked `//error 404` |
| `RemoveFriendComposer` | -1 | No valid packet ID, marked `//error 404` |
| `RoomEntryInfoComposer` | -1 | No valid packet ID |
| `UserBCLimitsComposer` | -1 | No valid packet ID |
| `QuestionInfoComposer` | -1 | No valid packet ID |
| `UnknownGuildForumComposer6` | -1 | No valid packet ID |
| `UnknownGuildForumComposer7` | -1 | No valid packet ID |
| `RoomUserQuestionAnsweredComposer` | -1 | No valid packet ID |
| `HotelViewCustomTimerComposer` | -1 | No valid packet ID |
| `InventoryAddEffectComposer` | -1 | No valid packet ID |

### Server-Only (Not in client's INCOMING_PACKETS) — 5 files
| Name | Packet ID | Reason |
|------|-----------|--------|
| `TradeCompleteComposer` | 2369 | Not registered in client's `INCOMING_PACKETS` |
| `TradeStoppedComposer` | 1373 | Not registered in client's `INCOMING_PACKETS` |
| `HabboWayQuizComposer1` | 3379 | Not registered in client's `INCOMING_PACKETS` |
| `FreezeLivesComposer` | 2324 | Not registered in client's `INCOMING_PACKETS` |
| `RoomFloorThicknessUpdatedComposer` | 3786 | Not registered in client's `INCOMING_PACKETS` |

### Obfuscated Client Names — 3 files
| Name | Packet ID | Reason |
|------|-----------|--------|
| `MysticBoxStartOpenComposer` | 3201 | Client event is obfuscated (`_Str_7564`) |
| `MysticBoxCloseComposer` | 596 | Client event is obfuscated (`_Str_7433`) |
| `UnknownComposer_1188` | 1437 | Client event is obfuscated (`_Str_17532`) |

### SnowStorm (5000+) — Custom Server Game Mode — 29 files
| Name | Packet ID | Reason |
|------|-----------|--------|
| `SnowStormGameStartedComposer` through `SnowStormUserRematchedComposer` | 5000-5029 | Custom server game mode, not in vanilla client |

---

## Summary

| Category | Count |
|----------|-------|
| **Total packets being renamed** | **~300+** |
| **Total packets NOT being renamed** | **47** |
| **Total Outgoing.java entries** | **~350+** |

## Execution Steps

For each rename:
1. Rename the `.java` file
2. Update the class name inside the file
3. Update the `Outgoing.java` enum entry
4. Update all `import` statements and usages across the codebase

No directory moves — files stay in their current locations.
