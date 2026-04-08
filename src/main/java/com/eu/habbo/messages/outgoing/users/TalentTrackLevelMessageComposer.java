package com.eu.habbo.messages.outgoing.users;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class TalentTrackLevelMessageComposer extends MessageComposer {
    private final String name;

    public TalentTrackLevelMessageComposer(String name) {
        this.name = name;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.TalentTrackLevelMessageComposer);
        this.response.appendString(this.name);
        this.response.appendInt(4);
        this.response.appendInt(4);
        return this.response;
    }

    public String getName() {
        return name;
    }
}
