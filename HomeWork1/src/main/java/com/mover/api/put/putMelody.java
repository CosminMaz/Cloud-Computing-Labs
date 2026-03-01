package com.mover.api.put;

import com.google.gson.Gson;
import com.mover.api.base.ApiHandler;
import com.mover.domain.dto.Melody;
import com.sun.net.httpserver.HttpExchange;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class putMelody extends ApiHandler {
    public static void handlePut(HttpExchange exchange, Set<Melody> melodies, String name) throws Exception {
        // Read the request body
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        // Parse JSON to Melody object
        Gson gson = new Gson();
        Melody updatedMelody = gson.fromJson(body, Melody.class);

        // Find the existing melody
        Optional<Melody> existingMelody = melodies.stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .findFirst();

        if (existingMelody.isEmpty()) {
            sendNotFound(exchange, "Melody not found: " + name);
            return;
        }

        // Remove old melody and add updated one
        melodies.remove(existingMelody.get());
        melodies.add(updatedMelody);

        String response = gson.toJson(updatedMelody);
        sendOk(exchange, response);
    }
}

