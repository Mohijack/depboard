import React, { useState } from 'react';
import ServiceLogs from './ServiceLogs';

function ServiceDetails({ booking, onClose, onDeploy, onSuspend, onResume, onDelete }) {
  const [showLogs, setShowLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [error, setError] = useState('');

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

  const handleServiceAction = async (action) => {
    try {
      setActionLoading(true);
      setActionSuccess('');
      setError('');

      let result;
      let successMessage;

      switch (action) {
        case 'deploy':
          result = await onDeploy(booking.id);
          successMessage = 'Bereitstellung erfolgreich gestartet!';
          break;
        case 'suspend':
          result = await onSuspend(booking.id);
          successMessage = 'Dienst erfolgreich pausiert!';
          break;
        case 'resume':
          result = await onResume(booking.id);
          successMessage = 'Dienst erfolgreich fortgesetzt!';
          break;
        case 'delete':
          result = await onDelete(booking.id);
          successMessage = 'Dienst erfolgreich gelöscht!';
          onClose(); // Close the modal after successful deletion
          return;
        default:
          throw new Error('Invalid action');
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      setActionSuccess(successMessage);
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (showLogs) {
    return (
      <ServiceLogs
        bookingId={booking.id}
        onClose={() => setShowLogs(false)}
      />
    );
  }

  return (
    <div className="service-details-modal">
      <div className="service-details-content">
        <div className="service-details-header">
          <h3>{booking.customName}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {actionSuccess && <div className="success-message">{actionSuccess}</div>}

        <div className="service-details-body">
          <div className="detail-row">
            <span className="detail-label">Service ID:</span>
            <span className="detail-value">{booking.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Service Type:</span>
            <span className="detail-value">{booking.serviceId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${getStatusClass(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Domain:</span>
            <a
              href={`http://${booking.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`domain-link ${booking.status !== 'active' ? 'disabled' : ''}`}
            >
              {booking.domain}
            </a>
          </div>
          <div className="detail-row">
            <span className="detail-label">Port:</span>
            <span className="detail-value">{booking.port}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Erstellt am:</span>
            <span className="detail-value">
              {new Date(booking.createdAt).toLocaleString()}
            </span>
          </div>

          {booking.licenseInfo && (
            <div className="detail-section">
              <h4>Lizenzinformationen</h4>
              <div className="detail-row">
                <span className="detail-label">E-Mail:</span>
                <span className="detail-value">{booking.licenseInfo.email}</span>
              </div>
            </div>
          )}

          <div className="service-actions">
            <h4>Service-Aktionen</h4>
            <div className="action-buttons">
              {booking.status === 'pending' && (
                <button
                  className="action-button deploy-button"
                  onClick={() => handleServiceAction('deploy')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird ausgeführt...' : 'Bereitstellen'}
                </button>
              )}

              {booking.status === 'active' && (
                <button
                  className="action-button suspend-button"
                  onClick={() => handleServiceAction('suspend')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird ausgeführt...' : 'Pausieren'}
                </button>
              )}

              {booking.status === 'suspended' && (
                <button
                  className="action-button resume-button"
                  onClick={() => handleServiceAction('resume')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird ausgeführt...' : 'Fortsetzen'}
                </button>
              )}

              {booking.status === 'failed' && (
                <button
                  className="action-button deploy-button"
                  onClick={() => handleServiceAction('deploy')}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird ausgeführt...' : 'Wiederholen'}
                </button>
              )}

              {(booking.status === 'active' || booking.status === 'failed' || booking.status === 'suspended') && (
                <button
                  className="action-button logs-button"
                  onClick={() => setShowLogs(true)}
                  disabled={actionLoading}
                >
                  Logs anzeigen
                </button>
              )}

              <button
                className="action-button delete-button"
                onClick={() => {
                  if (window.confirm('Sind Sie sicher, dass Sie diesen Dienst löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                    handleServiceAction('delete');
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
  );
}

export default ServiceDetails;
