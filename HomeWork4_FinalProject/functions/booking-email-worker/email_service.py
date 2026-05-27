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

    def _send(self, message: dict) -> None:
        poller = self._client.begin_send(message)
        poller.result()

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
                    "Sign in to Reparo to confirm or decline."
                ),
                "html": (
                    f"<p>You have a new booking request from <strong>{client_email}</strong>.</p>"
                    f"<ul>"
                    f"<li>Booking #{booking_id}</li>"
                    f"<li>When: {date}</li>"
                    f"<li>Notes: {notes}</li>"
                    f"</ul>"
                    f"<p>Sign in to Reparo to confirm or decline.</p>"
                ),
            },
        }

        poller = self._client.begin_send(message)
        result = poller.result()
        message_id = result.get("id") if isinstance(result, dict) else getattr(result, "id", None)
        logger.info("Sent booking.created email to %s (ACS message id=%s)", recipient, message_id)
        return message_id

    def send_payment_quoted(self, event: Mapping[str, object]) -> None:
        """Notifies the client that the contractor has set a price for their booking."""
        recipient = event.get("clientEmail")
        if not recipient:
            raise ValueError("Event is missing 'clientEmail'")

        amount = event.get("amount", 0)
        contractor_name = event.get("contractorName", "Your contractor")
        service_type = event.get("serviceType") or "the service"
        date = event.get("date", "the scheduled date")
        booking_id = event.get("bookingId")

        self._send({
            "senderAddress": self._sender,
            "recipients": {"to": [{"address": recipient}]},
            "content": {
                "subject": f"Price quote received: €{amount:.2f}",
                "plainText": (
                    f"{contractor_name} has set a price for your booking.\n\n"
                    f"Booking #{booking_id}\n"
                    f"Service: {service_type}\n"
                    f"Date: {date}\n"
                    f"Quoted amount: €{amount:.2f}\n\n"
                    "Log in to Reparo to review and pay."
                ),
                "html": (
                    f"<p><strong>{contractor_name}</strong> has set a price for your booking.</p>"
                    f"<ul>"
                    f"<li>Booking <strong>#{booking_id}</strong></li>"
                    f"<li>Service: {service_type}</li>"
                    f"<li>Date: {date}</li>"
                    f"<li>Quoted amount: <strong>€{amount:.2f}</strong></li>"
                    f"</ul>"
                    f"<p><a href='https://reparo.app'>Log in to Reparo</a> to review and pay.</p>"
                ),
            },
        })
        logger.info("Sent payment.quoted email to client %s for booking %s", recipient, booking_id)

    def send_booking_rescheduled(self, event: Mapping[str, object]) -> None:
        """Notifies the client that the contractor has moved their booking to a new date/time."""
        recipient = event.get("clientEmail")
        if not recipient:
            raise ValueError("Event is missing 'clientEmail'")

        contractor_name = event.get("contractorName", "Your contractor")
        new_date = event.get("newDate", "a new date")
        service_type = event.get("serviceType") or "the service"
        booking_id = event.get("bookingId")

        self._send({
            "senderAddress": self._sender,
            "recipients": {"to": [{"address": recipient}]},
            "content": {
                "subject": "Your booking has been rescheduled",
                "plainText": (
                    f"{contractor_name} has rescheduled your booking.\n\n"
                    f"Booking #{booking_id}\n"
                    f"Service: {service_type}\n"
                    f"New date: {new_date}\n\n"
                    "Log in to Reparo to view the details."
                ),
                "html": (
                    f"<p><strong>{contractor_name}</strong> has rescheduled your booking.</p>"
                    f"<ul>"
                    f"<li>Booking <strong>#{booking_id}</strong></li>"
                    f"<li>Service: {service_type}</li>"
                    f"<li>New date: <strong>{new_date}</strong></li>"
                    f"</ul>"
                    f"<p><a href='https://reparo.app'>Log in to Reparo</a> to view the details.</p>"
                ),
            },
        })
        logger.info("Sent booking.rescheduled email to client %s for booking %s", recipient, booking_id)

    def send_payment_released(self, event: Mapping[str, object]) -> None:
        """Sends two emails when escrow is released: invoice to the client, payout notice to the contractor."""
        client_email = event.get("clientEmail")
        contractor_email = event.get("contractorEmail")
        final_amount = event.get("finalAmount", 0)
        platform_fee = event.get("platformFee", 0)
        contractor_payout = event.get("contractorPayout", 0)
        service_type = event.get("serviceType") or "the service"
        date = event.get("date", "the service date")
        booking_id = event.get("bookingId")
        contractor_name = event.get("contractorName", "Your contractor")
        client_name = event.get("clientName", "Your client")

        if client_email:
            self._send({
                "senderAddress": self._sender,
                "recipients": {"to": [{"address": client_email}]},
                "content": {
                    "subject": f"Invoice — Booking #{booking_id}",
                    "plainText": (
                        f"Thank you for using Reparo. Here is your invoice.\n\n"
                        f"Booking #{booking_id}\n"
                        f"Service: {service_type}\n"
                        f"Date: {date}\n"
                        f"Provider: {contractor_name}\n"
                        f"Total paid: €{final_amount:.2f}\n\n"
                        "Your payment has been released to the contractor."
                    ),
                    "html": (
                        f"<h2>Invoice — Booking #{booking_id}</h2>"
                        f"<table cellpadding='6'>"
                        f"<tr><td>Service</td><td>{service_type}</td></tr>"
                        f"<tr><td>Date</td><td>{date}</td></tr>"
                        f"<tr><td>Provider</td><td>{contractor_name}</td></tr>"
                        f"<tr><td><strong>Total paid</strong></td><td><strong>€{final_amount:.2f}</strong></td></tr>"
                        f"</table>"
                        f"<p>Your payment has been released to the contractor. Thank you for using Reparo.</p>"
                    ),
                },
            })
            logger.info("Sent invoice email to client %s for booking %s", client_email, booking_id)

        if contractor_email:
            self._send({
                "senderAddress": self._sender,
                "recipients": {"to": [{"address": contractor_email}]},
                "content": {
                    "subject": f"Payment received for Booking #{booking_id}",
                    "plainText": (
                        f"{client_name} has released payment for your completed work.\n\n"
                        f"Booking #{booking_id}\n"
                        f"Service: {service_type}\n"
                        f"Total: €{final_amount:.2f}\n"
                        f"Platform fee: €{platform_fee:.2f}\n"
                        f"Your payout: €{contractor_payout:.2f}\n\n"
                        "Funds have been added to your Reparo balance."
                    ),
                    "html": (
                        f"<p><strong>{client_name}</strong> has released payment for your completed work.</p>"
                        f"<table cellpadding='6'>"
                        f"<tr><td>Booking</td><td>#{booking_id}</td></tr>"
                        f"<tr><td>Service</td><td>{service_type}</td></tr>"
                        f"<tr><td>Total charged</td><td>€{final_amount:.2f}</td></tr>"
                        f"<tr><td>Platform fee</td><td>€{platform_fee:.2f}</td></tr>"
                        f"<tr><td><strong>Your payout</strong></td><td><strong>€{contractor_payout:.2f}</strong></td></tr>"
                        f"</table>"
                        f"<p>Funds have been added to your Reparo balance.</p>"
                    ),
                },
            })
            logger.info("Sent payout notification to contractor %s for booking %s", contractor_email, booking_id)
