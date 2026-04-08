package com.eu.habbo.messages.incoming.navigator;

import com.eu.habbo.Emulator;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.navigator.GuestRoomSearchResultMessageComposer;

public class MyRoomHistorySearchMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new GuestRoomSearchResultMessageComposer(Emulator.getGameEnvironment().getRoomManager().getRoomsVisited(this.client.getHabbo(), false, 25)));
    }
}
