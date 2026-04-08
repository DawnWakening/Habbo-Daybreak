package com.eu.habbo.messages.outgoing.camera;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class InitCameraMessageComposer extends MessageComposer {
    public final int credits;
    public final int points;
    public final int pointsType;

    public InitCameraMessageComposer(int credits, int points, int pointsType) {
        this.credits = credits;
        this.points = points;
        this.pointsType = pointsType;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.InitCameraMessageComposer);
        this.response.appendInt(this.credits);
        this.response.appendInt(this.points);
        this.response.appendInt(this.pointsType);
        return this.response;
    }

    public int getCredits() {
        return credits;
    }

    public int getPoints() {
        return points;
    }

    public int getPointsType() {
        return pointsType;
    }
}