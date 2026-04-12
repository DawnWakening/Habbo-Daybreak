package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.BuildersClubFurniCountMessageComposer;
import com.eu.habbo.messages.outgoing.catalog.CatalogPagesListMessageComposer;
import com.eu.habbo.habbohotel.catalog.CatalogPageMode;

public class GetCatalogIndexEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        CatalogPageMode mode = CatalogPageMode.fromClientMode(this.packet.readString());
        this.client.sendResponse(new BuildersClubFurniCountMessageComposer(this.client.getHabbo()));
        this.client.sendResponse(new CatalogPagesListMessageComposer(this.client.getHabbo(), mode));
    }
}
