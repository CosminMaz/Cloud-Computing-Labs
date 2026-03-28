import "./CloudArchBadge.css";

const SERVICES = [
  { name: "App Engine", color: "#3b82f6" },
  { name: "Cloud Storage", color: "#4ade80" },
  { name: "Cloud SQL", color: "#c8a84b", stateful: true },
  { name: "Pub/Sub", color: "#a78bfa" },
  { name: "Cloud Functions", color: "#fb923c" },
];

export default function CloudArchBadge({ setView }) {
  return (
    <div className="cloud-badge">
      <div className="cloud-badge__container">
        <div className="cloud-badge__header">
          <span className="cloud-badge__label">
            INFRASTRUCTURA GOOGLE CLOUD — 5 SERVICII
          </span>
          <button
            className="cloud-badge__link"
            onClick={() => setView("architecture")}
          >
            Vezi arhitectura &rarr;
          </button>
        </div>
        <div className="cloud-badge__pills">
          {SERVICES.map((s) => (
            <span
              key={s.name}
              className={`cloud-badge__pill ${
                s.stateful ? "cloud-badge__pill--stateful" : ""
              }`}
            >
              <span
                className="cloud-badge__dot"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
              {s.stateful && (
                <span className="cloud-badge__stateful-label">STATEFUL</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
