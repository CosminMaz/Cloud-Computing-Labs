package com.winamp.api.put;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Melody;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

public class putMelody extends ApiHandler {
    public static void handlePut(HttpExchange exchange, DbStore db, String name) throws Exception {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8)
        );
        String body = reader.lines().collect(Collectors.joining("\n"));

        Gson gson = new Gson();
        Melody updatedMelody = gson.fromJson(body, Melody.class);

        if (!db.updateMelody(name, updatedMelody)) {
            sendNotFound(exchange, "Melody not found: " + name);
            return;
        }

        String response = gson.toJson(updatedMelody);
        sendOk(exchange, response);
    }
}
