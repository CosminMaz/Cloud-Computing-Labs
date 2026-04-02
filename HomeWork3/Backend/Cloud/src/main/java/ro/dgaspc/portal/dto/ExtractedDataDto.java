package ro.dgaspc.portal.dto;

import lombok.Data;

@Data
public class ExtractedDataDto {
    private String cnp;
    private String nume;
    private String prenume;
    private String dataNasterii;
    private String adresa;
    private String rawText;
}
