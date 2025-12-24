# Tree Implementation Comparison: Old vs Current

## 1. Data Fetching & API Integration

### Old Implementation (oldtree.js)
```javascript
- Fetches from: Config.registryUrl with groups parameter
- URL normalization: Replaces multiple domain patterns
  * stores.prod.isc.abccloud.com → api.abc.com
  * stores.ppe.isc.abccloud.com → api-ppe.abc.com
  * api.prod.retail.abc.com → api.abc.com
- Store/Country search: Can search by country code and store number
- Groups input: Manual group ID input
- Location ID lookup: Fetches location ID from country/store
- Auto-refresh: Every 60 seconds if enabled
```

### Current Implementation
```javascript
- Fetches from: /sampleTreeData.json (static sample data)
- No URL normalization
- No store/country search
- No groups filtering
- No auto-refresh
- Uses hardcoded sample JSON data
```

**Difference:** Current implementation uses static sample data instead of dynamic API calls.

---

## 2. Graph Configuration & Layouts

### Old Implementation
```javascript
styles: {
  "Standard": { rankdir: "BT", ranksep: 50, nodesep: 50 },
  "Standard LR": { rankdir: "RL", ranksep: 50, nodesep: 50 },
  "Packed": { rankdir: "BT", ranksep: 10, nodesep: 10 },
  "Packed LR": { rankdir: "RL", ranksep: 10, nodesep: 10 }
}
Default: "Packed LR"
User can select layout via dropdown
```

### Current Implementation
```javascript
Fixed layout:
rankdir: 'LR' (Left to Right)
nodesep: 60
ranksep: 150
marginx: 40, marginy: 40

No layout selector
```

**Difference:** Old version has 4 layout options, current has 1 fixed layout.

---

## 3. Node Grouping & Clustering

### Old Implementation
```javascript
// Creates CLUSTERS for each group
const groups = new Set(data.followers.map(({group}) => group));
groups.forEach(group => {
  g.setNode(group, {
    label: storeName,
    clusterLabelPos: 'bottom'
  });
});

// Parents each follower to its group
data.followers.forEach((node) => {
  g.setParent(node.id, node.group);
  g.setNode(node.id, {...});
});
```

### Current Implementation
```javascript
// NO CLUSTERING
// All nodes are at same level, no parent-child grouping
nodeMap.forEach((node, nodeId) => {
  g.setNode(nodeId, {...});
  // No g.setParent() call
});
```

**Difference:** Old version uses compound graphs with clusters/groups, current doesn't.

---

## 4. Edge Logic & Styling

### Old Implementation
```javascript
// Three modes via parentSelector:
1. "following" - shows actual following relationships
2. "requestedToFollow" - shows requested relationships
3. "requestedVsActual" - shows BOTH with different colors:
   - Requested: lightcoral (pink/red)
   - Following (when matches requested): black
   - Following (when differs): grey

// Edge creation:
let urlToId = (url) => {
  return (url === rootUrl) ? root.localUrl : group + "|" + url;
};

if (parentSelector === "requestedVsActual") {
  // Draw both requested and actual with different colors
  g.setEdge(id, urlToId(requested[0]), {
    style: "stroke: lightcoral;",
    arrowheadStyle: "stroke: lightcoral; fill: lightcoral;"
  });
  g.setEdge(id, urlToId(following[0]), {
    style: `stroke: ${color};`,
    arrowheadStyle: `stroke: ${color}; fill: ${color};`
  });
}
```

### Current Implementation
```javascript
// Two modes via viewMode:
1. "following" - shows following relationships (black arrows)
2. "requested" - shows requested relationships (grey dashed)
3. "both" - shows both

// Simpler edge styling:
- Following: 'stroke: #333; stroke-width: 1.5px;'
- Requested: 'stroke-dasharray: 5, 5; stroke: #999; stroke-width: 1.5px;'

// No color variation based on match/mismatch
```

**Difference:** Old version has more sophisticated edge coloring logic for requested vs actual comparison.

---

## 5. Node Labels

### Old Implementation
```javascript
// Dynamic label provider based on user selection
getLabelProvider: function() {
  let property = $("#nameSelector").val();
  return (node) => {
    // Supports nested properties: "pipe.host"
    return property.split('.').reduce((a, b) => a[b], node);
  }
}

// User can select what to display:
- pipe.host
- localUrl
- pipe.ip
- etc.
```

### Current Implementation
```javascript
// Fixed labels:
- Root: "v1"
- Followers: node.pipe?.host || node.name

// No user selection for label content
```

**Difference:** Old version allows dynamic label selection via property path.

---

## 6. Difference Calculation on Edges

### Old Implementation
```javascript
// Shows on DEFAULT edge labels automatically
g.setDefaultEdgeLabel((v, w) => {
  return { label: App.difference(g.node(w), g.node(v)) };
});

difference: function(node, nodeFollowing) {
  if (node && node.offsets && nodeFollowing.offsets) {
    return node.offsets.PIPE_OFFSET - nodeFollowing.offsets.PIPE_OFFSET;
  } else if (node && nodeFollowing.offsets) {
    return node.offset - nodeFollowing.offsets.PIPE_OFFSET;
  }
  return "NaN";
}
```

### Current Implementation
```javascript
// Manual calculation and formatting for each edge
const diff = calculateDifference(parentNode, node);
const diffLabel = typeof diff === 'number' ? diff.toLocaleString() : diff;

g.setEdge(parentId, nodeId, {
  label: `Δ ${diffLabel}`,
  ...
});

// Same calculation logic, but applied manually per edge
```

**Difference:** Old version uses default edge label function, current calculates per edge.

---

## 7. Tooltips

### Old Implementation
```javascript
// Uses tippy.js library
svgGroup.selectAll("g.node").each(function(id) {
  tippy(this, {
    content: App.tooltip(g.node(id)),
    arrow: true,
    placement: "right",
    theme: "light-border",
    interactive: true,
    delay: [50, 300]
  });
});

// Rich tooltip content:
- localUrl
- Status info (status, lastSeen)
- Offset info (PIPE_OFFSET, behindRoot)
- Pipe info (IP, state)
- Provider info (lastOffsetSent, lastAckedOffset)
```

### Current Implementation
```javascript
// NO TOOLTIPS
// All information must be visible on the node itself
```

**Difference:** Old version has detailed interactive tooltips, current doesn't.

---

## 8. UI Controls & Features

### Old Implementation
```javascript
Controls:
1. Country selector (dropdown)
2. Store input (text field)
3. Groups input (text field)
4. Name selector (what property to show on nodes)
5. Style selector (4 layout options)
6. Parent selector (following/requested/requestedVsActual)
7. Auto-refresh checkbox
8. Refresh button
9. Last refresh time display

Search functionality:
- Can search by store number
- Can filter by country
- Can filter by groups
```

### Current Implementation
```javascript
Controls:
1. View Mode selector (Following/Requested/Both)

Missing:
- Country/Store search
- Groups filtering
- Name selector
- Style selector
- Auto-refresh
- Last refresh time
```

**Difference:** Old version has extensive search and filtering capabilities.

---

## 9. Node Styling & Classes

### Old Implementation
```javascript
// Node class based on status
g.setNode(id, {
  ...node,
  class: status.toLowerCase()  // "following", "up_to_date", etc.
});

// CSS classes for different statuses
// Likely has .following, .up_to_date, .down, etc.
```

### Current Implementation
```javascript
// Node class based on type and pipeState
class: getNodeClass(node)

// Returns:
- node-root
- node-follower
- node-follower.pipe-up-to-date
- node-follower.pipe-out-of-sync
- node-follower.pipe-down

// Green for UP_TO_DATE, Yellow for OUT_OF_SYNC, Red for DOWN
```

**Difference:** Similar concept but different class naming conventions.

---

## 10. Data Massage/Normalization

### Old Implementation
```javascript
massageData: function(data) {
  data.root.localUrl = data.root.localUrl.replace('https', 'http');
  data.followers.forEach((node) => {
    node.following[0] = node.following[0].replace('https', 'http');
    node.requestedToFollow[0] = node.requestedToFollow[0].replace('https', 'http');
  });
}
```

### Current Implementation
```javascript
// No data massaging
// Uses data as-is from JSON
```

**Difference:** Old version normalizes HTTPS to HTTP for consistency.

---

## Summary of Key Differences

| Feature | Old Implementation | Current Implementation | Missing in Current |
|---------|-------------------|----------------------|-------------------|
| **Data Source** | Dynamic API with groups filtering | Static JSON file | ✓ API integration |
| **Clustering** | Yes (compound graphs with groups) | No | ✓ Group clusters |
| **Layout Options** | 4 selectable layouts | 1 fixed layout | ✓ Layout selector |
| **Search** | Country, Store, Groups | None | ✓ All search features |
| **Label Customization** | Dynamic property selection | Fixed labels | ✓ Label selector |
| **Tooltips** | Rich interactive tooltips | None | ✓ Tooltips |
| **Edge Colors** | 3 colors (requested vs actual) | 2 colors (following vs requested) | ✓ Match/mismatch coloring |
| **Auto-refresh** | Yes (60s interval) | No | ✓ Auto-refresh |
| **Offset Display** | On all edges by default | On all edges manually | ✗ (both have it) |
| **View Modes** | 3 modes (selector-based) | 3 modes (dropdown) | ✗ (both have it) |

## Recommendations for Current Implementation

To match the old implementation more closely:

1. **Add clustering support** - Use `g.setParent()` for grouping nodes
2. **Implement search functionality** - Country/Store/Groups filters
3. **Add layout selector** - Multiple layout options
4. **Add tooltips** - Use tippy.js for detailed information
5. **Dynamic labels** - Allow user to select what property to display
6. **API integration** - Replace static JSON with dynamic API calls
7. **Auto-refresh** - Periodic data refresh option
8. **Enhanced edge colors** - Different colors for match vs mismatch in requested vs actual
