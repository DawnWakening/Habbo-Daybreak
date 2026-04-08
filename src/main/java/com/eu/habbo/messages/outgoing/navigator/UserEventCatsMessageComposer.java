package com.eu.habbo.messages.outgoing.navigator;

import com.eu.habbo.habbohotel.navigation.EventCategory;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

import java.util.ArrayList;
import java.util.List;

public class UserEventCatsMessageComposer extends MessageComposer {
    public static List<EventCategory> CATEGORIES = new ArrayList<>();

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.UserEventCatsMessageComposer);

        this.response.appendInt(UserEventCatsMessageComposer.CATEGORIES.size());

        for (EventCategory category : UserEventCatsMessageComposer.CATEGORIES) {
            category.serialize(this.response);
        }

        return this.response;
    }
}
