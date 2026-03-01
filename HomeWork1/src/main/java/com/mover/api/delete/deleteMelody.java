package com.mover.api.delete;

import com.mover.api.base.ApiHandler;
import com.mover.domain.dto.Melody;
import com.sun.net.httpserver.HttpExchange;

import java.util.Optional;
import java.util.Set;

public class deleteMelody extends ApiHandler {
    public static void handleDelete(HttpExchange exchange, Set<Melody> melodies, String name) throws Exception {
        // Find the melody to delete
        Optional<Melody> melody = melodies.stream()
                .filter(m -> m.getName().equalsIgnoreCase(name))
                .findFirst();

        if (melody.isEmpty()) {
            sendNotFound(exchange, "Melody not found: " + name);
            return;
        }

        // Remove the melody
        melodies.remove(melody.get());

        sendNoContent(exchange);
    }
}

