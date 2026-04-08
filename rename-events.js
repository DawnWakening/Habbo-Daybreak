const fs = require('fs');
const path = require('path');

// Complete rename mapping from GitHub Issue #56
const RENAME_MAP = {
    // Handshake (9 files)
    'SecureLoginEvent': 'SSOTicketMessageEvent',
    'InitDiffieHandshake': 'InitDiffieHandshakeMessageEvent',
    'CompleteDiffieHandshake': 'CompleteDiffieHandshakeMessageEvent',
    'MachineIDEvent': 'UniqueIDMessageEvent',
    'PongEvent': 'PongMessageEvent',
    'PingEvent': 'LatencyPingRequestMessageEvent',
    'ReleaseVersionEvent': 'ClientHelloMessageEvent',
    'RequestResolutionEvent': 'GetResolutionAchievementsMessageEvent',

    // Users (46 files)
    'RequestUserDataEvent': 'InfoRetrieveMessageEvent',
    'RequestUserProfileEvent': 'GetExtendedProfileMessageEvent',
    'RequestUserCreditsEvent': 'GetCreditsInfoEvent',
    'RequestCreditsEvent': 'RedeemMarketplaceOfferCreditsMessageEvent',
    'RequestUserClubEvent': 'ScrGetUserInfoMessageEvent',
    'RequestUserCitizinShipEvent': 'GetTalentTrackLevelMessageEvent',
    'RequestClubCenterEvent': 'ScrGetKickbackInfoMessageEvent',
    'RequestUserWardrobeEvent': 'GetWardrobeMessageEvent',
    'SaveWardrobeEvent': 'SaveWardrobeOutfitMessageEvent',
    'RequestMeMenuSettingsEvent': 'GetSoundSettingsEvent',
    'RequestWearingBadgesEvent': 'GetSelectedBadgesMessageEvent',
    'UserWearBadgeEvent': 'SetActivatedBadgesEvent',
    'UserSaveLookEvent': 'UpdateFigureDataMessageEvent',
    'ChangeNameCheckUsernameEvent': 'CheckUserNameMessageEvent',
    'ConfirmChangeNameEvent': 'ChangeUserNameMessageEvent',
    'SaveMottoEvent': 'ChangeMottoMessageEvent',
    'UserActivityEvent': 'EventLogMessageEvent',
    'SetHomeRoomEvent': 'UpdateHomeRoomMessageEvent',
    'RequestProfileFriendsEvent': 'GetRelationshipStatusInfoMessageEvent',
    'ChangeRelationEvent': 'SetRelationshipStatusMessageEvent',
    'UserNuxEvent': 'NewUserExperienceScriptProceedEvent',
    'PickNewUserGiftEvent': 'NewUserExperienceGetGiftsMessageEvent',
    'ActivateEffectEvent': 'AvatarEffectActivatedEvent',
    'EnableEffectEvent': 'AvatarEffectSelectedEvent',
    'ChangeChatBubbleEvent': 'SetChatStylePreferenceEvent',
    'SaveUserVolumesEvent': 'SetSoundSettingsEvent',
    'SavePreferOldChatEvent': 'SetChatPreferencesMessageEvent',
    'SaveIgnoreRoomInvitesEvent': 'SetIgnoreRoomInvitesMessageEvent',
    'SaveBlockCameraFollowEvent': 'SetRoomCameraPreferencesMessageEvent',
    'UpdateUIFlagsEvent': 'SetUIFlagsMessageEvent',
    'RequestClubGiftsEvent': 'GetClubGiftInfoEvent',
    'RequestTalenTrackEvent': 'GetTalentTrackMessageEvent',
    'MySanctionStatusEvent': 'GetCfhStatusMessageEvent',
    'GetHabboGuildBadgesMessageEvent': 'GetHabboGroupBadgesMessageEvent',
    'RequestRoomUserTagsEvent': 'GetUserTagsMessageEvent',
    'RequestAchievementsEvent': 'GetAchievementsEvent',

    // Friends (15 files)
    'AcceptFriendRequest': 'AcceptFriendMessageEvent',
    'DeclineFriendRequest': 'DeclineFriendMessageEvent',
    'RemoveFriendEvent': 'RemoveFriendMessageEvent',
    'FriendRequestEvent': 'RequestFriendMessageEvent',
    'RequestFriendRequestEvent': 'GetFriendRequestsMessageEvent',
    'FriendPrivateMessageEvent': 'SendMsgMessageEvent',
    'RequestFriendsEvent': 'GetMOTDMessageEvent',
    'RequestInitFriendsEvent': 'MessengerInitMessageEvent',
    'StalkFriendEvent': 'VisitUserMessageEvent',
    'InviteFriendsEvent': 'SendRoomInviteMessageEvent',
    'FindNewFriendsEvent': 'FindNewFriendsMessageEvent',
    'SearchUserEvent': 'HabboSearchMessageEvent',

    // Inventory (6 files)
    'RequestInventoryItemsEvent': 'RequestFurniInventoryEvent',
    'RequestInventoryPetsEvent': 'GetPetInventoryEvent',
    'RequestInventoryBotsEvent': 'GetBotInventoryEvent',
    'RequestInventoryBadgesEvent': 'GetBadgesEvent',
    'HotelViewInventoryEvent': 'RequestFurniInventoryWhenNotInRoomEvent',

    // Rooms (104 files)
    'RequestRoomLoadEvent': 'OpenFlatConnectionMessageEvent',
    'RequestRoomDataEvent': 'GetGuestRoomMessageEvent',
    'RequestRoomSettingsEvent': 'GetRoomSettingsMessageEvent',
    'RoomSettingsSaveEvent': 'SaveRoomSettingsMessageEvent',
    'RequestRoomRightsEvent': 'GetFlatControllersMessageEvent',
    'RoomUserGiveRightsEvent': 'AssignRightsMessageEvent',
    'RoomUserRemoveRightsEvent': 'RemoveRightsMessageEvent',
    'RoomRemoveRightsEvent': 'RemoveOwnRoomRightsRoomMessageEvent',
    'RoomRemoveAllRightsEvent': 'RemoveAllRightsMessageEvent',
    'RequestRoomHeightmapEvent': 'GetRoomEntryDataMessageEvent',
    'RequestHeightmapEvent': 'GetFurnitureAliasesMessageEvent',
    'RequestRoomBannedUsersEvent': 'GetBannedUsersFromRoomMessageEvent',
    'RequestRoomWordFilterEvent': 'GetCustomRoomFilterMessageEvent',
    'RoomWordFilterModifyEvent': 'UpdateRoomFilterMessageEvent',
    'RoomMuteEvent': 'MuteAllInRoomEvent',
    'RoomUserMuteEvent': 'RoomUserMuteMessageEvent',
    'RoomUserBanEvent': 'BanUserWithDurationMessageEvent',
    'UnbanRoomUserEvent': 'UnbanUserFromRoomMessageEvent',
    'RoomUserKickEvent': 'RoomUserKickMessageEvent',
    'HandleDoorbellEvent': 'LetUserInMessageEvent',
    'RoomBackgroundEvent': 'SetRoomBackgroundColorDataEvent',
    'RoomPlacePaintEvent': 'RequestRoomPropertySetEvent',
    'RoomUserSitEvent': 'ChangePostureMessageEvent',
    'RoomUserTalkEvent': 'ChatMessageEvent',
    'RoomUserShoutEvent': 'ShoutMessageEvent',
    'RoomUserWhisperEvent': 'WhisperMessageEvent',
    'RoomUserStartTypingEvent': 'StartTypingMessageEvent',
    'RoomUserStopTypingEvent': 'CancelTypingMessageEvent',
    'RoomUserDanceEvent': 'DanceMessageEvent',
    'RoomUserActionEvent': 'AvatarExpressionMessageEvent',
    'RoomUserWalkEvent': 'MoveAvatarMessageEvent',
    'RoomUserLookAtPoint': 'LookToMessageEvent',
    'RoomUserGiveHandItemEvent': 'PassCarryItemMessageEvent',
    'RoomUserDropHandItemEvent': 'DropCarryItemMessageEvent',
    'RoomUserGiveRespectEvent': 'RespectUserMessageEvent',
    'RoomUserSignEvent': 'SignMessageEvent',
    'RoomVoteEvent': 'RateFlatMessageEvent',
    'IgnoreRoomUserEvent': 'IgnoreUserMessageEvent',
    'UnIgnoreRoomUserEvent': 'UnignoreUserMessageEvent',
    'RequestDeleteRoomEvent': 'DeleteRoomMessageEvent',
    'RequestCreateRoomEvent': 'CreateFlatMessageEvent',
    'RequestCanCreateRoomEvent': 'CanCreateRoomMessageEvent',
    'RoomFavoriteEvent': 'AddFavouriteRoomMessageEvent',
    'RoomUnFavoriteEvent': 'DeleteFavouriteRoomMessageEvent',
    'AdvertisingSaveEvent': 'SetObjectDataMessageEvent',
    'RequestPromotionRoomsEvent': 'GetRoomAdPurchaseInfoEvent',
    'BuyRoomPromotionEvent': 'PurchaseRoomAdMessageEvent',
    'EditRoomPromotionMessageEvent': 'EditEventMessageEvent',
    'RoomStaffPickEvent': 'ToggleStaffPickMessageEvent',
    'SetStackHelperHeightEvent': 'SetCustomStackingHeightEvent',
    'ToggleFloorItemEvent': 'UseFurnitureMessageEvent',
    'ToggleWallItemEvent': 'UseWallItemMessageEvent',
    'CloseDiceEvent': 'DiceOffMessageEvent',
    'TriggerDiceEvent': 'ThrowDiceMessageEvent',
    'TriggerColorWheelEvent': 'SpinWheelOfFortuneMessageEvent',
    'TriggerOneWayGateEvent': 'EnterOneWayDoorMessageEvent',
    'MoodLightTurnOnEvent': 'RoomDimmerChangeStateMessageEvent',
    'MoodLightSettingsEvent': 'RoomDimmerGetPresetsMessageEvent',
    'MoodLightSaveSettingsEvent': 'RoomDimmerSavePresetMessageEvent',
    'HorseRideEvent': 'MountPetMessageEvent',
    'HorseRideSettingsEvent': 'TogglePetRidingPermissionMessageEvent',
    'HorseRemoveSaddleEvent': 'RemoveSaddleFromPetMessageEvent',
    'PetUseItemEvent': 'CustomizePetWithFurniEvent',
    'RequestPetTrainingPanelEvent': 'GetPetCommandsMessageEvent',
    'RequestPetInformationEvent': 'GetPetInfoMessageEvent',
    'RequestPetBreedsEvent': 'GetSellablePetPalettesEvent',
    'PetPickupEvent': 'RemovePetFromFlatMessageEvent',
    'PetPlaceEvent': 'PlacePetMessageEvent',
    'ScratchPetEvent': 'RespectPetMessageEvent',
    'MovePetEvent': 'MovePetMessageEvent',
    'PetPackageNameEvent': 'OpenPetPackageMessageEvent',
    'CheckPetNameEvent': 'ApproveNameMessageEvent',
    'ToggleMonsterplantBreedableEvent': 'TogglePetBreedingPermissionMessageEvent',
    'CompostMonsterplantEvent': 'CompostPlantMessageEvent',
    'BreedMonsterplantsEvent': 'BreedPetsMessageEvent',
    'StopBreedingEvent': 'CancelPetBreedingEvent',
    'ConfirmPetBreedingEvent': 'ConfirmPetBreedingEvent',
    'LoveLockStartConfirmEvent': 'FriendFurniConfirmLockMessageEvent',
    'FootballGateSaveLookEvent': 'SetClothingChangeDataMessageEvent',
    'MannequinSaveLookEvent': 'SetMannequinFigureEvent',
    'MannequinSaveNameEvent': 'SetMannequinNameEvent',
    'SavePostItStickyPoleEvent': 'AddSpamWallPostItMessageEvent',

    // Rooms/Items (11 files)
    'RoomPlaceItemEvent': 'PlaceObjectMessageEvent',
    'RoomPickupItemEvent': 'PickupObjectMessageEvent',
    'RotateMoveItemEvent': 'MoveObjectMessageEvent',
    'MoveWallItemEvent': 'MoveWallItemMessageEvent',
    'PostItPlaceEvent': 'PlacePostItMessageEvent',
    'PostItRequestDataEvent': 'GetItemDataMessageEvent',
    'PostItSaveDataEvent': 'SetItemDataMessageEvent',
    'PostItDeleteEvent': 'RemoveItemMessageEvent',
    'UseRandomStateItemEvent': 'SetRandomStateMessageEvent',

    // Navigator (30 files)
    'RequestNewNavigatorDataEvent': 'NewNavigatorInitEvent',
    'RequestNewNavigatorRoomsEvent': 'NewNavigatorSearchEvent',
    'SearchRoomsEvent': 'RoomTextSearchMessageEvent',
    'RequestPopularRoomsEvent': 'PopularRoomsSearchMessageEvent',
    'RequestMyRoomsEvent': 'MyRoomsSearchMessageEvent',
    'RequestHighestScoreRoomsEvent': 'RoomsWithHighestScoreSearchMessageEvent',
    'RequestPromotedRoomsEvent': 'GetUnreadForumsCountMessageEvent',
    'SearchRoomsFriendsNowEvent': 'RoomsWhereMyFriendsAreSearchMessageEvent',
    'SearchRoomsFriendsOwnEvent': 'MyFriendsRoomsSearchMessageEvent',
    'SearchRoomsVisitedEvent': 'MyRoomHistorySearchMessageEvent',
    'SearchRoomsMyFavoriteEvent': 'MyFavouriteRoomsSearchMessageEvent',
    'SearchRoomsInGroupEvent': 'MyGuildBasesSearchMessageEvent',
    'SearchRoomsWithRightsEvent': 'MyRoomRightsSearchMessageEvent',
    'RequestPublicRoomsEvent': 'GetOfficialRoomsMessageEvent',
    'RequestTagsEvent': 'GetPopularRoomTagsMessageEvent',
    'RequestRoomCategoriesEvent': 'GetUserFlatCatsMessageEvent',
    'RequestNavigatorSettingsEvent': 'GetUserEventCatsMessageEvent',
    'NavigatorCategoryListModeEvent': 'NavigatorSetSearchCodeViewModeMessageEvent',
    'NavigatorCollapseCategoryEvent': 'NavigatorAddCollapsedCategoryMessageEvent',
    'NavigatorUncollapseCategoryEvent': 'NavigatorRemoveCollapsedCategoryMessageEvent',
    'AddSavedSearchEvent': 'NavigatorAddSavedSearchEvent',
    'DeleteSavedSearchEvent': 'NavigatorDeleteSavedSearchEvent',
    'SaveWindowSettingsEvent': 'SetNewNavigatorWindowPreferencesMessageEvent',
    'NewNavigatorActionEvent': 'ForwardToSomeRoomMessageEvent',

    // Catalog (32 files)
    'RequestCatalogIndexEvent': 'BuildersClubQueryFurniCountMessageEvent',
    'RequestCatalogPageEvent': 'GetCatalogPageEvent',
    'RequestCatalogModeEvent': 'GetCatalogIndexEvent',
    'CatalogBuyItemEvent': 'PurchaseFromCatalogEvent',
    'CatalogBuyItemAsGiftEvent': 'PurchaseFromCatalogAsGiftEvent',
    'CatalogSelectClubGiftEvent': 'SelectClubGiftEvent',
    'CatalogRequestClubDiscountEvent': 'GetHabboClubExtendOfferMessageEvent',
    'CatalogBuyClubDiscountEvent': 'PurchaseVipMembershipExtensionEvent',
    'CatalogSearchedItemEvent': 'GetProductOfferEvent',
    'RequestGiftConfigurationEvent': 'GetGiftWrappingConfigurationEvent',
    'RequestDiscountEvent': 'GetBundleDiscountRulesetEvent',
    'RequestTargetOfferEvent': 'GetNextTargetedOfferEvent',
    'PurchaseTargetOfferEvent': 'PurchaseTargetedOfferEvent',
    'TargetOfferStateEvent': 'SetTargetedOfferStateEvent',
    'RedeemVoucherEvent': 'RedeemVoucherMessageEvent',
    'RecycleEvent': 'RecycleItemsMessageEvent',
    'RequestRecylerLogicEvent': 'GetRecyclerPrizesMessageEvent',
    'ReloadRecyclerEvent': 'GetRecyclerStatusMessageEvent',
    'OpenRecycleBoxEvent': 'PresentOpenMessageEvent',
    'RedeemItemEvent': 'CreditFurniRedeemMessageEvent',
    'RedeemClothingEvent': 'CustomizeAvatarWithFurniMessageEvent',
    'RequestItemInfoEvent': 'GetMarketplaceItemStatsEvent',
    'RequestSellItemEvent': 'GetMarketplaceCanMakeOfferEvent',
    'SellItemEvent': 'MakeOfferMessageEvent',
    'BuyItemEvent': 'BuyMarketplaceOfferMessageEvent',
    'GetClubDataEvent': 'GetClubOffersMessageEvent',

    // Marketplace (9 files)
    'GetMarketplaceConfigEvent': 'GetMarketplaceConfigurationMessageEvent',
    'RequestOffersEvent': 'GetMarketplaceOffersMessageEvent',
    'RequestOwnItemsEvent': 'GetMarketplaceOwnOffersMessageEvent',
    'TakeBackItemEvent': 'CancelMarketplaceOfferMessageEvent',

    // Trading (13 files)
    'TradeStartEvent': 'OpenTradingEvent',
    'TradeCloseEvent': 'CloseTradingEvent',
    'TradeAcceptEvent': 'AcceptTradingEvent',
    'TradeUnAcceptEvent': 'UnacceptTradingEvent',
    'TradeCancelEvent': 'ConfirmDeclineTradingEvent',
    'TradeOfferItemEvent': 'AddItemToTradeEvent',
    'TradeOfferMultipleItemsEvent': 'AddItemsToTradeEvent',
    'TradeCancelOfferItemEvent': 'RemoveItemFromTradeEvent',
    'TradeConfirmEvent': 'ConfirmAcceptTradingEvent',

    // Wired (5 files)
    'WiredTriggerSaveDataEvent': 'UpdateTriggerMessageEvent',
    'WiredEffectSaveDataEvent': 'UpdateActionMessageEvent',
    'WiredConditionSaveDataEvent': 'UpdateConditionMessageEvent',
    'WiredApplySetConditionsEvent': 'ApplySnapshotMessageEvent',

    // Guilds (22 files)
    'RequestGuildInfoEvent': 'GetHabboGroupDetailsMessageEvent',
    'RequestGuildMembersEvent': 'GetGuildMembersMessageEvent',
    'RequestGuildManageEvent': 'GetGuildEditInfoMessageEvent',
    'RequestGuildPartsEvent': 'GetGuildEditorDataMessageEvent',
    'RequestGuildBuyEvent': 'CreateGuildMessageEvent',
    'RequestGuildBuyRoomsEvent': 'GetGuildCreationInfoMessageEvent',
    'RequestOwnGuildsEvent': 'GetGuildMembershipsMessageEvent',
    'RequestGuildJoinEvent': 'JoinHabboGroupMessageEvent',
    'GuildAcceptMembershipEvent': 'ApproveMembershipRequestMessageEvent',
    'GuildDeclineMembershipEvent': 'RejectMembershipRequestMessageEvent',
    'GuildSetAdminEvent': 'AddAdminRightsToMemberMessageEvent',
    'GuildRemoveAdminEvent': 'RemoveAdminRightsFromMemberMessageEvent',
    'GuildRemoveMemberEvent': 'KickMemberMessageEvent',
    'GuildConfirmRemoveMemberEvent': 'GetMemberGuildItemCountMessageEvent',
    'GuildSetFavoriteEvent': 'SelectFavouriteHabboGroupMessageEvent',
    'GuildRemoveFavoriteEvent': 'DeselectFavouriteHabboGroupMessageEvent',
    'GuildDeleteEvent': 'DeactivateGuildMessageEvent',
    'GuildChangeNameDescEvent': 'UpdateGuildIdentityMessageEvent',
    'GuildChangeColorsEvent': 'UpdateGuildColorsMessageEvent',
    'GuildChangeBadgeEvent': 'UpdateGuildBadgeMessageEvent',
    'GuildChangeSettingsEvent': 'UpdateGuildSettingsMessageEvent',
    'RequestGuildFurniWidgetEvent': 'GetGuildFurniContextMenuInfoMessageEvent',

    // Guild Forums (10 files)
    'GuildForumListEvent': 'GetForumsListMessageEvent',
    'GuildForumThreadsEvent': 'GetThreadsMessageEvent',
    'GuildForumDataEvent': 'GetForumStatsMessageEvent',
    'GuildForumPostThreadEvent': 'PostMessageMessageEvent',
    'GuildForumThreadsMessagesEvent': 'GetMessagesMessageEvent',
    'GuildForumModerateMessageEvent': 'ModerateMessageMessageEvent',
    'GuildForumModerateThreadEvent': 'ModerateThreadMessageEvent',
    'GuildForumUpdateSettingsEvent': 'UpdateForumSettingsMessageEvent',
    'GuildForumThreadUpdateEvent': 'UpdateThreadMessageEvent',
    'GuildForumMarkAsReadEvent': 'UpdateForumReadMarkerMessageEvent',

    // Guides (17 files)
    'RequestGuideToolEvent': 'GuideSessionOnDutyUpdateMessageEvent',
    'RequestGuideAssistanceEvent': 'GuideSessionCreateMessageEvent',
    'GuideUserTypingEvent': 'GuideSessionIsTypingMessageEvent',
    'GuideUserMessageEvent': 'GuideSessionMessageMessageEvent',
    'GuideReportHelperEvent': 'GuideSessionReportMessageEvent',
    'GuideRecommendHelperEvent': 'GuideSessionFeedbackMessageEvent',
    'GuideInviteUserEvent': 'GuideSessionInviteRequesterMessageEvent',
    'GuideHandleHelpRequestEvent': 'GuideSessionGuideDecidesMessageEvent',
    'GuideCancelHelpRequestEvent': 'GuideSessionRequesterCancelsMessageEvent',
    'GuideVisitUserEvent': 'GuideSessionGetRequesterRoomMessageEvent',
    'GuideCloseHelpRequestEvent': 'GuideSessionResolvedMessageEvent',

    // Guardians (4 files)
    'GuardianNoUpdatesWantedEvent': 'ChatReviewGuideDetachedMessageEvent',
    'GuardianVoteEvent': 'ChatReviewGuideVoteMessageEvent',
    'GuardianAcceptRequestEvent': 'ChatReviewGuideDecidesOnOfferMessageEvent',

    // ModTool (28 files)
    'RequestReportUserBullyingEvent': 'GetGuideReportingStatusMessageEvent',
    'ReportBullyEvent': 'ChatReviewSessionCreateMessageEvent',
    'ModToolRequestUserInfoEvent': 'GetModeratorUserInfoMessageEvent',
    'ModToolRequestRoomInfoEvent': 'GetModeratorRoomInfoMessageEvent',
    'ModToolRequestRoomChatlogEvent': 'GetRoomChatlogMessageEvent',
    'ModToolRequestUserChatlogEvent': 'GetUserChatlogMessageEvent',
    'ModToolRequestIssueChatlogEvent': 'GetCfhChatlogMessageEvent',
    'ModToolRequestRoomVisitsEvent': 'GetRoomVisitsMessageEvent',
    'ModToolAlertEvent': 'ModMessageMessageEvent',
    'ModToolPickTicketEvent': 'PickIssuesMessageEvent',
    'ModToolReleaseTicketEvent': 'ReleaseIssuesMessageEvent',
    'ModToolCloseTicketEvent': 'CloseIssuesMessageEvent',
    'ModToolKickEvent': 'ModKickMessageEvent',
    'ModToolChangeRoomSettingsEvent': 'ModerateRoomMessageEvent',
    'ModToolRoomAlertEvent': 'ModeratorActionMessageEvent',
    'ModToolSanctionAlertEvent': 'ModAlertMessageEvent',
    'ModToolSanctionMuteEvent': 'ModMuteMessageEvent',
    'ModToolSanctionBanEvent': 'ModBanMessageEvent',
    'ModToolSanctionTradeLockEvent': 'ModTradingLockMessageEvent',
    'ModToolIssueChangeTopicEvent': 'ModToolSanctionEvent',
    'ModToolIssueDefaultSanctionEvent': 'CloseIssueDefaultActionMessageEvent',
    'ReportEvent': 'CallForHelpMessageEvent',
    'RequestReportRoomEvent': 'GetPendingCallsForHelpMessageEvent',
    'ReportFriendPrivateChatEvent': 'CallForHelpFromIMMessageEvent',
    'ReportThreadEvent': 'CallForHelpFromForumThreadMessageEvent',
    'ReportCommentEvent': 'CallForHelpFromForumMessageMessageEvent',
    'ReportPhotoEvent': 'CallForHelpFromPhotoMessageEvent',

    // HotelView (12 files)
    'HotelViewEvent': 'QuitMessageEvent',
    'HotelViewDataEvent': 'GetCurrentTimingCodeMessageEvent',
    'RequestNewsListEvent': 'GetPromoArticlesEvent',
    'HotelViewRequestBonusRareEvent': 'GetBonusRareInfoMessageEvent',
    'HotelViewRequestLTDAvailabilityEvent': 'GetLimitedOfferAppearingNextEvent',
    'HotelViewRequestSecondsUntilEvent': 'GetSecondsUntilMessageEvent',
    'HotelViewRequestCommunityGoalEvent': 'GetCommunityGoalProgressMessageEvent',
    'HotelViewRequestConcurrentUsersEvent': 'GetConcurrentUsersGoalProgressMessageEvent',
    'HotelViewConcurrentUsersButtonEvent': 'GetConcurrentUsersRewardMessageEvent',
    'HotelViewClaimBadgeEvent': 'RequestABadgeEvent',

    // Camera (6 files)
    'RequestCameraConfigurationEvent': 'RequestCameraConfigurationEvent',
    'CameraPurchaseEvent': 'PurchasePhotoMessageEvent',
    'CameraRoomPictureEvent': 'RenderRoomMessageEvent',
    'CameraRoomThumbnailEvent': 'RenderRoomThumbnailMessageEvent',
    'CameraPublishToWebEvent': 'PublishPhotoMessageEvent',

    // Crafting (4 files)
    'RequestCraftingRecipesEvent': 'GetCraftingRecipeEvent',
    'RequestCraftingRecipesAvailableEvent': 'GetCraftingRecipesAvailableEvent',
    'CraftingAddRecipeEvent': 'GetCraftableProductsEvent',
    'CraftingCraftItemEvent': 'CraftEvent',
    'CraftingCraftSecretEvent': 'CraftSecretEvent',

    // Jukebox (8 files)
    'JukeBoxRequestPlayListEvent': 'GetNowPlayingMessageEvent',
    'JukeBoxRequestTrackCodeEvent': 'GetOfficialSongIdMessageEvent',
    'JukeBoxRequestTrackDataEvent': 'GetSongInfoMessageEvent',
    'JukeBoxEventOne': 'GetUserSongDisksMessageEvent',
    'JukeBoxEventTwo': 'GetJukeboxPlayListMessageEvent',
    'JukeBoxAddSoundTrackEvent': 'AddJukeboxDiskEvent',
    'JukeBoxRemoveSoundTrackEvent': 'RemoveJukeboxDiskEvent',

    // Youtube (3 files)
    'YoutubeRequestPlaylists': 'GetYoutubeDisplayStatusMessageEvent',
    'YoutubeRequestStateChange': 'ControlYoutubeDisplayPlaybackMessageEvent',
    'YoutubeRequestPlaylistChange': 'SetYoutubeDisplayPlaylistMessageEvent',

    // GameCenter (9 files)
    'GameCenterRequestGamesEvent': 'GetGameListMessageEvent',
    'GameCenterRequestAccountStatusEvent': 'GetGameStatusMessageEvent',
    'GameCenterRequestGameStatusEvent': 'Game2GetAccountGameStatusMessageEvent',
    'GameCenterJoinGameEvent': 'JoinQueueMessageEvent',
    'GameCenterLeaveGameEvent': 'GameUnloadedMessageEvent',
    'GameCenterLoadGameEvent': 'GetWeeklyGameRewardWinnersEvent',
    'GameCenterEvent': 'GetWeeklyGameRewardEvent',

    // FloorPlanEditor (3 files)
    'FloorPlanEditorSaveEvent': 'UpdateFloorPropertiesMessageEvent',
    'FloorPlanEditorRequestDoorSettingsEvent': 'GetRoomEntryTileMessageEvent',
    'FloorPlanEditorRequestBlockedTilesEvent': 'GetOccupiedTilesMessageEvent',

    // AdventCalendar (2 files)
    'AdventCalendarOpenDayEvent': 'OpenCampaignCalendarDoorAsStaffEvent',
    'AdventCalendarForceOpenEvent': 'OpenCampaignCalendarDoorEvent',

    // Bots (4 files)
    'BotPlaceEvent': 'PlaceBotMessageEvent',
    'BotPickupEvent': 'RemoveBotFromFlatMessageEvent',
    'BotSettingsEvent': 'GetBotCommandConfigurationDataEvent',
    'BotSaveSettingsEvent': 'CommandBotEvent',

    // Misc (3 files)
    'UsernameEvent': 'GetIgnoredUsersMessageEvent',
    'UnknownEvent1': 'GetBadgePointLimitsEvent',
    'RentSpaceEvent': 'RentableSpaceRentMessageEvent',
    'RentSpaceCancelEvent': 'RentableSpaceCancelRentMessageEvent',
};

/**
 * Find all Java files in the incoming messages directory
 */
function findEventFiles(baseDir) {
    const results = [];
    const incomingDir = path.join(baseDir, 'src/main/java/com/eu/habbo/messages/incoming');

    if (!fs.existsSync(incomingDir)) {
        console.log(`Incoming directory not found: ${incomingDir}`);
        return results;
    }

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith('.java')) {
                results.push(fullPath);
            }
        }
    }

    walk(incomingDir);
    return results;
}

/**
 * Extract the class name from a Java file
 */
function extractClassName(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/public\s+class\s+(\w+)/);
    return match ? match[1] : null;
}

/**
 * Find all Java files in the entire src directory that might reference events
 */
function findAllJavaFiles(baseDir) {
    const results = [];
    const srcDir = path.join(baseDir, 'src/main/java');

    function walk(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith('.java')) {
                results.push(fullPath);
            }
        }
    }

    walk(srcDir);
    return results;
}

/**
 * Dry run mode - just report what would change
 */
function dryRun(baseDir) {
    console.log('=== DRY RUN MODE ===\n');

    const eventFiles = findEventFiles(baseDir);
    let renameCount = 0;
    const renames = [];

    for (const filePath of eventFiles) {
        const className = extractClassName(filePath);
        if (!className) continue;

        const newName = RENAME_MAP[className];
        if (newName) {
            const dir = path.dirname(filePath);
            const newPath = path.join(dir, newName + '.java');
            const isNoop = className === newName;

            if (isNoop) {
                console.log(`[SKIP] ${className} -> ${newName} (same name)`);
                continue;
            }

            renames.push({ oldPath: filePath, newPath, oldName: className, newName });
            console.log(`[RENAME] ${className}.java -> ${newName}.java`);
            console.log(`         ${filePath}`);
            console.log(`         -> ${newPath}`);
            renameCount++;
        }
    }

    // Check for references in other files
    console.log('\n=== REFERENCE CHECK ===\n');

    const allJavaFiles = findAllJavaFiles(baseDir);
    const refUpdates = [];

    for (const { oldName, newName } of renames) {
        for (const javaFile of allJavaFiles) {
            const content = fs.readFileSync(javaFile, 'utf-8');
            if (content.includes(oldName)) {
                refUpdates.push({ file: javaFile, oldName, newName });
            }
        }
    }

    console.log(`Files with references to update: ${refUpdates.length}`);
    for (const { file, oldName, newName } of refUpdates.slice(0, 20)) {
        console.log(`  ${file}: ${oldName} -> ${newName}`);
    }
    if (refUpdates.length > 20) {
        console.log(`  ... and ${refUpdates.length - 20} more`);
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Files to rename: ${renameCount}`);
    console.log(`Reference updates needed: ${refUpdates.length}`);
    console.log(`\nRun with --apply to execute the changes.`);
}

/**
 * Apply the renames
 */
function applyRenames(baseDir) {
    console.log('=== APPLYING RENAMES ===\n');

    const eventFiles = findEventFiles(baseDir);
    const renames = [];

    // Phase 1: Collect all renames
    for (const filePath of eventFiles) {
        const className = extractClassName(filePath);
        if (!className) continue;

        const newName = RENAME_MAP[className];
        if (newName && className !== newName) {
            const dir = path.dirname(filePath);
            const newPath = path.join(dir, newName + '.java');
            renames.push({ oldPath: filePath, newPath, oldName: className, newName });
        }
    }

    // Phase 2: Rename files and update class declarations
    for (const { oldPath, newPath, oldName, newName } of renames) {
        let content = fs.readFileSync(oldPath, 'utf-8');

        // Update the class name in the file
        content = content.replace(
            new RegExp(`\\b${oldName}\\b`, 'g'),
            newName
        );

        // Write to new path
        fs.writeFileSync(newPath, content, 'utf-8');

        // Remove old file
        fs.unlinkSync(oldPath);

        console.log(`[RENAMED] ${oldName}.java -> ${newName}.java`);
    }

    // Phase 3: Update references in all Java files
    console.log('\n=== UPDATING REFERENCES ===\n');

    const allJavaFiles = findAllJavaFiles(baseDir);
    let updatedFileCount = 0;

    for (const javaFile of allJavaFiles) {
        let content = fs.readFileSync(javaFile, 'utf-8');
        let changed = false;

        for (const { oldName, newName } of renames) {
            if (content.includes(oldName)) {
                content = content.replace(
                    new RegExp(`\\b${oldName}\\b`, 'g'),
                    newName
                );
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(javaFile, content, 'utf-8');
            updatedFileCount++;
            console.log(`[UPDATED] ${javaFile}`);
        }
    }

    // Phase 4: Update Incoming.java enum constants
    const incomingPath = path.join(baseDir, 'src/main/java/com/eu/habbo/messages/incoming/Incoming.java');
    if (fs.existsSync(incomingPath)) {
        let incomingContent = fs.readFileSync(incomingPath, 'utf-8');
        let changed = false;

        for (const { oldName, newName } of renames) {
            if (incomingContent.includes(oldName)) {
                incomingContent = incomingContent.replace(
                    new RegExp(`\\b${oldName}\\b`, 'g'),
                    newName
                );
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(incomingPath, incomingContent, 'utf-8');
            console.log(`\n[UPDATED] Incoming.java`);
        }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Files renamed: ${renames.length}`);
    console.log(`Reference files updated: ${updatedFileCount}`);
}

// Main
const args = process.argv.slice(2);
const baseDir = path.resolve(__dirname);
const isApply = args.includes('--apply');

if (isApply) {
    applyRenames(baseDir);
} else {
    dryRun(baseDir);
}
