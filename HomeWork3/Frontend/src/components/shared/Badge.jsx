import "./Badge.css";

const STATUS_MAP = {
  pending: { label: "In asteptare", className: "badge-pending" },
  review: { label: "In analiza", className: "badge-review" },
  approved: { label: "Aprobat", className: "badge-approved" },
  rejected: { label: "Respins", className: "badge-rejected" },
};

export default function Badge({ status, label }) {
  const config = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span className={`badge ${config.className}`}>
      {label || config.label}
    </span>
  );
}
