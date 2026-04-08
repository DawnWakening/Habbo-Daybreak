package com.eu.habbo.messages.outgoing.catalog.marketplace;

import com.eu.habbo.habbohotel.catalog.marketplace.MarketPlaceOffer;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class MarketplaceCancelOfferResultMessageComposer extends MessageComposer {
    private final MarketPlaceOffer offer;
    private final boolean success;

    public MarketplaceCancelOfferResultMessageComposer(MarketPlaceOffer offer, Boolean success) {
        this.offer = offer;
        this.success = success;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.MarketplaceCancelOfferResultMessageComposer);
        this.response.appendInt(this.offer.getOfferId());
        this.response.appendBoolean(this.success);
        return this.response;
    }

    public MarketPlaceOffer getOffer() {
        return offer;
    }

    public boolean isSuccess() {
        return success;
    }
}
