package com.pos.tracker.model;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class MessageStatus {
    private String posId;
    private String posName;
    private String status;
    private String lastUpdate;
    private int retryAttempts;

    public MessageStatus() {}

    public MessageStatus(String posId, String posName, String status, String lastUpdate, int retryAttempts) {
        this.posId = posId;
        this.posName = posName;
        this.status = status;
        this.lastUpdate = lastUpdate;
        this.retryAttempts = retryAttempts;
    }

    // Getters and Setters
    public String getPosId() { return posId; }
    public void setPosId(String posId) { this.posId = posId; }

    public String getPosName() { return posName; }
    public void setPosName(String posName) { this.posName = posName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLastUpdate() { return lastUpdate; }
    public void setLastUpdate(String lastUpdate) { this.lastUpdate = lastUpdate; }

    public int getRetryAttempts() { return retryAttempts; }
    public void setRetryAttempts(int retryAttempts) { this.retryAttempts = retryAttempts; }
}
