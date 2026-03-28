import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <p className="footer__line1">
          <strong>DGASPC Iasi</strong> — Directia Generala de Asistenta Sociala
          si Protectia Copilului, Judetul Iasi
        </p>
        <p className="footer__line2">
          Aliniat cu{" "}
          <span className="footer__gold">PNRR C13</span> &middot;{" "}
          <span className="footer__gold">ESF+ Romania 2021–2027</span>{" "}
          &middot; Construit pe Google Cloud Platform
        </p>
      </div>
    </footer>
  );
}
