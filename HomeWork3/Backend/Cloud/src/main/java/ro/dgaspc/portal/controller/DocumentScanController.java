package ro.dgaspc.portal.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import ro.dgaspc.portal.dto.ExtractedDataDto;
import ro.dgaspc.portal.service.DocumentScanService;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentScanController {

    private final DocumentScanService documentScanService;

    /**
     * POST /api/scan-document
     *
     * Accepts an image (JPEG/PNG) or PDF of a Romanian national ID card and returns
     * extracted field values ready to autofill the request form.
     *
     * Request:  multipart/form-data, field name "image"
     * Response: { cnp, nume, prenume, dataNasterii, adresa, rawText }
     */
    @PostMapping("/scan-document")
    public ResponseEntity<?> scanDocument(@RequestParam("image") MultipartFile image) {
        if (image.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No image provided"));
        }

        String contentType = image.getContentType();
        if (contentType == null
                || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File must be an image (JPEG, PNG) or PDF"));
        }

        try {
            ExtractedDataDto result = documentScanService.scanDocument(image.getBytes());
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            log.error("Document scan failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to process document: " + e.getMessage()));
        }
    }
}
