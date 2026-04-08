package com.eu.habbo.messages.incoming.navigator;

import com.eu.habbo.Emulator;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.navigator.PopularRoomTagsResultMessageComposer;

public class GetPopularRoomTagsMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new PopularRoomTagsResultMessageComposer(Emulator.getGameEnvironment().getRoomManager().getTags()));
    }
}
