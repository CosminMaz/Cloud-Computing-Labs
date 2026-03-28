package ro.dgaspc.portal.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ro.dgaspc.portal.model.Beneficiar;
import ro.dgaspc.portal.service.BeneficiarService;

@RestController
@RequestMapping("/api/beneficiari")
@RequiredArgsConstructor
public class BeneficiariController {

    private final BeneficiarService beneficiarService;

    /**
     * POST /api/beneficiari - Create or find a beneficiar by CNP.
     */
    @PostMapping
    public ResponseEntity<Beneficiar> createOrFind(@Valid @RequestBody Beneficiar beneficiar) {
        return ResponseEntity.ok(beneficiarService.createOrFind(beneficiar));
    }
}
