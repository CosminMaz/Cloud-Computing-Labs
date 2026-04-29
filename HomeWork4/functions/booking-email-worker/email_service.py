import os
import logging
from typing import Mapping
from azure.communication.email import EmailClient

logger = logging.getLogger(__name__)


class EmailService:
    """Encapsulates Azure Communication Services email delivery so the
    Service Bus trigger stays a thin entry point."""

    def __init__(self, connection_string: str, sender_address: str):
        if not connection_string:
            raise RuntimeError("EMAIL_CONNECTION_STRING is not configured")
        if not sender_address:
            raise RuntimeError("EMAIL_SENDER_ADDRESS is not configured")
        self._client = EmailClient.from_connection_string(connection_string)
        self._sender = sender_address

    @classmethod
    def from_env(cls) -> "EmailService":
        return cls(
            connection_string=os.environ.get("EMAIL_CONNECTION_STRING", ""),
            sender_address=os.environ.get("EMAIL_SENDER_ADDRESS", ""),
        )

    def send_booking_notification(self, event: Mapping[str, object]) -> str:
        """Sends a 'new booking' notification to the contractor and blocks
        until the ACS poller resolves. Returns the message id."""
        recipient = event.get("contractorEmail")
        if not recipient:
            raise ValueError("Event is missing 'contractorEmail'")

        date = event.get("date", "an unspecified time")
        client_email = event.get("clientEmail", "a client")
        notes = event.get("notes") or "(no notes provided)"
        booking_id = event.get("bookingId")

        message = {
            "senderAddress": self._sender,
            "recipients": {"to": [{"address": recipient}]},
            "content": {
                "subject": f"New booking request for {date}",
                "plainText": (
                    f"You have a new booking request from {client_email}.\n\n"
                    f"Booking #{booking_id}\n"
                    f"When: {date}\n"
                    f"Notes: {notes}\n\n"
                    "Sign in to CloudCRM to confirm or decline."
                ),
                "html": (
                    f"<p>You have a new booking request from <strong>{client_email}</strong>.</p>"
                    f"<ul>"
                    f"<li>Booking #{booking_id}</li>"
                    f"<li>When: {date}</li>"
                    f"<li>Notes: {notes}</li>"
                    f"</ul>"
                    f"<p>Sign in to CloudCRM to confirm or decline.</p>"
                ),
            },
        }

        poller = self._client.begin_send(message)
        result = poller.result()
        message_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info("Sent booking email to %s (ACS message id=%s)", recipient, message_id)
        return message_id
