package ro.dgaspc.portal.service;

import com.google.cloud.storage.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
        BlobId blobId = BlobId.of(bucketName, objectName);
        BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                .setContentType(contentType)
                .build();

        storage.create(blobInfo, content);
        log.info("Uploaded file to gs://{}/{}", bucketName, objectName);

        return objectName;
    }

    /**
     * Generates a signed URL valid for 15 minutes for secure document access.
     */
    public String generateSignedUrl(String gcsPath) {
        BlobInfo blobInfo = BlobInfo.newBuilder(BlobId.of(bucketName, gcsPath)).build();
        URL signedUrl = storage.signUrl(
                blobInfo,
                15,
                TimeUnit.MINUTES,
                Storage.SignUrlOption.withV4Signature()
        );
        return signedUrl.toString();
    }
}
