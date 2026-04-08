package com.eu.habbo.messages.incoming.catalog.marketplace;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.marketplace.MarketPlaceOwnOffersMessageComposer;

public class RequestOwnItemsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new MarketPlaceOwnOffersMessageComposer(this.client.getHabbo()));
    }
}
