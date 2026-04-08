package com.eu.habbo.messages.outgoing.generic.alerts;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class HotelClosedAndOpensMessageComposer extends MessageComposer {
    private final int hour;
    private final int minute;

    public HotelClosedAndOpensMessageComposer(int hour, int minute) {
        this.hour = hour;
        this.minute = minute;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.HotelClosedAndOpensMessageComposer);
        this.response.appendInt(this.hour);
        this.response.appendInt(this.minute);
        return this.response;
    }

    public int getHour() {
        return hour;
    }

    public int getMinute() {
        return minute;
    }
}
