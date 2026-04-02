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

const EMPTY_STATS = {
  total: 0,
  pending: 0,
  review: 0,
  approved: 0,
  rejected: 0,
};

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [cereri, setCereri] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [notified, setNotified] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cereriRes, statsRes] = await Promise.all([
        client.get("/cereri"),
        client.get("/stats"),
      ]);
      setCereri(cereriRes.data || []);
      setStats(statsRes.data || EMPTY_STATS);
    } catch (err) {
      console.error("Failed to fetch data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (dosarId) => {
    try {
      await client.patch(`/cereri/${dosarId}/status`, { status: "review" });
      setNotified((prev) => ({ ...prev, [dosarId]: true }));
      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err.message);
    }
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
          <span className="dashboard__stat-value">{stats.total}</span>
          <span className="dashboard__stat-sub">inregistrate in sistem</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">IN ASTEPTARE</span>
          <span className="dashboard__stat-value">{stats.pending}</span>
          <span className="dashboard__stat-sub">necesita procesare</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">IN ANALIZA</span>
          <span className="dashboard__stat-value">{stats.review}</span>
          <span className="dashboard__stat-sub">in curs de verificare</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-label">APROBATE</span>
          <span className="dashboard__stat-value">{stats.approved}</span>
          <span className="dashboard__stat-sub">{stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% rata aprobare</span>
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
                <td className="dashboard__dosar-id">{c.dosarId}</td>
                <td>{c.tipAjutor}</td>
                <td>{c.beneficiarNume || "—"}</td>
                <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString("ro-RO") : "—"}</td>
                <td>
                  <Badge status={c.status} />
                </td>
                <td>
                  {notified[c.dosarId] ? (
                    <span className="dashboard__notified">
                      {"\u26A1"} Trimis via Functions
                    </span>
                  ) : (
                    <button
                      className="dashboard__notify-btn"
                      onClick={() => handleNotify(c.dosarId)}
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
