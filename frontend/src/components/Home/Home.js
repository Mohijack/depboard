import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>FE2 - Feuerwehr Einsatzleitsystem in der Cloud</h1>
          <p>
            BeyondFire Cloud bietet Ihnen das professionelle Alamos FE2 Einsatzleitsystem als Cloud-Lösung –
            einfach zu deployen, zuverlässig im Betrieb und optimal für Ihre Feuerwehr.
          </p>
          <div className="hero-buttons">
            <Link to="/booking" className="btn-primary">Jetzt starten</Link>
            <Link to="/login" className="btn-secondary">Anmelden</Link>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="features-container">
          <h2>Warum FE2 auf BeyondFire Cloud?</h2>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Schnelle Bereitstellung</h3>
              <p>Ihr FE2-System ist in wenigen Minuten einsatzbereit - ohne komplizierte Installation.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Sicher & Zuverlässig</h3>
              <p>Hohe Verfügbarkeit durch professionelle Cloud-Infrastruktur und automatische Backups.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Eigene Domain</h3>
              <p>Erhalten Sie automatisch eine eigene Subdomain für Ihr FE2-System.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Kosteneffizient</h3>
              <p>Keine Anschaffungskosten für Hardware und keine Wartungskosten - nur eine monatliche Gebühr.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="services">
        <div className="services-container">
          <h2>Verfügbare Dienste</h2>
          <p className="services-description">
            Stellen Sie das professionelle Alamos FE2 Feuerwehr Einsatzleitsystem mit nur wenigen Klicks bereit.
          </p>

          <div className="services-grid">
            <div className="service-preview fe2-preview">
              <h3>FE2 - Feuerwehr Einsatzleitsystem</h3>
              <p>Professionelles Einsatzleitsystem für Feuerwehren mit Alarmierung und Einsatzkoordination.</p>
              <div className="service-price">Starting at $19.99/month</div>
              <div className="service-features">
                <ul>
                  <li>Empfang und Verarbeitung von Alarmierungen</li>
                  <li>Automatische Benachrichtigung von Einsatzkräften</li>
                  <li>Einsatzdokumentation und -verwaltung</li>
                  <li>Schnittstellen zu verschiedenen Alarmierungssystemen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="services-cta">
            <Link to="/booking" className="btn-primary">FE2 jetzt bereitstellen</Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="how-it-works-container">
          <h2>So einfach geht's</h2>

          <div className="steps">
            <div className="step step-1">
              <div className="step-badge">Schritt 1</div>
              <div className="step-number">1</div>
              <div className="step-icon">👤</div>
              <h3>Konto erstellen</h3>
              <p>Registrieren Sie sich in wenigen Sekunden bei BeyondFire Cloud und erhalten Sie sofort Zugang.</p>
            </div>

            <div className="step step-2">
              <div className="step-badge">Schritt 2</div>
              <div className="step-number">2</div>
              <div className="step-icon">⚙️</div>
              <h3>FE2 konfigurieren</h3>
              <p>Wählen Sie einen Namen und optional eine benutzerdefinierte Subdomain für Ihr FE2-System.</p>
            </div>

            <div className="step step-3">
              <div className="step-badge">Schritt 3</div>
              <div className="step-number">3</div>
              <div className="step-icon">🚀</div>
              <h3>Bereitstellen</h3>
              <p>Klicken Sie auf "Bereitstellen" und Ihr FE2-System ist in wenigen Minuten einsatzbereit.</p>
            </div>

            <div className="step step-4">
              <div className="step-badge">Schritt 4</div>
              <div className="step-number">4</div>
              <div className="step-icon">🔥</div>
              <h3>Sofort nutzen</h3>
              <p>Greifen Sie über Ihre Subdomain auf Ihr FE2-System zu und beginnen Sie mit der Konfiguration.</p>
            </div>
          </div>


        </div>
      </section>
    </div>
  );
}

export default Home;
