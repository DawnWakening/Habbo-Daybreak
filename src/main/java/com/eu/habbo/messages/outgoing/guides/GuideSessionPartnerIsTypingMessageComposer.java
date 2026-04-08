package com.eu.habbo.messages.outgoing.guides;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class GuideSessionPartnerIsTypingMessageComposer extends MessageComposer {
    private final boolean typing;

    public GuideSessionPartnerIsTypingMessageComposer(boolean typing) {
        this.typing = typing;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.GuideSessionPartnerIsTypingMessageComposer);
        this.response.appendBoolean(this.typing);
        return this.response;
    }

    public boolean isTyping() {
        return typing;
    }
}
