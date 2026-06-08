package com.eu.habbo.messages.outgoing.unknown;

import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class BuildersClubSubscriptionStatusMessageComposer extends MessageComposer {
    private final Habbo habbo;

    public BuildersClubSubscriptionStatusMessageComposer(Habbo habbo) {
        this.habbo = habbo;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.BuildersClubSubscriptionStatusMessageComposer);
        this.response.appendInt(this.habbo.getHabboStats().getBuildersClubSecondsRemaining());
        this.response.appendInt(this.habbo.getHabboStats().getBuildersClubFurniLimit());
        this.response.appendInt(this.habbo.getHabboStats().getBuildersClubMaxFurniLimit());
        this.response.appendInt(this.habbo.getHabboStats().getBuildersClubSecondsRemainingWithGrace());
        return this.response;
    }
}
