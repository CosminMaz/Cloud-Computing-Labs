package ro.dgaspc.portal.dto;

import ro.dgaspc.portal.model.Cerere;

import java.time.LocalDateTime;

public class CerereResponseDto {

    public String dosarId;
    public String tipAjutor;
    public String status;
    public String detalii;
    public String judet;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    // Flat beneficiar fields — avoids Hibernate proxy serialization issues
    public String beneficiarNume;
    public String beneficiarEmail;
    public String beneficiarCnp;

    public static CerereResponseDto from(Cerere c) {
        CerereResponseDto dto = new CerereResponseDto();
        dto.dosarId = c.getDosarId();
        dto.tipAjutor = c.getTipAjutor();
        dto.status = c.getStatus();
        dto.detalii = c.getDetalii();
        dto.judet = c.getJudet();
        dto.createdAt = c.getCreatedAt();
        dto.updatedAt = c.getUpdatedAt();
        if (c.getBeneficiar() != null) {
            dto.beneficiarNume = c.getBeneficiar().getNume();
            dto.beneficiarEmail = c.getBeneficiar().getEmail();
            dto.beneficiarCnp = c.getBeneficiar().getCnp();
        }
        return dto;
    }
}
