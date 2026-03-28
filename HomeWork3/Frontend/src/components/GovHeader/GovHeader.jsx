import "./GovHeader.css";

const TABS = [
  { key: "home", label: "Portal Cetateni" },
  { key: "architecture", label: "Arhitectura Cloud" },
  { key: "dashboard", label: "Tablou de bord" },
  { key: "form", label: "Cerere noua" },
];

export default function GovHeader({ currentView, setView }) {
  return (
    <header className="gov-header">
      <div className="gov-header__gold-bar" />
      <div className="gov-header__main">
        <div className="gov-header__left">
          <div className="gov-header__badge-circle">&#127479;&#127476;</div>
          <div className="gov-header__text">
            <span className="gov-header__subtitle">
              ROMANIA — JUDETUL IASI
            </span>
            <span className="gov-header__title">
              DGASPC — Directia Generala de Asistenta Sociala
            </span>
          </div>
        </div>
        <div className="gov-header__right">
          <span className="gov-header__status-dot" />
          <span className="gov-header__status-text">
            5 servicii Google Cloud active
          </span>
        </div>
      </div>
      <nav className="gov-header__nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`gov-header__tab ${
              currentView === tab.key ? "gov-header__tab--active" : ""
            }`}
            onClick={() => setView(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
