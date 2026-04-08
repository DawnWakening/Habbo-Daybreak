package com.eu.habbo.messages.incoming.catalog.marketplace;

import com.eu.habbo.habbohotel.catalog.marketplace.MarketPlace;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.marketplace.MarketplaceCanMakeOfferResultMessageComposer;

public class RequestSellItemEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        if (MarketPlace.MARKETPLACE_ENABLED)
            this.client.sendResponse(new MarketplaceCanMakeOfferResultMessageComposer(1, 0, 0));
        else
            this.client.sendResponse(new MarketplaceCanMakeOfferResultMessageComposer(3, 0, 0));
    }
}
