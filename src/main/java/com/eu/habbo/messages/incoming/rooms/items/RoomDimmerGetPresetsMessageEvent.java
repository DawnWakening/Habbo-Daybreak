package com.eu.habbo.messages.incoming.rooms.items;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.rooms.items.RoomDimmerPresetsMessageComposer;

public class RoomDimmerGetPresetsMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        if (this.client.getHabbo().getHabboInfo().getCurrentRoom() != null)
            this.client.sendResponse(new RoomDimmerPresetsMessageComposer(this.client.getHabbo().getHabboInfo().getCurrentRoom().getMoodlightData()));
    }
}
