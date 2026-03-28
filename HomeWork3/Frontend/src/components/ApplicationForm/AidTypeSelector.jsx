const AID_TYPES = [
  { key: "handicap", emoji: "\u267F", label: "Indemnizatie handicap" },
  { key: "venit_minim", emoji: "\uD83C\uDFE0", label: "Venit minim garantat" },
  { key: "incalzire", emoji: "\uD83D\uDD25", label: "Ajutor incalzire" },
  { key: "copii", emoji: "\uD83D\uDC76", label: "Alocatie copii" },
  { key: "varstnici", emoji: "\uD83E\uDDD3", label: "Ingrijire varstnici" },
];

export default function AidTypeSelector({ selected, onSelect }) {
  return (
    <div className="aid-type-grid">
      {AID_TYPES.map((t) => (
        <button
          key={t.key}
          className={`aid-type-card ${
            selected === t.key ? "aid-type-card--selected" : ""
          }`}
          onClick={() => onSelect(t.key)}
          type="button"
        >
          <span className="aid-type-card__emoji">{t.emoji}</span>
          <span className="aid-type-card__label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
