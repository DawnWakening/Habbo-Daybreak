package com.eu.habbo.messages.outgoing.rooms.items;

import com.eu.habbo.habbohotel.users.HabboItem;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class CustomStackingHeightUpdateMessageComposer extends MessageComposer {
    private final HabboItem item;
    private final int height;

    public CustomStackingHeightUpdateMessageComposer(HabboItem item, int height) {
        this.item = item;
        this.height = height;

    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.CustomStackingHeightUpdateMessageComposer);
        this.response.appendInt(this.item.getRoomVisibleId());
        this.response.appendInt(this.height);
        return this.response;
    }

    public HabboItem getItem() {
        return item;
    }

    public int getHeight() {
        return height;
    }
}
