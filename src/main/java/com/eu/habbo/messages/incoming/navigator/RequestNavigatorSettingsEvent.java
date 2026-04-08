package com.eu.habbo.messages.incoming.navigator;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.navigator.NewNavigatorPreferencesMessageComposer;

public class RequestNavigatorSettingsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {


        this.client.sendResponse(new NewNavigatorPreferencesMessageComposer(this.client.getHabbo().getHabboStats().navigatorWindowSettings));

    }
}
