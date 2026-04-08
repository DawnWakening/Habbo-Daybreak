const fs = require('fs');
const path = require('path');

// Complete rename mapping from GitHub Issue #55
const RENAME_MAP = {
    // Handshake (9 files)
    'SecureLoginOKComposer': 'AuthenticationOKMessageComposer',
    'InitDiffieHandshakeComposer': 'InitDiffieHandshakeMessageComposer',
    'CompleteDiffieHandshakeComposer': 'CompleteDiffieHandshakeMessageComposer',
    'PongComposer': 'LatencyPingResponseMessageComposer',
    'MachineIDComposer': 'UniqueMachineIDMessageComposer',
    'AvailabilityStatusMessageComposer': 'AvailabilityStatusMessageComposer',
    'EnableNotificationsComposer': 'InfoFeedEnableMessageComposer',
    'ConnectionErrorComposer': 'ErrorReportMessageComposer',
    'PingComposer': 'PingMessageComposer',

    // Users (22 files)
    'UserDataComposer': 'UserObjectMessageComposer',
    'UserProfileComposer': 'ExtendedProfileMessageComposer',
    'UserCreditsComposer': 'CreditBalanceMessageComposer',
    'UserCurrencyComposer': 'ActivityPointsMessageComposer',
    'UserPointsComposer': 'HabboActivityPointNotificationMessageComposer',
    'UserAchievementScoreComposer': 'AchievementsScoreMessageComposer',
    'UserBadgesComposer': 'UserBadgesMessageComposer',
    'UserClothesComposer': 'FigureSetIdsMessageComposer',
    'UserWardrobeComposer': 'WardrobeMessageComposer',
    'UserHomeRoomComposer': 'NavigatorSettingsMessageComposer',
    'UserClubComposer': 'ScrSendUserInfoMessageComposer',
    'UserCitizinShipComposer': 'TalentTrackLevelMessageComposer',
    'UserPerksComposer': 'PerkAllowancesMessageComposer',
    'UserPermissionsComposer': 'UserRightsMessageComposer',
    'UpdateUserLookComposer': 'FigureUpdateMessageComposer',
    'MeMenuSettingsComposer': 'AccountPreferencesMessageComposer',
    'AddUserBadgeComposer': 'BadgeReceivedMessageComposer',
    'ChangeNameUpdateComposer': 'ChangeUserNameResultMessageComposer',
    'ClubGiftReceivedComposer': 'ClubGiftSelectedMessageComposer',
    'FavoriteRoomsCountComposer': 'FavouritesMessageComposer',
    'MutedWhisperComposer': 'RemainingMutePeriodMessageComposer',
    'ProfileFriendsComposer': 'RelationshipStatusInfoMessageComposer',

    // Friends (12 files)
    'FriendsComposer': 'FriendListFragmentMessageComposer',
    'FriendRequestComposer': 'NewFriendRequestMessageComposer',
    'FriendRequestErrorComposer': 'MessengerErrorMessageComposer',
    'MessengerInitComposer': 'MessengerInitMessageComposer',
    'LoadFriendRequestsComposer': 'FriendRequestsMessageComposer',
    'FriendChatMessageComposer': 'NewConsoleMessageMessageComposer',
    'FriendFindingRoomComposer': 'FindFriendsProcessResultMessageComposer',
    'FriendNotificationComposer': 'FriendNotificationMessageComposer',
    'UpdateFriendComposer': 'FriendListUpdateMessageComposer',
    'StalkErrorComposer': 'FollowFriendFailedMessageComposer',
    'RoomInviteComposer': 'RoomInviteMessageComposer',
    'RoomInviteErrorComposer': 'RoomInviteErrorMessageComposer',

    // Inventory (17 files)
    'InventoryItemsComposer': 'FurniListMessageComposer',
    'InventoryPetsComposer': 'PetInventoryMessageComposer',
    'InventoryBotsComposer': 'BotInventoryMessageComposer',
    'InventoryBadgesComposer': 'BadgesMessageComposer',
    'InventoryAchievementsComposer': 'BadgePointLimitsMessageComposer',
    'InventoryRefreshComposer': 'FurniListInvalidateMessageComposer',
    'InventoryItemUpdateComposer': 'FurniListAddOrUpdateMessageComposer',
    'AddHabboItemComposer': 'UnseenItemsMessageComposer',
    'AddPetComposer': 'PetAddedToInventoryMessageComposer',
    'AddBotComposer': 'BotAddedToInventoryMessageComposer',
    'RemoveHabboItemComposer': 'FurniListRemoveMessageComposer',
    'RemovePetComposer': 'PetRemovedFromInventoryMessageComposer',
    'RemoveBotComposer': 'BotRemovedFromInventoryMessageComposer',
    'UserEffectsListComposer': 'AvatarEffectsMessageComposer',
    'EffectsListAddComposer': 'AvatarEffectAddedMessageComposer',
    'EffectsListEffectEnableComposer': 'AvatarEffectActivatedMessageComposer',
    'EffectsListRemoveComposer': 'AvatarEffectExpiredMessageComposer',

    // Rooms (38 files)
    'RoomDataComposer': 'GetGuestRoomResultMessageComposer',
    'RoomOpenComposer': 'OpenConnectionMessageComposer',
    'RoomSettingsComposer': 'RoomSettingsDataMessageComposer',
    'RoomSettingsSavedComposer': 'RoomSettingsSavedMessageComposer',
    'RoomSettingsUpdatedComposer': 'RoomInfoUpdatedMessageComposer',
    'RoomEditSettingsErrorComposer': 'RoomSettingsSaveErrorMessageComposer',
    'RoomEnterErrorComposer': 'CantConnectMessageComposer',
    'RoomRightsComposer': 'YouAreControllerMessageComposer',
    'RoomRightsListComposer': 'FlatControllersMessageComposer',
    'RoomAddRightsListComposer': 'FlatControllerAddedMessageComposer',
    'RoomRemoveRightsListComposer': 'FlatControllerRemovedMessageComposer',
    'RoomBannedUsersComposer': 'BannedUsersFromRoomMessageComposer',
    'RoomFilterWordsComposer': 'RoomFilterSettingsMessageComposer',
    'RoomMutedComposer': 'MuteAllInRoomMessageComposer',
    'RoomOwnerComposer': 'YouAreOwnerMessageComposer',
    'RoomPaneComposer': 'RoomEntryInfoMessageComposer',
    'RoomModelComposer': 'RoomReadyMessageComposer',
    'RoomHeightMapComposer': 'FloorHeightMapMessageComposer',
    'RoomRelativeMapComposer': 'HeightMapMessageComposer',
    'RoomPaintComposer': 'RoomPropertyMessageComposer',
    'RoomScoreComposer': 'RoomRatingMessageComposer',
    'RoomChatSettingsComposer': 'RoomChatSettingsMessageComposer',
    'RoomThicknessComposer': 'RoomVisualizationSettingsMessageComposer',
    'ForwardToRoomComposer': 'RoomForwardMessageComposer',
    'ConvertedForwardToRoomComposer': 'ConvertedRoomIdMessageComposer',
    'FavoriteRoomChangedComposer': 'FavouriteChangedMessageComposer',
    'FloodCounterComposer': 'FloodControlMessageComposer',
    'DoorbellAddUserComposer': 'DoorbellMessageComposer',
    'HideDoorbellComposer': 'FlatAccessibleMessageComposer',
    'RoomAccessDeniedComposer': 'FlatAccessDeniedMessageComposer',
    'RoomNoRightsComposer': 'YouAreNotControllerMessageComposer',
    'RoomCreatedComposer': 'FlatCreatedMessageComposer',
    'RoomCategoriesComposer': 'UserFlatCatsMessageComposer',
    'RoomUserRemoveComposer': 'UserRemoveMessageComposer',
    'RoomUserUnbannedComposer': 'UserUnbannedFromRoomMessageComposer',
    'TagsComposer': 'PopularRoomTagsResultMessageComposer',
    'PrivateRoomsComposer': 'GuestRoomSearchResultMessageComposer',
    'OldPublicRoomsComposer': 'OfficialRoomsMessageComposer',

    // Rooms/Users (20 files)
    'RoomUsersComposer': 'UsersMessageComposer',
    'RoomUserStatusComposer': 'UserUpdateMessageComposer',
    'RoomUserDanceComposer': 'DanceMessageComposer',
    'RoomUserTalkComposer': 'ChatMessageComposer',
    'RoomUserShoutComposer': 'ShoutMessageComposer',
    'RoomUserWhisperComposer': 'WhisperMessageComposer',
    'RoomUserTypingComposer': 'UserTypingMessageComposer',
    'RoomUserEffectComposer': 'AvatarEffectMessageComposer',
    'RoomUserActionComposer': 'ExpressionMessageComposer',
    'RoomUserDataComposer': 'UserChangeMessageComposer',
    'RoomUserHandItemComposer': 'CarryObjectMessageComposer',
    'RoomUserReceivedHandItemComposer': 'HandItemReceivedMessageComposer',
    'RoomUserRespectComposer': 'RoomUserRespectMessageComposer',
    'RoomUserNameChangedComposer': 'UserNameChangedMessageComposer',
    'RoomUserRemoveRightsComposer': 'NoSuchFlatMessageComposer',
    'RoomUserIgnoredComposer': 'IgnoreResultMessageComposer',
    'RoomUserTagsComposer': 'UserTagsMessageComposer',
    'RoomUsersGuildBadgesComposer': 'HabboGroupBadgesMessageComposer',
    'RoomUnitIdleComposer': 'SleepMessageComposer',
    'RoomUnitOnRollerComposer': 'SlideObjectBundleMessageComposer',

    // Rooms/Items (17 files)
    'AddFloorItemComposer': 'ObjectAddMessageComposer',
    'AddWallItemComposer': 'ItemAddMessageComposer',
    'RemoveFloorItemComposer': 'ObjectRemoveMessageComposer',
    'RemoveWallItemComposer': 'ItemRemoveMessageComposer',
    'FloorItemUpdateComposer': 'ObjectUpdateMessageComposer',
    'WallItemUpdateComposer': 'ItemUpdateMessageComposer',
    'RoomFloorItemsComposer': 'ObjectsMessageComposer',
    'RoomWallItemsComposer': 'ItemsMessageComposer',
    'ItemStateComposer': 'OneWayDoorStatusMessageComposer',
    'ItemExtraDataComposer': 'ObjectDataUpdateMessageComposer',
    'ItemsDataUpdateComposer': 'ObjectsDataUpdateMessageComposer',
    'PostItDataComposer': 'ItemDataUpdateMessageComposer',
    'PostItStickyPoleOpenComposer': 'RequestSpamWallPostItMessageComposer',
    'PresentItemOpenedComposer': 'PresentOpenedMessageComposer',
    'MoodLightDataComposer': 'RoomDimmerPresetsMessageComposer',
    'UpdateStackHeightComposer': 'HeightMapUpdateMessageComposer',
    'UpdateStackHeightTileHeightComposer': 'CustomStackingHeightUpdateMessageComposer',

    // Rooms/Pets (14 files)
    'PetInformationComposer': 'PetInfoMessageComposer',
    'PetStatusUpdateComposer': 'PetStatusUpdateMessageComposer',
    'PetLevelUpComposer': 'PetLevelNotificationMessageComposer',
    'PetLevelUpdatedComposer': 'PetLevelUpdateMessageComposer',
    'PetTrainingPanelComposer': 'PetTrainingPanelMessageComposer',
    'PetPackageComposer': 'FurnitureAliasesMessageComposer',
    'PetPackageNameValidationComposer': 'OpenPetPackageResultMessageComposer',
    'PetNameErrorComposer': 'ApproveNameMessageComposer',
    'CantScratchPetNotOldEnoughComposer': 'PetRespectFailedMessageComposer',
    'RoomPetComposer': 'PetFigureUpdateMessageComposer',
    'RoomPetExperienceComposer': 'PetExperienceMessageComposer',
    'RoomPetRespectComposer': 'PetRespectNotificationMessageComposer',
    'PetBreedsComposer': 'SellablePetPalettesMessageComposer',
    'PetBoughtNotificationComposer': 'PetReceivedMessageComposer',

    // Rooms/Pets/Breeding (4 files)
    'PetBreedingResultComposer': 'ConfirmBreedingRequestMessageComposer',
    'PetBreedingStartComposer': 'PetBreedingMessageComposer',
    'PetBreedingFailedComposer': 'ConfirmBreedingResultMessageComposer',
    'PetBreedingStartFailedComposer': 'GoToBreedingNestFailureMessageComposer',

    // Catalog (22 files)
    'CatalogPageComposer': 'CatalogPageMessageComposer',
    'CatalogPagesListComposer': 'CatalogPagesListMessageComposer',
    'CatalogSearchResultComposer': 'ProductOfferMessageComposer',
    'CatalogUpdatedComposer': 'CatalogPublishedMessageComposer',
    'CatalogModeComposer': 'BuildersClubFurniCountMessageComposer',
    'PurchaseOKComposer': 'PurchaseOKMessageComposer',
    'RedeemVoucherOKComposer': 'VoucherRedeemOkMessageComposer',
    'RedeemVoucherErrorComposer': 'VoucherRedeemErrorMessageComposer',
    'GiftConfigurationComposer': 'GiftWrappingConfigurationMessageComposer',
    'GiftReceiverNotFoundComposer': 'GiftReceiverNotFoundMessageComposer',
    'NotEnoughPointsTypeComposer': 'NotEnoughBalanceMessageComposer',
    'AlertLimitedSoldOutComposer': 'LimitedEditionSoldOutMessageComposer',
    'AlertPurchaseFailedComposer': 'PurchaseErrorMessageComposer',
    'AlertPurchaseUnavailableComposer': 'PurchaseNotAllowedMessageComposer',
    'ClubDataComposer': 'HabboClubOffersMessageComposer',
    'ClubCenterDataComposer': 'ScrSendKickbackInfoMessageComposer',
    'ClubGiftsComposer': 'ClubGiftInfoMessageComposer',
    'DiscountComposer': 'BundleDiscountRulesetMessageComposer',
    'TargetedOfferComposer': 'TargetedOfferMessageComposer',
    'RecyclerCompleteComposer': 'RecyclerFinishedMessageComposer',
    'RecyclerLogicComposer': 'RecyclerPrizesMessageComposer',
    'ReloadRecyclerComposer': 'RecyclerStatusMessageComposer',

    // Catalog/Marketplace (8 files)
    'MarketplaceConfigComposer': 'MarketplaceConfigurationMessageComposer',
    'MarketplaceOffersComposer': 'MarketPlaceOffersMessageComposer',
    'MarketplaceOwnItemsComposer': 'MarketPlaceOwnOffersMessageComposer',
    'MarketplaceItemInfoComposer': 'MarketplaceItemStatsMessageComposer',
    'MarketplaceItemPostedComposer': 'MarketplaceMakeOfferResultMessageComposer',
    'MarketplaceBuyErrorComposer': 'MarketplaceBuyOfferResultMessageComposer',
    'MarketplaceCancelSaleComposer': 'MarketplaceCancelOfferResultMessageComposer',
    'MarketplaceSellItemComposer': 'MarketplaceCanMakeOfferResultMessageComposer',

    // Navigator (12 files)
    'NewNavigatorMetaDataComposer': 'NavigatorMetaDataMessageComposer',
    'NewNavigatorSearchResultsComposer': 'NavigatorSearchResultBlocksMessageComposer',
    'NewNavigatorSettingsComposer': 'NewNavigatorPreferencesMessageComposer',
    'NewNavigatorCollapsedCategoriesComposer': 'CollapsedCategoriesMessageComposer',
    'NewNavigatorSavedSearchesComposer': 'NavigatorSavedSearchesMessageComposer',
    'NewNavigatorLiftedRoomsComposer': 'NavigatorLiftedRoomsMessageComposer',
    'NewNavigatorEventCategoriesComposer': 'UserEventCatsMessageComposer',
    'NewNavigatorCategoryUserCountComposer': 'CategoriesWithVisitorCountMessageComposer',
    'CanCreateRoomComposer': 'CanCreateRoomMessageComposer',
    'CanCreateEventComposer': 'CanCreateRoomEventMessageComposer',
    'PromoteOwnRoomsRoomsListComposer': 'RoomAdPurchaseInfoMessageComposer',
    'PromoteOwnRoomsListComposer': 'RoomAdPurchaseInfoMessageComposer',
    'RemoveRoomEventComposer': 'RoomEventCancelMessageComposer',

    // HotelView (12 files)
    'HotelViewComposer': 'CloseConnectionMessageComposer',
    'HotelViewDataComposer': 'CurrentTimingCodeMessageComposer',
    'HotelViewCommunityGoalComposer': 'CommunityGoalProgressMessageComposer',
    'HotelViewConcurrentUsersComposer': 'ConcurrentUsersGoalProgressMessageComposer',
    'HotelViewBadgeButtonConfigComposer': 'IsBadgeRequestFulfilledMessageComposer',
    'HotelViewCatalogPageExpiringComposer': 'CatalogPageExpirationMessageComposer',
    'HotelViewNextLTDAvailableComposer': 'LimitedOfferAppearingNextMessageComposer',
    'HotelViewSecondsUntilComposer': 'SecondsUntilMessageComposer',
    'BonusRareComposer': 'BonusRareInfoMessageComposer',
    'HallOfFameComposer': 'CommunityGoalHallOfFameMessageComposer',
    'NewsWidgetsComposer': 'PromoArticlesMessageComposer',
    'HotelViewExpiringCatalogPageCommposer': 'CatalogPageWithEarliestExpiryMessageComposer',

    // Wired (6 files)
    'WiredTriggerDataComposer': 'WiredTriggerDataMessageComposer',
    'WiredEffectDataComposer': 'WiredEffectDataMessageComposer',
    'WiredConditionDataComposer': 'WiredConditionDataMessageComposer',
    'WiredSavedComposer': 'WiredSavedMessageComposer',
    'WiredRewardAlertComposer': 'WiredRewardResultMessageComposer',
    'WiredOpenComposer': 'OpenMessageComposer',

    // Polls (5 files)
    'PollStartComposer': 'PollOfferMessageComposer',
    'PollQuestionsComposer': 'PollContentsMessageComposer',
    'SimplePollStartComposer': 'QuestionMessageComposer',
    'SimplePollAnswerComposer': 'QuestionAnsweredMessageComposer',
    'SimplePollAnswersComposer': 'QuestionFinishedMessageComposer',

    // Trading (9 files)
    'TradeStartComposer': 'TradingOpenMessageComposer',
    'TradeCloseWindowComposer': 'TradingCompletedMessageComposer',
    'TradeStoppedComposer': 'TradingCloseMessageComposer',
    'TradeStartFailComposer': 'TradingOpenFailedMessageComposer',
    'TradeAcceptedComposer': 'TradingAcceptMessageComposer',
    'TradeUpdateComposer': 'TradingItemListMessageComposer',
    'TradingWaitingConfirmComposer': 'TradingConfirmationMessageComposer',
    'OtherTradingDisabledComposer': 'TradingOtherNotAllowedMessageComposer',
    'YouTradingDisabledComposer': 'TradingYouAreNotAllowedMessageComposer',

    // Achievements (4 files)
    'AchievementListComposer': 'AchievementsMessageComposer',
    'AchievementProgressComposer': 'AchievementMessageComposer',
    'AchievementUnlockedComposer': 'HabboAchievementNotificationMessageComposer',
    'AchievementsConfigurationComposer': 'GameAchievementsMessageComposer',

    // Talent Track (4 files)
    'TalentTrackComposer': 'TalentTrackMessageComposer',
    'TalentLevelUpdateComposer': 'TalentLevelUpMessageComposer',
    'TalentTrackEmailVerifiedComposer': 'EmailStatusResultMessageComposer',
    'TalentTrackEmailFailedComposer': 'ChangeEmailResultMessageComposer',

    // Guilds (17 files)
    'GuildListComposer': 'GuildMembershipsMessageComposer',
    'GuildInfoComposer': 'HabboGroupDetailsMessageComposer',
    'GuildMembersComposer': 'GuildMembersMessageComposer',
    'GuildMemberUpdateComposer': 'GuildMembershipUpdatedMessageComposer',
    'GuildManageComposer': 'GuildEditInfoMessageComposer',
    'GuildPartsComposer': 'GuildEditorDataMessageComposer',
    'GuildBoughtComposer': 'GuildCreatedMessageComposer',
    'GuildBuyRoomsComposer': 'GuildCreationInfoMessageComposer',
    'GuildJoinErrorComposer': 'HabboGroupJoinFailedMessageComposer',
    'GuildAcceptMemberErrorComposer': 'GuildMemberMgmtFailedMessageComposer',
    'GuildConfirmRemoveMemberComposer': 'GuildMemberFurniCountInHQMessageComposer',
    'GuildEditFailComposer': 'GuildEditFailedMessageComposer',
    'GuildFavoriteRoomUserUpdateComposer': 'FavoriteMembershipUpdateMessageComposer',
    'GuildRefreshMembersListComposer': 'GuildMembershipRejectedMessageComposer',
    'RemoveGuildFromRoomComposer': 'HabboGroupDeactivatedMessageComposer',
    'GuildFurniWidgetComposer': 'GuildFurniContextMenuInfoMessageComposer',
    'GuildMembershipRequestedComposer': 'GroupMembershipRequestedMessageComposer',

    // Guild Forums (9 files)
    'GuildForumListComposer': 'ForumsListMessageComposer',
    'GuildForumDataComposer': 'ForumDataMessageComposer',
    'GuildForumThreadsComposer': 'GuildForumThreadsMessageComposer',
    'GuildForumThreadMessagesComposer': 'PostThreadMessageMessageComposer',
    'GuildForumCommentsComposer': 'ThreadMessagesMessageComposer',
    'GuildForumAddCommentComposer': 'PostMessageMessageComposer',
    'GuildForumsUnreadMessagesCountComposer': 'UnreadForumsCountMessageComposer',
    'PostUpdateMessageComposer': 'UpdateMessageMessageComposer',
    'ThreadUpdateMessageComposer': 'UpdateThreadMessageComposer',

    // Guides (11 files)
    'GuideSessionAttachedComposer': 'GuideSessionAttachedMessageComposer',
    'GuideSessionDetachedComposer': 'GuideSessionDetachedMessageComposer',
    'GuideSessionStartedComposer': 'GuideSessionStartedMessageComposer',
    'GuideSessionEndedComposer': 'GuideSessionEndedMessageComposer',
    'GuideSessionErrorComposer': 'GuideSessionErrorMessageComposer',
    'GuideSessionMessageComposer': 'GuideSessionMessageMessageComposer',
    'GuideSessionRequesterRoomComposer': 'GuideSessionRequesterRoomMessageComposer',
    'GuideSessionInvitedToGuideRoomComposer': 'GuideSessionInvitedToGuideRoomMessageComposer',
    'GuideSessionPartnerIsTypingComposer': 'GuideSessionPartnerIsTypingMessageComposer',
    'GuideSessionPartnerIsPlayingComposer': 'YouArePlayingGameMessageComposer',
    'GuideToolsComposer': 'GuideOnDutyStatusMessageComposer',

    // Guardians (5 files)
    'GuardianNewReportReceivedComposer': 'ChatReviewSessionOfferedToGuideMessageComposer',
    'GuardianVotingRequestedComposer': 'ChatReviewSessionStartedMessageComposer',
    'GuardianVotingVotesComposer': 'ChatReviewSessionVotingStatusMessageComposer',
    'GuardianVotingResultComposer': 'ChatReviewSessionResultsMessageComposer',
    'GuardianVotingTimeEnded': 'ChatReviewSessionDetachedMessageComposer',

    // HabboWay/NUX (4 files)
    'NuxAlertComposer': 'InClientLinkMessageComposer',
    'NewUserGiftComposer': 'NewUserExperienceGiftOfferMessageComposer',
    'NewUserIdentityComposer': 'NoobnessLevelMessageComposer',
    'VipTutorialsStartComposer': 'CitizenshipVipOfferPromoEnabledMessageComposer',

    // Events/Calendar (2 files)
    'AdventCalendarDataComposer': 'CampaignCalendarDataMessageComposer',
    'AdventCalendarProductComposer': 'CampaignCalendarDoorOpenedMessageComposer',

    // Generic/Alerts (19 files)
    'GenericAlertComposer': 'HabboBroadcastMessageComposer',
    'BubbleAlertComposer': 'NotificationDialogMessageComposer',
    'CustomNotificationComposer': 'CustomUserNotificationMessageComposer',
    'GenericErrorMessages': 'GenericErrorMessageComposer',
    'HotelClosedAndOpensComposer': 'HotelClosedAndOpensMessageComposer',
    'HotelClosesAndWillOpenAtComposer': 'HotelClosesAndWillOpenAtMessageComposer',
    'HotelWillCloseInMinutesComposer': 'HotelWillCloseInMinutesMessageComposer',
    'HotelWillCloseInMinutesAndBackInComposer': 'MaintenanceStatusMessageComposer',
    'StaffAlertAndOpenHabboWayComposer': 'UserBannedMessageComposer',
    'StaffAlertWithLinkComposer': 'ModeratorMessageComposer',
    'StaffAlertWIthLinkAndOpenHabboWayComposer': 'ModeratorCautionMessageComposer',
    'UpdateFailedComposer': 'WiredValidationErrorMessageComposer',
    'PickMonthlyClubGiftNotificationComposer': 'ClubGiftNotificationMessageComposer',
    'MinimailCountComposer': 'MiniMailUnreadCountMessageComposer',
    'MessagesForYouComposer': 'MOTDNotificationMessageComposer',
    'PetErrorComposer': 'PetPlacingErrorMessageComposer',
    'BotErrorComposer': 'BotErrorMessageComposer',
    'EpicPopupFrameComposer': 'EpicPopupMessageComposer',
    'MostUselessErrorAlertComposer': 'PollErrorMessageComposer',

    // Crafting (4 files)
    'CraftableProductsComposer': 'CraftableProductsMessageComposer',
    'CraftingRecipeComposer': 'CraftingRecipeMessageComposer',
    'CraftingResultComposer': 'CraftingResultMessageComposer',
    'CraftingComposerFour': 'CraftingRecipesAvailableMessageComposer',

    // Camera (6 files)
    'CameraCompetitionStatusComposer': 'CompetitionStatusMessageComposer',
    'CameraPriceComposer': 'InitCameraMessageComposer',
    'CameraPublishWaitMessageComposer': 'CameraPublishStatusMessageComposer',
    'CameraPurchaseSuccesfullComposer': 'CameraPurchaseOKMessageComposer',
    'CameraRoomThumbnailSavedComposer': 'ThumbnailStatusMessageComposer',
    'CameraURLComposer': 'CameraStorageUrlMessageComposer',

    // MysteryBox (2 files)
    'MysteryBoxKeysComposer': 'MysteryBoxKeysMessageComposer',
    'MysticBoxPrizeComposer': 'GotMysteryBoxPrizeMessageComposer',

    // GameCenter (13 files)
    'GameCenterAccountInfoComposer': 'Game2AccountGameStatusMessageComposer',
    'GameCenterGameListComposer': 'GameListMessageComposer',
    'GameCenterGameComposer': 'GameStatusMessageComposer',
    'GameCenterFeaturedPlayersComposer': 'WeeklyGameRewardWinnersMessageComposer',
    'BaseJumpJoinQueueComposer': 'JoinedQueueMessageComposer',
    'BaseJumpLeaveQueueComposer': 'LeftQueueMessageComposer',
    'BaseJumpLoadGameComposer': 'LoadGameMessageMessageComposer',
    'BaseJumpLoadGameURLComposer': 'LoadGameUrlMessageComposer',
    'BaseJumpUnloadGameComposer': 'UnloadGameMessageComposer',
    'Game2WeeklyLeaderboardComposer': 'Game2WeeklyLeaderboardMessageComposer',
    'Game2WeeklySmallLeaderboardComposer': 'WeeklyCompetitiveLeaderboardMessageComposer',
    'UnknowComposer_1390': 'Game2WeeklyFriendsLeaderboardMessageComposer',
    'GameAchievementsListComposer': 'UserGameAchievementsMessageComposer',

    // ModTool (17 files)
    'ModToolUserInfoComposer': 'ModeratorUserInfoMessageComposer',
    'ModToolRoomChatlogComposer': 'RoomChatlogMessageComposer',
    'ModToolUserChatlogComposer': 'UserChatlogMessageComposer',
    'ModToolRoomInfoComposer': 'ModeratorRoomInfoMessageComposer',
    'ModToolIssueInfoComposer': 'IssueInfoMessageComposer',
    'ModToolIssueChatlogComposer': 'CfhChatlogMessageComposer',
    'ModToolSanctionInfoComposer': 'SanctionStatusMessageComposer',
    'ModToolSanctionDataComposer': 'CfhSanctionMessageComposer',
    'ModToolIssueHandledComposer': 'IssueCloseNotificationMessageComposer',
    'ModToolIssueUpdateComposer': 'IssuePickFailedMessageComposer',
    'ModToolIssueResponseAlertComposer': 'CallForHelpReplyMessageComposer',
    'ModToolReportReceivedAlertComposer': 'CallForHelpResultMessageComposer',
    'ModToolComposer': 'ModeratorInitMessageComposer',
    'ModToolComposerOne': 'IssueDeletedMessageComposer',
    'ModToolComposerTwo': 'ModeratorActionResultMessageComposer',
    'ModToolIssueHandlerDimensionsComposer': 'ModeratorToolPreferencesMessageComposer',
    'CfhTopicsMessageComposer': 'CfhTopicsInitMessageComposer',

    // Quests (7 files)
    'QuestsComposer': 'QuestsMessageComposer',
    'QuestComposer': 'QuestMessageComposer',
    'QuestCompletedComposer': 'QuestCompletedMessageComposer',
    'QuestExpiredComposer': 'QuestCancelledMessageComposer',
    'DailyQuestComposer': 'QuestDailyMessageComposer',
    'IsFirstLoginOfDayComposer': 'IsFirstLoginOfDayMessageComposer',
    'UnknownQuestComposer3': 'SeasonalQuestsMessageComposer',

    // Verification/Gifts (6 files)
    'VerifyMobilePhoneWindowComposer': 'PhoneCollectionStateMessageComposer',
    'VerifyMobilePhoneCodeWindowComposer': 'TryPhoneNumberResultMessageComposer',
    'VerifyMobilePhoneDoneComposer': 'TryVerificationCodeResultMessageComposer',
    'VerifyMobileNumberComposer': 'NewUserExperienceNotCompleteMessageComposer',
    'WelcomeGiftComposer': 'WelcomeGiftStatusMessageComposer',
    'WelcomeGiftErrorComposer': 'WelcomeGiftChangeEmailResultMessageComposer',

    // Jukebox (8 files)
    'JukeBoxPlayListComposer': 'JukeboxSongDisksMessageComposer',
    'JukeBoxNowPlayingMessageComposer': 'NowPlayingMessageComposer',
    'JukeBoxPlayListFullComposer': 'JukeboxPlayListFullMessageComposer',
    'JukeBoxPlayListUpdatedComposer': 'PlayListMessageComposer',
    'JukeBoxPlayListAddSongComposer': 'PlayListSongAddedMessageComposer',
    'JukeBoxMySongsComposer': 'UserSongDisksInventoryMessageComposer',
    'JukeBoxTrackDataComposer': 'TraxSongInfoMessageComposer',
    'JukeBoxTrackCodeComposer': 'OfficialSongIdMessageComposer',

    // Youtube (3 files)
    'YoutubeDisplayListComposer': 'YoutubeDisplayPlaylistsMessageComposer',
    'YoutubeMessageComposer2': 'YoutubeDisplayVideoMessageComposer',
    'YoutubeMessageComposer3': 'YoutubeControlVideoMessageComposer',

    // LoveLock (3 files)
    'LoveLockFurniStartComposer': 'FriendFurniStartConfirmationMessageComposer',
    'LoveLockFurniFriendConfirmedComposer': 'FriendFurniOtherLockConfirmedMessageComposer',
    'LoveLockFurniFinishedComposer': 'FriendFurniCancelLockMessageComposer',

    // Misc/Other (44 files)
    'IgnoredUsersComposer': 'IgnoredUsersMessageComposer',
    'UserClassificationComposer': 'UserClassificationMessageComposer',
    'HabboMallComposer': 'TargetedOfferNotFoundMessageComposer',
    'ErrorLoginComposer': 'DisconnectReasonMessageComposer',
    'CloseWebPageComposer': 'RestoreClientMessageComposer',
    'UnknownStatusComposer': 'AccountSafetyLockStatusChangeMessageComposer',
    'UnknownHintComposer': 'ElementPointerMessageComposer',
    'UnknownGuild2Composer': 'GroupDetailsChangedMessageComposer',
    'UnknownGuildComposer3': 'ExtendedProfileChangedMessageComposer',
    'UnknownMessengerErrorComposer': 'InstantMessageErrorMessageComposer',
    'UnknownRoomViewerComposer': 'IdentityAccountsMessageComposer',
    'UnknownRoomDesktopComposer': 'BotSkillListUpdateMessageComposer',
    'UnknownFurniModelComposer': 'PostItPlacedMessageComposer',
    'UnknownAdManagerComposer': 'InterstitialMessageComposer',
    'UnknownCatalogPageOfferComposer': 'SeasonalCalendarDailyOfferMessageComposer',
    'UnknownHabboWayQuizComposer': 'QuizResultsMessageComposer',
    'UnknownHelperComposer': 'CallForHelpPendingCallsDeletedMessageComposer',
    'UnknownCompetitionComposer': 'CompetitionVotingInfoMessageComposer',
    'RentableSpaceInfoComposer': 'RentableSpaceStatusMessageComposer',
    'RentableSpaceUnknownComposer': 'RentableSpaceRentOkMessageComposer',
    'RentableSpaceUnknown2Composer': 'RentableSpaceRentFailedMessageComposer',
    'RentableItemBuyOutPriceComposer': 'FurniRentOrBuyoutOfferMessageComposer',
    'BuildersClubExpiredComposer': 'BuildersClubSubscriptionStatusMessageComposer',
    'ExtendClubMessageComposer': 'HabboClubExtendOfferMessageComposer',
    'CompetitionEntrySubmitResultComposer': 'CompetitionEntrySubmitResultMessageComposer',
    'SubmitCompetitionRoomComposer': 'IsUserPartOfCompetitionMessageComposer',
    'RoomCategoryUpdateMessageComposer': 'ShowEnforceRoomCategoryDialogMessageComposer',
    'RoomEventMessageComposer': 'RoomEventMessageComposer',
    'RoomMessagesPostedCountComposer': 'RoomMessageNotificationMessageComposer',
    'RoomQueueStatusMessage': 'RoomQueueStatusMessageComposer',
    'RoomUnknown3Composer': 'YouAreSpectatorMessageComposer',
    'RoomAdErrorComposer': 'RoomAdErrorMessageComposer',
    'OpenRoomCreationWindowComposer': 'NoOwnedRoomsAlertMessageComposer',
    'ReportRoomFormComposer': 'CallForHelpPendingCallsMessageComposer',
    'HelperRequestDisabledComposer': 'CallForHelpDisabledNotifyMessageComposer',
    'BullyReportRequestComposer': 'GuideReportingStatusMessageComposer',
    'BullyReportedMessageComposer': 'GuideTicketCreationResultMessageComposer',
    'BullyReportClosedComposer': 'GuideTicketResolutionMessageComposer',
    'NewYearResolutionComposer': 'AchievementResolutionsMessageComposer',
    'NewYearResolutionProgressComposer': 'AchievementResolutionProgressMessageComposer',
    'NewYearResolutionCompletedComposer': 'AchievementResolutionCompletedMessageComposer',
    'WatchAndEarnRewardComposer': 'OfferRewardDeliveredMessageComposer',
    'LeprechaunStarterBundleComposer': 'OpenPetPackageRequestedMessageComposer',
    'MinimailNewMessageComposer': 'MiniMailNewMessageMessageComposer',
    'BotSettingsComposer': 'BotCommandConfigurationMessageComposer',
    'BotForceOpenContextMenuComposer': 'BotForceOpenContextMenuMessageComposer',
    'ItemStateComposer2': 'DiceValueMessageComposer',
    'FloorPlanEditorDoorSettingsComposer': 'RoomEntryTileMessageComposer',
    'FloorPlanEditorBlockedTilesComposer': 'RoomOccupiedTilesMessageComposer',
    'UnknownComposer_100': 'PetBreedingResultMessageComposer',
    'UnknownComposer_1111': 'FaqSearchResultsMessageComposer',
    'UnknownComposer_1165': 'GameInviteMessageComposer',
    'UnknownComposer_137': 'RoomSettingsErrorMessageComposer',
    'UnknownComposer_152': 'CompetitionRoomsDataMessageComposer',
    'UnknownComposer_1577': 'WeeklyGameRewardMessageComposer',
    'UnknownComposer_1741': 'Game2GameDirectoryStatusMessageComposer',
    'UnknownComposer_1744': 'TradingNoSuchItemMessageComposer',
    'UnknownComposer_1965': 'FaqTextMessageComposer',
    'UnknownComposer_2563': 'UseObjectMessageComposer',
    'UnknownComposer_2601': 'HotelMergeNameChangeMessageComposer',
    'UnknownComposer_2621': 'RoomThumbnailUpdateResultMessageComposer',
    'UnknownComposer_2698': 'CheckUserNameResultMessageComposer',
    'UnknownComposer8': 'PetSupplementedNotificationMessageComposer',
    'HabboWayQuizComposer2': 'QuizDataMessageComposer',
    'UnknownAvatarEditorComposer': 'AvatarEffectSelectedMessageComposer',
    'PetBreedingCompleted': 'NestBreedingSuccessMessageComposer',
};

// Build reverse lookup
const REVERSE_MAP = {};
for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
    REVERSE_MAP[newName] = oldName;
}

/**
 * Find all Java files in the outgoing messages directory
 */
function findComposerFiles(baseDir) {
    const results = [];
    const outgoingDir = path.join(baseDir, 'src/main/java/com/eu/habbo/messages/outgoing');

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

    walk(outgoingDir);
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
 * Find all Java files in the entire src directory that might reference composers
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

    const composerFiles = findComposerFiles(baseDir);
    let renameCount = 0;
    let missingCount = 0;
    const renames = [];

    for (const filePath of composerFiles) {
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

    const composerFiles = findComposerFiles(baseDir);
    const renames = [];

    // Phase 1: Collect all renames
    for (const filePath of composerFiles) {
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

    // Phase 4: Update Outgoing.java enum constants
    const outgoingPath = path.join(baseDir, 'src/main/java/com/eu/habbo/messages/outgoing/Outgoing.java');
    if (fs.existsSync(outgoingPath)) {
        let outgoingContent = fs.readFileSync(outgoingPath, 'utf-8');
        let changed = false;

        for (const { oldName, newName } of renames) {
            if (outgoingContent.includes(oldName)) {
                outgoingContent = outgoingContent.replace(
                    new RegExp(`\\b${oldName}\\b`, 'g'),
                    newName
                );
                changed = true;
            }
        }

        if (changed) {
            fs.writeFileSync(outgoingPath, outgoingContent, 'utf-8');
            console.log(`\n[UPDATED] Outgoing.java`);
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
