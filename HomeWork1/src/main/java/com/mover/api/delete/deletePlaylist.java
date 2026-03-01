package com.mover.api.delete;

import com.mover.api.base.ApiHandler;
import com.mover.domain.dto.Playlist;
import com.sun.net.httpserver.HttpExchange;

import java.util.Optional;
import java.util.Set;

public class deletePlaylist extends ApiHandler {
    public static void handleDelete(HttpExchange exchange, Set<Playlist> playlists, String name) throws Exception {
        // Find the playlist to delete
        Optional<Playlist> playlist = playlists.stream()
                .filter(p -> p.getName().equalsIgnoreCase(name))
                .findFirst();

        if (playlist.isEmpty()) {
            sendNotFound(exchange, "Playlist not found: " + name);
            return;
        }

        // Remove the playlist
        playlists.remove(playlist.get());

        sendNoContent(exchange);
    }
}

