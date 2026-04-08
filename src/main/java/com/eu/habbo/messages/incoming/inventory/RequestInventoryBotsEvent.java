package com.eu.habbo.messages.incoming.inventory;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.inventory.BotInventoryMessageComposer;

public class RequestInventoryBotsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new BotInventoryMessageComposer(this.client.getHabbo()));
    }
}
