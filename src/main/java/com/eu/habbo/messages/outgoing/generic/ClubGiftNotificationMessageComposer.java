package com.eu.habbo.messages.outgoing.generic;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class ClubGiftNotificationMessageComposer extends MessageComposer {
    private final int count;

    public ClubGiftNotificationMessageComposer(int count) {
        this.count = count;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.ClubGiftNotificationMessageComposer);
        this.response.appendInt(this.count);
        return this.response;
    }

    public int getCount() {
        return count;
    }
}
