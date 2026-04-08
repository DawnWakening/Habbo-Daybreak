package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class FavouriteChangedMessageComposer extends MessageComposer {
    private final int roomId;
    private final boolean favorite;

    public FavouriteChangedMessageComposer(int roomId, boolean favorite) {
        this.roomId = roomId;
        this.favorite = favorite;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.FavouriteChangedMessageComposer);
        this.response.appendInt(this.roomId);
        this.response.appendBoolean(this.favorite);
        return this.response;
    }

    public int getRoomId() {
        return roomId;
    }

    public boolean isFavorite() {
        return favorite;
    }
}