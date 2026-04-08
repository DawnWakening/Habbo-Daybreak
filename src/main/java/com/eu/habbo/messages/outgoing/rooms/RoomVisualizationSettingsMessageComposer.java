package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.habbohotel.rooms.Room;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class RoomVisualizationSettingsMessageComposer extends MessageComposer {
    private final Room room;

    public RoomVisualizationSettingsMessageComposer(Room room) {
        this.room = room;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.RoomVisualizationSettingsMessageComposer);
        this.response.appendBoolean(this.room.isHideWall());
        this.response.appendInt(this.room.getWallSize());
        this.response.appendInt(this.room.getFloorSize());
        return this.response;
    }

    public Room getRoom() {
        return room;
    }
}
