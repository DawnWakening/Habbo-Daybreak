package com.eu.habbo.habbohotel.commands;

import com.eu.habbo.Emulator;
import com.eu.habbo.habbohotel.gameclients.GameClient;
import com.eu.habbo.habbohotel.rooms.RoomChatMessageBubbles;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.habbohotel.users.subscriptions.SubscriptionBuildersClub;
import com.eu.habbo.messages.outgoing.catalog.*;
import com.eu.habbo.messages.outgoing.catalog.marketplace.MarketplaceConfigurationMessageComposer;

public class UpdateCatalogCommand extends Command {

    public UpdateCatalogCommand() {
        super("cmd_update_catalogue", Emulator.getTexts().getValue("commands.keys.cmd_update_catalogue").split(";"));
    }

    @Override
    public boolean handle(GameClient gameClient, String[] params) {
        Emulator.getGameEnvironment().getCatalogManager().initialize();
        Emulator.getGameServer().getGameClientManager().sendBroadcastResponse(new CatalogPublishedMessageComposer());
        Emulator.getGameServer().getGameClientManager().sendBroadcastResponse(new BundleDiscountRulesetMessageComposer());
        Emulator.getGameServer().getGameClientManager().sendBroadcastResponse(new MarketplaceConfigurationMessageComposer());
        Emulator.getGameServer().getGameClientManager().sendBroadcastResponse(new GiftWrappingConfigurationMessageComposer());
        Emulator.getGameServer().getGameClientManager().sendBroadcastResponse(new RecyclerPrizesMessageComposer());
        for (GameClient client : Emulator.getGameServer().getGameClientManager().getSessions().values()) {
            Habbo habbo = client.getHabbo();
            if (habbo != null && habbo.getClient() != null) {
                SubscriptionBuildersClub.pushCatalogState(habbo);
            }
        }
        Emulator.getGameEnvironment().getCraftingManager().reload();
        gameClient.getHabbo().whisper(Emulator.getTexts().getValue("commands.succes.cmd_update_catalog"), RoomChatMessageBubbles.ALERT);
        return true;
    }
}
