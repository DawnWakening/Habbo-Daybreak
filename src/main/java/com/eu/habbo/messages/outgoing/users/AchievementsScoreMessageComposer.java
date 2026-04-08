package com.eu.habbo.messages.outgoing.users;

import com.eu.habbo.habbohotel.users.Habbo;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class AchievementsScoreMessageComposer extends MessageComposer {
    private final Habbo habbo;

    public AchievementsScoreMessageComposer(Habbo habbo) {
        this.habbo = habbo;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.AchievementsScoreMessageComposer);
        this.response.appendInt(this.habbo.getHabboStats().getAchievementScore());
        return this.response;
    }

    public Habbo getHabbo() {
        return habbo;
    }
}
