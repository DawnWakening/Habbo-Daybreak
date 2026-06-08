package com.eu.habbo.habbohotel.commands;

import com.eu.habbo.habbohotel.gameclients.GameClient;
import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.habbohotel.users.subscriptions.SubscriptionBuildersClub;

public class PickallBcCommand extends Command {
    public PickallBcCommand() {
        super("cmd_pickall", new String[]{"pickallbc"});
    }

    @Override
    public boolean handle(GameClient gameClient, String[] params) throws Exception {
        Room room = gameClient.getHabbo().getHabboInfo().getCurrentRoom();

        if (room != null && room.isOwner(gameClient.getHabbo())) {
            room.pickUpBuildersClubItems(gameClient.getHabbo().getHabboInfo().getId(), gameClient.getHabbo());
            SubscriptionBuildersClub.pushCatalogState(gameClient.getHabbo());
        }

        return true;
    }
}
