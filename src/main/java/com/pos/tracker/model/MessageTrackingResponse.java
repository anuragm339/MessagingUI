package com.pos.tracker.model;

import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.Map;

@Serdeable
public class MessageTrackingResponse {
    private String messageKey;
    private Map<String, Integer> overallStats;
    private List<StoreMessageStatus> stores;

    public MessageTrackingResponse() {}

    public MessageTrackingResponse(String messageKey, Map<String, Integer> overallStats, List<StoreMessageStatus> stores) {
        this.messageKey = messageKey;
        this.overallStats = overallStats;
        this.stores = stores;
    }

    // Getters and Setters
    public String getMessageKey() { return messageKey; }
    public void setMessageKey(String messageKey) { this.messageKey = messageKey; }

    public Map<String, Integer> getOverallStats() { return overallStats; }
    public void setOverallStats(Map<String, Integer> overallStats) { this.overallStats = overallStats; }

    public List<StoreMessageStatus> getStores() { return stores; }
    public void setStores(List<StoreMessageStatus> stores) { this.stores = stores; }
}
