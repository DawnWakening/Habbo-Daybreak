package com.eu.habbo.messages.incoming.navigator;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.navigator.*;

public class NewNavigatorInitEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new NewNavigatorPreferencesMessageComposer(this.client.getHabbo().getHabboStats().navigatorWindowSettings));
        this.client.sendResponse(new NavigatorMetaDataMessageComposer());
        this.client.sendResponse(new NavigatorLiftedRoomsMessageComposer());
        this.client.sendResponse(new CollapsedCategoriesMessageComposer());
        this.client.sendResponse(new NavigatorSavedSearchesMessageComposer(this.client.getHabbo().getHabboInfo().getSavedSearches()));
        this.client.sendResponse(new UserEventCatsMessageComposer());
    }
}
