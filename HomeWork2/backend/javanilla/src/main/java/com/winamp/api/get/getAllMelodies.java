package com.winamp.api.get;

import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Melody;

import java.util.List;

public class getAllMelodies extends ApiHandler {
    public static void handleGet(HttpExchange exchange, DbStore db) throws Exception {
        List<Melody> melodies = db.getAllMelodies();
        Gson gson = new Gson();
        String response = gson.toJson(melodies);
        sendOk(exchange, response);
    }
}
