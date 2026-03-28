package ro.dgaspc.portal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ro.dgaspc.portal.model.NotificareLog;

@Repository
public interface NotificareLogRepository extends JpaRepository<NotificareLog, Long> {
}
