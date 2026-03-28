import "./InfoSection.css";

const STEPS = [
  {
    step: "01",
    emoji: "\uD83C\uDF10",
    title: "Portal web",
    desc: "Cetatenii acceseaza portalul si completeaza cererea de ajutor social online prin intermediul App Engine.",
    service: "App Engine",
  },
  {
    step: "02",
    emoji: "\uD83E\uDD16",
    title: "Scanare CI automata",
    desc: "Document AI extrage automat datele personale din cartea de identitate incarcata de solicitant.",
    service: "Document AI",
  },
  {
    step: "03",
    emoji: "\uD83D\uDCE6",
    title: "Documente stocate",
    desc: "Toate documentele justificative sunt stocate securizat in Cloud Storage cu URL-uri semnate.",
    service: "Cloud Storage",
  },
  {
    step: "04",
    emoji: "\uD83D\uDDC4\uFE0F",
    title: "Dosar inregistrat",
    desc: "Dosarul este salvat in baza de date Cloud SQL PostgreSQL cu un numar unic de inregistrare.",
    service: "Cloud SQL",
  },
  {
    step: "05",
    emoji: "\u26A1",
    title: "Notificare automata",
    desc: "La schimbarea statusului, Pub/Sub publica un mesaj iar Cloud Functions trimite email automat.",
    service: "Cloud Functions + Pub/Sub",
  },
];

export default function InfoSection() {
  return (
    <section className="info-section">
      <div className="info-section__container">
        <h2 className="info-section__title">
          Cum functioneaza — 5 servicii Google Cloud
        </h2>
        <div className="info-section__grid">
          {STEPS.map((s) => (
            <div className="info-section__card" key={s.step}>
              <span className="info-section__step-label">PASUL {s.step}</span>
              <span className="info-section__emoji">{s.emoji}</span>
              <h3 className="info-section__card-title">{s.title}</h3>
              <p className="info-section__card-desc">{s.desc}</p>
              <span className="info-section__service-badge">{s.service}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
