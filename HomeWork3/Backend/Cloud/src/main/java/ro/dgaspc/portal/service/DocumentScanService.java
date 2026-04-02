package ro.dgaspc.portal.service;

import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import ro.dgaspc.portal.dto.ExtractedDataDto;

import java.io.IOException;
import java.text.Normalizer;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class DocumentScanService {

    public ExtractedDataDto scanDocument(byte[] imageBytes) throws IOException {
        Image img = Image.newBuilder()
                .setContent(ByteString.copyFrom(imageBytes))
                .build();
        Feature feat = Feature.newBuilder()
                .setType(Feature.Type.DOCUMENT_TEXT_DETECTION)
                .build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feat)
                .setImage(img)
                .build();

        try (ImageAnnotatorClient client = ImageAnnotatorClient.create()) {
            BatchAnnotateImagesResponse response = client.batchAnnotateImages(List.of(request));
            AnnotateImageResponse res = response.getResponses(0);

            if (res.hasError()) {
                log.error("Vision API error: {}", res.getError().getMessage());
                throw new IOException("Vision API error: " + res.getError().getMessage());
            }

            String fullText = res.getFullTextAnnotation().getText();
            log.info("Vision API extracted {} characters", fullText.length());
            log.debug("Raw OCR text:\n{}", fullText);
            return parseRomanianId(fullText);
        }
    }

    private ExtractedDataDto parseRomanianId(String text) {
        ExtractedDataDto dto = new ExtractedDataDto();
        dto.setRawText(text);

        String[] lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n");

        for (int i = 0; i < lines.length; i++) {
            String raw = lines[i].trim();
            // Normalize diacritics for keyword matching only
            String norm = normalize(raw);

            // ── CNP ─────────────────────────────────────────────────────────────
            // Use lookbehind/lookahead instead of \b to handle MRZ like IDROU185…
            if (dto.getCnp() == null) {
                Matcher m = Pattern.compile("(?<!\\d)([1-9]\\d{12})(?!\\d)").matcher(raw);
                if (m.find()) {
                    dto.setCnp(m.group(1));
                }
            }

            // ── Last name ────────────────────────────────────────────────────────
            if (dto.getNume() == null && matchesLabel(norm, "NUME", "LAST NAME")) {
                String val = inlineValue(norm, "NUME", "LAST NAME");
                if (val != null) {
                    dto.setNume(val);
                } else {
                    String next = nextValueLine(lines, i);
                    if (next != null) dto.setNume(next);
                }
            }

            // ── First name ───────────────────────────────────────────────────────
            if (dto.getPrenume() == null && matchesLabel(norm, "PRENUME", "FIRST NAME")) {
                String val = inlineValue(norm, "PRENUME", "FIRST NAME");
                if (val != null) {
                    dto.setPrenume(val);
                } else {
                    String next = nextValueLine(lines, i);
                    if (next != null) dto.setPrenume(next);
                }
            }

            // ── Date of birth ────────────────────────────────────────────────────
            if (dto.getDataNasterii() == null
                    && (norm.contains("NASTERII") || norm.contains("DATE OF BIRTH") || norm.contains("DATA NASTERE"))) {
                Matcher dm = Pattern.compile("(\\d{2})[./\\-](\\d{2})[./\\-](\\d{4})").matcher(raw);
                if (dm.find()) {
                    dto.setDataNasterii(dm.group(1) + "." + dm.group(2) + "." + dm.group(3));
                } else {
                    String next = nextNonEmpty(lines, i);
                    if (next != null) {
                        Matcher dm2 = Pattern.compile("(\\d{2})[./\\-](\\d{2})[./\\-](\\d{4})").matcher(next);
                        if (dm2.find()) {
                            dto.setDataNasterii(dm2.group(1) + "." + dm2.group(2) + "." + dm2.group(3));
                        }
                    }
                }
            }

            // ── Address ──────────────────────────────────────────────────────────
            // Romanian CI uses "Domiciliu/Adresse/Address", not "Adresa"
            if (dto.getAdresa() == null
                    && (norm.startsWith("ADRES") || norm.startsWith("ADDRESS") || norm.startsWith("DOMICILIU"))) {
                String inline = inlineValue(norm, "DOMICILIU", "ADRESA", "ADDRESS");
                if (inline != null && !inline.isEmpty()) {
                    // Address may continue on the next line (street + city)
                    String next = nextNonEmpty(lines, i);
                    if (next != null && !isLikelyLabel(normalize(next))) {
                        dto.setAdresa(inline + ", " + next.trim());
                    } else {
                        dto.setAdresa(inline);
                    }
                } else {
                    // Collect up to 2 continuation lines
                    StringBuilder addr = new StringBuilder();
                    for (int j = i + 1; j < lines.length && j <= i + 3; j++) {
                        String l = lines[j].trim();
                        if (l.isEmpty()) continue;
                        if (isLikelyLabel(normalize(l))) break;
                        if (addr.length() > 0) addr.append(", ");
                        addr.append(l);
                    }
                    if (addr.length() > 0) dto.setAdresa(addr.toString());
                }
            }
        }

        log.info("Parsed: cnp={} nume={} prenume={} dob={} adresa={}",
                dto.getCnp(), dto.getNume(), dto.getPrenume(), dto.getDataNasterii(), dto.getAdresa());
        return dto;
    }

    /**
     * Normalize text for keyword matching: uppercase, strip diacritics, collapse spaces.
     */
    private String normalize(String s) {
        String nfd = Normalizer.normalize(s.toUpperCase(), Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{InCombiningDiacriticalMarks}", "")
                  .replaceAll("\\s+", " ")
                  .trim();
    }

    /**
     * True if this normalized line IS a label (exact match or "LABEL /" or "LABEL /ENGLISH").
     */
    private boolean matchesLabel(String norm, String... keywords) {
        for (String kw : keywords) {
            if (norm.equals(kw)
                    || norm.startsWith(kw + " /")
                    || norm.startsWith(kw + "/")
                    || norm.startsWith(kw + " ")) {
                return true;
            }
        }
        return false;
    }

    /**
     * Extracts an inline value from a normalized line after the keyword.
     * Strips multi-language label alternatives like "/Nom/Last name" or "/Adresse/Address".
     * Returns null if the line contains only the label (no actual value).
     *
     * Examples:
     *   "NUME/NOM/LAST NAME"      → null  (pure label line)
     *   "NUME POPESCU"            → "POPESCU"
     *   "DOMICILIU STR. LIBERTATII" → "STR. LIBERTATII"
     */
    private String inlineValue(String norm, String... keywords) {
        for (String kw : keywords) {
            if (!norm.startsWith(kw)) continue;
            String rest = norm.substring(kw.length()).trim();
            // Strip ALL slash-separated language alternatives: "/NOM/LAST NAME", "/Adresse/Address", etc.
            rest = rest.replaceAll("^(/[^/]+)+", "").trim();
            // Also strip a single leading separator without a following slash
            rest = rest.replaceFirst("^[/|:]\\s*", "").trim();
            if (!rest.isEmpty()) return rest;
        }
        return null;
    }

    /**
     * Returns the next non-empty trimmed line after index i that is not a label.
     */
    private String nextValueLine(String[] lines, int i) {
        for (int j = i + 1; j < lines.length; j++) {
            String s = lines[j].trim();
            if (s.isEmpty()) continue;
            if (!isLikelyLabel(normalize(s))) return s;
            break; // if we hit another label, stop
        }
        return null;
    }

    private String nextNonEmpty(String[] lines, int i) {
        for (int j = i + 1; j < lines.length; j++) {
            String s = lines[j].trim();
            if (!s.isEmpty()) return s;
        }
        return null;
    }

    /**
     * Heuristic: is this normalized line a known label rather than a value?
     */
    private boolean isLikelyLabel(String norm) {
        String[] labels = {
            "CETATENIE", "NATIONALIT", "LOC NASTERE", "PLACE OF BIRTH",
            "SEX", "VALABILITATE", "VALID", "SERIE", "CNP", "DATA NASTERII",
            "DATE OF BIRTH", "PRENUME", "FIRST NAME", "ADRES", "ADDRESS",
            "DOMICILIU", "EMISA", "ISSUED", "ROMANIA", "CARTE DE IDENTITATE"
        };
        for (String label : labels) {
            if (norm.equals(label) || norm.startsWith(label + " ") || norm.startsWith(label + "/")) {
                return true;
            }
        }
        return false;
    }
}
