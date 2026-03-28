package ro.dgaspc.portal.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificari_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificareLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cerere_id")
    private Cerere cerere;

    @Column(name = "tip_eveniment", length = 50)
    private String tipEveniment;

    @Column(name = "status_vechi", length = 20)
    private String statusVechi;

    @Column(name = "status_nou", length = 20)
    private String statusNou;

    @Column(name = "pubsub_message_id", length = 100)
    private String pubsubMessageId;

    @Column(name = "trimis_la")
    private LocalDateTime trimisLa;

    @PrePersist
    protected void onCreate() {
        this.trimisLa = LocalDateTime.now();
    }
}
