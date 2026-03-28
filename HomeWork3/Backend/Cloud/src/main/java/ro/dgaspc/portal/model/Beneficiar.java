package ro.dgaspc.portal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "beneficiari")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Beneficiar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String nume;

    @NotBlank
    @Column(unique = true, nullable = false, length = 13)
    private String cnp;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 20)
    private String telefon;

    @Column(columnDefinition = "TEXT")
    private String adresa;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
