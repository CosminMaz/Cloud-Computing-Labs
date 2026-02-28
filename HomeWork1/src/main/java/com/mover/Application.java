package com.mover;

import com.google.gson.Gson;
import com.mover.domain.dto.Melody;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

public class Application {
    private final String baseApiPath = "/v1/api/";
    private final HttpServer server;

    private static Set<Melody> melodies;

    Application() throws IOException {
        melodies = new HashSet<>();

        int serverPort = 8000;
        this.server = HttpServer.create(new InetSocketAddress(serverPort), 0);
        buildEndpoints();

        server.setExecutor(null);
        server.start();
        System.out.println("Server started on port " + serverPort);
    }

    private void buildEndpoints() {
        helloWorldApi();
        getAllMelodiesApi();
        getMelodyByNameApi();
        addMelodyApi();
    }

    private void getAllMelodiesApi() {
        this.server.createContext(this.baseApiPath + "melodies", (
                exchange -> {
                    if("GET".equals(exchange.getRequestMethod())) {
                        Gson gson = new Gson();
                        String response = gson.toJson(melodies);
                        exchange.getResponseHeaders().set("Content-Type", "application/json");
                        exchange.sendResponseHeaders(200, response.getBytes().length);
                        OutputStream output = exchange.getResponseBody();
                        output.write(response.getBytes());
                        output.flush();
                        exchange.close();
                    } else {
                        exchange.sendResponseHeaders(405, -1);
                        exchange.close();
                    }
                }
                ));
    }

    private void getMelodyByNameApi() {
        this.server.createContext(this.baseApiPath + "melodies/", (
                exchange -> {
                    if("GET".equals(exchange.getRequestMethod())) {
                        // Extract melody name from path: /v1/api/melodies/{melodyname}
                        String path = exchange.getRequestURI().getPath();
                        String melodyName = path.substring(path.lastIndexOf('/') + 1);

                        // Find melody by name
                        Melody foundMelody = melodies.stream()
                                .filter(m -> m.getName().equalsIgnoreCase(melodyName))
                                .findFirst()
                                .orElse(null);

                        if(foundMelody != null) {
                            Gson gson = new Gson();
                            String response = gson.toJson(foundMelody);
                            exchange.getResponseHeaders().set("Content-Type", "application/json");
                            exchange.sendResponseHeaders(200, response.getBytes().length);
                            OutputStream output = exchange.getResponseBody();
                            output.write(response.getBytes());
                            output.flush();
                            exchange.close();
                        } else {
                            String errorResponse = "{\"error\":\"Melody not found\"}";
                            exchange.getResponseHeaders().set("Content-Type", "application/json");
                            exchange.sendResponseHeaders(404, errorResponse.getBytes().length);
                            OutputStream output = exchange.getResponseBody();
                            output.write(errorResponse.getBytes());
                            output.flush();
                            exchange.close();
                        }
                    } else {
                        exchange.sendResponseHeaders(405, -1);
                        exchange.close();
                    }
                }
                ));
    }

    private void addMelodyApi() {
        this.server.createContext(this.baseApiPath + "melody", (
                exchange -> {
                    if("POST".equals(exchange.getRequestMethod())) {
                        try {
                            InputStream inputStream = exchange.getRequestBody();
                            String requestBody = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                            
                            Gson gson = new Gson();
                            Melody melody = gson.fromJson(requestBody, Melody.class);
                            
                            melodies.add(melody);
                            
                            String response = "{\"message\":\"Melody added successfully\"}";
                            exchange.getResponseHeaders().set("Content-Type", "application/json");
                            exchange.sendResponseHeaders(201, response.getBytes().length);
                            OutputStream output = exchange.getResponseBody();
                            output.write(response.getBytes());
                            output.flush();
                            exchange.close();
                        } catch (Exception e) {
                            String errorResponse = "{\"error\":\"Invalid melody data\"}";
                            exchange.getResponseHeaders().set("Content-Type", "application/json");
                            exchange.sendResponseHeaders(400, errorResponse.getBytes().length);
                            OutputStream output = exchange.getResponseBody();
                            output.write(errorResponse.getBytes());
                            output.flush();
                            exchange.close();
                        }
                    } else {
                        exchange.sendResponseHeaders(405, -1);
                        exchange.close();
                    }
                }
                ));
    }

    private void helloWorldApi() {
        this.server.createContext(this.baseApiPath + "hello", (
                exchange -> {
                    String response = "Hello World!\n";
                    exchange.sendResponseHeaders(200, response.getBytes().length);
                    OutputStream output = exchange.getResponseBody();
                    output.write(response.getBytes());
                    output.flush();
                    exchange.close();
                }
                ));
    }
}
