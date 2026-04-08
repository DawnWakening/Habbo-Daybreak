package com.eu.habbo.messages.outgoing.handshake;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class InfoFeedEnableMessageComposer extends MessageComposer {
    private final boolean enabled;

    public InfoFeedEnableMessageComposer(boolean enabled) {
        this.enabled = enabled;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.InfoFeedEnableMessageComposer);
        this.response.appendBoolean(this.enabled);
        return this.response;
    }

    public boolean isEnabled() {
        return enabled;
    }
}
