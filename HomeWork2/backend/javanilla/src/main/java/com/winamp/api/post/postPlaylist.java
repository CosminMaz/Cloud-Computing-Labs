package com.winamp.api.post;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Playlist;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.stream.Collectors;

public class postPlaylist extends ApiHandler {
    public static void handlePost(HttpExchange exchange, DbStore db, Set<Playlist> playlists) throws Exception {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        Gson gson = new Gson();
        Playlist playlist = gson.fromJson(body, Playlist.class);

        boolean exists = playlists.stream()
                .anyMatch(p -> p.getName().equalsIgnoreCase(playlist.getName()));

        if (exists) {
            sendBadRequest(exchange, "Playlist already exists");
            return;
        }

        for (String melodyName : playlist.getMelodyNames()) {
            if (!db.melodyExists(melodyName)) {
                sendBadRequest(exchange, "Melody not found: " + melodyName);
                return;
            }
        }

        playlists.add(playlist);

        String response = gson.toJson(playlist);
        sendCreated(exchange, response);
    }
}
