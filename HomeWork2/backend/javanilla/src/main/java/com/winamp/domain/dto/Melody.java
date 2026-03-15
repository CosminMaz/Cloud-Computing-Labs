package com.winamp.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.Objects;

@AllArgsConstructor
@Getter
@Setter
public class Melody {
    private String name;
    private String genre;
    private String album;
    private String artist;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Melody melody = (Melody) o;
        return Objects.equals(name, melody.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
