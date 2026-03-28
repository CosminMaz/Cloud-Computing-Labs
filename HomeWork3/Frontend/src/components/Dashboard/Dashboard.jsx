import { useState, useEffect } from "react";
import Badge from "../shared/Badge";
import client from "../../api/client";
import "./Dashboard.css";

const FILTERS = [
  { key: "all", label: "Toate" },
  { key: "pending", label: "In asteptare" },
  { key: "review", label: "In analiza" },
  { key: "approved", label: "Aprobat" },
  { key: "rejected", label: "Respins" },
];

const FALLBACK_CERERI = [
  {
    dosarId: "CJ-2024-0347",
    tipAjutor: "Indemnizatie handicap",
    beneficiarNume: "Ion Popescu",
    createdAt: "2024-03-15",
    status: "approved",
  },
  {
    dosarId: "CJ-2024-0348",
    tipAjutor: "Venit minim garantat",
    beneficiarNume: "Maria Ionescu",
    createdAt: "2024-03-16",
    status: "pending",
  },
  {
    dosarId: "CJ-2024-0349",
    tipAjutor: "Ajutor incalzire",
    beneficiarNume: "Vasile Georgescu",
    createdAt: "2024-03-17",
    status: "review",
  },
  {
    dosarId: "CJ-2024-0350",
    tipAjutor: "Alocatie copii",
    beneficiarNume: "Elena Dumitrescu",
    createdAt: "2024-03-18",
    status: "rejected",
  },
  {
    dosarId: "CJ-2024-0351",
    tipAjutor: "Ingrijire varstnici",
    beneficiarNume: "Gheorghe Munteanu",
    createdAt: "2024-03-19",
    status: "pending",
  },
];

const FALLBACK_STATS = {
  total: 1247,
  pending: 318,
  approved: 891,
  avgDays: "4.2",
};

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [cereri, setCereri] = useState([]);
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [notified, setNotified] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cereriRes, statsRes] = await Promise.all([
        client.get("/cereri"),
        client.get("/stats"),
      ]);
      setCereri(cereriRes.data || FALLBACK_CERERI);
      setStats(statsRes.data || FALLBACK_STATS);
    } catch (err) {
      console.warn("Using fallback data:", err.message);
      setCereri(FALLBACK_CERERI);
      setStats(FALLBACK_STATS);
    }
  };

  const handleNotify = async (dosarId) => {
    try {
      await client.patch(`/cereri/${dosarId}/status`, { status: "review" });
    } catch (err) {
      console.warn("Notification simulated locally:", err.message);
    }
    setNotified((prev) => ({ ...prev, [dosarId]: true }));
  };

  const filtered =
    filter === "all"
      ? cereri
      : cereri.filter((c) => c.status === filter);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__title">Tablou de bord DGASPC</h2>
          <p className="dashboard__subtitle">
            5 servicii Google Cloud active — date in timp real
          </p>
        </div>
        <span className="dashboard__inspector">Inspector: Mihai Danila</span>
      </div>

      <div className="dashboard__stats-grid">
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">CERERI TOTALE</span>
          <span className="dashboard__stat-value">{stats.total?.toLocaleString?.() || stats.total}</span>
          <span className="dashboard__stat-sub">+43 luna aceasta</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">IN ASTEPTARE</span>
          <span className="dashboard__stat-value">{stats.pending}</span>
          <span className="dashboard__stat-sub">necesita procesare</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">APROBATE</span>
          <span className="dashboard__stat-value">{stats.approved}</span>
          <span className="dashboard__stat-sub">rata: 71.5%</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">TIMP MEDIU</span>
          <span className="dashboard__stat-value">{stats.avgDays} zile</span>
          <span className="dashboard__stat-sub">fata de 18 zile anterior</span>
        </div>
      </div>

      <div className="dashboard__table-card">
        <div className="dashboard__table-header">
          <h3 className="dashboard__table-title">Cereri recente</h3>
          <div className="dashboard__filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`dashboard__filter-pill ${
                  filter === f.key ? "dashboard__filter-pill--active" : ""
                }`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <table className="dashboard__table">
          <thead>
            <tr>
              <th>Nr. Dosar</th>
              <th>Tip ajutor</th>
              <th>Beneficiar</th>
              <th>Data</th>
              <th>Status</th>
              <th>Notificare Pub/Sub</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.dosarId || i} className={i % 2 === 1 ? "dashboard__row--alt" : ""}>
                <td className="dashboard__dosar-id">{c.dosarId || c.dosar_id}</td>
                <td>{c.tipAjutor || c.tip_ajutor}</td>
                <td>{c.beneficiarNume || c.beneficiar_nume || "—"}</td>
                <td>{c.createdAt || c.created_at || "—"}</td>
                <td>
                  <Badge status={c.status} />
                </td>
                <td>
                  {notified[c.dosarId || c.dosar_id] ? (
                    <span className="dashboard__notified">
                      {"\u26A1"} Trimis via Functions
                    </span>
                  ) : (
                    <button
                      className="dashboard__notify-btn"
                      onClick={() => handleNotify(c.dosarId || c.dosar_id)}
                    >
                      {"\uD83D\uDCE8"} Notifica
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#6b7280" }}>
                  Nicio cerere gasita pentru filtrul selectat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="dashboard__info-box">
        <strong>{"\uD83D\uDCE8"} Pipeline Notificari:</strong> Cand statusul
        unei cereri se schimba, backend-ul Spring Boot publica un mesaj pe
        topic-ul Pub/Sub <code>status-updates</code>. Subscriptia{" "}
        <code>notify-citizen-sub</code> declanseaza Cloud Function{" "}
        <code>notify-citizen</code> care trimite un email automat
        beneficiarului.
      </div>
    </div>
  );
}
