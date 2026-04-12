package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.Emulator;
import com.eu.habbo.habbohotel.catalog.CatalogItem;
import com.eu.habbo.habbohotel.catalog.CatalogPage;
import com.eu.habbo.habbohotel.catalog.CatalogPageMode;
import com.eu.habbo.habbohotel.gameclients.GameClient;
import com.eu.habbo.habbohotel.items.FurnitureType;
import com.eu.habbo.habbohotel.items.Item;
import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.habbohotel.rooms.RoomRightLevels;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.habbohotel.users.HabboItem;
import com.eu.habbo.habbohotel.users.subscriptions.SubscriptionBuildersClub;
import com.eu.habbo.messages.outgoing.catalog.BuildersClubFurniCountMessageComposer;
import com.eu.habbo.messages.outgoing.generic.alerts.BubbleAlertKeys;
import com.eu.habbo.messages.outgoing.generic.alerts.NotificationDialogMessageComposer;
import com.eu.habbo.messages.outgoing.unknown.BuildersClubSubscriptionStatusMessageComposer;

final class BuildersClubPlacementSupport {
    private BuildersClubPlacementSupport() {
    }

    static ValidatedPlacement validate(GameClient client, int pageId, int offerId, FurnitureType expectedType) {
        Habbo habbo = client.getHabbo();

        if (habbo == null || !habbo.getRoomUnit().isInRoom()) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.not_in_room"));
            return null;
        }

        Room room = habbo.getHabboInfo().getCurrentRoom();
        if (room == null) {
            return null;
        }

        if (!SubscriptionBuildersClub.isEnabled() || !habbo.getHabboStats().hasEffectiveBuildersClub()) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.membership_required"));
            return null;
        }

        boolean isOwner = room.isOwner(habbo);
        boolean guildPlacementAllowed = room.hasGuild()
                && SubscriptionBuildersClub.GROUP_ROOM_PLACEMENT_ENABLED
                && room.getGuildRightLevel(habbo).isEqualOrGreaterThan(RoomRightLevels.GUILD_RIGHTS);

        if (!isOwner && !guildPlacementAllowed) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.room_owner_required"));
            return null;
        }

        if (habbo.getHabboStats().getBuildersClubSecondsRemaining() <= 0
                && SubscriptionBuildersClub.hasVisitorsBlockingPlacement(room, habbo)) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.BUILDERS_CLUB_VISIT_DENIED_OWNER.key));
            return null;
        }

        if (habbo.getHabboStats().getBuildersClubFurniCount() >= habbo.getHabboStats().getBuildersClubFurniLimit()) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.limit_reached"));
            return null;
        }

        CatalogPage page = Emulator.getGameEnvironment().getCatalogManager().getCatalogPage(pageId, CatalogPageMode.BUILDERS_CLUB);
        if (page == null || !page.isEnabled() || page.getRank() > habbo.getHabboInfo().getRank().getId()) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.invalid_page"));
            return null;
        }

        CatalogItem item = Emulator.getGameEnvironment().getCatalogManager().getCatalogItemByWireId(page, offerId);
        if (!Emulator.getGameEnvironment().getCatalogManager().isBuildersClubPlaceableItem(page, item)) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.invalid_offer"));
            return null;
        }

        Item baseItem = item.getBaseItems().iterator().next();
        if (baseItem.getType() != expectedType) {
            client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.invalid_type"));
            return null;
        }

        return new ValidatedPlacement(room, item, baseItem);
    }

    static HabboItem createBuildersClubItem(Habbo habbo, Item baseItem, String extraData) {
        HabboItem item = Emulator.getGameEnvironment().getItemManager().createBuildersClubItem(
                habbo.getHabboInfo().getId(),
                baseItem,
                extraData == null ? "" : extraData
        );

        habbo.getHabboStats().invalidateBuildersClubFurniCount();
        return item;
    }

    static void sendUpdatedState(Habbo habbo) {
        habbo.getHabboStats().invalidateBuildersClubFurniCount();
        habbo.getClient().sendResponse(new BuildersClubFurniCountMessageComposer(habbo));
        habbo.getClient().sendResponse(new BuildersClubSubscriptionStatusMessageComposer(habbo));
    }

    record ValidatedPlacement(Room room, CatalogItem item, Item baseItem) {
    }
}
