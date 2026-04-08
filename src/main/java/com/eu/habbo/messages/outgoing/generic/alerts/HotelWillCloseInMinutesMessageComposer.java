package com.eu.habbo.messages.outgoing.generic.alerts;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class HotelWillCloseInMinutesMessageComposer extends MessageComposer {
    private final int minutes;

    public HotelWillCloseInMinutesMessageComposer(int minutes) {
        this.minutes = minutes;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.HotelWillCloseInMinutesMessageComposer);
        this.response.appendInt(this.minutes);
        return this.response;
    }

    public int getMinutes() {
        return minutes;
    }
}
