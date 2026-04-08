package com.eu.habbo.messages.outgoing.rooms;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class BotForceOpenContextMenuMessageComposer extends MessageComposer {
    private final int botId;

    public BotForceOpenContextMenuMessageComposer(int botId) {
        this.botId = botId;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.BotForceOpenContextMenuMessageComposer);
        this.response.appendInt(this.botId);
        return this.response;
    }

    public int getBotId() {
        return botId;
    }
}