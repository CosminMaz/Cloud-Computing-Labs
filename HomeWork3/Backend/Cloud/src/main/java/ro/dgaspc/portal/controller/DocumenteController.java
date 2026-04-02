package ro.dgaspc.portal.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ro.dgaspc.portal.model.Cerere;
import ro.dgaspc.portal.model.Document;
import ro.dgaspc.portal.repository.DocumentRepository;
import ro.dgaspc.portal.service.CereriService;
import ro.dgaspc.portal.service.CloudStorageService;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/cereri/{dosarId}/documente")
@RequiredArgsConstructor
public class DocumenteController {

    private final CereriService cereriService;
    private final CloudStorageService cloudStorageService;
    private final DocumentRepository documentRepository;

    /**
     * POST /api/cereri/{dosarId}/documente - Upload a document to Cloud Storage.
     */
    @PostMapping
    public ResponseEntity<?> uploadDocument(
            @PathVariable String dosarId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tipDocument", required = false, defaultValue = "general") String tipDocument
    ) {
        log.info("Upload request: dosar={} file={} type={}", dosarId, file.getOriginalFilename(), tipDocument);
        try {
            Cerere cerere = cereriService.getCerereByDosarId(dosarId);

            String gcsPath = cloudStorageService.uploadFile(
                    dosarId,
                    file.getOriginalFilename(),
                    file.getBytes(),
                    file.getContentType()
            );

            Document document = new Document();
            document.setCerere(cerere);
            document.setNumeFisier(file.getOriginalFilename());
            document.setGcsPath(gcsPath);
            document.setTipDocument(tipDocument);

            Document saved = documentRepository.save(document);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IOException e) {
            log.error("IO error uploading document for dosar {}: {}", dosarId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "IO error: " + e.getMessage()));
        } catch (Exception e) {
            log.error("GCS upload failed for dosar {}: {}", dosarId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/cereri/{dosarId}/documente - List documents for a cerere, including signed URLs.
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listDocuments(@PathVariable String dosarId) {
        Cerere cerere = cereriService.getCerereByDosarId(dosarId);
        List<Document> documents = documentRepository.findByCerereId(cerere.getId());

        List<Map<String, Object>> result = documents.stream().map(doc -> {
            Map<String, Object> docMap = new HashMap<>();
            docMap.put("id", doc.getId());
            docMap.put("numeFisier", doc.getNumeFisier());
            docMap.put("gcsPath", doc.getGcsPath());
            docMap.put("tipDocument", doc.getTipDocument());
            docMap.put("uploadedAt", doc.getUploadedAt());
            try {
                docMap.put("signedUrl", cloudStorageService.generateSignedUrl(doc.getGcsPath()));
            } catch (Exception e) {
                docMap.put("signedUrl", null);
            }
            return docMap;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}
