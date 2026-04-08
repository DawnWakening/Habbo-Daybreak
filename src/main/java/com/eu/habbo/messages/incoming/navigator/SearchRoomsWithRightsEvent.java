package com.eu.habbo.messages.incoming.navigator;

import com.eu.habbo.Emulator;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.navigator.GuestRoomSearchResultMessageComposer;

public class SearchRoomsWithRightsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new GuestRoomSearchResultMessageComposer(Emulator.getGameEnvironment().getRoomManager().getRoomsWithRights(this.client.getHabbo())));
    }
}
