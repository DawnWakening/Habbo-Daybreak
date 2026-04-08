package com.eu.habbo.messages.outgoing.inventory;

import com.eu.habbo.habbohotel.pets.Pet;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class PetRemovedFromInventoryMessageComposer extends MessageComposer {
    private final int petId;

    public PetRemovedFromInventoryMessageComposer(Pet pet) {
        this.petId = pet.getId();
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.PetRemovedFromInventoryMessageComposer);
        this.response.appendInt(this.petId);
        return this.response;
    }

    public int getPetId() {
        return petId;
    }
}
