package com.eu.habbo.messages.outgoing.rooms.pets.breeding;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class NestBreedingSuccessMessageComposer extends MessageComposer {
    private final int type;
    private final int race;

    public NestBreedingSuccessMessageComposer(int type, int race) {
        this.type = type;
        this.race = race;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.NestBreedingSuccessMessageComposer);
        this.response.appendInt(this.type);
        this.response.appendInt(this.race);
        return this.response;
    }

    public int getType() {
        return type;
    }

    public int getRace() {
        return race;
    }
}