package com.winamp.api.put;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Playlist;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class putPlaylist extends ApiHandler {
    public static void handlePut(HttpExchange exchange, DbStore db, Set<Playlist> playlists, String name) throws Exception {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        Gson gson = new Gson();
        Playlist updatedPlaylist = gson.fromJson(body, Playlist.class);

        Optional<Playlist> existingPlaylist = playlists.stream()
                .filter(p -> p.getName().equalsIgnoreCase(name))
                .findFirst();

        if (existingPlaylist.isEmpty()) {
            sendNotFound(exchange, "Playlist not found: " + name);
            return;
        }

        for (String melodyName : updatedPlaylist.getMelodyNames()) {
            if (!db.melodyExists(melodyName)) {
                sendBadRequest(exchange, "Melody not found: " + melodyName);
                return;
            }
        }

        playlists.remove(existingPlaylist.get());
        playlists.add(updatedPlaylist);

        String response = gson.toJson(updatedPlaylist);
        sendOk(exchange, response);
    }
}
