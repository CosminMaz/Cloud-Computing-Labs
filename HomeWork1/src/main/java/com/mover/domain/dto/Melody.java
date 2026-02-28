package com.mover.domain.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class Melody {
    private String name;
    private String genre;
    private String album;
    private String artist;
}
