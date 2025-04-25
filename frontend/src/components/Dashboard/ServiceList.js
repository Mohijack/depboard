import React, { useState } from 'react';

function ServiceList({ services, onBook }) {
  const [selectedService, setSelectedService] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [licenseEmail, setLicenseEmail] = useState('');
  const [licensePassword, setLicensePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSelectService = (service) => {
    setSelectedService(service);
    setCustomName(service.name);
    setCustomDomain('');
    setLicenseEmail('');
    setLicensePassword('');
    setError('');
    setSuccess('');
  };

  const handleBookService = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Prepare license info if needed
      const licenseInfo = selectedService.id === 'fe2-docker' ? {
        email: licenseEmail,
        password: licensePassword
      } : null;

      const result = await onBook(selectedService.id, customName, customDomain, licenseInfo);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`${customName} wurde erfolgreich gebucht!`);
      setSelectedService(null);
      setCustomName('');
      setCustomDomain('');
      setLicenseEmail('');
      setLicensePassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-list">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {selectedService ? (
        <div className="booking-form">
          <h3>{selectedService.name} buchen</h3>
          <p className="service-description">{selectedService.description}</p>
          <p className="service-price">{selectedService.price} €/Monat</p>

          <form onSubmit={handleBookService}>
            <div className="form-group">
              <label htmlFor="customName">Dienstname</label>
              <input
                type="text"
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="customDomain">Benutzerdefinierte Subdomain (Optional)</label>
              <div className="domain-input">
                <input
                  type="text"
                  id="customDomain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="meine-feuerwehr"
                />
                <span className="domain-suffix">.beyondfire.cloud</span>
              </div>
              <small>Leer lassen für automatisch generierte Subdomain</small>
            </div>

            {/* Lizenzinformationen für FE2 */}
            {selectedService && selectedService.id === 'fe2-docker' && (
              <>
                <div className="license-section">
                  <h4>Alamos FE2 Lizenzinformationen</h4>
                  <p>Bitte geben Sie Ihre Alamos FE2 Lizenzinformationen ein:</p>
                </div>

                <div className="form-group">
                  <label htmlFor="licenseEmail">E-Mail-Adresse</label>
                  <input
                    type="email"
                    id="licenseEmail"
                    value={licenseEmail}
                    onChange={(e) => setLicenseEmail(e.target.value)}
                    required
                    placeholder="ihre-email@beispiel.de"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="licensePassword">Passwort</label>
                  <input
                    type="password"
                    id="licensePassword"
                    value={licensePassword}
                    onChange={(e) => setLicensePassword(e.target.value)}
                    required
                    placeholder="Ihr Alamos FE2 Passwort"
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedService(null)}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Wird gebucht...' : 'Jetzt buchen'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="service-grid">
          {services.map(service => (
            <div key={service.id} className="service-card">
              <h3>{service.name}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-details">
                <div className="service-resources">
                  <div>CPU: {service.resources.cpu}</div>
                  <div>Memory: {service.resources.memory}</div>
                  <div>Storage: {service.resources.storage}</div>
                </div>
                <div className="service-price">{service.price} €/Monat</div>
              </div>
              <button
                className="btn-primary"
                onClick={() => handleSelectService(service)}
              >
                Jetzt buchen
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ServiceList;
