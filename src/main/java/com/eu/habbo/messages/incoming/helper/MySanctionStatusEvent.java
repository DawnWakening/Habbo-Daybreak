package com.eu.habbo.messages.incoming.helper;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.modtool.SanctionStatusMessageComposer;

public class MySanctionStatusEvent extends MessageHandler {

    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new SanctionStatusMessageComposer(this.client.getHabbo()));
    }
}
