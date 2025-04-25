import React, { useState, useEffect } from 'react';
import ServiceLogs from './ServiceLogs';
import './AdminDashboard.css';

function AdminDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchServices();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(fetchServices, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Check if token exists
      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      try {
        const response = await fetch('/api/admin/services', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
          }
          throw new Error('Fehler beim Abrufen der Services');
        }

        const data = await response.json();
        setServices(data.services || []);
        setError('');
      } catch (fetchError) {
        // Handle network errors specifically
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Netzwerkfehler: Server nicht erreichbar. Bitte überprüfen Sie Ihre Verbindung.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error in fetchServices:', error);
      setError(error.message);
      // If services were previously loaded, keep them instead of showing an empty state
      if (services.length === 0) {
        // Set mock data for demonstration if needed
        // setServices(mockServices);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (serviceId, action) => {
    try {
      setActionLoading(true);
      setActionSuccess('');

      // Special handling for logs action
      if (action === 'logs') {
        setShowLogs(true);
        setActionLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/services/${serviceId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} service`);
      }

      const data = await response.json();
      setActionSuccess(`Service ${action} erfolgreich`);

      // Update the service in the list
      setServices(services.map(service =>
        service.id === serviceId ? { ...service, status: data.status } : service
      ));
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (service) => {
    setSelectedService(service);
  };

  const closeDetails = () => {
    setSelectedService(null);
    setShowLogs(false);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'deploying': return 'status-deploying';
      case 'suspended': return 'status-suspended';
      case 'failed': return 'status-failed';
      default: return '';
    }
  };

  if (loading && services.length === 0) {
    return <div className="loading">Loading services...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Service Dashboard</h2>
        <button className="refresh-button" onClick={fetchServices}>
          <span className="refresh-icon">&#x21bb;</span> Aktualisieren
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {actionSuccess && <div className="success-message">{actionSuccess}</div>}

      {showLogs && selectedService ? (
        <ServiceLogs
          serviceId={selectedService.id}
          serviceName={selectedService.customName}
          onClose={() => setShowLogs(false)}
        />
      ) : selectedService ? (
        <div className="service-details-modal">
          <div className="service-details-content">
            <div className="service-details-header">
              <h3>{selectedService.customName}</h3>
              <button className="close-button" onClick={closeDetails}>×</button>
            </div>

            <div className="service-details-body">
              <div className="detail-row">
                <span className="detail-label">Service ID:</span>
                <span className="detail-value">{selectedService.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Service Type:</span>
                <span className="detail-value">{selectedService.serviceId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${getStatusClass(selectedService.status)}`}>
                  {selectedService.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Domain:</span>
                <a
                  href={`http://${selectedService.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="domain-link"
                >
                  {selectedService.domain}
                </a>
              </div>
              <div className="detail-row">
                <span className="detail-label">Port:</span>
                <span className="detail-value">{selectedService.port}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Erstellt am:</span>
                <span className="detail-value">
                  {new Date(selectedService.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Läuft ab am:</span>
                <span className="detail-value">
                  {new Date(selectedService.expiresAt).toLocaleString()}
                </span>
              </div>

              <div className="detail-section">
                <h4>Kundeninformationen</h4>
                <div className="detail-row">
                  <span className="detail-label">Benutzer ID:</span>
                  <span className="detail-value">{selectedService.userId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedService.userName || 'Nicht verfügbar'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">E-Mail:</span>
                  <span className="detail-value">{selectedService.userEmail || 'Nicht verfügbar'}</span>
                </div>
              </div>

              {selectedService.licenseInfo && (
                <div className="detail-section">
                  <h4>Lizenzinformationen</h4>
                  <div className="detail-row">
                    <span className="detail-label">E-Mail:</span>
                    <span className="detail-value">{selectedService.licenseInfo.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Passwort:</span>
                    <span className="detail-value">
                      <button
                        className="show-password-button"
                        onClick={() => alert(`Passwort: ${selectedService.licenseInfo.password}`)}
                      >
                        Passwort anzeigen
                      </button>
                    </span>
                  </div>
                </div>
              )}

              <div className="service-actions">
                <h4>Service-Aktionen</h4>
                <div className="action-buttons">
                  {selectedService.status === 'pending' && (
                    <button
                      className="action-button deploy-button"
                      onClick={() => handleServiceAction(selectedService.id, 'deploy')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Wird ausgeführt...' : 'Bereitstellen'}
                    </button>
                  )}

                  {selectedService.status === 'active' && (
                    <button
                      className="action-button suspend-button"
                      onClick={() => handleServiceAction(selectedService.id, 'suspend')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Wird ausgeführt...' : 'Pausieren'}
                    </button>
                  )}

                  {selectedService.status === 'suspended' && (
                    <button
                      className="action-button resume-button"
                      onClick={() => handleServiceAction(selectedService.id, 'resume')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Wird ausgeführt...' : 'Fortsetzen'}
                    </button>
                  )}

                  <button
                    className="action-button logs-button"
                    onClick={() => setShowLogs(true)}
                    disabled={actionLoading}
                  >
                    Logs anzeigen
                  </button>

                  <button
                    className="action-button delete-button"
                    onClick={() => {
                      if (window.confirm('Sind Sie sicher, dass Sie diesen Service löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                        handleServiceAction(selectedService.id, 'delete');
                      }
                    }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Wird ausgeführt...' : 'Löschen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="services-table-container">
          {services.length === 0 ? (
            <div className="empty-state">
              <p>Keine Services gefunden</p>
            </div>
          ) : (
            <table className="services-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Kunde</th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Erstellt am</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {services.map(service => (
                  <tr key={service.id}>
                    <td>
                      <div className="service-name">{service.customName}</div>
                      <div className="service-type">{service.serviceId}</div>
                    </td>
                    <td>
                      <div>{service.userName || 'Unbekannt'}</div>
                      <div className="user-email">{service.userEmail || 'Keine E-Mail'}</div>
                    </td>
                    <td>
                      <a
                        href={`http://${service.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`domain-link ${service.status !== 'active' ? 'disabled' : ''}`}
                      >
                        {service.domain}
                      </a>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(service.status)}`}>
                        {service.status}
                      </span>
                    </td>
                    <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-button view-button"
                          onClick={() => handleViewDetails(service)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
