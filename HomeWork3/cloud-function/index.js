const functions = require("@google-cloud/functions-framework");
const nodemailer = require("nodemailer");

/**
 * Maps application status codes to human-readable Romanian labels.
 */
const STATUS_LABELS = {
  pending: "In asteptare",
  review: "In analiza",
  approved: "Aprobat",
  rejected: "Respins",
};

/**
 * Returns the next steps text based on the new status.
 */
function getNextSteps(statusNou) {
  switch (statusNou) {
    case "review":
      return "Cererea dumneavoastra este in curs de analiza de catre un inspector DGASPC. Veti fi notificat(a) cand procesul este finalizat.";
    case "approved":
      return "Cererea dumneavoastra a fost aprobata. Va rugam sa va prezentati la sediul DGASPC Iasi cu un act de identitate valid pentru finalizarea dosarului.";
    case "rejected":
      return "Din pacate, cererea dumneavoastra nu a fost aprobata. Puteti depune o contestatie in termen de 30 de zile la sediul DGASPC Iasi.";
    default:
      return "Cererea dumneavoastra a fost inregistrata. Veti fi notificat(a) la fiecare schimbare de status.";
  }
}

/**
 * Builds the HTML email body in Romanian.
 */
function buildEmailHtml(data) {
  const statusLabel = STATUS_LABELS[data.status_nou] || data.status_nou;
  const statusVechiLabel =
    STATUS_LABELS[data.status_vechi] || data.status_vechi;
  const nextSteps = getNextSteps(data.status_nou);

  return `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8f5ef;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border:1px solid #e5e0d8;border-radius:8px;overflow:hidden;">
    <div style="background:#1a2744;padding:20px 30px;border-top:4px solid #c8a84b;">
      <h1 style="color:#ffffff;font-size:18px;margin:0;">DGASPC Iasi</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">Directia Generala de Asistenta Sociala si Protectia Copilului</p>
    </div>
    <div style="padding:30px;">
      <p style="font-size:15px;color:#1a2744;">Stimate/Stimata <strong>${data.beneficiar_nume}</strong>,</p>
      <p style="font-size:14px;color:#333;line-height:1.6;">
        Va informam ca statusul cererii dumneavoastra cu numarul de dosar
        <strong style="font-family:monospace;font-size:15px;color:#1a2744;">${data.dosar_id}</strong>
        a fost actualizat.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="padding:10px 15px;background:#f8f5ef;border:1px solid #e5e0d8;font-size:13px;color:#6b7280;">Status anterior</td>
          <td style="padding:10px 15px;background:#f8f5ef;border:1px solid #e5e0d8;font-size:14px;font-weight:bold;color:#333;">${statusVechiLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 15px;border:1px solid #e5e0d8;font-size:13px;color:#6b7280;">Status nou</td>
          <td style="padding:10px 15px;border:1px solid #e5e0d8;font-size:14px;font-weight:bold;color:#166534;">${statusLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 15px;background:#f8f5ef;border:1px solid #e5e0d8;font-size:13px;color:#6b7280;">Data actualizarii</td>
          <td style="padding:10px 15px;background:#f8f5ef;border:1px solid #e5e0d8;font-size:14px;color:#333;">${new Date(data.timestamp).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</td>
        </tr>
      </table>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:15px;margin:20px 0;">
        <p style="font-size:13px;color:#1e40af;margin:0;"><strong>Pasii urmatori:</strong></p>
        <p style="font-size:13px;color:#1e40af;margin:8px 0 0;line-height:1.5;">${nextSteps}</p>
      </div>
      <p style="font-size:13px;color:#6b7280;line-height:1.5;">
        Pentru intrebari sau informatii suplimentare, va rugam sa contactati DGASPC Iasi la
        telefon <strong>0232-XXX-XXX</strong> sau email <strong>contact@dgaspc-iasi.ro</strong>.
      </p>
    </div>
    <div style="background:#f8f5ef;padding:15px 30px;border-top:1px solid #e5e0d8;text-align:center;">
      <p style="font-size:11px;color:#6b7280;margin:0;">
        DGASPC Iasi &mdash; Aliniat cu PNRR C13 &middot; ESF+ Romania 2021&ndash;2027 &middot; Google Cloud Platform
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Creates a Nodemailer transporter using SMTP environment variables.
 * Falls back to null if SMTP is not configured, in which case we only log.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[notify-citizen] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Emails will be logged only."
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Cloud Function entry point — triggered by Pub/Sub messages on the
 * "status-updates" topic.
 *
 * Expected message data (base64-encoded JSON):
 * {
 *   "dosar_id": "CJ-2024-0042",
 *   "beneficiar_email": "ion.popescu@email.ro",
 *   "beneficiar_nume": "Ion Popescu",
 *   "status_nou": "approved",
 *   "status_vechi": "pending",
 *   "timestamp": "2024-03-22T10:30:00Z"
 * }
 */
functions.cloudEvent("notifyCitizen", async (cloudEvent) => {
  console.log("[notify-citizen] Function triggered. Event ID:", cloudEvent.id);

  // --- 1. Decode the Pub/Sub message ----------------------------------------
  const pubsubMessage = cloudEvent.data?.message;
  if (!pubsubMessage || !pubsubMessage.data) {
    console.error("[notify-citizen] No Pub/Sub message data found in event.");
    return;
  }

  let data;
  try {
    const decoded = Buffer.from(pubsubMessage.data, "base64").toString("utf-8");
    data = JSON.parse(decoded);
    console.log("[notify-citizen] Decoded message:", JSON.stringify(data));
  } catch (err) {
    console.error("[notify-citizen] Failed to decode message:", err.message);
    return;
  }

  // --- 2. Validate required fields ------------------------------------------
  const required = [
    "dosar_id",
    "beneficiar_email",
    "beneficiar_nume",
    "status_nou",
    "status_vechi",
    "timestamp",
  ];
  const missing = required.filter((f) => !data[f]);
  if (missing.length > 0) {
    console.error(
      "[notify-citizen] Missing required fields:",
      missing.join(", ")
    );
    return;
  }

  // --- 3. Build and send (or log) email --------------------------------------
  const subject = `Actualizare cerere ${data.dosar_id} — DGASPC Iasi`;
  const html = buildEmailHtml(data);

  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"DGASPC Iasi" <${process.env.SMTP_USER}>`,
        to: data.beneficiar_email,
        subject,
        html,
      });
      console.log(
        `[notify-citizen] Email sent successfully to ${data.beneficiar_email}. Message ID: ${info.messageId}`
      );
    } catch (err) {
      console.error("[notify-citizen] Failed to send email:", err.message);
      throw err; // Rethrow so Cloud Functions marks the invocation as failed
    }
  } else {
    console.log("[notify-citizen] === EMAIL LOG (SMTP not configured) ===");
    console.log(`  To:      ${data.beneficiar_email}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Dosar:   ${data.dosar_id}`);
    console.log(
      `  Status:  ${data.status_vechi} -> ${data.status_nou}`
    );
    console.log(`  Nume:    ${data.beneficiar_nume}`);
    console.log("[notify-citizen] === END EMAIL LOG ===");
  }

  console.log(
    `[notify-citizen] Processing complete for dosar ${data.dosar_id}.`
  );
});
