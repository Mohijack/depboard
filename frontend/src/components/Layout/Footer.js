import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>BeyondFire Cloud</h3>
            <p>Ihre Plattform für einfache Bereitstellung von FE2-Einsatzleitsystemen mit Portainer- und Cloudflare-Integration.</p>
          </div>

          <div className="footer-section">
            <h3>Schnellzugriff</h3>
            <ul>
              <li><a href="/">Startseite</a></li>
              <li><a href="/#features">Vorteile</a></li>
              <li><a href="/#services">Dienste</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Rechtliches</h3>
            <ul>
              <li><a href="/impressum">Impressum</a></li>
              <li><a href="/datenschutz">Datenschutz</a></li>
              <li><a href="/agb">AGB</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Kontakt</h3>
            <p>E-Mail: support@beyondfire.cloud</p>
            <p>Telefon: +49 123 456789</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BeyondFire Cloud. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
