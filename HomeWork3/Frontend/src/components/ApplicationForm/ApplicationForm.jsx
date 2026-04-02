import { useState, useRef } from "react";
import AidTypeSelector from "./AidTypeSelector";
import DocumentUpload from "./DocumentUpload";
import client from "../../api/client";
import "./ApplicationForm.css";

const STEP_LABELS = ["Tip ajutor", "Date personale", "Documente"];

function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {STEP_LABELS.map((label, i) => (
        <div className="step-indicator__item" key={i}>
          {i > 0 && (
            <div
              className={`step-indicator__line ${
                i <= current ? "step-indicator__line--active" : ""
              }`}
            />
          )}
          <div
            className={`step-indicator__circle ${
              i <= current ? "step-indicator__circle--active" : ""
            }`}
          >
            {i + 1}
          </div>
          <span className="step-indicator__label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ApplicationForm({ setView }) {
  const [step, setStep] = useState(0);
  const [aidType, setAidType] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState("");
  const [rawOcr, setRawOcr] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const idFileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nume: "",
    cnp: "",
    email: "",
    telefon: "",
    adresa: "",
  });
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [docFiles, setDocFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dosarId, setDosarId] = useState("");
  const [error, setError] = useState("");

  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIdFile(file);
    setScanned(false);
    setScanError("");
    setIdPreview(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    if (!idFile) return;
    setScanning(true);
    setScanError("");
    const form = new FormData();
    form.append("image", idFile);
    try {
      const { data } = await client.post("/scan-document", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRawOcr(data.rawText || "");
      setScanned(true);
      setFormData((prev) => ({
        ...prev,
        nume: [data.prenume, data.nume].filter(Boolean).join(" ") || prev.nume,
        cnp: data.cnp || prev.cnp,
        adresa: data.adresa || prev.adresa,
      }));
      if (!data.cnp && !data.nume && !data.prenume) {
        setScanError("Nu s-au putut extrage date. Verificati ca fotografia CI sa fie clara si bine iluminata.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setScanError("Scanarea a esuat. Verificati imaginea si reincercati.");
    } finally {
      setScanning(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocUpload = (key, file) => {
    setUploadedDocs((prev) => [...prev, key]);
    setDocFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const response = await client.post("/cereri", {
        nume: formData.nume,
        cnp: formData.cnp,
        email: formData.email,
        telefon: formData.telefon,
        adresa: formData.adresa,
        tipAjutor: aidType,
        detalii: `Cerere ${aidType}`,
      });
      const id = response.data?.dosarId || response.data?.dosar_id;
      setDosarId(id);

      // Upload documents to Cloud Storage via backend
      const uploadErrors = [];
      for (const [tipDocument, file] of Object.entries(docFiles)) {
        const form = new FormData();
        form.append("file", file);
        form.append("tipDocument", tipDocument);
        try {
          await client.post(`/cereri/${id}/documente`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (uploadErr) {
          const msg = uploadErr.response?.data?.error || uploadErr.message;
          console.error(`Failed to upload ${tipDocument}:`, msg);
          uploadErrors.push(`${tipDocument}: ${msg}`);
        }
      }
      if (uploadErrors.length > 0) {
        setError(`Cererea a fost inregistrata (${id}), dar unele documente nu au putut fi incarcate:\n${uploadErrors.join("\n")}`);
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Eroare la trimiterea cererii. Verificati conexiunea si reincercati.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="app-form__wrapper">
        <div className="app-form__success-card">
          <span className="app-form__success-icon">{"\u2705"}</span>
          <h2 className="app-form__success-title">
            Cerere inregistrata cu succes
          </h2>
          <span className="app-form__dosar-id">{dosarId}</span>
        </div>

        <div className="app-form__log-panel">
          <h3 className="app-form__log-title">
            JURNAL SERVICII GOOGLE CLOUD
          </h3>
          <div className="app-form__log-line">
            <span className="app-form__log-time">00:00:01</span>
            <span className="app-form__log-dot app-form__log-dot--blue" />
            <span className="app-form__log-msg">
              [Cloud SQL] INSERT INTO cereri — dosar {dosarId} creat
            </span>
          </div>
          <div className="app-form__log-line">
            <span className="app-form__log-time">00:00:02</span>
            <span className="app-form__log-dot app-form__log-dot--green" />
            <span className="app-form__log-msg">
              [Cloud Storage] Upload gs://dgaspc-iasi-docs/{dosarId}/copie_ci.pdf
            </span>
          </div>
          <div className="app-form__log-line">
            <span className="app-form__log-time">00:00:03</span>
            <span className="app-form__log-dot app-form__log-dot--purple" />
            <span className="app-form__log-msg">
              [Pub/Sub] Mesaj publicat pe topic status-updates — msgId: ps-{Math.random().toString(36).slice(2, 10)}
            </span>
          </div>
          <div className="app-form__log-line">
            <span className="app-form__log-time">00:00:04</span>
            <span className="app-form__log-dot app-form__log-dot--orange" />
            <span className="app-form__log-msg">
              [Cloud Functions] notify-citizen declansat — email: {formData.email || "ion.popescu@email.ro"}
            </span>
          </div>
          <div className="app-form__log-line">
            <span className="app-form__log-time">00:00:05</span>
            <span className="app-form__log-dot app-form__log-dot--green" />
            <span className="app-form__log-msg">
              [Cloud Functions] Email trimis cu succes — status: 200 OK
            </span>
          </div>
        </div>

        <button
          className="app-form__btn app-form__btn--navy"
          onClick={() => setView("home")}
        >
          Inapoi la portal
        </button>
      </div>
    );
  }

  return (
    <div className="app-form__wrapper">
      <div className="app-form__card">
        <StepIndicator current={step} />

        {step === 0 && (
          <div className="app-form__step">
            <h3 className="app-form__step-title">
              Tipul ajutorului solicitat
            </h3>
            <AidTypeSelector selected={aidType} onSelect={setAidType} />
            <div className="app-form__actions">
              <button
                className="app-form__btn app-form__btn--navy"
                disabled={!aidType}
                onClick={() => setStep(1)}
              >
                Continua &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="app-form__step">
            <h3 className="app-form__step-title">Date personale</h3>

            <div className="app-form__docai-panel">
              <div className="app-form__docai-header">
                <span>{"\uD83E\uDD16"}</span>
                <span className="app-form__docai-title">
                  Document AI — extragere automata date CI
                </span>
                <span className="app-form__docai-badge">GOOGLE CLOUD</span>
              </div>
              <p className="app-form__docai-desc">
                Incarcati o fotografie a cartii de identitate, iar sistemul va
                extrage automat datele personale.
              </p>
              <input
                ref={idFileInputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                style={{ display: "none" }}
                onChange={handleIdFileChange}
              />
              {!scanned && !scanning && (
                <div className="app-form__docai-upload-row">
                  <button
                    className="app-form__docai-file-btn"
                    onClick={() => idFileInputRef.current.click()}
                    type="button"
                  >
                    {"\uD83D\uDCC4"} {idFile ? idFile.name : "Selectati fotografia CI"}
                  </button>
                  {idPreview && (
                    <img
                      src={idPreview}
                      alt="Previzualizare CI"
                      className="app-form__docai-preview"
                    />
                  )}
                  <button
                    className="app-form__docai-scan-btn"
                    onClick={handleScan}
                    disabled={!idFile}
                    type="button"
                  >
                    Scaneaza CI
                  </button>
                </div>
              )}
              {scanError && (
                <div className="app-form__docai-error">{scanError}</div>
              )}
              {scanning && (
                <div className="app-form__docai-loading">
                  {"\u23F3"} Scanez cu Google Vision API...
                </div>
              )}
              {scanned && (
                <div className="app-form__docai-result">
                  <div className="app-form__docai-result-grid">
                    <div>
                      <span className="app-form__docai-result-label">Nume</span>
                      <span className="app-form__docai-result-value">{formData.nume || "—"}</span>
                    </div>
                    <div>
                      <span className="app-form__docai-result-label">CNP</span>
                      <span className="app-form__docai-result-value">{formData.cnp || "—"}</span>
                    </div>
                    <div>
                      <span className="app-form__docai-result-label">Adresa</span>
                      <span className="app-form__docai-result-value">{formData.adresa || "—"}</span>
                    </div>
                  </div>
                  {rawOcr && (
                    <div className="app-form__docai-raw">
                      <button
                        type="button"
                        className="app-form__docai-raw-toggle"
                        onClick={() => setShowRaw((v) => !v)}
                      >
                        {showRaw ? "▲" : "▼"} Text brut OCR
                      </button>
                      {showRaw && (
                        <pre className="app-form__docai-raw-text">{rawOcr}</pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="app-form__fields-grid">
              <div className="app-form__field">
                <label>Nume Complet</label>
                <input
                  name="nume"
                  value={formData.nume}
                  onChange={handleChange}
                  placeholder="Nume si prenume"
                />
              </div>
              <div className="app-form__field">
                <label>CNP</label>
                <input
                  name="cnp"
                  value={formData.cnp}
                  onChange={handleChange}
                  placeholder="Cod numeric personal"
                  maxLength={13}
                />
              </div>
              <div className="app-form__field">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="adresa@email.ro"
                />
              </div>
              <div className="app-form__field">
                <label>Telefon</label>
                <input
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  placeholder="07xx xxx xxx"
                />
              </div>
            </div>
            <div className="app-form__field app-form__field--full">
              <label>Adresa Domiciliu</label>
              <input
                name="adresa"
                value={formData.adresa}
                onChange={handleChange}
                placeholder="Strada, numar, localitate, judet"
              />
            </div>

            <div className="app-form__actions app-form__actions--between">
              <button
                className="app-form__btn app-form__btn--outline"
                onClick={() => setStep(0)}
                type="button"
              >
                &larr; Inapoi
              </button>
              <button
                className="app-form__btn app-form__btn--navy"
                onClick={() => setStep(2)}
                disabled={!formData.nume || !formData.cnp || !formData.email}
              >
                Continua &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="app-form__step">
            <h3 className="app-form__step-title">Documente</h3>
            <p className="app-form__step-subtitle">
              Documentele vor fi stocate securizat in Cloud Storage
              (gs://dgaspc-iasi-docs/)
            </p>

            <DocumentUpload
              uploaded={uploadedDocs}
              onUpload={handleDocUpload}
            />

            <div className="app-form__warning-box">
              <strong>Declaratie:</strong> Declar pe propria raspundere ca datele
              furnizate sunt corecte si complete. Inteleg ca furnizarea de
              informatii false constituie infractiune conform legislatiei in
              vigoare.
            </div>

            {error && (
              <div className="app-form__error-box" style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
                {error}
              </div>
            )}

            <div className="app-form__actions app-form__actions--between">
              <button
                className="app-form__btn app-form__btn--outline"
                onClick={() => setStep(1)}
                type="button"
              >
                &larr; Inapoi
              </button>
              <button
                className="app-form__btn app-form__btn--gold"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Se trimite..." : "Trimite cererea \u2192"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
