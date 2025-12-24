package com.pos.tracker.service;

import com.pos.tracker.model.*;
import jakarta.inject.Singleton;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Singleton
public class POSDataService {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public List<POSNode> getPOSTreeStructure() {
        // Mock data - replace with actual database queries
        List<POSNode> regions = new ArrayList<>();

        // East Region
        List<POSNode> eastClusters = Arrays.asList(
            createCluster("C001", "Cluster-NYC", Arrays.asList(
                createStore("S001", "Store-001", Arrays.asList(
                    createPOS("POS-001-01", "POS-001-01", true),
                    createPOS("POS-001-02", "POS-001-02", true)
                )),
                createStore("S002", "Store-002", Arrays.asList(
                    createPOS("POS-002-01", "POS-002-01", true),
                    createPOS("POS-002-02", "POS-002-02", false)
                ))
            ))
        );
        regions.add(new POSNode("R001", "East Region", "region", true, eastClusters));

        // West Region
        List<POSNode> westClusters = Arrays.asList(
            createCluster("C002", "Cluster-LA", Arrays.asList(
                createStore("S003", "Store-003", Arrays.asList(
                    createPOS("POS-003-01", "POS-003-01", true),
                    createPOS("POS-003-02", "POS-003-02", true)
                ))
            ))
        );
        regions.add(new POSNode("R002", "West Region", "region", true, westClusters));

        return regions;
    }

    public MessageTrackingResponse trackMessage(String messageKey, String storeId, String clusterId, List<String> storeIds) {
        // Mock data - replace with actual database queries
        Random random = new Random();
        List<StoreMessageStatus> stores = new ArrayList<>();

        List<String> targetStores;
        if (storeId != null && !storeId.isEmpty()) {
            targetStores = Arrays.asList(storeId);
        } else if (storeIds != null && !storeIds.isEmpty()) {
            targetStores = storeIds;
        } else {
            targetStores = Arrays.asList("S001", "S002", "S003");
        }

        int totalDelivered = 0, totalProcessing = 0, totalPending = 0, totalFailed = 0;

        for (String store : targetStores) {
            List<MessageStatus> posStatuses = new ArrayList<>();
            Map<String, Integer> statusCounts = new HashMap<>();
            statusCounts.put("delivered", 0);
            statusCounts.put("processing", 0);
            statusCounts.put("pending", 0);
            statusCounts.put("failed", 0);

            int numPOS = 2 + random.nextInt(3); // 2-4 POS per store
            for (int i = 1; i <= numPOS; i++) {
                String[] statuses = {"delivered", "processing", "pending", "failed"};
                String status = statuses[random.nextInt(statuses.length)];

                String posId = "POS-" + store.substring(1) + "-0" + i;
                String lastUpdate = LocalDateTime.now().minusMinutes(random.nextInt(120)).format(formatter);
                int retries = status.equals("failed") ? random.nextInt(3) + 1 : 0;

                posStatuses.add(new MessageStatus(posId, posId, status, lastUpdate, retries));
                statusCounts.put(status, statusCounts.get(status) + 1);
            }

            totalDelivered += statusCounts.get("delivered");
            totalProcessing += statusCounts.get("processing");
            totalPending += statusCounts.get("pending");
            totalFailed += statusCounts.get("failed");

            stores.add(new StoreMessageStatus(store, "Store-" + store.substring(1), statusCounts, posStatuses));
        }

        Map<String, Integer> overallStats = new HashMap<>();
        overallStats.put("total", totalDelivered + totalProcessing + totalPending + totalFailed);
        overallStats.put("delivered", totalDelivered);
        overallStats.put("processing", totalProcessing);
        overallStats.put("pending", totalPending);
        overallStats.put("failed", totalFailed);

        return new MessageTrackingResponse(messageKey, overallStats, stores);
    }

    private POSNode createCluster(String id, String name, List<POSNode> stores) {
        return new POSNode(id, name, "cluster", true, stores);
    }

    private POSNode createStore(String id, String name, List<POSNode> pos) {
        return new POSNode(id, name, "store", true, pos);
    }

    private POSNode createPOS(String id, String name, boolean active) {
        return new POSNode(id, name, "pos", active, null);
    }

    public List<String> getClusters() {
        return Arrays.asList("Cluster-NYC", "Cluster-LA", "Cluster-Chicago");
    }

    public List<String> getStoresByCluster(String cluster) {
        // Mock data - replace with actual database queries
        Map<String, List<String>> clusterStores = new HashMap<>();
        clusterStores.put("Cluster-NYC", Arrays.asList("Store-001", "Store-002"));
        clusterStores.put("Cluster-LA", Arrays.asList("Store-003", "Store-004"));
        clusterStores.put("Cluster-Chicago", Arrays.asList("Store-005", "Store-006"));

        return clusterStores.getOrDefault(cluster, new ArrayList<>());
    }
}
