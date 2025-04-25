import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BookingProcess.css';

function BookingProcess() {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState({
    bookingId: null,
    serviceName: '',
    subdomain: '',
    status: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    serviceName: '',
    subdomain: '',
    licenseEmail: 'philipp.dasilva@e.bosch.com', // Default value
    licensePassword: 'PG1hQcUIDLxY' // Default value
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      // If user is already logged in, move to step 2
      setCurrentStep(2);
    }

    // Check URL parameters for step information
    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const step = parseInt(stepParam);
      if (!isNaN(step) && step >= 1 && step <= 3) {
        setCurrentStep(step);
      }
    }
  }, [location.search]);

  const handleStepClick = (step) => {
    // Only allow going to steps that are accessible
    if (step === 1 || (user && step <= 4)) {
      setCurrentStep(step);
      navigate(`/booking?step=${step}`);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const deleteBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to delete booking:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      return false;
    }
  };

  const handleDeployService = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    let createdBookingId = null;

    try {
      const token = localStorage.getItem('token');

      // First, book the service
      const bookResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId: 'fe2-docker',
          customName: formData.serviceName,
          customDomain: formData.subdomain,
          licenseInfo: {
            email: formData.licenseEmail,
            password: formData.licensePassword
          }
        })
      });

      const bookData = await bookResponse.json();

      if (!bookResponse.ok) {
        throw new Error(bookData.error || 'Failed to book service');
      }

      // Extract booking ID from the response
      const bookingId = bookData.booking?.id;
      createdBookingId = bookingId;

      if (!bookingId) {
        throw new Error('Keine Buchungs-ID in der Antwort gefunden');
      }

      console.log('Booking successful, ID:', bookingId);

      // Update deployment status with booking information
      setDeploymentStatus({
        bookingId: bookingId,
        serviceName: formData.serviceName,
        subdomain: formData.subdomain || 'automatisch generiert',
        status: 'booked'
      });

      // Then, deploy the service
      const deployResponse = await fetch(`/api/bookings/${bookingId}/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const deployData = await deployResponse.json();

      if (!deployResponse.ok) {
        // If deployment fails, delete the booking
        const deleted = await deleteBooking(bookingId);

        if (deleted) {
          setError(`Deployment konnte nicht gestartet werden: ${deployData.error || 'Unbekannter Fehler'}. Der unvollständige Service wurde gelöscht. Bitte versuchen Sie es erneut.`);
        } else {
          setError(`Deployment konnte nicht gestartet werden: ${deployData.error || 'Unbekannter Fehler'}. Der Service konnte nicht automatisch gelöscht werden. Bitte wenden Sie sich an den Support.`);
        }

        setDeploymentStatus({
          bookingId: null,
          serviceName: '',
          subdomain: '',
          status: 'deleted'
        });

        return;
      }

      setSuccess('FE2-Service erfolgreich gebucht und wird bereitgestellt.');

      setDeploymentStatus(prev => ({
        ...prev,
        status: 'deployed'
      }));

      // Move to the next step
      setCurrentStep(4);
      navigate('/booking?step=4');

    } catch (error) {
      console.error('Error in deployment process:', error);

      // Provide more helpful error messages
      if (error.message.includes('Booking not found')) {
        setError('Der Service wurde nicht gefunden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.');
      } else if (error.message.includes('Keine Buchungs-ID')) {
        setError('Es gab ein Problem bei der Buchung des Services. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.');
      } else {
        setError(`Fehler: ${error.message}`);
      }

      // If a booking was created but deployment failed, try to delete it
      if (createdBookingId) {
        try {
          await deleteBooking(createdBookingId);
          console.log('Cleaned up incomplete booking:', createdBookingId);
        } catch (cleanupError) {
          console.error('Failed to clean up incomplete booking:', cleanupError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Schritt 1: Registrieren oder Anmelden</h2>
            <p>Um einen FE2-Service zu buchen, benötigen Sie ein Konto bei BeyondFire Cloud.</p>
            <div className="step-actions">
              <button
                className="btn-primary"
                onClick={() => navigate('/register?redirect=booking')}
              >
                Registrieren
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/login-step')}
              >
                Anmelden
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h2>Schritt 2: FE2-Service konfigurieren</h2>
            <p>Konfigurieren Sie Ihren FE2-Service mit einem Namen und einer optionalen Subdomain.</p>
            <div className="config-form">
              <div className="form-group">
                <label htmlFor="serviceName">Name des Services</label>
                <input
                  type="text"
                  id="serviceName"
                  placeholder="z.B. FE2-Feuerwehr-Musterhausen"
                  value={formData.serviceName}
                  onChange={handleInputChange}
                  required
                />
                <small>Dieser Name wird in Ihrem Dashboard angezeigt.</small>
              </div>
              <div className="form-group">
                <label htmlFor="subdomain">Subdomain (optional)</label>
                <div className="subdomain-input">
                  <input
                    type="text"
                    id="subdomain"
                    placeholder="ihre-feuerwehr"
                    value={formData.subdomain}
                    onChange={handleInputChange}
                  />
                  <span className="domain-suffix">.beyondfire.cloud</span>
                </div>
                <small>Leer lassen für automatisch generierte Subdomain.</small>
              </div>
            </div>
            <div className="step-actions">
              <button
                className="btn-primary"
                onClick={() => handleStepClick(3)}
                disabled={!formData.serviceName}
              >
                Weiter
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-content">
            <h2>Schritt 3: Alamos FE2 Lizenzinformationen</h2>
            <p>Geben Sie Ihre Alamos FE2 Lizenzinformationen ein, um den Service zu aktivieren.</p>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <div className="config-form">
              <div className="license-section">
                <h4>Alamos FE2 Lizenzinformationen</h4>
                <p>Diese Informationen werden für die Aktivierung Ihres FE2-Systems benötigt.</p>
              </div>
              <div className="form-group">
                <label htmlFor="licenseEmail">E-Mail-Adresse</label>
                <input
                  type="email"
                  id="licenseEmail"
                  placeholder="ihre-email@beispiel.de"
                  value={formData.licenseEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="licensePassword">Passwort</label>
                <input
                  type="password"
                  id="licensePassword"
                  placeholder="Ihr Alamos FE2 Passwort"
                  value={formData.licensePassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="step-actions">
              <button
                className="btn-primary"
                onClick={handleDeployService}
                disabled={loading || !formData.licenseEmail || !formData.licensePassword}
              >
                {loading ? 'Wird bereitgestellt...' : 'Service bereitstellen'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleStepClick(2)}
                disabled={loading}
              >
                Zurück
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-content">
            <h2>Schritt 4: Bereitstellung abgeschlossen</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="deployment-summary">
              <h3>Zusammenfassung Ihres FE2-Services</h3>
              <div className="summary-item">
                <span className="summary-label">Service-Name:</span>
                <span className="summary-value">{deploymentStatus.serviceName}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Subdomain:</span>
                <span className="summary-value">{deploymentStatus.subdomain}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Status:</span>
                <span className={`summary-value status-${deploymentStatus.status}`}>
                  {deploymentStatus.status === 'deployed' ? 'Erfolgreich bereitgestellt' :
                   deploymentStatus.status === 'deployment_failed' ? 'Bereitstellung fehlgeschlagen' :
                   'In Bearbeitung'}
                </span>
              </div>
            </div>

            <div className="next-steps">
              <h3>Nächste Schritte</h3>
              <p>Ihr FE2-Service wurde erfolgreich gebucht und wird nun bereitgestellt. Dies kann einige Minuten dauern.</p>
              <p>Sie können den Status Ihres Services im Dashboard überprüfen und verwalten.</p>
            </div>

            <div className="step-actions">
              <button
                className="btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                Zum Dashboard
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="booking-process">
      <div className="step-indicator">
        <div
          className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
          onClick={() => handleStepClick(1)}
        >
          <div className="step-number">1</div>
          <div className="step-label">Registrieren</div>
        </div>
        <div className="step-connector"></div>
        <div
          className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
          onClick={() => handleStepClick(2)}
        >
          <div className="step-number">2</div>
          <div className="step-label">FE2 konfigurieren</div>
        </div>
        <div className="step-connector"></div>
        <div
          className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
          onClick={() => handleStepClick(3)}
        >
          <div className="step-number">3</div>
          <div className="step-label">Bereitstellen</div>
        </div>
        <div className="step-connector"></div>
        <div
          className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}
          onClick={() => currentStep >= 4 && handleStepClick(4)}
        >
          <div className="step-number">4</div>
          <div className="step-label">Abgeschlossen</div>
        </div>
      </div>

      {renderStepContent()}
    </div>
  );
}

export default BookingProcess;
