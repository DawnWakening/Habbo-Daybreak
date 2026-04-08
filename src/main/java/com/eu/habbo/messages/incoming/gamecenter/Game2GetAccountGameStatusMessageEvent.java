package com.eu.habbo.messages.incoming.gamecenter;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.gamecenter.GameStatusMessageComposer;

public class Game2GetAccountGameStatusMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new GameStatusMessageComposer(this.packet.readInt(), GameStatusMessageComposer.OK));
    }
}
