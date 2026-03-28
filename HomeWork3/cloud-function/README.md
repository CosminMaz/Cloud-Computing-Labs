# notify-citizen Cloud Function

Cloud Function triggered by the `status-updates` Pub/Sub topic. When an application status changes, it sends an email notification to the citizen using Nodemailer.

## Prerequisites

- Google Cloud project with Cloud Functions API enabled
- Pub/Sub topic `status-updates` already created
- SMTP credentials (e.g. SendGrid, Gmail App Password, or any SMTP provider)

## Install dependencies

```bash
cd cloud-function
npm install
```

## Deploy

```bash
gcloud functions deploy notify-citizen \
  --gen2 \
  --runtime=nodejs18 \
  --trigger-topic=status-updates \
  --region=europe-west1 \
  --entry-point=notifyCitizen \
  --set-env-vars SMTP_HOST=smtp.example.com,SMTP_PORT=587,SMTP_USER=noreply@dgaspc-iasi.ro,SMTP_PASS=your-smtp-password
```

## Environment Variables

| Variable    | Description                        | Required |
|-------------|------------------------------------|----------|
| `SMTP_HOST` | SMTP server hostname               | No*      |
| `SMTP_PORT` | SMTP server port (default: 587)    | No*      |
| `SMTP_USER` | SMTP username / sender email       | No*      |
| `SMTP_PASS` | SMTP password                      | No*      |

*If SMTP variables are not set, the function logs the email content to Cloud Logging instead of sending.

## Expected Pub/Sub Message Format

The message data field must be a base64-encoded JSON string:

```json
{
  "dosar_id": "CJ-2024-0042",
  "beneficiar_email": "ion.popescu@email.ro",
  "beneficiar_nume": "Ion Popescu",
  "status_nou": "approved",
  "status_vechi": "pending",
  "timestamp": "2024-03-22T10:30:00Z"
}
```

## Local Testing

```bash
npx @google-cloud/functions-framework --target=notifyCitizen --signature-type=cloudevent
```

Then send a test CloudEvent to `http://localhost:8080`.
