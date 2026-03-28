const DOCUMENTS = [
  { key: "copie_ci", label: "Copie CI" },
  { key: "adeverinta_venituri", label: "Adeverinta venituri" },
  { key: "certificat_medical", label: "Certificat medical" },
  { key: "declaratie", label: "Declaratie pe proprie raspundere" },
];

export default function DocumentUpload({ uploaded, onUpload }) {
  return (
    <div className="doc-upload">
      {DOCUMENTS.map((doc) => {
        const done = uploaded.includes(doc.key);
        return (
          <div
            key={doc.key}
            className={`doc-upload__row ${
              done ? "doc-upload__row--done" : ""
            }`}
            onClick={() => !done && onUpload(doc.key)}
          >
            <span className="doc-upload__icon">{done ? "\u2705" : "\uD83D\uDCC4"}</span>
            <div className="doc-upload__info">
              <span className="doc-upload__name">{doc.label}</span>
              <span className="doc-upload__status">
                {done ? "Incarcat cu succes" : "Click pentru a incarca"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
