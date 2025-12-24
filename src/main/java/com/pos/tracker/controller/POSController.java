package com.pos.tracker.controller;

import com.pos.tracker.model.POSNode;
import com.pos.tracker.service.POSDataService;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import jakarta.inject.Inject;

import java.util.List;

@Controller("/api/pos")
public class POSController {

    @Inject
    private POSDataService posDataService;

    @Get("/tree")
    public List<POSNode> getPOSTree() {
        return posDataService.getPOSTreeStructure();
    }

    @Get("/clusters")
    public List<String> getClusters() {
        return posDataService.getClusters();
    }

    @Get("/stores/{cluster}")
    public List<String> getStoresByCluster(String cluster) {
        return posDataService.getStoresByCluster(cluster);
    }
}
