import uuid
from typing import BinaryIO
from azure.storage.blob import BlobServiceClient, ContentSettings
from azure.core.exceptions import ResourceExistsError
from app.core.config import settings


class BlobStorageService:
    """Thin wrapper over the Azure Blob SDK. The route layer should never
    import azure.* directly — it talks to this class."""

    def __init__(self, connection_string: str, container_name: str):
        if not connection_string:
            raise RuntimeError("AZURE_STORAGE_CONNECTION_STRING is not configured")
        self._client = BlobServiceClient.from_connection_string(connection_string)
        self._container_name = container_name
        self._ensure_container()

    def _ensure_container(self) -> None:
        container = self._client.get_container_client(self._container_name)
        try:
            container.create_container(public_access="blob")
        except ResourceExistsError:
            pass

    def upload_image(self, stream: BinaryIO, content_type: str, original_filename: str) -> str:
        """Streams an image to Blob Storage under a unique name and returns its public URL."""
        extension = ""
        if "." in original_filename:
            extension = "." + original_filename.rsplit(".", 1)[-1].lower()
        blob_name = f"{uuid.uuid4().hex}{extension}"

        blob_client = self._client.get_blob_client(
            container=self._container_name, blob=blob_name
        )
        blob_client.upload_blob(
            stream,
            overwrite=False,
            content_settings=ContentSettings(content_type=content_type),
        )
        return blob_client.url


_service: BlobStorageService | None = None


def get_blob_service() -> BlobStorageService:
    """FastAPI dependency. Lazily builds a singleton so import-time failures
    don't crash the whole app when Blob is unconfigured."""
    global _service
    if _service is None:
        _service = BlobStorageService(
            settings.AZURE_STORAGE_CONNECTION_STRING,
            settings.AZURE_STORAGE_CONTAINER,
        )
    return _service
