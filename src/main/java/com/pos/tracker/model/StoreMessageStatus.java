package com.pos.tracker.model;

import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.Map;

@Serdeable
public class StoreMessageStatus {
    private String storeId;
    private String storeName;
    private Map<String, Integer> statusCounts;
    private List<MessageStatus> posStatuses;

    public StoreMessageStatus() {}

    public StoreMessageStatus(String storeId, String storeName, Map<String, Integer> statusCounts, List<MessageStatus> posStatuses) {
        this.storeId = storeId;
        this.storeName = storeName;
        this.statusCounts = statusCounts;
        this.posStatuses = posStatuses;
    }

    // Getters and Setters
    public String getStoreId() { return storeId; }
    public void setStoreId(String storeId) { this.storeId = storeId; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public Map<String, Integer> getStatusCounts() { return statusCounts; }
    public void setStatusCounts(Map<String, Integer> statusCounts) { this.statusCounts = statusCounts; }

    public List<MessageStatus> getPosStatuses() { return posStatuses; }
    public void setPosStatuses(List<MessageStatus> posStatuses) { this.posStatuses = posStatuses; }
}
