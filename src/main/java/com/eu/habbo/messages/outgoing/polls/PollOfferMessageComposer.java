package com.eu.habbo.messages.outgoing.polls;

import com.eu.habbo.habbohotel.polls.Poll;
import com.eu.habbo.messages.ServerMessage;
import com.eu.habbo.messages.outgoing.MessageComposer;
import com.eu.habbo.messages.outgoing.Outgoing;

public class PollOfferMessageComposer extends MessageComposer {
    private final Poll poll;

    public PollOfferMessageComposer(Poll poll) {
        this.poll = poll;
    }

    @Override
    protected ServerMessage composeInternal() {
        this.response.init(Outgoing.PollOfferMessageComposer);
        this.response.appendInt(this.poll.id);
        this.response.appendString(this.poll.title);
        this.response.appendString(this.poll.thanksMessage);
        this.response.appendString(this.poll.title);
        return this.response;
    }

    public Poll getPoll() {
        return poll;
    }
}
