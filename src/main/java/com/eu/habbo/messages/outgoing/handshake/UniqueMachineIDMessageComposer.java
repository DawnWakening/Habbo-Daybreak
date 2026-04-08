package com.eu.habbo.messages.outgoing.handshake;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class UniqueMachineIDMessageComposer extends MessageComposer {

    private final String machineId;

    public UniqueMachineIDMessageComposer(String machineId) {
        this.machineId = machineId;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.UniqueMachineIDMessageComposer);
        this.response.appendString(this.machineId);
        return this.response;
    }

    public String getMachineId() {
        return machineId;
    }
}
