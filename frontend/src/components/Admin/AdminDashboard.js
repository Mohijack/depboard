import React, { useState, useEffect } from 'react';
import ServiceLogs from './ServiceLogs';
import LoadingOverlay from '../common/LoadingOverlay';
import stateManager from '../../utils/StateManager';
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
    // Abonniere den StateManager für Updates
    const unsubscribe = stateManager.subscribe((state) => {
      setServices(state.services || []);
      setLoading(state.isLoading);
      setError(state.error || '');
      if (state.actionSuccess) {
        setActionSuccess(state.actionSuccess);
        // Nach 3 Sekunden die Erfolgsmeldung zurücksetzen
        setTimeout(() => setActionSuccess(''), 3000);
      }
    });

    // Initial Services laden
    fetchServices();

    // Starte Polling für Echtzeit-Updates
    const stopPolling = stateManager.startPolling(10000, true);

    // Cleanup beim Unmount
    return () => {
      unsubscribe();
      stopPolling();
    };
  }, []);

  const fetchServices = async () => {
    await stateManager.fetchServices(true);
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

      // Verwende den StateManager für Service-Aktionen
      const success = await stateManager.performServiceAction(serviceId, action, true);

      if (!success) {
        throw new Error(`Fehler bei der Aktion ${action}`);
      }

      // Bei erfolgreichem Löschen, schließe das Detail-Fenster
      if (action === 'delete' && success) {
        closeDetails();
      }
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

  // Bestimme die Lademeldung basierend auf dem aktuellen Zustand
  const getLoadingMessage = () => {
    const state = stateManager.state;
    if (!state.loadingAction) return 'Wird geladen...';

    switch (state.loadingAction) {
      case 'fetch':
        return 'Dienste werden geladen...';
      case 'deploy':
        return 'Dienst wird bereitgestellt...';
      case 'suspend':
        return 'Dienst wird pausiert...';
      case 'resume':
        return 'Dienst wird fortgesetzt...';
      case 'delete':
        return 'Dienst wird gelöscht...';
      default:
        return 'Wird geladen...';
    }
  };

  return (
    <LoadingOverlay
      isLoading={loading}
      showOnlyForUserActions={true}
      message={getLoadingMessage()}
    >
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
          serviceStatus={selectedService.status}
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
    </LoadingOverlay>
  );
}

export default AdminDashboard;
