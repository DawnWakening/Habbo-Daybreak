package com.eu.habbo.messages.outgoing.catalog;

import com.eu.habbo.habbohotel.catalog.CatalogItem;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class ProductOfferMessageComposer extends MessageComposer {
    private final CatalogItem item;

    public ProductOfferMessageComposer(CatalogItem item) {
        this.item = item;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.ProductOfferMessageComposer);
        this.item.serialize(this.response);
        return this.response;
    }

    public CatalogItem getItem() {
        return item;
    }
}
