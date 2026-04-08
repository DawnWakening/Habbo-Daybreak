# Server Incoming Packet Rename Plan

## Objective
Rename all server incoming packet handlers (Events) to match the client's outgoing composer naming convention. The client is the source of truth.

## Naming Rule
**Server packet ID → Client outgoing composer → New server name**
- `Incoming.SecureLoginEvent = 2419` → `OUTGOING_PACKETS[2419] = SSOTicketMessageComposer` → `SSOTicketMessageEvent.java`

Simply replace "Composer" with "Event", keeping the full name including "Message".

---

## Complete Mapping (Confirmed 1:1 Only)

### Handshake
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `SecureLoginEvent` | 2419 | `SSOTicketMessageComposer` | `SSOTicketMessageEvent` |
| `InitDiffieHandshake` | 3110 | `InitDiffieHandshakeMessageComposer` | `InitDiffieHandshakeMessageEvent` |
| `CompleteDiffieHandshake` | 773 | `CompleteDiffieHandshakeMessageComposer` | `CompleteDiffieHandshakeMessageEvent` |
| `MachineIDEvent` | 2490 | `UniqueIDMessageComposer` | `UniqueIDMessageEvent` |
| `PongEvent` | 2596 | `PongMessageComposer` | `PongMessageEvent` |
| `PingEvent` | 295 | `LatencyPingRequestMessageComposer` | `LatencyPingRequestMessageEvent` |
| `ReleaseVersionEvent` | 4000 | `ClientHelloMessageComposer` | `ClientHelloMessageEvent` |
| `RequestResolutionEvent` | 359 | `GetResolutionAchievementsMessageComposer` | `GetResolutionAchievementsMessageEvent` |

### Users
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestUserDataEvent` | 357 | `InfoRetrieveMessageComposer` | `InfoRetrieveMessageEvent` |
| `RequestUserProfileEvent` | 3265 | `GetExtendedProfileMessageComposer` | `GetExtendedProfileMessageEvent` |
| `RequestUserCreditsEvent` | 273 | `GetCreditsInfoComposer` | `GetCreditsInfoEvent` |
| `RequestCreditsEvent` | 2650 | `RedeemMarketplaceOfferCreditsMessageComposer` | `RedeemMarketplaceOfferCreditsMessageEvent` |
| `RequestUserClubEvent` | 3166 | `ScrGetUserInfoMessageComposer` | `ScrGetUserInfoMessageEvent` |
| `RequestUserCitizinShipEvent` | 2127 | `GetTalentTrackLevelMessageComposer` | `GetTalentTrackLevelMessageEvent` |
| `RequestClubCenterEvent` | 869 | `ScrGetKickbackInfoMessageComposer` | `ScrGetKickbackInfoMessageEvent` |
| `RequestUserWardrobeEvent` | 2742 | `GetWardrobeMessageComposer` | `GetWardrobeMessageEvent` |
| `SaveWardrobeEvent` | 800 | `SaveWardrobeOutfitMessageComposer` | `SaveWardrobeOutfitMessageEvent` |
| `RequestMeMenuSettingsEvent` | 2388 | `GetSoundSettingsComposer` | `GetSoundSettingsEvent` |
| `RequestWearingBadgesEvent` | 2091 | `GetSelectedBadgesMessageComposer` | `GetSelectedBadgesMessageEvent` |
| `UserWearBadgeEvent` | 644 | `SetActivatedBadgesComposer` | `SetActivatedBadgesEvent` |
| `UserSaveLookEvent` | 2730 | `UpdateFigureDataMessageComposer` | `UpdateFigureDataMessageEvent` |
| `ChangeNameCheckUsernameEvent` | 3950 | `CheckUserNameMessageComposer` | `CheckUserNameMessageEvent` |
| `ConfirmChangeNameEvent` | 2977 | `ChangeUserNameMessageComposer` | `ChangeUserNameMessageEvent` |
| `SaveMottoEvent` | 2228 | `ChangeMottoMessageComposer` | `ChangeMottoMessageEvent` |
| `UserActivityEvent` | 3457 | `EventLogMessageComposer` | `EventLogMessageEvent` |
| `SetHomeRoomEvent` | 1740 | `UpdateHomeRoomMessageComposer` | `UpdateHomeRoomMessageEvent` |
| `RequestProfileFriendsEvent` | 2138 | `GetRelationshipStatusInfoMessageComposer` | `GetRelationshipStatusInfoMessageEvent` |
| `ChangeRelationEvent` | 3768 | `SetRelationshipStatusMessageComposer` | `SetRelationshipStatusMessageEvent` |
| `UserNuxEvent` | 1299 | `NewUserExperienceScriptProceedComposer` | `NewUserExperienceScriptProceedEvent` |
| `PickNewUserGiftEvent` | 1822 | `NewUserExperienceGetGiftsMessageComposer` | `NewUserExperienceGetGiftsMessageEvent` |
| `ActivateEffectEvent` | 2959 | `AvatarEffectActivatedComposer` | `AvatarEffectActivatedEvent` |
| `EnableEffectEvent` | 1752 | `AvatarEffectSelectedComposer` | `AvatarEffectSelectedEvent` |
| `ChangeChatBubbleEvent` | 1030 | `SetChatStylePreferenceComposer` | `SetChatStylePreferenceEvent` |
| `SaveUserVolumesEvent` | 1367 | `SetSoundSettingsComposer` | `SetSoundSettingsEvent` |
| `SavePreferOldChatEvent` | 1262 | `SetChatPreferencesMessageComposer` | `SetChatPreferencesMessageEvent` |
| `SaveIgnoreRoomInvitesEvent` | 1086 | `SetIgnoreRoomInvitesMessageComposer` | `SetIgnoreRoomInvitesMessageEvent` |
| `SaveBlockCameraFollowEvent` | 1461 | `SetRoomCameraPreferencesMessageComposer` | `SetRoomCameraPreferencesMessageEvent` |
| `UpdateUIFlagsEvent` | 2313 | `SetUIFlagsMessageComposer` | `SetUIFlagsMessageEvent` |
| `RequestClubGiftsEvent` | 487 | `GetClubGiftInfo` | `GetClubGiftInfoEvent` |
| `RequestTalenTrackEvent` | 196 | `GetTalentTrackMessageComposer` | `GetTalentTrackMessageEvent` |
| `MySanctionStatusEvent` | 2746 | `GetCfhStatusMessageComposer` | `GetCfhStatusMessageEvent` |
| `GetHabboGuildBadgesMessageEvent` | 21 | `GetHabboGroupBadgesMessageComposer` | `GetHabboGroupBadgesMessageEvent` |
| `RequestRoomUserTagsEvent` | 17 | `GetUserTagsMessageComposer` | `GetUserTagsMessageEvent` |
| `RequestAchievementsEvent` | 219 | `GetAchievementsComposer` | `GetAchievementsEvent` |
| `RequestAchievementConfigurationEvent` | -1 | *(no packet ID)* | *(skip)* |

### Friends
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `AcceptFriendRequest` | 137 | `AcceptFriendMessageComposer` | `AcceptFriendMessageEvent` |
| `DeclineFriendRequest` | 2890 | `DeclineFriendMessageComposer` | `DeclineFriendMessageEvent` |
| `RemoveFriendEvent` | 1689 | `RemoveFriendMessageComposer` | `RemoveFriendMessageEvent` |
| `FriendRequestEvent` | 3157 | `RequestFriendMessageComposer` | `RequestFriendMessageEvent` |
| `RequestFriendRequestEvent` | 2448 | `GetFriendRequestsMessageComposer` | `GetFriendRequestsMessageEvent` |
| `FriendPrivateMessageEvent` | 3567 | `SendMsgMessageComposer` | `SendMsgMessageEvent` |
| `RequestFriendsEvent` | 1523 | `GetMOTDMessageComposer` | `GetMOTDMessageEvent` |
| `RequestInitFriendsEvent` | 2781 | `MessengerInitMessageComposer` | `MessengerInitMessageEvent` |
| `StalkFriendEvent` | 3997 | `VisitUserMessageComposer` | `VisitUserMessageEvent` |
| `InviteFriendsEvent` | 1276 | `SendRoomInviteMessageComposer` | `SendRoomInviteMessageEvent` |
| `FindNewFriendsEvent` | 516 | `FindNewFriendsMessageComposer` | `FindNewFriendsMessageEvent` |
| `SearchUserEvent` | 1210 | `HabboSearchMessageComposer` | `HabboSearchMessageEvent` |

### Inventory
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestInventoryItemsEvent` | 3150 | `RequestFurniInventoryComposer` | `RequestFurniInventoryEvent` |
| `RequestInventoryPetsEvent` | 3095 | `GetPetInventoryComposer` | `GetPetInventoryEvent` |
| `RequestInventoryBotsEvent` | 3848 | `GetBotInventoryComposer` | `GetBotInventoryEvent` |
| `RequestInventoryBadgesEvent` | 2769 | `GetBadgesComposer` | `GetBadgesEvent` |
| `HotelViewInventoryEvent` | 3500 | `RequestFurniInventoryWhenNotInRoomComposer` | `RequestFurniInventoryWhenNotInRoomEvent` |

### Rooms
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestRoomLoadEvent` | 2312 | `OpenFlatConnectionMessageComposer` | `OpenFlatConnectionMessageEvent` |
| `RequestRoomDataEvent` | 2230 | `GetGuestRoomMessageComposer` | `GetGuestRoomMessageEvent` |
| `RequestRoomSettingsEvent` | 3129 | `GetRoomSettingsMessageComposer` | `GetRoomSettingsMessageEvent` |
| `RoomSettingsSaveEvent` | 1969 | `SaveRoomSettingsMessageComposer` | `SaveRoomSettingsMessageEvent` |
| `RequestRoomRightsEvent` | 3385 | `GetFlatControllersMessageComposer` | `GetFlatControllersMessageEvent` |
| `RoomUserGiveRightsEvent` | 808 | `AssignRightsMessageComposer` | `AssignRightsMessageEvent` |
| `RoomUserRemoveRightsEvent` | 2064 | `RemoveRightsMessageComposer` | `RemoveRightsMessageEvent` |
| `RoomRemoveRightsEvent` | 3182 | `RemoveOwnRoomRightsRoomMessageComposer` | `RemoveOwnRoomRightsRoomMessageEvent` |
| `RoomRemoveAllRightsEvent` | 2683 | `RemoveAllRightsMessageComposer` | `RemoveAllRightsMessageEvent` |
| `RequestRoomHeightmapEvent` | 2300 | `GetRoomEntryDataMessageComposer` | `GetRoomEntryDataMessageEvent` |
| `RequestHeightmapEvent` | 3898 | `GetFurnitureAliasesMessageComposer` | `GetFurnitureAliasesMessageEvent` |
| `RequestRoomBannedUsersEvent` | 2267 | `GetBannedUsersFromRoomMessageComposer` | `GetBannedUsersFromRoomMessageEvent` |
| `RequestRoomWordFilterEvent` | 1911 | `GetCustomRoomFilterMessageComposer` | `GetCustomRoomFilterMessageEvent` |
| `RoomWordFilterModifyEvent` | 3001 | `UpdateRoomFilterMessageComposer` | `UpdateRoomFilterMessageEvent` |
| `RoomMuteEvent` | 3637 | `MuteAllInRoomComposer` | `MuteAllInRoomEvent` |
| `RoomUserMuteEvent` | 3485 | `RoomUserMuteMessageComposer` | `RoomUserMuteMessageEvent` |
| `RoomUserBanEvent` | 1477 | `BanUserWithDurationMessageComposer` | `BanUserWithDurationMessageEvent` |
| `UnbanRoomUserEvent` | 992 | `UnbanUserFromRoomMessageComposer` | `UnbanUserFromRoomMessageEvent` |
| `RoomUserKickEvent` | 1320 | `RoomUserKickMessageComposer` | `RoomUserKickMessageEvent` |
| `HandleDoorbellEvent` | 1644 | `LetUserInMessageComposer` | `LetUserInMessageEvent` |
| `RoomBackgroundEvent` | 2880 | `SetRoomBackgroundColorDataComposer` | `SetRoomBackgroundColorDataEvent` |
| `RoomPlacePaintEvent` | 711 | `RequestRoomPropertySet` | `RequestRoomPropertySetEvent` |
| `RoomUserSitEvent` | 2235 | `ChangePostureMessageComposer` | `ChangePostureMessageEvent` |
| `RoomUserTalkEvent` | 1314 | `ChatMessageComposer` | `ChatMessageEvent` |
| `RoomUserShoutEvent` | 2085 | `ShoutMessageComposer` | `ShoutMessageEvent` |
| `RoomUserWhisperEvent` | 1543 | `WhisperMessageComposer` | `WhisperMessageEvent` |
| `RoomUserStartTypingEvent` | 1597 | `StartTypingMessageComposer` | `StartTypingMessageEvent` |
| `RoomUserStopTypingEvent` | 1474 | `CancelTypingMessageComposer` | `CancelTypingMessageEvent` |
| `RoomUserDanceEvent` | 2080 | `DanceMessageComposer` | `DanceMessageEvent` |
| `RoomUserActionEvent` | 2456 | `AvatarExpressionMessageComposer` | `AvatarExpressionMessageEvent` |
| `RoomUserWalkEvent` | 3320 | `MoveAvatarMessageComposer` | `MoveAvatarMessageEvent` |
| `RoomUserLookAtPoint` | 3301 | `LookToMessageComposer` | `LookToMessageEvent` |
| `RoomUserGiveHandItemEvent` | 2941 | `PassCarryItemMessageComposer` | `PassCarryItemMessageEvent` |
| `RoomUserDropHandItemEvent` | 2814 | `DropCarryItemMessageComposer` | `DropCarryItemMessageEvent` |
| `RoomUserGiveRespectEvent` | 2694 | `RespectUserMessageComposer` | `RespectUserMessageEvent` |
| `RoomUserSignEvent` | 1975 | `SignMessageComposer` | `SignMessageEvent` |
| `RoomVoteEvent` | 3582 | `RateFlatMessageComposer` | `RateFlatMessageEvent` |
| `RoomUserKickEvent` | 1320 | `RoomUserKickMessageComposer` | `RoomUserKickMessageEvent` |
| `IgnoreRoomUserEvent` | 1117 | `IgnoreUserMessageComposer` | `IgnoreUserMessageEvent` |
| `UnIgnoreRoomUserEvent` | 2061 | `UnignoreUserMessageComposer` | `UnignoreUserMessageEvent` |
| `RequestDeleteRoomEvent` | 532 | `DeleteRoomMessageComposer` | `DeleteRoomMessageEvent` |
| `RequestCreateRoomEvent` | 2752 | `CreateFlatMessageComposer` | `CreateFlatMessageEvent` |
| `RequestCanCreateRoomEvent` | 2128 | `CanCreateRoomMessageComposer` | `CanCreateRoomMessageEvent` |
| `RoomFavoriteEvent` | 3817 | `AddFavouriteRoomMessageComposer` | `AddFavouriteRoomMessageEvent` |
| `RoomUnFavoriteEvent` | 309 | `DeleteFavouriteRoomMessageComposer` | `DeleteFavouriteRoomMessageEvent` |
| `AdvertisingSaveEvent` | 3608 | `SetObjectDataMessageComposer` | `SetObjectDataMessageEvent` |
| `RequestPromotionRoomsEvent` | 1075 | `GetRoomAdPurchaseInfoComposer` | `GetRoomAdPurchaseInfoEvent` |
| `BuyRoomPromotionEvent` | 777 | `PurchaseRoomAdMessageComposer` | `PurchaseRoomAdMessageEvent` |
| `EditRoomPromotionMessageEvent` | 3991 | `EditEventMessageComposer` | `EditEventMessageEvent` |
| `RoomStaffPickEvent` | 1918 | `ToggleStaffPickMessageComposer` | `ToggleStaffPickMessageEvent` |
| `SetStackHelperHeightEvent` | 3839 | `SetCustomStackingHeightComposer` | `SetCustomStackingHeightEvent` |
| `ToggleFloorItemEvent` | 99 | `UseFurnitureMessageComposer` | `UseFurnitureMessageEvent` |
| `ToggleWallItemEvent` | 210 | `UseWallItemMessageComposer` | `UseWallItemMessageEvent` |
| `CloseDiceEvent` | 1533 | `DiceOffMessageComposer` | `DiceOffMessageEvent` |
| `TriggerDiceEvent` | 1990 | `ThrowDiceMessageComposer` | `ThrowDiceMessageEvent` |
| `TriggerColorWheelEvent` | 2144 | `SpinWheelOfFortuneMessageComposer` | `SpinWheelOfFortuneMessageEvent` |
| `TriggerOneWayGateEvent` | 2765 | `EnterOneWayDoorMessageComposer` | `EnterOneWayDoorMessageEvent` |
| `MoodLightTurnOnEvent` | 2296 | `RoomDimmerChangeStateMessageComposer` | `RoomDimmerChangeStateMessageEvent` |
| `MoodLightSettingsEvent` | 2813 | `RoomDimmerGetPresetsMessageComposer` | `RoomDimmerGetPresetsMessageEvent` |
| `MoodLightSaveSettingsEvent` | 1648 | `RoomDimmerSavePresetMessageComposer` | `RoomDimmerSavePresetMessageEvent` |
| `HorseRideEvent` | 1036 | `MountPetMessageComposer` | `MountPetMessageEvent` |
| `HorseRideSettingsEvent` | 1472 | `TogglePetRidingPermissionMessageComposer` | `TogglePetRidingPermissionMessageEvent` |
| `HorseRemoveSaddleEvent` | 186 | `RemoveSaddleFromPetMessageComposer` | `RemoveSaddleFromPetMessageEvent` |
| `PetUseItemEvent` | 1328 | `CustomizePetWithFurniComposer` | `CustomizePetWithFurniEvent` |
| `RequestPetTrainingPanelEvent` | 2161 | `GetPetCommandsMessageComposer` | `GetPetCommandsMessageEvent` |
| `RequestPetInformationEvent` | 2934 | `GetPetInfoMessageComposer` | `GetPetInfoMessageEvent` |
| `RequestPetBreedsEvent` | 1756 | `GetSellablePetPalettesComposer` | `GetSellablePetPalettesEvent` |
| `PetPickupEvent` | 1581 | `RemovePetFromFlatMessageComposer` | `RemovePetFromFlatMessageEvent` |
| `PetPlaceEvent` | 2647 | `PlacePetMessageComposer` | `PlacePetMessageEvent` |
| `ScratchPetEvent` | 3202 | `RespectPetMessageComposer` | `RespectPetMessageEvent` |
| `MovePetEvent` | 3449 | `MovePetMessageComposer` | `MovePetMessageEvent` |
| `PetPackageNameEvent` | 3698 | `OpenPetPackageMessageComposer` | `OpenPetPackageMessageEvent` |
| `CheckPetNameEvent` | 2109 | `ApproveNameMessageComposer` | `ApproveNameMessageEvent` |
| `ToggleMonsterplantBreedableEvent` | 3379 | `TogglePetBreedingPermissionMessageComposer` | `TogglePetBreedingPermissionMessageEvent` |
| `CompostMonsterplantEvent` | 3835 | `CompostPlantMessageComposer` | `CompostPlantMessageEvent` |
| `BreedMonsterplantsEvent` | 1638 | `BreedPetsMessageComposer` | `BreedPetsMessageEvent` |
| `StopBreedingEvent` | 2713 | `CancelPetBreedingComposer` | `CancelPetBreedingEvent` |
| `ConfirmPetBreedingEvent` | 3382 | `ConfirmPetBreedingComposer` | `ConfirmPetBreedingEvent` |
| `LoveLockStartConfirmEvent` | 3775 | `FriendFurniConfirmLockMessageComposer` | `FriendFurniConfirmLockMessageEvent` |
| `FootballGateSaveLookEvent` | 924 | `SetClothingChangeDataMessageComposer` | `SetClothingChangeDataMessageEvent` |
| `MannequinSaveLookEvent` | 2209 | `SetMannequinFigureComposer` | `SetMannequinFigureEvent` |
| `MannequinSaveNameEvent` | 2850 | `SetMannequinNameComposer` | `SetMannequinNameEvent` |
| `SavePostItStickyPoleEvent` | 3283 | `AddSpamWallPostItMessageComposer` | `AddSpamWallPostItMessageEvent` |

### Rooms/Items
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RoomPlaceItemEvent` | 1258 | `PlaceObjectMessageComposer` | `PlaceObjectMessageEvent` |
| `RoomPickupItemEvent` | 3456 | `PickupObjectMessageComposer` | `PickupObjectMessageEvent` |
| `RotateMoveItemEvent` | 248 | `MoveObjectMessageComposer` | `MoveObjectMessageEvent` |
| `MoveWallItemEvent` | 168 | `MoveWallItemMessageComposer` | `MoveWallItemMessageEvent` |
| `PostItPlaceEvent` | 2248 | `PlacePostItMessageComposer` | `PlacePostItMessageEvent` |
| `PostItRequestDataEvent` | 3964 | `GetItemDataMessageComposer` | `GetItemDataMessageEvent` |
| `PostItSaveDataEvent` | 3666 | `SetItemDataMessageComposer` | `SetItemDataMessageComposer` |
| `PostItDeleteEvent` | 3336 | `RemoveItemMessageComposer` | `RemoveItemMessageEvent` |
| `UseRandomStateItemEvent` | 3617 | `SetRandomStateMessageComposer` | `SetRandomStateMessageEvent` |

### Navigator
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestNewNavigatorDataEvent` | 2110 | `NewNavigatorInitComposer` | `NewNavigatorInitEvent` |
| `RequestNewNavigatorRoomsEvent` | 249 | `NewNavigatorSearchComposer` | `NewNavigatorSearchEvent` |
| `SearchRoomsEvent` | 3943 | `RoomTextSearchMessageComposer` | `RoomTextSearchMessageEvent` |
| `RequestPopularRoomsEvent` | 2758 | `PopularRoomsSearchMessageComposer` | `PopularRoomsSearchMessageEvent` |
| `RequestMyRoomsEvent` | 2277 | `MyRoomsSearchMessageComposer` | `MyRoomsSearchMessageEvent` |
| `RequestHighestScoreRoomsEvent` | 2939 | `RoomsWithHighestScoreSearchMessageComposer` | `RoomsWithHighestScoreSearchMessageEvent` |
| `RequestPromotedRoomsEvent` | 2908 | `GetUnreadForumsCountMessageComposer` | `GetUnreadForumsCountMessageEvent` |
| `SearchRoomsFriendsNowEvent` | 1786 | `RoomsWhereMyFriendsAreSearchMessageComposer` | `RoomsWhereMyFriendsAreSearchMessageEvent` |
| `SearchRoomsFriendsOwnEvent` | 2266 | `MyFriendsRoomsSearchMessageComposer` | `MyFriendsRoomsSearchMessageEvent` |
| `SearchRoomsVisitedEvent` | 2264 | `MyRoomHistorySearchMessageComposer` | `MyRoomHistorySearchMessageEvent` |
| `SearchRoomsMyFavoriteEvent` | 2578 | `MyFavouriteRoomsSearchMessageComposer` | `MyFavouriteRoomsSearchMessageEvent` |
| `SearchRoomsInGroupEvent` | 39 | `MyGuildBasesSearchMessageComposer` | `MyGuildBasesSearchMessageEvent` |
| `SearchRoomsWithRightsEvent` | 272 | `MyRoomRightsSearchMessageComposer` | `MyRoomRightsSearchMessageEvent` |
| `RequestPublicRoomsEvent` | 1229 | `GetOfficialRoomsMessageComposer` | `GetOfficialRoomsMessageEvent` |
| `RequestTagsEvent` | 826 | `GetPopularRoomTagsMessageComposer` | `GetPopularRoomTagsMessageComposer` |
| `RequestRoomCategoriesEvent` | 3027 | `GetUserFlatCatsMessageComposer` | `GetUserFlatCatsMessageEvent` |
| `RequestNavigatorSettingsEvent` | 1782 | `GetUserEventCatsMessageComposer` | `GetUserEventCatsMessageEvent` |
| `NavigatorCategoryListModeEvent` | 1202 | `NavigatorSetSearchCodeViewModeMessageComposer` | `NavigatorSetSearchCodeViewModeMessageEvent` |
| `NavigatorCollapseCategoryEvent` | 1834 | `NavigatorAddCollapsedCategoryMessageComposer` | `NavigatorAddCollapsedCategoryMessageEvent` |
| `NavigatorUncollapseCategoryEvent` | 637 | `NavigatorRemoveCollapsedCategoryMessageComposer` | `NavigatorRemoveCollapsedCategoryMessageEvent` |
| `AddSavedSearchEvent` | 2226 | `NavigatorAddSavedSearchComposer` | `NavigatorAddSavedSearchEvent` |
| `DeleteSavedSearchEvent` | 1954 | `NavigatorDeleteSavedSearchComposer` | `NavigatorDeleteSavedSearchEvent` |
| `SaveWindowSettingsEvent` | 3159 | `SetNewNavigatorWindowPreferencesMessageComposer` | `SetNewNavigatorWindowPreferencesMessageEvent` |
| `NewNavigatorActionEvent` | 1703 | `ForwardToSomeRoomMessageComposer` | `ForwardToSomeRoomMessageEvent` |

### Catalog
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestCatalogIndexEvent` | 2529 | `BuildersClubQueryFurniCountMessageComposer` | `BuildersClubQueryFurniCountMessageEvent` |
| `RequestCatalogPageEvent` | 412 | `GetCatalogPageComposer` | `GetCatalogPageEvent` |
| `RequestCatalogModeEvent` | 1195 | `GetCatalogIndexComposer` | `GetCatalogIndexEvent` |
| `CatalogBuyItemEvent` | 3492 | `PurchaseFromCatalogComposer` | `PurchaseFromCatalogEvent` |
| `CatalogBuyItemAsGiftEvent` | 1411 | `PurchaseFromCatalogAsGiftComposer` | `PurchaseFromCatalogAsGiftEvent` |
| `CatalogSelectClubGiftEvent` | 2276 | `SelectClubGiftComposer` | `SelectClubGiftEvent` |
| `CatalogRequestClubDiscountEvent` | 2462 | `GetHabboClubExtendOfferMessageComposer` | `GetHabboClubExtendOfferMessageEvent` |
| `CatalogBuyClubDiscountEvent` | 3407 | `PurchaseVipMembershipExtensionComposer` | `PurchaseVipMembershipExtensionEvent` |
| `CatalogSearchedItemEvent` | 2594 | `GetProductOfferComposer` | `GetProductOfferEvent` |
| `RequestGiftConfigurationEvent` | 418 | `GetGiftWrappingConfigurationComposer` | `GetGiftWrappingConfigurationEvent` |
| `RequestDiscountEvent` | 223 | `GetBundleDiscountRulesetComposer` | `GetBundleDiscountRulesetEvent` |
| `RequestTargetOfferEvent` | 2487 | `GetNextTargetedOfferComposer` | `GetNextTargetedOfferEvent` |
| `PurchaseTargetOfferEvent` | 1826 | `PurchaseTargetedOfferComposer` | `PurchaseTargetedOfferEvent` |
| `TargetOfferStateEvent` | 2041 | `SetTargetedOfferStateComposer` | `SetTargetedOfferStateEvent` |
| `RedeemVoucherEvent` | 339 | `RedeemVoucherMessageComposer` | `RedeemVoucherMessageEvent` |
| `RecycleEvent` | 2771 | `RecycleItemsMessageComposer` | `RecycleItemsMessageEvent` |
| `RequestRecylerLogicEvent` | 398 | `GetRecyclerPrizesMessageComposer` | `GetRecyclerPrizesMessageEvent` |
| `ReloadRecyclerEvent` | 1342 | `GetRecyclerStatusMessageComposer` | `GetRecyclerStatusMessageEvent` |
| `OpenRecycleBoxEvent` | 3558 | `PresentOpenMessageComposer` | `PresentOpenMessageEvent` |
| `RedeemItemEvent` | 3115 | `CreditFurniRedeemMessageComposer` | `CreditFurniRedeemMessageEvent` |
| `RedeemClothingEvent` | 3374 | `CustomizeAvatarWithFurniMessageComposer` | `CustomizeAvatarWithFurniMessageEvent` |
| `RequestItemInfoEvent` | 3288 | `GetMarketplaceItemStatsComposer` | `GetMarketplaceItemStatsEvent` |
| `RequestSellItemEvent` | 848 | `GetMarketplaceCanMakeOfferComposer` | `GetMarketplaceCanMakeOfferEvent` |
| `SellItemEvent` | 3447 | `MakeOfferMessageComposer` | `MakeOfferMessageEvent` |
| `BuyItemEvent` | 1603 | `BuyMarketplaceOfferMessageComposer` | `BuyMarketplaceOfferMessageEvent` |
| `GetMarketplaceConfigEvent` | 2597 | `GetMarketplaceConfigurationMessageComposer` | `GetMarketplaceConfigurationMessageEvent` |
| `RequestOffersEvent` | 2407 | `GetMarketplaceOffersMessageComposer` | `GetMarketplaceOffersMessageEvent` |
| `RequestOwnItemsEvent` | 2105 | `GetMarketplaceOwnOffersMessageComposer` | `GetMarketplaceOwnOffersMessageEvent` |
| `TakeBackItemEvent` | 434 | `CancelMarketplaceOfferMessageComposer` | `CancelMarketplaceOfferMessageEvent` |
| `GetClubDataEvent` | 3285 | `GetClubOffersMessageComposer` | `GetClubOffersMessageEvent` |

### Trading
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `TradeStartEvent` | 1481 | `OpenTradingComposer` | `OpenTradingEvent` |
| `TradeCloseEvent` | 2551 | `CloseTradingComposer` | `CloseTradingEvent` |
| `TradeAcceptEvent` | 3863 | `AcceptTradingComposer` | `AcceptTradingEvent` |
| `TradeUnAcceptEvent` | 1444 | `UnacceptTradingComposer` | `UnacceptTradingEvent` |
| `TradeCancelEvent` | 2341 | `ConfirmDeclineTradingComposer` | `ConfirmDeclineTradingEvent` |
| `TradeOfferItemEvent` | 3107 | `AddItemToTradeComposer` | `AddItemToTradeEvent` |
| `TradeOfferMultipleItemsEvent` | 1263 | `AddItemsToTradeComposer` | `AddItemsToTradeEvent` |
| `TradeCancelOfferItemEvent` | 3845 | `RemoveItemFromTradeComposer` | `RemoveItemFromTradeEvent` |
| `TradeConfirmEvent` | 2760 | `ConfirmAcceptTradingComposer` | `ConfirmAcceptTradingEvent` |

### Wired
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `WiredTriggerSaveDataEvent` | 1520 | `UpdateTriggerMessageComposer` | `UpdateTriggerMessageEvent` |
| `WiredEffectSaveDataEvent` | 2281 | `UpdateActionMessageComposer` | `UpdateActionMessageEvent` |
| `WiredConditionSaveDataEvent` | 3203 | `UpdateConditionMessageComposer` | `UpdateConditionMessageEvent` |
| `WiredApplySetConditionsEvent` | 3373 | `ApplySnapshotMessageComposer` | `ApplySnapshotMessageEvent` |
| `WiredSaveException` | *(no packet ID)* | *(no packet ID)* | *(skip)* |

### Guilds
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestGuildInfoEvent` | 2991 | `GetHabboGroupDetailsMessageComposer` | `GetHabboGroupDetailsMessageEvent` |
| `RequestGuildMembersEvent` | 312 | `GetGuildMembersMessageComposer` | `GetGuildMembersMessageEvent` |
| `RequestGuildManageEvent` | 1004 | `GetGuildEditInfoMessageComposer` | `GetGuildEditInfoMessageEvent` |
| `RequestGuildPartsEvent` | 813 | `GetGuildEditorDataMessageComposer` | `GetGuildEditorDataMessageEvent` |
| `RequestGuildBuyEvent` | 230 | `CreateGuildMessageComposer` | `CreateGuildMessageEvent` |
| `RequestGuildBuyRoomsEvent` | 798 | `GetGuildCreationInfoMessageComposer` | `GetGuildCreationInfoMessageEvent` |
| `RequestOwnGuildsEvent` | 367 | `GetGuildMembershipsMessageComposer` | `GetGuildMembershipsMessageEvent` |
| `RequestGuildJoinEvent` | 998 | `JoinHabboGroupMessageComposer` | `JoinHabboGroupMessageEvent` |
| `GuildAcceptMembershipEvent` | 3386 | `ApproveMembershipRequestMessageComposer` | `ApproveMembershipRequestMessageEvent` |
| `GuildDeclineMembershipEvent` | 1894 | `RejectMembershipRequestMessageComposer` | `RejectMembershipRequestMessageEvent` |
| `GuildSetAdminEvent` | 2894 | `AddAdminRightsToMemberMessageComposer` | `AddAdminRightsToMemberMessageEvent` |
| `GuildRemoveAdminEvent` | 722 | `RemoveAdminRightsFromMemberMessageComposer` | `RemoveAdminRightsFromMemberMessageEvent` |
| `GuildRemoveMemberEvent` | 593 | `KickMemberMessageComposer` | `KickMemberMessageEvent` |
| `GuildConfirmRemoveMemberEvent` | 3593 | `GetMemberGuildItemCountMessageComposer` | `GetMemberGuildItemCountMessageEvent` |
| `GuildSetFavoriteEvent` | 3549 | `SelectFavouriteHabboGroupMessageComposer` | `SelectFavouriteHabboGroupMessageEvent` |
| `GuildRemoveFavoriteEvent` | 1820 | `DeselectFavouriteHabboGroupMessageComposer` | `DeselectFavouriteHabboGroupMessageEvent` |
| `GuildDeleteEvent` | 1134 | `DeactivateGuildMessageComposer` | `DeactivateGuildMessageEvent` |
| `GuildChangeNameDescEvent` | 3137 | `UpdateGuildIdentityMessageComposer` | `UpdateGuildIdentityMessageEvent` |
| `GuildChangeColorsEvent` | 1764 | `UpdateGuildColorsMessageComposer` | `UpdateGuildColorsMessageEvent` |
| `GuildChangeBadgeEvent` | 1991 | `UpdateGuildBadgeMessageComposer` | `UpdateGuildBadgeMessageEvent` |
| `GuildChangeSettingsEvent` | 3435 | `UpdateGuildSettingsMessageComposer` | `UpdateGuildSettingsMessageEvent` |
| `RequestGuildFurniWidgetEvent` | 2651 | `GetGuildFurniContextMenuInfoMessageComposer` | `GetGuildFurniContextMenuInfoMessageEvent` |

### Guild Forums
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `GuildForumListEvent` | 873 | `GetForumsListMessageComposer` | `GetForumsListMessageEvent` |
| `GuildForumThreadsEvent` | 436 | `GetThreadsMessageComposer` | `GetThreadsMessageEvent` |
| `GuildForumDataEvent` | 3149 | `GetForumStatsMessageComposer` | `GetForumStatsMessageEvent` |
| `GuildForumPostThreadEvent` | 3529 | `PostMessageMessageComposer` | `PostMessageMessageEvent` |
| `GuildForumThreadsMessagesEvent` | 232 | `GetMessagesMessageComposer` | `GetMessagesMessageEvent` |
| `GuildForumModerateMessageEvent` | 286 | `ModerateMessageMessageComposer` | `ModerateMessageMessageEvent` |
| `GuildForumModerateThreadEvent` | 1397 | `ModerateThreadMessageComposer` | `ModerateThreadMessageEvent` |
| `GuildForumUpdateSettingsEvent` | 2214 | `UpdateForumSettingsMessageComposer` | `UpdateForumSettingsMessageEvent` |
| `GuildForumThreadUpdateEvent` | 3045 | `UpdateThreadMessageComposer` | `UpdateThreadMessageEvent` |
| `GuildForumMarkAsReadEvent` | 1855 | `UpdateForumReadMarkerMessageComposer` | `UpdateForumReadMarkerMessageEvent` |

### Guides
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestGuideToolEvent` | 1922 | `GuideSessionOnDutyUpdateMessageComposer` | `GuideSessionOnDutyUpdateMessageEvent` |
| `RequestGuideAssistanceEvent` | 3338 | `GuideSessionCreateMessageComposer` | `GuideSessionCreateMessageEvent` |
| `GuideUserTypingEvent` | 519 | `GuideSessionIsTypingMessageComposer` | `GuideSessionIsTypingMessageEvent` |
| `GuideUserMessageEvent` | 3899 | `GuideSessionMessageMessageComposer` | `GuideSessionMessageMessageEvent` |
| `GuideReportHelperEvent` | 3969 | `GuideSessionReportMessageComposer` | `GuideSessionReportMessageEvent` |
| `GuideRecommendHelperEvent` | 477 | `GuideSessionFeedbackMessageComposer` | `GuideSessionFeedbackMessageEvent` |
| `GuideInviteUserEvent` | 234 | `GuideSessionInviteRequesterMessageComposer` | `GuideSessionInviteRequesterMessageEvent` |
| `GuideHandleHelpRequestEvent` | 1424 | `GuideSessionGuideDecidesMessageComposer` | `GuideSessionGuideDecidesMessageEvent` |
| `GuideCancelHelpRequestEvent` | 291 | `GuideSessionRequesterCancelsMessageComposer` | `GuideSessionRequesterCancelsMessageEvent` |
| `GuideVisitUserEvent` | 1052 | `GuideSessionGetRequesterRoomMessageComposer` | `GuideSessionGetRequesterRoomMessageEvent` |
| `GuideCloseHelpRequestEvent` | 887 | `GuideSessionResolvedMessageComposer` | `GuideSessionResolvedMessageEvent` |

### Guardians
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `GuardianNoUpdatesWantedEvent` | 2501 | `ChatReviewGuideDetachedMessageComposer` | `ChatReviewGuideDetachedMessageEvent` |
| `GuardianVoteEvent` | 3961 | `ChatReviewGuideVoteMessageComposer` | `ChatReviewGuideVoteMessageEvent` |
| `GuardianAcceptRequestEvent` | 3365 | `ChatReviewGuideDecidesOnOfferMessageComposer` | `ChatReviewGuideDecidesOnOfferMessageEvent` |
| `RequestReportUserBullyingEvent` | 3786 | `GetGuideReportingStatusMessageComposer` | `GetGuideReportingStatusMessageEvent` |
| `ReportBullyEvent` | 3060 | `ChatReviewSessionCreateMessageComposer` | `ChatReviewSessionCreateMessageEvent` |

### HotelView
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `HotelViewEvent` | 105 | `QuitMessageComposer` | `QuitMessageEvent` |
| `HotelViewDataEvent` | 2912 | `GetCurrentTimingCodeMessageComposer` | `GetCurrentTimingCodeMessageEvent` |
| `RequestNewsListEvent` | 1827 | `GetPromoArticlesComposer` | `GetPromoArticlesEvent` |
| `HotelViewRequestBonusRareEvent` | 957 | `GetBonusRareInfoMessageComposer` | `GetBonusRareInfoMessageEvent` |
| `HotelViewRequestLTDAvailabilityEvent` | 410 | `GetLimitedOfferAppearingNextComposer` | `GetLimitedOfferAppearingNextEvent` |
| `HotelViewRequestSecondsUntilEvent` | 271 | `GetSecondsUntilMessageComposer` | `GetSecondsUntilMessageEvent` |
| `HotelViewRequestBadgeRewardEvent` | 2318 | *(needs verification)* | *(needs verification)* |
| `HotelViewClaimBadgeRewardEvent` | -1 | *(no packet ID)* | *(skip)* |
| `HotelViewRequestCommunityGoalEvent` | 1145 | `GetCommunityGoalProgressMessageComposer` | `GetCommunityGoalProgressMessageEvent` |
| `HotelViewRequestConcurrentUsersEvent` | 1343 | `GetConcurrentUsersGoalProgressMessageComposer` | `GetConcurrentUsersGoalProgressMessageEvent` |
| `HotelViewConcurrentUsersButtonEvent` | 3872 | `GetConcurrentUsersRewardMessageComposer` | `GetConcurrentUsersRewardMessageEvent` |
| `HotelViewClaimBadgeEvent` | 3077 | `RequestABadgeComposer` | `RequestABadgeEvent` |

### Camera
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestCameraConfigurationEvent` | 796 | `RequestCameraConfigurationComposer` | `RequestCameraConfigurationEvent` |
| `CameraPurchaseEvent` | 2408 | `PurchasePhotoMessageComposer` | `PurchasePhotoMessageEvent` |
| `CameraRoomPictureEvent` | 3226 | `RenderRoomMessageComposer` | `RenderRoomMessageEvent` |
| `CameraRoomThumbnailEvent` | 1982 | `RenderRoomThumbnailMessageComposer` | `RenderRoomThumbnailMessageEvent` |
| `CameraPublishToWebEvent` | 2068 | `PublishPhotoMessageComposer` | `PublishPhotoMessageEvent` |

### Crafting
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `RequestCraftingRecipesEvent` | 1173 | `GetCraftingRecipeComposer` | `GetCraftingRecipeEvent` |
| `RequestCraftingRecipesAvailableEvent` | 3086 | `GetCraftingRecipesAvailableComposer` | `GetCraftingRecipesAvailableEvent` |
| `CraftingAddRecipeEvent` | 633 | `GetCraftableProductsComposer` | `GetCraftableProductsEvent` |
| `CraftingCraftItemEvent` | 3591 | `CraftComposer` | `CraftEvent` |
| `CraftingCraftSecretEvent` | 1251 | `CraftSecretComposer` | `CraftSecretEvent` |

### Jukebox
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `JukeBoxRequestPlayListEvent` | 1325 | `GetNowPlayingMessageComposer` | `GetNowPlayingMessageEvent` |
| `JukeBoxRequestTrackCodeEvent` | 3189 | `GetOfficialSongIdMessageComposer` | `GetOfficialSongIdMessageEvent` |
| `JukeBoxRequestTrackDataEvent` | 3082 | `GetSongInfoMessageComposer` | `GetSongInfoMessageEvent` |
| `JukeBoxEventOne` | 2304 | `GetUserSongDisksMessageComposer` | `GetUserSongDisksMessageEvent` |
| `JukeBoxEventTwo` | 1435 | `GetJukeboxPlayListMessageComposer` | `GetJukeboxPlayListMessageEvent` |
| `JukeBoxAddSoundTrackEvent` | 753 | `AddJukeboxDiskComposer` | `AddJukeboxDiskEvent` |
| `JukeBoxRemoveSoundTrackEvent` | 3050 | `RemoveJukeboxDiskComposer` | `RemoveJukeboxDiskEvent` |

### Youtube
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `YoutubeRequestPlaylists` | 336 | `GetYoutubeDisplayStatusMessageComposer` | `GetYoutubeDisplayStatusMessageEvent` |
| `YoutubeRequestStateChange` | 3005 | `ControlYoutubeDisplayPlaybackMessageComposer` | `ControlYoutubeDisplayPlaybackMessageEvent` |
| `YoutubeRequestPlaylistChange` | 2069 | `SetYoutubeDisplayPlaylistMessageComposer` | `SetYoutubeDisplayPlaylistMessageEvent` |

### GameCenter
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `GameCenterRequestGamesEvent` | 741 | `GetGameListMessageComposer` | `GetGameListMessageEvent` |
| `GameCenterRequestAccountStatusEvent` | 3171 | `GetGameStatusMessageComposer` | `GetGameStatusMessageEvent` |
| `GameCenterRequestGameStatusEvent` | 11 | `Game2GetAccountGameStatusMessageComposer` | `Game2GetAccountGameStatusMessageEvent` |
| `GameCenterJoinGameEvent` | 1458 | `JoinQueueMessageComposer` | `JoinQueueMessageEvent` |
| `GameCenterLeaveGameEvent` | 3207 | `GameUnloadedMessageComposer` | `GameUnloadedMessageEvent` |
| `GameCenterLoadGameEvent` | 1054 | `GetWeeklyGameRewardWinnersComposer` | `GetWeeklyGameRewardWinnersEvent` |
| `GameCenterEvent` | 2914 | `GetWeeklyGameRewardComposer` | `GetWeeklyGameRewardEvent` |

### ModTool
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `ModToolRequestUserInfoEvent` | 3295 | `GetModeratorUserInfoMessageComposer` | `GetModeratorUserInfoMessageEvent` |
| `ModToolRequestRoomInfoEvent` | 707 | `GetModeratorRoomInfoMessageComposer` | `GetModeratorRoomInfoMessageEvent` |
| `ModToolRequestRoomChatlogEvent` | 2587 | `GetRoomChatlogMessageComposer` | `GetRoomChatlogMessageEvent` |
| `ModToolRequestUserChatlogEvent` | 1391 | `GetUserChatlogMessageComposer` | `GetUserChatlogMessageEvent` |
| `ModToolRequestIssueChatlogEvent` | 211 | `GetCfhChatlogMessageComposer` | `GetCfhChatlogMessageEvent` |
| `ModToolRequestRoomVisitsEvent` | 3526 | `GetRoomVisitsMessageComposer` | `GetRoomVisitsMessageEvent` |
| `ModToolAlertEvent` | 1840 | `ModMessageMessageComposer` | `ModMessageMessageEvent` |
| `ModToolPickTicketEvent` | 15 | `PickIssuesMessageComposer` | `PickIssuesMessageEvent` |
| `ModToolReleaseTicketEvent` | 1572 | `ReleaseIssuesMessageComposer` | `ReleaseIssuesMessageEvent` |
| `ModToolCloseTicketEvent` | 2067 | `CloseIssuesMessageComposer` | `CloseIssuesMessageEvent` |
| `ModToolKickEvent` | 2582 | `ModKickMessageComposer` | `ModKickMessageEvent` |
| `ModToolBanEvent` | -1 | *(no packet ID)* | *(skip)* |
| `ModToolChangeRoomSettingsEvent` | 3260 | `ModerateRoomMessageComposer` | `ModerateRoomMessageEvent` |
| `ModToolRoomAlertEvent` | 3842 | `ModeratorActionMessageComposer` | `ModeratorActionMessageEvent` |
| `ModToolSanctionAlertEvent` | 229 | `ModAlertMessageComposer` | `ModAlertMessageEvent` |
| `ModToolSanctionMuteEvent` | 1945 | `ModMuteMessageComposer` | `ModMuteMessageEvent` |
| `ModToolSanctionBanEvent` | 2766 | `ModBanMessageComposer` | `ModBanMessageEvent` |
| `ModToolSanctionTradeLockEvent` | 3742 | `ModTradingLockMessageComposer` | `ModTradingLockMessageEvent` |
| `ModToolIssueChangeTopicEvent` | 1392 | `ModToolSanctionComposer` | `ModToolSanctionEvent` |
| `ModToolIssueDefaultSanctionEvent` | 2717 | `CloseIssueDefaultActionMessageComposer` | `CloseIssueDefaultActionMessageEvent` |

### Reports
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `ReportEvent` | 1691 | `CallForHelpMessageComposer` | `CallForHelpMessageEvent` |
| `RequestReportRoomEvent` | 3267 | `GetPendingCallsForHelpMessageComposer` | `GetPendingCallsForHelpMessageEvent` |
| `ReportFriendPrivateChatEvent` | 2950 | `CallForHelpFromIMMessageComposer` | `CallForHelpFromIMMessageEvent` |
| `ReportThreadEvent` | 534 | `CallForHelpFromForumThreadMessageComposer` | `CallForHelpFromForumThreadMessageEvent` |
| `ReportCommentEvent` | 1412 | `CallForHelpFromForumMessageMessageComposer` | `CallForHelpFromForumMessageMessageEvent` |
| `ReportPhotoEvent` | 2492 | `CallForHelpFromPhotoMessageComposer` | `CallForHelpFromPhotoMessageEvent` |

### FloorPlanEditor
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `FloorPlanEditorSaveEvent` | 875 | `UpdateFloorPropertiesMessageComposer` | `UpdateFloorPropertiesMessageEvent` |
| `FloorPlanEditorRequestDoorSettingsEvent` | 3559 | `GetRoomEntryTileMessageComposer` | `GetRoomEntryTileMessageEvent` |
| `FloorPlanEditorRequestBlockedTilesEvent` | 1687 | `GetOccupiedTilesMessageComposer` | `GetOccupiedTilesMessageEvent` |

### Calendar/Campaign
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `AdventCalendarOpenDayEvent` | 2257 | `OpenCampaignCalendarDoorAsStaffComposer` | `OpenCampaignCalendarDoorAsStaffEvent` |
| `AdventCalendarForceOpenEvent` | 3889 | `OpenCampaignCalendarDoorComposer` | `OpenCampaignCalendarDoorEvent` |

### Bots
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `BotPlaceEvent` | 1592 | `PlaceBotMessageComposer` | `PlaceBotMessageEvent` |
| `BotPickupEvent` | 3323 | `RemoveBotFromFlatMessageComposer` | `RemoveBotFromFlatMessageEvent` |
| `BotSettingsEvent` | 1986 | `GetBotCommandConfigurationDataComposer` | `GetBotCommandConfigurationDataEvent` |
| `BotSaveSettingsEvent` | 2624 | `CommandBotComposer` | `CommandBotEvent` |

### Misc/Other
| Old Name | Packet ID | Client Composer | New Name |
|----------|-----------|-----------------|----------|
| `UsernameEvent` | 3878 | `GetIgnoredUsersMessageComposer` | `GetIgnoredUsersMessageEvent` |
| `UnknownEvent1` | 1371 | `GetBadgePointLimitsComposer` | `GetBadgePointLimitsEvent` |
| `UnknownEvent2` | *(no packet ID)* | *(no packet ID)* | *(skip)* |
| `RentSpaceEvent` | 2946 | `RentableSpaceRentMessageComposer` | `RentableSpaceRentMessageEvent` |
| `RentSpaceCancelEvent` | 1667 | `RentableSpaceCancelRentMessageComposer` | `RentableSpaceCancelRentMessageEvent` |
| `RequestClubDiscountEvent` | 2462 | `GetHabboClubExtendOfferMessageComposer` | `GetHabboClubExtendOfferMessageEvent` |
| `CatalogSearchedItemEvent` | 2594 | `GetProductOfferComposer` | `GetProductOfferEvent` |

---

## Packets NOT Being Renamed

### No Valid Packet ID (-1)
| Name | Packet ID | Reason |
|------|-----------|--------|
| `ModToolBanEvent` | -1 | No valid packet ID |
| `ModToolRequestRoomUserChatlogEvent` | -1 | No valid packet ID |
| `HotelViewClaimBadgeRewardEvent` | -1 | No valid packet ID |
| `RequestAchievementConfigurationEvent` | -1 | No valid packet ID |

### SnowStorm (6000+) — Custom Server Game Mode — 27 files
| Name | Packet ID | Reason |
|------|-----------|--------|
| `UNKNOWN_SNOWSTORM_6000` through `UNKNOWN_SNOWSTORM_6025` | 6000-6025 | Custom server game mode, not in vanilla client |
| `SnowStormJoinQueueEvent` | 6012 | Custom server game mode |
| `SnowStormUserPickSnowballEvent` | 6026 | Custom server game mode |

---

## Summary

| Category | Count |
|----------|-------|
| **Total packets being renamed** | **~200+** |
| **Total packets NOT being renamed** | **~32** |
| **Total Incoming.java entries** | **~235** |

## Execution Steps

For each rename:
1. Rename the `.java` file
2. Update the class name inside the file
3. Update the `Incoming.java` enum entry
4. Update all `import` statements and usages across the codebase
5. Update `MessageHandler.java` registrations

No directory moves — files stay in their current locations.
