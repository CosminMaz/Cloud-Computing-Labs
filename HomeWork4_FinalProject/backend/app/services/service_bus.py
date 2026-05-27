import json
import logging
from typing import Any, Mapping
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from app.core.config import settings

logger = logging.getLogger(__name__)


class ServiceBusPublisher:
    """Thin wrapper over the Service Bus SDK. Routes never import azure.* —
    they call publish() on this class."""

    def __init__(self, connection_string: str, queue_name: str):
        if not connection_string:
            raise RuntimeError("AZURE_SERVICE_BUS_CONNECTION_STRING is not configured")
        self._client = ServiceBusClient.from_connection_string(connection_string)
        self._queue_name = queue_name

    def publish(self, payload: Mapping[str, Any], subject: str | None = None) -> None:
        """Publishes a single JSON message to the configured queue."""
        message = ServiceBusMessage(
            body=json.dumps(payload, default=str),
            content_type="application/json",
            subject=subject,
        )
        with self._client.get_queue_sender(queue_name=self._queue_name) as sender:
            sender.send_messages(message)


_publisher: ServiceBusPublisher | None = None


def get_service_bus_publisher() -> ServiceBusPublisher:
    """FastAPI dependency. Lazy singleton so import-time misconfiguration
    doesn't crash the whole app."""
    global _publisher
    if _publisher is None:
        _publisher = ServiceBusPublisher(
            settings.AZURE_SERVICE_BUS_CONNECTION_STRING,
            settings.AZURE_SERVICE_BUS_QUEUE,
        )
    return _publisher
