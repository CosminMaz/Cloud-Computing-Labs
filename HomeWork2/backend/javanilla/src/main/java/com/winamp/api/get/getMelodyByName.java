package com.winamp.api.get;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.domain.dto.Melody;

import java.util.Optional;
import java.util.Set;

public class getMelodyByName extends ApiHandler {
    public static void handleGet(HttpExchange exchange, Set<Melody> melodies, String name) throws Exception {
        Optional<Melody> melody = melodies.stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .findFirst();

        if (melody.isEmpty()) {
            sendNotFound(exchange, "Melody not found: " + name);
            return;
        }

        Gson gson = new Gson();
        String response = gson.toJson(melody.get());
        sendOk(exchange, response);
    }
}

