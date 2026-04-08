package com.eu.habbo.messages.outgoing.inventory;

import com.eu.habbo.habbohotel.bots.Bot;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class BotAddedToInventoryMessageComposer extends MessageComposer {
    private final Bot bot;

    public BotAddedToInventoryMessageComposer(Bot bot) {
        this.bot = bot;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.BotAddedToInventoryMessageComposer);
        this.response.appendInt(this.bot.getId());
        this.response.appendString(this.bot.getName());
        this.response.appendString(this.bot.getMotto());
        this.response.appendString(this.bot.getGender().toString().toLowerCase().charAt(0) + "");
        this.response.appendString(this.bot.getFigure());
        this.response.appendBoolean(true);
        return this.response;
    }

    public Bot getBot() {
        return bot;
    }
}
