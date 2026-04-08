package com.eu.habbo.messages.outgoing.handshake;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class CompleteDiffieHandshakeMessageComposer extends MessageComposer {

    private final String publicKey;
    private final boolean clientEncryption;

    public CompleteDiffieHandshakeMessageComposer(String publicKey) {
        this(publicKey, true);
    }

    public CompleteDiffieHandshakeMessageComposer(String publicKey, boolean clientEncryption) {
        this.publicKey = publicKey;
        this.clientEncryption = clientEncryption;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.CompleteDiffieHandshakeMessageComposer);
        this.response.appendString(this.publicKey);
        this.response.appendBoolean(this.clientEncryption);
        return this.response;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public boolean isClientEncryption() {
        return clientEncryption;
    }
}
