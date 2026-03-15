package com.winamp.api.base;

import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class ApiHandler {

    protected static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    protected static void sendOk(HttpExchange exchange, String response) throws IOException {
        sendResponse(exchange, 200, response);
    }

    protected static void sendCreated(HttpExchange exchange, String response) throws IOException {
        sendResponse(exchange, 201, response);
    }

    protected static void sendNoContent(HttpExchange exchange) throws IOException {
        exchange.sendResponseHeaders(204, -1);
        exchange.getResponseBody().close();
    }

    protected static void sendBadRequest(HttpExchange exchange) throws IOException {
        sendBadRequest(exchange, "Bad Request");
    }

    protected static void sendBadRequest(HttpExchange exchange, String message) throws IOException {
        sendResponse(exchange, 400, "{\"error\":\"" + message + "\"}");
    }

    protected static void sendNotFound(HttpExchange exchange) throws IOException {
        sendNotFound(exchange, "Not Found");
    }

    protected static void sendNotFound(HttpExchange exchange, String message) throws IOException {
        sendResponse(exchange, 404, "{\"error\":\"" + message + "\"}");
    }

    protected static void sendMethodNotAllowed(HttpExchange exchange) throws IOException {
        sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
    }
}

