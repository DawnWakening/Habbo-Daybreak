package com.eu.habbo.messages.incoming.handshake;

import com.eu.habbo.messages.NoAuthMessage;
import com.eu.habbo.messages.incoming.MessageHandler;

@NoAuthMessage
public class ClientHelloMessageEvent extends MessageHandler {

    @Override
    public void handle() throws Exception {
        this.packet.readString();
    }
}
