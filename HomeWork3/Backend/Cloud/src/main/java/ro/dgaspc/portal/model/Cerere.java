package ro.dgaspc.portal.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "cereri")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cerere {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dosar_id", unique = true, nullable = false, length = 20)
    private String dosarId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "beneficiar_id")
    private Beneficiar beneficiar;

    @NotBlank
    @Column(name = "tip_ajutor", nullable = false, length = 50)
    private String tipAjutor;

    @Column(length = 20)
    private String status = "pending";

    @Column(columnDefinition = "TEXT")
    private String detalii;

    @Column(length = 50)
    private String judet = "Iași";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
