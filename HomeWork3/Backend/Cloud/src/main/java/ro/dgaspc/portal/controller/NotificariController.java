package ro.dgaspc.portal.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.dgaspc.portal.service.CereriService;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class NotificariController {

    private final CereriService cereriService;

    /**
     * GET /api/stats - Return dashboard statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(cereriService.getStats());
    }

    /**
     * POST /api/simulate-notification - Simulate Cloud Function email notification.
     * For local development only.
     */
    @PostMapping("/simulate-notification")
    public ResponseEntity<Map<String, Object>> simulateNotification(@RequestBody Map<String, String> payload) {
        String dosarId = payload.getOrDefault("dosar_id", "unknown");
        String email = payload.getOrDefault("beneficiar_email", "unknown");
        String name = payload.getOrDefault("beneficiar_nume", "unknown");
        String newStatus = payload.getOrDefault("status_nou", "unknown");
        String oldStatus = payload.getOrDefault("status_vechi", "unknown");

        log.info("=== SIMULATED CLOUD FUNCTION: notify-citizen ===");
        log.info("To: {}", email);
        log.info("Subject: Actualizare cerere {} - DGASPC Iasi", dosarId);
        log.info("Body: Stimate/a {}, cererea dvs. {} a fost actualizata: {} -> {}",
                name, dosarId, oldStatus, newStatus);
        log.info("=== END SIMULATION ===");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Notification simulated successfully");
        response.put("dosar_id", dosarId);
        response.put("email_sent_to", email);
        response.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(response);
    }
}
