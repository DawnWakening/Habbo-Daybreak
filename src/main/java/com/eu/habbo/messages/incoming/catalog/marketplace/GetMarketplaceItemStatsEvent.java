package com.eu.habbo.messages.incoming.catalog.marketplace;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.marketplace.MarketplaceItemStatsMessageComposer;

public class GetMarketplaceItemStatsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.packet.readInt();
        int id = this.packet.readInt();

        this.client.sendResponse(new MarketplaceItemStatsMessageComposer(id));
    }
}
