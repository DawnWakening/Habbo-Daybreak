package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.habbohotel.items.FurnitureType;
import com.eu.habbo.habbohotel.rooms.FurnitureMovementError;
import com.eu.habbo.habbohotel.rooms.RoomTile;
import com.eu.habbo.habbohotel.users.HabboItem;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.generic.alerts.BubbleAlertKeys;
import com.eu.habbo.messages.outgoing.generic.alerts.NotificationDialogMessageComposer;

public class BuildersClubPlaceRoomItemMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        int pageId = this.packet.readInt();
        int offerId = this.packet.readInt();
        String extraData = this.packet.readString();
        short x = this.packet.readInt().shortValue();
        short y = this.packet.readInt().shortValue();
        int rotation = this.packet.readInt();

        BuildersClubPlacementSupport.ValidatedPlacement placement = BuildersClubPlacementSupport.validate(this.client, pageId, offerId, FurnitureType.FLOOR);
        if (placement == null) {
            return;
        }

        RoomTile tile = placement.room().getLayout().getTile(x, y);
        if (tile == null) {
            this.client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.invalid_tile"));
            return;
        }

        HabboItem item = BuildersClubPlacementSupport.createBuildersClubItem(this.client.getHabbo(), placement.baseItem(), extraData);
        if (item == null) {
            this.client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.create_failed"));
            return;
        }

        FurnitureMovementError error = placement.room().canPlaceFurnitureAt(item, this.client.getHabbo(), tile, rotation);
        if (!error.equals(FurnitureMovementError.NONE)) {
            com.eu.habbo.Emulator.getGameEnvironment().getItemManager().deleteItem(item);
            this.client.getHabbo().getHabboStats().invalidateBuildersClubFurniCount();
            this.client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, error.errorCode));
            return;
        }

        error = placement.room().placeFloorFurniAt(item, tile, rotation, this.client.getHabbo());
        if (!error.equals(FurnitureMovementError.NONE)) {
            com.eu.habbo.Emulator.getGameEnvironment().getItemManager().deleteItem(item);
            this.client.getHabbo().getHabboStats().invalidateBuildersClubFurniCount();
            this.client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, error.errorCode));
            return;
        }

        BuildersClubPlacementSupport.sendUpdatedState(this.client.getHabbo());
    }
}
