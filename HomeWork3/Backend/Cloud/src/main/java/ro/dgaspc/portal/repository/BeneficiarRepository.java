package ro.dgaspc.portal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.dgaspc.portal.model.Beneficiar;

import java.util.Optional;

@Repository
public interface BeneficiarRepository extends JpaRepository<Beneficiar, Long> {
    Optional<Beneficiar> findByCnp(String cnp);
}
