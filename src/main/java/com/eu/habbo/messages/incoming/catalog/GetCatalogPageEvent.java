package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.Emulator;
import com.eu.habbo.habbohotel.catalog.CatalogPage;
import com.eu.habbo.habbohotel.catalog.CatalogPageMode;
import com.eu.habbo.habbohotel.modtool.ScripterManager;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.CatalogPageMessageComposer;

public class GetCatalogPageEvent extends MessageHandler {

    @Override
    public void handle() throws Exception {
        int catalogPageId = this.packet.readInt();
        int offerId = this.packet.readInt();
        CatalogPageMode mode = CatalogPageMode.fromClientMode(this.packet.readString());

        CatalogPage page = Emulator.getGameEnvironment().getCatalogManager().getCatalogPage(catalogPageId, mode);

        if (catalogPageId > 0 && page != null) {
            if (page.getRank() <= this.client.getHabbo().getHabboInfo().getRank().getId() && page.isEnabled()) {
                this.client.sendResponse(new CatalogPageMessageComposer(page, this.client.getHabbo(), offerId, mode));
            } else {
                if (!page.isVisible()) {
                    ScripterManager.scripterDetected(this.client, Emulator.getTexts().getValue("scripter.warning.catalog.page").replace("%username%", this.client.getHabbo().getHabboInfo().getUsername()).replace("%pagename%", page.getCaption()));
                }
            }
        }
    }
}
