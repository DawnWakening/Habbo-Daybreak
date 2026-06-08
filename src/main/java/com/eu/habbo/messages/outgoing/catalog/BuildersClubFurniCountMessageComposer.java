package com.eu.habbo.messages.outgoing.catalog;

import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class BuildersClubFurniCountMessageComposer extends MessageComposer {
    private final int furniCount;

    public BuildersClubFurniCountMessageComposer(Habbo habbo) {
        this(habbo.getHabboStats().getBuildersClubFurniCount());
    }

    public BuildersClubFurniCountMessageComposer(int furniCount) {
        this.furniCount = furniCount;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.BuildersClubFurniCountMessageComposer);
        this.response.appendInt(this.furniCount);
        return this.response;
    }

    public int getFurniCount() {
        return furniCount;
    }
}
