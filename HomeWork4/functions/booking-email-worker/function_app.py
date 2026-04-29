import json
import logging
import azure.functions as func
from email_service import EmailService

app = func.FunctionApp()


@app.service_bus_queue_trigger(
    arg_name="msg",
    queue_name="%SERVICE_BUS_QUEUE_NAME%",
    connection="SERVICE_BUS_CONNECTION",
)
def on_booking_created(msg: func.ServiceBusMessage) -> None:
    """Triggered for every message on the bookings queue. Parses the JSON
    payload and delegates to EmailService — the SDK call lives there so this
    function stays a thin adapter (Single Responsibility)."""
    raw_body = msg.get_body().decode("utf-8")
    logging.info("Received booking event: %s", raw_body)

    try:
        event = json.loads(raw_body)
    except json.JSONDecodeError:
        logging.exception("Discarding non-JSON message")
        # Swallow so the message isn't retried forever; for production you'd
        # route this to a dead-letter queue instead.
        return

    EmailService.from_env().send_booking_notification(event)
