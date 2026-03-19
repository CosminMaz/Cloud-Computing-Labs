package com.winamp.api.post;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Melody;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class postMelody extends ApiHandler {
    public static void handlePost(HttpExchange exchange, DbStore db) throws Exception {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        Gson gson = new Gson();
        Melody melody = gson.fromJson(body, Melody.class);

        if (db.melodyExists(melody.getName())) {
            sendBadRequest(exchange, "Melody already exists");
            return;
        }

        db.addMelody(melody);

        String response = gson.toJson(melody);
        sendCreated(exchange, response);
    }
}
