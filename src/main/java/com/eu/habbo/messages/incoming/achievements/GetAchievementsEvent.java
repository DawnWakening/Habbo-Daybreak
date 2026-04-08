package com.eu.habbo.messages.incoming.achievements;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.achievements.AchievementsMessageComposer;

public class GetAchievementsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new AchievementsMessageComposer(this.client.getHabbo()));
    }
}
