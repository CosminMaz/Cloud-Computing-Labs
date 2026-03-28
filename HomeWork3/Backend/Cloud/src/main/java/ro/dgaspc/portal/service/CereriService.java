package ro.dgaspc.portal.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import ro.dgaspc.portal.model.Beneficiar;
import ro.dgaspc.portal.model.Cerere;
import ro.dgaspc.portal.model.NotificareLog;
import ro.dgaspc.portal.repository.CerereRepository;
import ro.dgaspc.portal.repository.NotificareLogRepository;

import java.time.Year;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CereriService {

    private final CerereRepository cerereRepository;
    private final NotificareLogRepository notificareLogRepository;
    private final BeneficiarService beneficiarService;
    private final PubSubService pubSubService;

    private final Random random = new Random();

    /**
     * Creates a new cerere with an auto-generated dosar ID.
     * Also creates or finds the beneficiar by CNP.
     */
    public Cerere createCerere(Cerere cerere, Beneficiar beneficiar) {
        Beneficiar savedBeneficiar = beneficiarService.createOrFind(beneficiar);
        cerere.setBeneficiar(savedBeneficiar);
        cerere.setDosarId(generateDosarId());
        cerere.setStatus("pending");
        cerere.setJudet("Iași");

        Cerere saved = cerereRepository.save(cerere);
        log.info("Created cerere with dosar ID: {}", saved.getDosarId());
        return saved;
    }

    /**
     * Returns all cereri ordered by creation date descending.
     */
    public List<Cerere> getAllCereri() {
        List<Cerere> cereri = cerereRepository.findAll();
        cereri.sort(Comparator.comparing(Cerere::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return cereri;
    }

    /**
     * Returns cereri filtered by status.
     */
    public List<Cerere> getCereriByStatus(String status) {
        return cerereRepository.findByStatus(status);
    }

    /**
     * Finds a cerere by its dosar ID or throws 404.
     */
    public Cerere getCerereByDosarId(String dosarId) {
        return cerereRepository.findByDosarId(dosarId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Cerere not found with dosar ID: " + dosarId));
    }

    /**
     * Updates the status of a cerere, publishes to Pub/Sub, and logs the notification.
     */
    public Cerere updateStatus(String dosarId, String newStatus) {
        Cerere cerere = getCerereByDosarId(dosarId);
        String oldStatus = cerere.getStatus();

        cerere.setStatus(newStatus);
        cerereRepository.save(cerere);

        // Publish status change to Pub/Sub
        String messageId = pubSubService.publishStatusChange(
                dosarId,
                cerere.getBeneficiar().getEmail(),
                cerere.getBeneficiar().getNume(),
                oldStatus,
                newStatus
        );

        // Log the notification
        NotificareLog notificareLog = new NotificareLog();
        notificareLog.setCerere(cerere);
        notificareLog.setTipEveniment("status_change");
        notificareLog.setStatusVechi(oldStatus);
        notificareLog.setStatusNou(newStatus);
        notificareLog.setPubsubMessageId(messageId);
        notificareLogRepository.save(notificareLog);

        log.info("Updated cerere {} status: {} -> {}, Pub/Sub message ID: {}",
                dosarId, oldStatus, newStatus, messageId);

        return cerere;
    }

    /**
     * Returns dashboard statistics as a map.
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", cerereRepository.count());
        stats.put("pending", cerereRepository.countByStatus("pending"));
        stats.put("review", cerereRepository.countByStatus("review"));
        stats.put("approved", cerereRepository.countByStatus("approved"));
        stats.put("rejected", cerereRepository.countByStatus("rejected"));
        return stats;
    }

    /**
     * Generates a dosar ID in the format CJ-{YEAR}-{4-digit-random}.
     * Retries if duplicate exists.
     */
    private String generateDosarId() {
        String dosarId;
        do {
            int number = random.nextInt(9000) + 1000;
            dosarId = "CJ-" + Year.now().getValue() + "-" + String.format("%04d", number);
        } while (cerereRepository.findByDosarId(dosarId).isPresent());
        return dosarId;
    }
}
