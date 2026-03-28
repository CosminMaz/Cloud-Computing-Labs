package ro.dgaspc.portal.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ro.dgaspc.portal.model.Beneficiar;
import ro.dgaspc.portal.repository.BeneficiarRepository;

@Service
@RequiredArgsConstructor
public class BeneficiarService {

    private final BeneficiarRepository beneficiarRepository;

    public Beneficiar createOrFind(Beneficiar beneficiar) {
        return beneficiarRepository.findByCnp(beneficiar.getCnp())
                .orElseGet(() -> beneficiarRepository.save(beneficiar));
    }
}
