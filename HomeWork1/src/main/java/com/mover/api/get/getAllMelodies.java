package com.mover.api.get;

import com.google.gson.Gson;
import com.mover.api.base.ApiHandler;
import com.mover.domain.dto.Melody;
import com.sun.net.httpserver.HttpExchange;

import java.util.Set;

public class getAllMelodies extends ApiHandler {
    public static void handleGet(HttpExchange exchange, Set<Melody> melodies) throws Exception {
        Gson gson = new Gson();
        String response = gson.toJson(melodies);
        sendOk(exchange, response);
    }
}
