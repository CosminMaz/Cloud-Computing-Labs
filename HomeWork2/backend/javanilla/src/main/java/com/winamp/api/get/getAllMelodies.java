package com.winamp.api.get;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.domain.dto.Melody;

import java.util.Set;

public class getAllMelodies extends ApiHandler {
    public static void handleGet(HttpExchange exchange, Set<Melody> melodies) throws Exception {
        Gson gson = new Gson();
        String response = gson.toJson(melodies);
        sendOk(exchange, response);
    }
}
