package com.mover.api.put;

import com.google.gson.Gson;
import com.mover.api.base.ApiHandler;
import com.mover.domain.dto.Melody;
import com.mover.domain.dto.Playlist;
import com.sun.net.httpserver.HttpExchange;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class putPlaylist extends ApiHandler {
    public static void handlePut(HttpExchange exchange, Set<Melody> melodies, Set<Playlist> playlists, String name) throws Exception {
        // Read the request body
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        // Parse JSON to Playlist object
        Gson gson = new Gson();
        Playlist updatedPlaylist = gson.fromJson(body, Playlist.class);

        // Find the existing playlist
        Optional<Playlist> existingPlaylist = playlists.stream()
                .filter(p -> p.getName().equalsIgnoreCase(name))
                .findFirst();

        if (existingPlaylist.isEmpty()) {
            sendNotFound(exchange, "Playlist not found: " + name);
            return;
        }

        // Validate that all melodies in the updated playlist exist
        for (String melodyName : updatedPlaylist.getMelodyNames()) {
            boolean melodyExists = melodies.stream()
                    .anyMatch(m -> m.getName().equalsIgnoreCase(melodyName));
            if (!melodyExists) {
                sendBadRequest(exchange, "Melody not found: " + melodyName);
                return;
            }
        }

        // Remove old playlist and add updated one
        playlists.remove(existingPlaylist.get());
        playlists.add(updatedPlaylist);

        String response = gson.toJson(updatedPlaylist);
        sendOk(exchange, response);
    }
}

