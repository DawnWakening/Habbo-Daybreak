package com.eu.habbo.messages.rcon;

import com.eu.habbo.Emulator;
import com.eu.habbo.habbohotel.gameclients.GameClient;
import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.habbohotel.users.subscriptions.SubscriptionBuildersClub;
import com.eu.habbo.messages.outgoing.catalog.*;
import com.eu.habbo.messages.outgoing.catalog.marketplace.MarketplaceConfigurationMessageComposer;
import com.google.gson.Gson;

public class UpdateCatalog extends RCONMessage<UpdateCatalog.JSONUpdateCatalog> {

    public UpdateCatalog() {
        super(JSONUpdateCatalog.class);
    }

    @Override
    public void handle(Gson gson, JSONUpdateCatalog json) {
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
    }

    static class JSONUpdateCatalog {
    }
}
