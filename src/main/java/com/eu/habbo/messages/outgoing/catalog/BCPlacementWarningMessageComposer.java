package com.eu.habbo.messages.outgoing.catalog;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class BCPlacementWarningMessageComposer extends MessageComposer {

    public static final int TYPE_FLOOR = 0;
    public static final int TYPE_WALL  = 1;

    private final int typeCode;
    private final int pageId;
    private final int offerId;
    private final String extraParam;

    // Floor fields
    private final int x;
    private final int y;
    private final int rotation;

    // Wall field
    private final String wallLocation;

    /** Floor item warning. */
    public BCPlacementWarningMessageComposer(int pageId, int offerId, String extraParam,
                                             int x, int y, int rotation) {
        this.typeCode    = TYPE_FLOOR;
        this.pageId      = pageId;
        this.offerId     = offerId;
        this.extraParam  = extraParam;
        this.x           = x;
        this.y           = y;
        this.rotation    = rotation;
        this.wallLocation = null;
    }

    /** Wall item warning. */
    public BCPlacementWarningMessageComposer(int pageId, int offerId, String extraParam,
                                             String wallLocation) {
        this.typeCode     = TYPE_WALL;
        this.pageId       = pageId;
        this.offerId      = offerId;
        this.extraParam   = extraParam;
        this.wallLocation = wallLocation;
        this.x            = 0;
        this.y            = 0;
        this.rotation     = 0;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.BCPlacementWarningMessageComposer);
        this.response.appendInt(this.typeCode);
        this.response.appendInt(this.pageId);
        this.response.appendInt(this.offerId);
        this.response.appendString(this.extraParam);
        if (this.typeCode == TYPE_FLOOR) {
            this.response.appendInt(this.x);
            this.response.appendInt(this.y);
            this.response.appendInt(this.rotation);
        } else {
            this.response.appendString(this.wallLocation);
        }
        return this.response;
    }
}
