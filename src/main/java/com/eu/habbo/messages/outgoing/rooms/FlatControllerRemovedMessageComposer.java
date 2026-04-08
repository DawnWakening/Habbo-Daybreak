package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class FlatControllerRemovedMessageComposer extends MessageComposer {
    private final Room room;
    private final int userId;

    public FlatControllerRemovedMessageComposer(Room room, int userId) {
        this.room = room;
        this.userId = userId;
    }


    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.FlatControllerRemovedMessageComposer);
        this.response.appendInt(this.room.getId());
        this.response.appendInt(this.userId);
        return this.response;
    }

    public Room getRoom() {
        return room;
    }

    public int getUserId() {
        return userId;
    }
}
