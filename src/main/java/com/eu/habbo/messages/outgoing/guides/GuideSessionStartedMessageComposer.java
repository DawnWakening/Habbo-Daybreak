package com.eu.habbo.messages.outgoing.guides;

import com.eu.habbo.habbohotel.guides.GuideTour;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class GuideSessionStartedMessageComposer extends MessageComposer {
    private final GuideTour tour;

    public GuideSessionStartedMessageComposer(GuideTour tour) {
        this.tour = tour;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.GuideSessionStartedMessageComposer);
        this.response.appendInt(this.tour.getNoob().getHabboInfo().getId());
        this.response.appendString(this.tour.getNoob().getHabboInfo().getUsername());
        this.response.appendString(this.tour.getNoob().getHabboInfo().getLook());
        this.response.appendInt(this.tour.getHelper().getHabboInfo().getId());
        this.response.appendString(this.tour.getHelper().getHabboInfo().getUsername());
        this.response.appendString(this.tour.getHelper().getHabboInfo().getLook());
        return this.response;
    }

    public GuideTour getTour() {
        return tour;
    }
}
