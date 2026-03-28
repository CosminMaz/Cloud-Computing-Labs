package ro.dgaspc.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "documente")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cerere_id")
    private Cerere cerere;

    @Column(name = "nume_fisier", length = 200)
    private String numeFisier;

    @Column(name = "gcs_path", columnDefinition = "TEXT")
    private String gcsPath;

    @Column(name = "tip_document", length = 50)
    private String tipDocument;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onUpload() {
        this.uploadedAt = LocalDateTime.now();
    }
}
