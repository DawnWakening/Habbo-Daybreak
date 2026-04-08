package com.eu.habbo.plugin.events.trading;

import com.eu.habbo.habbohotel.rooms.RoomTradeUser;
import com.eu.habbo.plugin.Event;

public class ConfirmAcceptTradingEvent extends Event {
    public final RoomTradeUser userOne;
    public final RoomTradeUser userTwo;

    public ConfirmAcceptTradingEvent(RoomTradeUser userOne, RoomTradeUser userTwo) {
        this.userOne = userOne;
        this.userTwo = userTwo;
    }
}
