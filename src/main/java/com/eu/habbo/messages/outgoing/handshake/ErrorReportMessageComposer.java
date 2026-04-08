package com.eu.habbo.messages.outgoing.handshake;

import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class ErrorReportMessageComposer extends MessageComposer {
    private final int messageId;
    private final int errorCode;
    private final String timestamp;

    public ErrorReportMessageComposer(int errorCode) {
        this.messageId = 0;
        this.errorCode = errorCode;
        this.timestamp = "";
    }

    public ErrorReportMessageComposer(int messageId, int errorCode, String timestamp) {
        this.messageId = messageId;
        this.errorCode = errorCode;
        this.timestamp = timestamp;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.ErrorReportMessageComposer);
        this.response.appendInt(this.messageId);
        this.response.appendInt(this.errorCode);
        this.response.appendString(this.timestamp);

        return this.response;
    }

    public int getMessageId() {
        return messageId;
    }

    public int getErrorCode() {
        return errorCode;
    }

    public String getTimestamp() {
        return timestamp;
    }
}
