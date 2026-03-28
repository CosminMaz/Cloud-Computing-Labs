package ro.dgaspc.portal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.dgaspc.portal.model.Beneficiar;
import ro.dgaspc.portal.model.Cerere;
import ro.dgaspc.portal.service.CereriService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cereri")
@RequiredArgsConstructor
public class CereriController {

    private final CereriService cereriService;

    /**
     * POST /api/cereri - Submit a new application.
     * Expects JSON with nested beneficiar data and cerere fields.
     */
    @PostMapping
    public ResponseEntity<Cerere> createCerere(@Valid @RequestBody CerereRequest request) {
        Beneficiar beneficiar = new Beneficiar();
        beneficiar.setNume(request.nume);
        beneficiar.setCnp(request.cnp);
        beneficiar.setEmail(request.email);
        beneficiar.setTelefon(request.telefon);
        beneficiar.setAdresa(request.adresa);

        Cerere cerere = new Cerere();
        cerere.setTipAjutor(request.tipAjutor);
        cerere.setDetalii(request.detalii);

        Cerere saved = cereriService.createCerere(cerere, beneficiar);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/cereri - List all applications, optionally filtered by status.
     */
    @GetMapping
    public ResponseEntity<List<Cerere>> getAllCereri(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(cereriService.getCereriByStatus(status));
        }
        return ResponseEntity.ok(cereriService.getAllCereri());
    }

    /**
     * GET /api/cereri/{dosarId} - Get a single application by dosar ID.
     */
    @GetMapping("/{dosarId}")
    public ResponseEntity<Cerere> getCerereByDosarId(@PathVariable String dosarId) {
        return ResponseEntity.ok(cereriService.getCerereByDosarId(dosarId));
    }

    /**
     * PATCH /api/cereri/{dosarId}/status - Update application status.
     * Triggers Pub/Sub notification.
     */
    @PatchMapping("/{dosarId}/status")
    public ResponseEntity<Cerere> updateStatus(
            @PathVariable String dosarId,
            @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(cereriService.updateStatus(dosarId, newStatus));
    }

    /**
     * Request DTO for creating a cerere with beneficiar data.
     */
    public static class CerereRequest {
        public String nume;
        public String cnp;
        public String email;
        public String telefon;
        public String adresa;
        public String tipAjutor;
        public String detalii;
    }
}
