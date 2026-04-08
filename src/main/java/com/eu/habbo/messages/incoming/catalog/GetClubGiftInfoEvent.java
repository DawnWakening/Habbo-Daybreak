package com.eu.habbo.messages.incoming.catalog;

import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.ClubGiftInfoMessageComposer;

public class GetClubGiftInfoEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        this.client.sendResponse(new ClubGiftInfoMessageComposer(
            (int) Math.floor(this.client.getHabbo().getHabboStats().getTimeTillNextClubGift() / 86400.0),
            this.client.getHabbo().getHabboStats().getRemainingClubGifts(),
            (int) Math.floor(this.client.getHabbo().getHabboStats().getPastTimeAsClub() / 86400.0)
        ));
    }
}
