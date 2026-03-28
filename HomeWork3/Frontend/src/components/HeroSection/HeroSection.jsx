import "./HeroSection.css";

const STATS = [
  { value: "1,247", label: "Cereri totale", sub: "+43 luna aceasta" },
  { value: "318", label: "In asteptare", sub: "necesita procesare" },
  { value: "891", label: "Aprobate", sub: "rata: 71.5%" },
  { value: "4.2 zile", label: "Timp mediu", sub: "fata de 18 zile anterior" },
];

export default function HeroSection({ setView }) {
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
          {STATS.map((s, i) => (
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
