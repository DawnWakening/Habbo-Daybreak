package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.habbohotel.items.FurnitureType;
import com.eu.habbo.habbohotel.rooms.FurnitureMovementError;
import com.eu.habbo.habbohotel.users.HabboItem;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.generic.alerts.BubbleAlertKeys;
import com.eu.habbo.messages.outgoing.generic.alerts.NotificationDialogMessageComposer;

public class BuildersClubPlaceWallItemMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        int pageId = this.packet.readInt();
        int offerId = this.packet.readInt();
        String extraData = this.packet.readString();
        String wallPosition = this.packet.readString();

        BuildersClubPlacementSupport.ValidatedPlacement placement = BuildersClubPlacementSupport.validate(this.client, pageId, offerId, FurnitureType.WALL);
        if (placement == null) {
            return;
        }

        // validate() reserved an in-flight slot on success; release it on every path below.
        boolean released = false;
        try {
            HabboItem item = BuildersClubPlacementSupport.createBuildersClubItem(this.client.getHabbo(), placement.baseItem(), extraData);
            if (item == null) {
                this.client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, "builders_club.create_failed"));
                return;
            }

            FurnitureMovementError error = placement.room().placeWallFurniAt(item, wallPosition, this.client.getHabbo());
            if (!error.equals(FurnitureMovementError.NONE)) {
                com.eu.habbo.Emulator.getGameEnvironment().getItemManager().deleteItem(item);
                this.client.getHabbo().getHabboStats().invalidateBuildersClubFurniCount();
                this.client.sendResponse(new NotificationDialogMessageComposer(BubbleAlertKeys.FURNITURE_PLACEMENT_ERROR.key, error.errorCode));
                return;
            }

            // Release the reservation first so sendUpdatedState sees the fresh post-commit count.
            this.client.getHabbo().getHabboStats().releaseBuildersClubSlot();
            released = true;
            BuildersClubPlacementSupport.sendUpdatedState(this.client.getHabbo());
        } finally {
            if (!released) {
                this.client.getHabbo().getHabboStats().releaseBuildersClubSlot();
            }
        }
    }
}
