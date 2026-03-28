import { useState } from "react";
import "./ArchitecturePage.css";

const FLOW_NODES = [
  { id: "citizen", emoji: "\uD83D\uDC64", label: "Cetatean", external: true },
  { id: "appengine", emoji: "\uD83C\uDF10", label: "App Engine", color: "#3b82f6" },
  { id: "storage", emoji: "\uD83D\uDCE6", label: "Cloud Storage", color: "#4ade80" },
  { id: "sql", emoji: "\uD83D\uDDC4\uFE0F", label: "Cloud SQL", color: "#c8a84b", stateful: true },
  { id: "pubsub", emoji: "\uD83D\uDCE8", label: "Cloud Pub/Sub", color: "#a78bfa" },
  { id: "functions", emoji: "\u26A1", label: "Cloud Functions", color: "#fb923c" },
  { id: "email", emoji: "\uD83D\uDCEC", label: "Email/SMS", external: true },
];

const SERVICE_DETAILS = {
  appengine: {
    role: "Runtime & API Server",
    desc: "Google App Engine serveste aplicatia Spring Boot si expune API-ul REST. Gestioneaza cererile HTTP de la portal si coordoneaza comunicarea cu celelalte servicii Google Cloud. Scalare automata in functie de trafic.",
  },
  storage: {
    role: "Stocare documente",
    desc: "Cloud Storage stocheaza securizat toate documentele incarcate de cetateni (PDF, JPG, PNG). Fisierele sunt organizate pe dosare: gs://dgaspc-iasi-docs/{dosar_id}/. Acces securizat prin URL-uri semnate valabile 15 minute.",
  },
  sql: {
    role: "Baza de date relationale (STATEFUL)",
    desc: "Cloud SQL PostgreSQL este serviciul STATEFUL al proiectului. Stocheaza datele beneficiarilor, cererile de ajutor social, documentele si logul notificarilor. Conectat prin Cloud SQL Auth Proxy pentru securitate maxima.",
  },
  pubsub: {
    role: "Messaging asincron",
    desc: "Cloud Pub/Sub asigura comunicarea asincrona intre backend si Cloud Functions. La fiecare schimbare de status, un mesaj JSON este publicat pe topicul status-updates, decuplind procesarea notificarilor de fluxul principal.",
  },
  functions: {
    role: "Procesare evenimente",
    desc: "Cloud Functions (notify-citizen) este declansat automat de subscriptia Pub/Sub notify-citizen-sub. Proceseaza mesajul, extrage datele beneficiarului si trimite un email de notificare despre schimbarea statusului cererii.",
  },
};

const PIPELINE_STEPS = [
  {
    num: "1",
    emoji: "\uD83D\uDDA5\uFE0F",
    title: "Inspector actualizeaza statusul",
    desc: "Inspectorul DGASPC modifica statusul cererii din tabloul de bord. Backend-ul Spring Boot proceseaza PATCH-ul si actualizeaza Cloud SQL.",
  },
  {
    num: "2",
    emoji: "\uD83D\uDCE8",
    title: "Pub/Sub publica mesajul",
    desc: "Backend-ul publica un mesaj JSON pe topicul status-updates cu detaliile schimbarii: dosar_id, email, status vechi si nou.",
  },
  {
    num: "3",
    emoji: "\u26A1",
    title: "Cloud Function declansata",
    desc: "Subscriptia notify-citizen-sub declanseaza functia notify-citizen care trimite automat un email beneficiarului cu noile informatii.",
  },
];

export default function ArchitecturePage() {
  const [selected, setSelected] = useState(null);

  const handleSelect = (id) => {
    if (id === "citizen" || id === "email") return;
    setSelected(selected === id ? null : id);
  };

  const detail = selected ? SERVICE_DETAILS[selected] : null;
  const selectedNode = FLOW_NODES.find((n) => n.id === selected);

  return (
    <div className="arch">
      <div className="arch__flow-card">
        <span className="arch__flow-label">
          FLUXUL UNEI CERERI — DE LA CETATEAN LA NOTIFICARE
        </span>
        <div className="arch__flow-row">
          {FLOW_NODES.map((node, i) => (
            <div className="arch__flow-item" key={node.id}>
              {i > 0 && (
                <div className="arch__arrow">
                  <div className="arch__arrow-line" />
                  <div className="arch__arrow-head" />
                </div>
              )}
              <button
                className={`arch__flow-node ${
                  node.external ? "arch__flow-node--external" : ""
                } ${node.stateful ? "arch__flow-node--stateful" : ""} ${
                  selected === node.id ? "arch__flow-node--selected" : ""
                }`}
                onClick={() => handleSelect(node.id)}
              >
                <span className="arch__flow-node-emoji">{node.emoji}</span>
                <span className="arch__flow-node-label">{node.label}</span>
                {node.stateful && (
                  <span className="arch__stateful-tag">STATEFUL</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {detail && selectedNode && (
        <div
          className="arch__detail-panel"
          style={{ borderColor: selectedNode.color || "#c8a84b" }}
        >
          <div className="arch__detail-header">
            <span className="arch__detail-emoji">{selectedNode.emoji}</span>
            <div>
              <h3 className="arch__detail-name">{selectedNode.label}</h3>
              <span className="arch__detail-role">{detail.role}</span>
            </div>
            {selectedNode.stateful && (
              <span className="arch__stateful-badge">STATEFUL {"\u2713"}</span>
            )}
          </div>
          <p className="arch__detail-desc">{detail.desc}</p>
        </div>
      )}

      <div className="arch__services-grid">
        {FLOW_NODES.filter((n) => !n.external).map((node) => (
          <button
            key={node.id}
            className={`arch__service-card ${
              node.stateful ? "arch__service-card--stateful" : ""
            } ${selected === node.id ? "arch__service-card--selected" : ""}`}
            onClick={() => handleSelect(node.id)}
          >
            <span
              className="arch__service-dot"
              style={{ backgroundColor: node.color }}
            />
            <span className="arch__service-name">{node.label}</span>
            <span className="arch__service-role">
              {SERVICE_DETAILS[node.id]?.role}
            </span>
            {node.stateful && (
              <span className="arch__stateful-tag">STATEFUL</span>
            )}
          </button>
        ))}
      </div>

      <div className="arch__pipeline">
        <h2 className="arch__pipeline-title">
          PIPELINE NOTIFICARI — Pub/Sub + Cloud Functions
        </h2>
        <div className="arch__pipeline-grid">
          {PIPELINE_STEPS.map((s) => (
            <div className="arch__pipeline-step" key={s.num}>
              <span className="arch__pipeline-num">{s.num}</span>
              <span className="arch__pipeline-emoji">{s.emoji}</span>
              <h4 className="arch__pipeline-step-title">{s.title}</h4>
              <p className="arch__pipeline-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
