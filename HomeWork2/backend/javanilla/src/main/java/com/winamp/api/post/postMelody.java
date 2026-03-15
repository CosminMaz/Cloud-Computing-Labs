package com.winamp.api.post;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.domain.dto.Melody;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;

public class postMelody extends ApiHandler {
    public static void handlePost(HttpExchange exchange, Set<Melody> melodies) throws Exception {
        // Read the request body
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        // Parse JSON to Melody object
        Gson gson = new Gson();
        Melody melody = gson.fromJson(body, Melody.class);

        // Check if melody already exists
        boolean exists = melodies.stream()
                .anyMatch(m -> m.getName().equalsIgnoreCase(melody.getName()));

        if(exists) {
            sendBadRequest(exchange, "Melody already exists");
            return;
        }

        // Add melody to the set
        melodies.add(melody);

        String response = gson.toJson(melody);
        sendCreated(exchange, response);
    }
}
