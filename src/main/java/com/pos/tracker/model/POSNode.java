package com.pos.tracker.model;

import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

@Serdeable
public class POSNode {
    private String id;
    private String name;
    private String type;
    private boolean active;
    private List<POSNode> children;

    public POSNode() {}

    public POSNode(String id, String name, String type, boolean active, List<POSNode> children) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.active = active;
        this.children = children;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<POSNode> getChildren() { return children; }
    public void setChildren(List<POSNode> children) { this.children = children; }
}
