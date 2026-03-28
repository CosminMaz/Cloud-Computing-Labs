package ro.dgaspc.portal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.dgaspc.portal.model.Cerere;

import java.util.List;
import java.util.Optional;

@Repository
public interface CerereRepository extends JpaRepository<Cerere, Long> {
    Optional<Cerere> findByDosarId(String dosarId);
    List<Cerere> findByStatus(String status);
    long countByStatus(String status);
}
