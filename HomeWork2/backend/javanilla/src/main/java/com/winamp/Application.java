package com.winamp;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.winamp.api.delete.deleteMelody;
import com.winamp.api.delete.deletePlaylist;
import com.winamp.api.get.getAllMelodies;
import com.winamp.api.get.getMelodyByName;
import com.winamp.api.post.postMelody;
import com.winamp.api.post.postPlaylist;
import com.winamp.api.put.putMelody;
import com.winamp.api.put.putPlaylist;
import com.winamp.db.DbStore;
import com.winamp.domain.dto.Playlist;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

public class Application {
    private final String baseApiPath = "/v1/api/";
    private final HttpServer server;

    private final DbStore db;
    private static Set<Playlist> playlists;

    Application() throws IOException, SQLException {
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            throw new IllegalStateException("DATABASE_URL environment variable is not set");
        }
        db = new DbStore(dbUrl);
        playlists = new HashSet<>();

        int serverPort = 8000;
        this.server = HttpServer.create(new InetSocketAddress(serverPort), 0);
        buildEndpoints();

        server.setExecutor(null);
        server.start();
        System.out.println("Server started on port " + serverPort);
    }

    private void buildEndpoints() {
        // Hello World endpoint
        server.createContext(baseApiPath + "hello", exchange -> {
            try {
                if ("GET".equals(exchange.getRequestMethod())) {
                    String response = "{\"message\":\"Hello World\"}";
                    sendResponse(exchange, 200, response);
                } else {
                    sendMethodNotAllowed(exchange);
                }
            } catch (Exception e) {
                handleError(exchange, e);
            }
        });

        // GET all melodies
        server.createContext(baseApiPath + "melodies", exchange -> {
            try {
                if ("GET".equals(exchange.getRequestMethod())) {
                    getAllMelodies.handleGet(exchange, db);
                } else {
                    sendMethodNotAllowed(exchange);
                }
            } catch (Exception e) {
                handleError(exchange, e);
            }
        });

        // GET melody by name, POST, PUT, DELETE melody
        server.createContext(baseApiPath + "melody", exchange -> {
            try {
                String method = exchange.getRequestMethod();

                if ("POST".equals(method)) {
                    postMelody.handlePost(exchange, db);
                } else if ("PUT".equals(method)) {
                    String name = getQueryParam(exchange, "name");
                    if (name == null || name.isEmpty()) {
                        sendBadRequest(exchange, "Missing 'name' query parameter");
                        return;
                    }
                    putMelody.handlePut(exchange, db, name);
                } else if ("DELETE".equals(method)) {
                    String name = getQueryParam(exchange, "name");
                    if (name == null || name.isEmpty()) {
                        sendBadRequest(exchange, "Missing 'name' query parameter");
                        return;
                    }
                    deleteMelody.handleDelete(exchange, db, name);
                } else {
                    sendMethodNotAllowed(exchange);
                }
            } catch (Exception e) {
                handleError(exchange, e);
            }
        });

        // GET melody by name - path parameter
        server.createContext(baseApiPath + "melodies/", exchange -> {
            try {
                if ("GET".equals(exchange.getRequestMethod())) {
                    String path = exchange.getRequestURI().getPath();
                    String name = path.substring((baseApiPath + "melodies/").length());

                    if (name.isEmpty()) {
                        sendBadRequest(exchange, "Melody name is required");
                        return;
                    }

                    // URL decode the name
                    name = java.net.URLDecoder.decode(name, StandardCharsets.UTF_8);
                    getMelodyByName.handleGet(exchange, db, name);
                } else {
                    sendMethodNotAllowed(exchange);
                }
            } catch (Exception e) {
                handleError(exchange, e);
            }
        });

        // POST, PUT, DELETE playlist
        server.createContext(baseApiPath + "playlist", exchange -> {
            try {
                String method = exchange.getRequestMethod();

                if ("POST".equals(method)) {
                    postPlaylist.handlePost(exchange, db, playlists);
                } else if ("PUT".equals(method)) {
                    String name = getQueryParam(exchange, "name");
                    if (name == null || name.isEmpty()) {
                        sendBadRequest(exchange, "Missing 'name' query parameter");
                        return;
                    }
                    putPlaylist.handlePut(exchange, db, playlists, name);
                } else if ("DELETE".equals(method)) {
                    String name = getQueryParam(exchange, "name");
                    if (name == null || name.isEmpty()) {
                        sendBadRequest(exchange, "Missing 'name' query parameter");
                        return;
                    }
                    deletePlaylist.handleDelete(exchange, playlists, name);
                } else {
                    sendMethodNotAllowed(exchange);
                }
            } catch (Exception e) {
                handleError(exchange, e);
            }
        });
    }

    private String getQueryParam(HttpExchange exchange, String paramName) {
        String query = exchange.getRequestURI().getQuery();
        if (query == null) return null;

        String[] params = query.split("&");
        for (String param : params) {
            String[] keyValue = param.split("=");
            if (keyValue.length == 2 && keyValue[0].equals(paramName)) {
                try {
                    return java.net.URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8);
                } catch (Exception e) {
                    return keyValue[1];
                }
            }
        }
        return null;
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private void sendBadRequest(HttpExchange exchange, String message) throws IOException {
        sendResponse(exchange, 400, "{\"error\":\"" + message + "\"}");
    }

    private void sendMethodNotAllowed(HttpExchange exchange) throws IOException {
        sendResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
    }

    private void handleError(HttpExchange exchange, Exception e) {
        try {
            e.printStackTrace();
            sendResponse(exchange, 500, "{\"error\":\"Internal Server Error: " + e.getMessage() + "\"}");
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
    }

}
