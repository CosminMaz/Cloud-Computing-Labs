package com.winamp.api.delete;

import com.sun.net.httpserver.HttpExchange;
import com.winamp.api.base.ApiHandler;
import com.winamp.db.DbStore;

public class deleteMelody extends ApiHandler {
    public static void handleDelete(HttpExchange exchange, DbStore db, String name) throws Exception {
        if (!db.deleteMelody(name)) {
            sendNotFound(exchange, "Melody not found: " + name);
            return;
        }

        sendNoContent(exchange);
    }
}
