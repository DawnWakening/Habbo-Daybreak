package com.eu.habbo.messages.incoming.users;

import com.eu.habbo.Emulator;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.users.AccountPreferencesMessageComposer;
import com.eu.habbo.messages.outgoing.users.UserObjectMessageComposer;
import com.eu.habbo.messages.outgoing.users.PerkAllowancesMessageComposer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;

public class RequestUserDataEvent extends MessageHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(RequestUserDataEvent.class);

    @Override
    public void handle() throws Exception {
        if (this.client.getHabbo() != null) {
            //this.client.sendResponse(new TestComposer());

            //this.client.sendResponse(new UserObjectMessageComposer(this.client.getHabbo()));
            //this.client.sendResponse(new CloseConnectionMessageComposer());
            //this.client.sendResponse(new NavigatorSettingsMessageComposer());
            //this.client.sendResponse(new UserRightsMessageComposer(this.client.getHabbo()));

            //this.client.sendResponse(new CreditBalanceMessageComposer(this.client.getHabbo()));
            //this.client.sendResponse(new ActivityPointsMessageComposer(this.client.getHabbo()));
            //this.client.sendResponse(new FavouritesMessageComposer());

            //this.client.sendResponse(new AchievementsScoreMessageComposer(this.client.getHabbo()));
            //this.client.sendResponse(new FigureSetIdsMessageComposer());
            //this.client.sendResponse(new HabboBroadcastMessageComposer(Emulator.getTexts().getValue("hotel.alert.message.welcome").replace("%user%", this.client.getHabbo().getHabboInfo().getUsername()), this.client.getHabbo()));


            //

            ArrayList<ServerMessage> messages = new ArrayList<>();


            messages.add(new UserObjectMessageComposer(this.client.getHabbo()).compose());
            messages.add(new PerkAllowancesMessageComposer(this.client.getHabbo()).compose());

            messages.add(new AccountPreferencesMessageComposer(this.client.getHabbo()).compose());


//
//

//
//
//


            this.client.sendResponses(messages);


        } else {
            LOGGER.debug("Attempted to request user data where Habbo was null.");
            Emulator.getGameServer().getGameClientManager().disposeClient(this.client);
        }
    }
}
