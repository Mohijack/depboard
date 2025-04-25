import React, { useState, useEffect } from 'react';
import ServiceLogs from './ServiceLogs';
import ServiceDetails from './ServiceDetails';
import stateManager from '../../utils/StateManager';

function BookingList({ bookings: initialBookings, onDeploy, onSuspend, onResume, onDelete }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionBookingId, setActionBookingId] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Abonniere den StateManager für reaktive Updates
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((state) => {
      setBookings(state.services || initialBookings);
      setLoading(state.isLoading);
      setError(state.error || '');
      if (state.actionSuccess) {
        setSuccess(state.actionSuccess);
        // Nach 3 Sekunden die Erfolgsmeldung zurücksetzen
        setTimeout(() => setSuccess(''), 3000);
      }
    });

    // Starte Polling für Echtzeit-Updates
    const stopPolling = stateManager.startPolling(10000, false);

    // Cleanup beim Unmount
    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [initialBookings]);

  // Aktualisiere Bookings, wenn sich initialBookings ändert
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const handleShowLogs = (bookingId) => {
    setSelectedBookingId(bookingId);
    setShowLogs(true);
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
    setSelectedBookingId(null);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCloseDetails = () => {
    setSelectedBooking(null);
  };

  const handleAction = async (action, bookingId) => {
    setError('');
    setSuccess('');
    setLoading(true);
    setActionBookingId(bookingId);
    setCurrentAction(action);

    try {
      // Verwende den StateManager für Service-Aktionen
      const success = await stateManager.performServiceAction(bookingId, action, false);

      if (success) {
        // Bei erfolgreichem Löschen, schließe das Detail-Fenster
        if (action === 'delete' && selectedBooking && selectedBooking.id === bookingId) {
          handleCloseDetails();
        }
        return;
      }

      // Fallback für die alten Funktionen, falls der StateManager nicht funktioniert
      let result;
      let successMessage;

      switch (action) {
        case 'deploy':
          result = await onDeploy(bookingId);
          successMessage = 'Bereitstellung erfolgreich gestartet!';
          break;
        case 'suspend':
          result = await onSuspend(bookingId);
          successMessage = 'Dienst erfolgreich pausiert!';
          break;
        case 'resume':
          result = await onResume(bookingId);
          successMessage = 'Dienst erfolgreich fortgesetzt!';
          break;
        case 'delete':
          result = await onDelete(bookingId);
          successMessage = 'Dienst erfolgreich gelöscht!';
          // Bei erfolgreichem Löschen, schließe das Detail-Fenster
          if (selectedBooking && selectedBooking.id === bookingId) {
            handleCloseDetails();
          }
          break;
        default:
          throw new Error('Invalid action');
      }

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(successMessage);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setActionBookingId(null);
      setCurrentAction(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'deploying':
        return 'status-deploying';
      case 'suspended':
        return 'status-suspended';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <p>Sie haben noch keine Dienste. Erstellen Sie einen Dienst, um zu beginnen!</p>
      </div>
    );
  }

  return (
    <div className="booking-list">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Service Logs Modal */}
      {showLogs && selectedBookingId && (
        <ServiceLogs
          bookingId={selectedBookingId}
          onClose={handleCloseLogs}
        />
      )}

      {/* Service Details Modal */}
      {selectedBooking && (
        <ServiceDetails
          booking={selectedBooking}
          onClose={handleCloseDetails}
          onDeploy={onDeploy}
          onSuspend={onSuspend}
          onResume={onResume}
          onDelete={onDelete}
        />
      )}

      <div className="booking-table">
        <div className="booking-header">
          <div className="booking-cell">Dienst</div>
          <div className="booking-cell">Domain</div>
          <div className="booking-cell">Port</div>
          <div className="booking-cell">Status</div>
          <div className="booking-cell">Aktionen</div>
        </div>

        {bookings.map(booking => (
          <div key={booking.id} className="booking-row">
            <div className="booking-cell">
              <div className="service-name">{booking.customName}</div>
              <div className="service-type">{booking.serviceName}</div>
            </div>
            <div className="booking-cell">
              <a
                href={`http://${booking.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={booking.status === 'active' ? 'domain-link' : 'domain-link disabled'}
              >
                {booking.domain}
              </a>
            </div>
            <div className="booking-cell">
              <span className="port-number">{booking.port}</span>
              {booking.status === 'active' && (
                <a
                  href={`http://192.168.200.170:${booking.port}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="port-link"
                  title="Direkt über IP und Port zugreifen"
                >
                  <span className="port-link-icon">↗</span>
                </a>
              )}
            </div>
            <div className="booking-cell">
              <span className={`status-badge ${getStatusClass(booking.status)}`}>
                {booking.status === 'active' && 'Aktiv'}
                {booking.status === 'pending' && 'Ausstehend'}
                {booking.status === 'deploying' && 'Wird bereitgestellt'}
                {booking.status === 'suspended' && 'Pausiert'}
                {booking.status === 'failed' && 'Fehlgeschlagen'}
              </span>
            </div>
            <div className="booking-cell">
              {booking.status === 'pending' && (
                <button
                  className="btn-action"
                  onClick={() => handleAction('deploy', booking.id)}
                  disabled={loading && actionBookingId === booking.id}
                >
                  {loading && actionBookingId === booking.id ? 'Wird bereitgestellt...' : 'Bereitstellen'}
                </button>
              )}
              {booking.status === 'active' && (
                <button
                  className="btn-action btn-suspend"
                  onClick={() => handleAction('suspend', booking.id)}
                  disabled={loading && actionBookingId === booking.id}
                >
                  {loading && actionBookingId === booking.id ? 'Wird pausiert...' : 'Pausieren'}
                </button>
              )}
              {booking.status === 'suspended' && (
                <button
                  className="btn-action"
                  onClick={() => handleAction('resume', booking.id)}
                  disabled={loading && actionBookingId === booking.id}
                >
                  {loading && actionBookingId === booking.id ? 'Wird fortgesetzt...' : 'Fortsetzen'}
                </button>
              )}
              {booking.status === 'failed' && (
                <button
                  className="btn-action"
                  onClick={() => handleAction('deploy', booking.id)}
                  disabled={loading && actionBookingId === booking.id}
                >
                  {loading && actionBookingId === booking.id ? 'Wird wiederholt...' : 'Wiederholen'}
                </button>
              )}

              {/* Details-Button für alle Status */}
              <button
                className="btn-action btn-details"
                onClick={() => handleViewDetails(booking)}
                disabled={loading && actionBookingId === booking.id}
              >
                Details
              </button>

              {/* Löschen-Button für alle Status */}
              <button
                className="btn-action btn-delete"
                onClick={() => {
                  if (window.confirm('Sind Sie sicher, dass Sie diesen Dienst löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                    handleAction('delete', booking.id);
                  }
                }}
                disabled={loading && actionBookingId === booking.id}
              >
                {loading && actionBookingId === booking.id && currentAction === 'delete' ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookingList;
