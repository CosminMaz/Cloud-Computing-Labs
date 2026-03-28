package ro.dgaspc.portal.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.pubsub.v1.Publisher;
import com.google.protobuf.ByteString;
import com.google.pubsub.v1.PubsubMessage;
import com.google.pubsub.v1.TopicName;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@Slf4j
public class PubSubService {

    private final String projectId;
    private final String topicId;

    public PubSubService(
            @Value("${gcp.project-id}") String projectId,
            @Value("${gcp.pubsub.topic-id}") String topicId) {
        this.projectId = projectId;
        this.topicId = topicId;
    }

    /**
     * Publishes a status change event to the Pub/Sub topic.
     * Returns the published message ID.
     */
    public String publishStatusChange(String dosarId, String email, String name,
                                       String oldStatus, String newStatus) {
        TopicName topicName = TopicName.of(projectId, topicId);
        Publisher publisher = null;

        try {
            publisher = Publisher.newBuilder(topicName).build();

            String payload = String.format(
                    "{\"dosar_id\":\"%s\",\"beneficiar_email\":\"%s\",\"beneficiar_nume\":\"%s\"," +
                    "\"status_nou\":\"%s\",\"status_vechi\":\"%s\",\"timestamp\":\"%s\"}",
                    dosarId, email, name, newStatus, oldStatus, Instant.now().toString()
            );

            PubsubMessage message = PubsubMessage.newBuilder()
                    .setData(ByteString.copyFromUtf8(payload))
                    .build();

            ApiFuture<String> future = publisher.publish(message);
            String messageId = future.get();

            log.info("Published Pub/Sub message {} for dosar {} status change: {} -> {}",
                    messageId, dosarId, oldStatus, newStatus);

            return messageId;

        } catch (Exception e) {
            log.error("Failed to publish Pub/Sub message for dosar {}: {}", dosarId, e.getMessage(), e);
            return "error-" + System.currentTimeMillis();
        } finally {
            if (publisher != null) {
                try {
                    publisher.shutdown();
                } catch (Exception e) {
                    log.warn("Error shutting down publisher: {}", e.getMessage());
                }
            }
        }
    }
}
