package com.eu.habbo.messages.incoming.users;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.users.CreditBalanceMessageComposer;
import com.eu.habbo.messages.outgoing.users.ActivityPointsMessageComposer;

public class GetCreditsInfoEvent extends MessageHandler {
    @Override
    public void handle() {
        this.client.sendResponse(new CreditBalanceMessageComposer(this.client.getHabbo()));
        this.client.sendResponse(new ActivityPointsMessageComposer(this.client.getHabbo()));
    }
}
