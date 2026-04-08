package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class RoomRatingMessageComposer extends MessageComposer {
    private final int score;
    private final boolean canVote;

    public RoomRatingMessageComposer(int score, boolean canVote) {
        this.score = score;
        this.canVote = canVote;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.RoomRatingMessageComposer);
        this.response.appendInt(this.score);
        this.response.appendBoolean(this.canVote);
        return this.response;
    }

    public int getScore() {
        return score;
    }

    public boolean isCanVote() {
        return canVote;
    }
}
