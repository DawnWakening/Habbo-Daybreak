package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class MuteAllInRoomMessageComposer extends MessageComposer {
    private final Room room;

    public MuteAllInRoomMessageComposer(Room room) {
        this.room = room;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.MuteAllInRoomMessageComposer);
        this.response.appendBoolean(this.room.isMuted());
        return this.response;
    }

    public Room getRoom() {
        return room;
    }
}
