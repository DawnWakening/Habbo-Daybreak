package com.eu.habbo.messages.outgoing.users;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class RemainingMutePeriodMessageComposer extends MessageComposer {
    private final int seconds;

    public RemainingMutePeriodMessageComposer(int seconds) {
        this.seconds = seconds;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.RemainingMutePeriodMessageComposer);
        this.response.appendInt(this.seconds);
        return this.response;
    }

    public int getSeconds() {
        return seconds;
    }
}
