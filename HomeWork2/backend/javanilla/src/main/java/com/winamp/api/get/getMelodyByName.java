package com.winamp.api.get;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Melody;

import java.util.Optional;

public class getMelodyByName extends ApiHandler {
    public static void handleGet(HttpExchange exchange, DbStore db, String name) throws Exception {
        Optional<Melody> melody = db.getMelodyByName(name);

        if (melody.isEmpty()) {
            sendNotFound(exchange, "Melody not found: " + name);
            return;
        }

        Gson gson = new Gson();
        String response = gson.toJson(melody.get());
        sendOk(exchange, response);
    }
}
