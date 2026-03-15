package com.winamp.api.post;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.domain.dto.Melody;
import com.winamp.domain.dto.Playlist;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;

public class postPlaylist extends ApiHandler {
    public static void handlePost(HttpExchange exchange, Set<Melody> melodies, Set<Playlist> playlists) throws Exception {
        // Read the request body
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        // Parse JSON to Playlist object
        Gson gson = new Gson();
        Playlist playlist = gson.fromJson(body, Playlist.class);

        // Check if playlist already exists
        boolean exists = playlists.stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(playlist.getName()));

        if (exists) {
            sendBadRequest(exchange, "Playlist already exists");
            return;
        }

        // Validate that all melodies in the playlist exist
        for (String melodyName : playlist.getMelodyNames()) {
            boolean melodyExists = melodies.stream()
                    .anyMatch(m -> m.getName().equalsIgnoreCase(melodyName));
            if (!melodyExists) {
                sendBadRequest(exchange, "Melody not found: " + melodyName);
                return;
            }
        }

        // Add playlist to the set
        playlists.add(playlist);

        String response = gson.toJson(playlist);
        sendCreated(exchange, response);
    }
}



