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
                .map(existing -> {
                    existing.setNume(beneficiar.getNume());
                    existing.setEmail(beneficiar.getEmail());
                    existing.setTelefon(beneficiar.getTelefon());
                    existing.setAdresa(beneficiar.getAdresa());
                    return beneficiarRepository.save(existing);
                })
                .orElseGet(() -> beneficiarRepository.save(beneficiar));
    }
}
