package ro.dgaspc.portal.service;

import com.google.auth.ServiceAccountSigner;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URL;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class CloudStorageService {

    private final Storage storage;
    private final String bucketName;

    public CloudStorageService(
            Storage storage,
            @Value("${gcp.storage.bucket-name}") String bucketName) {
        this.storage = storage;
        this.bucketName = bucketName;
    }

    /**
     * Uploads a file to Google Cloud Storage under the path {dosarId}/{filename}.
     * Returns the GCS path (without gs:// prefix) for storage in the database.
     */
    public String uploadFile(String dosarId, String filename, byte[] content, String contentType) {
        String objectName = dosarId + "/" + filename;
        log.info("Uploading to gs://{}/{} ({} bytes, type={})", bucketName, objectName, content.length, contentType);
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(contentType)
                .build();

        try {
            storage.create(blobInfo, content);
            log.info("Upload successful: gs://{}/{}", bucketName, objectName);
        } catch (Exception e) {
            log.error("GCS upload failed for gs://{}/{}: {}", bucketName, objectName, e.getMessage(), e);
            throw e;
        }

        return objectName;
    }

    /**
     * Generates a signed URL valid for 15 minutes for secure document access.
     * Uses Application Default Credentials as the explicit signer so this works
     * on App Engine / Compute Engine without a JSON key file.
     * Requires the service account to have roles/iam.serviceAccountTokenCreator on itself.
     */
    public String generateSignedUrl(String gcsPath) {
        try {
            ServiceAccountSigner signer = (ServiceAccountSigner)
                    GoogleCredentials.getApplicationDefault();
            BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketName, gcsPath)).build();
            URL signedUrl = storage.signUrl(
                    blobInfo,
                    15,
                    TimeUnit.MINUTES,
                    Storage.SignUrlOption.withV4Signature(),
                    Storage.SignUrlOption.signWith(signer)
            );
            return signedUrl.toString();
        } catch (IOException e) {
            log.error("Failed to generate signed URL for {}", gcsPath, e);
            throw new RuntimeException("Could not generate signed URL for " + gcsPath, e);
        }
    }
}
