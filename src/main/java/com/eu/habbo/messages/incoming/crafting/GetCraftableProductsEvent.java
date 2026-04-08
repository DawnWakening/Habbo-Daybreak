package com.eu.habbo.messages.incoming.crafting;

import com.eu.habbo.Emulator;
import com.eu.habbo.habbohotel.crafting.CraftingRecipe;
import com.eu.habbo.messages.incoming.MessageHandler;
import com.eu.habbo.messages.outgoing.catalog.LimitedEditionSoldOutMessageComposer;
import com.eu.habbo.messages.outgoing.crafting.CraftingRecipeMessageComposer;

public class GetCraftableProductsEvent extends MessageHandler {
    @Override
    public void handle() throws Exception {
        String recipeName = this.packet.readString();
        CraftingRecipe recipe = Emulator.getGameEnvironment().getCraftingManager().getRecipe(recipeName);

        if (recipe != null) {
            if (!recipe.canBeCrafted()) {
                this.client.sendResponse(new LimitedEditionSoldOutMessageComposer());
                return;
            }

            this.client.sendResponse(new CraftingRecipeMessageComposer(recipe));
        }
    }
}
