package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class RoomInfoUpdatedMessageComposer extends MessageComposer {
    private final Room room;

    public RoomInfoUpdatedMessageComposer(Room room) {
        this.room = room;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.RoomInfoUpdatedMessageComposer);
        this.response.appendInt(this.room.getId());
        return this.response;
    }

    public Room getRoom() {
        return room;
    }
}
