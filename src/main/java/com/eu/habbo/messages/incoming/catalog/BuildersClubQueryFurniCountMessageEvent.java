package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.BuildersClubFurniCountMessageComposer;

public class BuildersClubQueryFurniCountMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new BuildersClubFurniCountMessageComposer(this.client.getHabbo()));
    }
}
