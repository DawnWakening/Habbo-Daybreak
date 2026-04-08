package com.eu.habbo.messages.outgoing.unknown;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class ChangeEmailResultMessageComposer extends MessageComposer {
    private final int result;

    public ChangeEmailResultMessageComposer(int result) {
        this.result = result;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.ChangeEmailResultMessageComposer);
        this.response.appendInt(this.result);
        return this.response;
    }

    public int getResult() {
        return result;
    }
}