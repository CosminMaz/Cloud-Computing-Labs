package ro.dgaspc.portal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import ro.dgaspc.portal.model.Cerere;

import java.util.List;
import java.util.Optional;

@Repository
public interface CerereRepository extends JpaRepository<Cerere, Long> {
    Optional<Cerere> findByDosarId(String dosarId);
    List<Cerere> findByStatus(String status);
    long countByStatus(String status);

    @Query("SELECT c FROM Cerere c JOIN FETCH c.beneficiar ORDER BY c.createdAt DESC")
    List<Cerere> findAllWithBeneficiar();

    @Query("SELECT c FROM Cerere c JOIN FETCH c.beneficiar WHERE c.status = :status")
    List<Cerere> findByStatusWithBeneficiar(String status);
}
