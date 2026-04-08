package com.eu.habbo.messages.incoming.unknown;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.events.resolution.AchievementResolutionsMessageComposer;

public class GetResolutionAchievementsMessageEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.packet.readInt(); // itemId - not used
        int viewAll = this.packet.readInt();

        if (viewAll == 0) {
            this.client.sendResponse(new AchievementResolutionsMessageComposer());
        }
    }
}
