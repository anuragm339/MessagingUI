package com.pos.tracker.controller;

import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;

import java.io.InputStream;

@Controller
public class HomeController {

    @Get("/")
    public HttpResponse<?> index() {
        InputStream indexHtml = getClass().getResourceAsStream("/public/index.html");
        if (indexHtml != null) {
            return HttpResponse.ok(indexHtml).contentType("text/html");
        }
        return HttpResponse.notFound("Frontend not found. Please build the frontend first.");
    }
}
