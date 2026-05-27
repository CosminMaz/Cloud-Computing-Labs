import json
import logging
import azure.functions as func
from email_service import EmailService

app = func.FunctionApp()

_DISPATCH = {
    "booking.created":    lambda svc, e: svc.send_booking_notification(e),
    "payment.quoted":     lambda svc, e: svc.send_payment_quoted(e),
    "booking.rescheduled": lambda svc, e: svc.send_booking_rescheduled(e),
    "payment.released":   lambda svc, e: svc.send_payment_released(e),
}


@app.service_bus_queue_trigger(
    arg_name="msg",
    queue_name="%SERVICE_BUS_QUEUE_NAME%",
    connection="SERVICE_BUS_CONNECTION",
)
def on_booking_event(msg: func.ServiceBusMessage) -> None:
    """Routes every message on the bookings queue to the right email handler
    based on the event_type field in the JSON body."""
    raw_body = msg.get_body().decode("utf-8")
    logging.info("Received event: %s", raw_body)

    try:
        event = json.loads(raw_body)
    except json.JSONDecodeError:
        logging.exception("Discarding non-JSON message")
        return

    event_type = event.get("event_type")
    handler = _DISPATCH.get(event_type)
    if not handler:
        logging.warning("Unknown event_type '%s', discarding", event_type)
        return

    try:
        handler(EmailService.from_env(), event)
    except Exception:
        logging.error(
            "Failed to handle %s for bookingId=%s",
            event_type, event.get("bookingId"),
            exc_info=True,
        )

