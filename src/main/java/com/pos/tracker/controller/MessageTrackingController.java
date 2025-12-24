package com.pos.tracker.controller;

import com.pos.tracker.model.MessageTrackingResponse;
import com.pos.tracker.service.POSDataService;
import io.micronaut.http.annotation.*;
import io.micronaut.core.annotation.Nullable;
import jakarta.inject.Inject;

import java.util.List;

@Controller("/api/messages")
public class MessageTrackingController {

    @Inject
    private POSDataService posDataService;

    @Get("/track")
    public MessageTrackingResponse trackMessage(
            @QueryValue String messageKey,
            @Nullable @QueryValue String storeId,
            @Nullable @QueryValue String clusterId,
            @Nullable @QueryValue List<String> storeIds) {
        return posDataService.trackMessage(messageKey, storeId, clusterId, storeIds);
    }
}
