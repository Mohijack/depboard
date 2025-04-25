import React from 'react';
import { Link } from 'react-router-dom';
import './DeploymentLanding.css';

function DeploymentLanding() {
  return (
    <div className="deployment-landing">
      <section className="deployment-header">
        <div className="deployment-header-content">
          <h1>FE2 - Deployment Service</h1>
          <p>
            Stellen Sie das professionelle Alamos FE2 Einsatzleitsystem mit nur wenigen Klicks bereit.
          </p>
          <div className="deployment-buttons">
            <Link to="/booking" className="btn-primary">Jetzt bereitstellen</Link>
            <Link to="/login" className="btn-secondary">Anmelden</Link>
          </div>
        </div>
      </section>

      <section className="deployment-services">
        <div className="deployment-services-container">
          <h2>Verfügbare Dienste</h2>
          
          <div className="deployment-services-grid">
            <div className="deployment-service-card fe2-service">
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
              <div className="service-cta">
                <Link to="/booking" className="btn-primary">Jetzt bereitstellen</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DeploymentLanding;
