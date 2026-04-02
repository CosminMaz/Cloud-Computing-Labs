import { useState, useEffect } from "react";
import client from "../../api/client";
import "./HeroSection.css";

export default function HeroSection({ setView }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, review: 0 });

  useEffect(() => {
    client.get("/stats")
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const statCards = [
    { value: stats.total, label: "Cereri totale", sub: "inregistrate in sistem" },
    { value: stats.pending, label: "In asteptare", sub: "necesita procesare" },
    { value: stats.approved, label: "Aprobate", sub: stats.total > 0 ? `rata: ${Math.round((stats.approved / stats.total) * 100)}%` : "rata: 0%" },
    { value: stats.review, label: "In analiza", sub: "in curs de verificare" },
  ];

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__left">
          <span className="hero__pill">
            SERVICII SOCIALE DIGITALIZATE &middot; 5 SERVICII GOOGLE CLOUD
          </span>
          <h1 className="hero__title">
            Portal de Solicitare
            <br />
            <span className="hero__title--gold">Ajutor Social</span>
          </h1>
          <p className="hero__desc">
            Platforma digitala pentru depunerea cererilor de ajutor social
            online. Sistemul utilizeaza Document AI pentru extragerea automata a
            datelor din actele de identitate si Cloud Functions pentru
            notificari in timp real.
          </p>
          <div className="hero__buttons">
            <button
              className="hero__btn hero__btn--primary"
              onClick={() => setView("form")}
            >
              Depune o cerere &rarr;
            </button>
            <button
              className="hero__btn hero__btn--secondary"
              onClick={() => setView("architecture")}
            >
              Arhitectura Cloud
            </button>
          </div>
        </div>
        <div className="hero__right">
          {statCards.map((s, i) => (
            <div className="hero__stat-card" key={i}>
              <span className="hero__stat-value">{s.value}</span>
              <span className="hero__stat-label">{s.label}</span>
              <span className="hero__stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
