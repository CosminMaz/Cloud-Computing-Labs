package com.winamp.db;

import com.winamp.domain.dto.Melody;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class DbStore {
    private final String dbUrl;

    public DbStore(String dbUrl) {
        this.dbUrl = dbUrl;
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl);
    }

    public List<Melody> getAllMelodies() throws SQLException {
        List<Melody> result = new ArrayList<>();
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT name, genre, album, artist FROM melodies");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                result.add(new Melody(
                        rs.getString("name"),
                        rs.getString("genre"),
                        rs.getString("album"),
                        rs.getString("artist")));
            }
        }
        return result;
    }

    public Optional<Melody> getMelodyByName(String name) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT name, genre, album, artist FROM melodies WHERE LOWER(name) = LOWER(?)")) {
            ps.setString(1, name);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new Melody(
                            rs.getString("name"),
                            rs.getString("genre"),
                            rs.getString("album"),
                            rs.getString("artist")));
                }
            }
        }
        return Optional.empty();
    }

    public boolean melodyExists(String name) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "SELECT 1 FROM melodies WHERE LOWER(name) = LOWER(?)")) {
            ps.setString(1, name);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    public void addMelody(Melody melody) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "INSERT INTO melodies (name, genre, album, artist) VALUES (?, ?, ?, ?)")) {
            ps.setString(1, melody.getName());
            ps.setString(2, melody.getGenre() != null ? melody.getGenre() : "");
            ps.setString(3, melody.getAlbum() != null ? melody.getAlbum() : "");
            ps.setString(4, melody.getArtist() != null ? melody.getArtist() : "");
            ps.executeUpdate();
        }
    }

    public boolean updateMelody(String name, Melody updated) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "UPDATE melodies SET name = ?, genre = ?, album = ?, artist = ? WHERE LOWER(name) = LOWER(?)")) {
            ps.setString(1, updated.getName());
            ps.setString(2, updated.getGenre() != null ? updated.getGenre() : "");
            ps.setString(3, updated.getAlbum() != null ? updated.getAlbum() : "");
            ps.setString(4, updated.getArtist() != null ? updated.getArtist() : "");
            ps.setString(5, name);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deleteMelody(String name) throws SQLException {
        try (Connection conn = getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "DELETE FROM melodies WHERE LOWER(name) = LOWER(?)")) {
            ps.setString(1, name);
            return ps.executeUpdate() > 0;
        }
    }
}
