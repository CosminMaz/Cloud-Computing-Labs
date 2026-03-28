package ro.dgaspc.portal;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/dgaspc_portal_test",
    "spring.datasource.username=postgres",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "gcp.project-id=test-project",
    "gcp.storage.bucket-name=test-bucket",
    "gcp.pubsub.topic-id=test-topic"
})
class DgaspcApplicationTests {

    @Test
    void contextLoads() {
    }
}
