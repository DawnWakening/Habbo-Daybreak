package com.eu.habbo.messages.outgoing.hotelview;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class CatalogPageExpirationMessageComposer extends MessageComposer {
    private final String name;
    private final int time;
    private final String image;

    public CatalogPageExpirationMessageComposer(String name, int time, String image) {
        this.name = name;
        this.time = time;
        this.image = image;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.CatalogPageExpirationMessageComposer);
        this.response.appendString(this.name);
        this.response.appendInt(this.time);
        this.response.appendString(this.image);
        return this.response;
    }

    public String getName() {
        return name;
    }

    public int getTime() {
        return time;
    }

    public String getImage() {
        return image;
    }
}