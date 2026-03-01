package com.mover.api.get;

import com.google.gson.Gson;
import com.mover.api.base.ApiHandler;
import com.mover.domain.dto.Melody;
import com.sun.net.httpserver.HttpExchange;

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
