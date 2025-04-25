import React from 'react';
import './LoadingOverlay.css';

/**
 * LoadingOverlay-Komponente
 * Zeigt eine Ladeanimation über dem Inhalt an, ohne ihn auszublenden
 *
 * @param {boolean} isLoading - Gibt an, ob der Ladevorgang aktiv ist
 * @param {boolean} showOnlyForUserActions - Wenn true, wird das Overlay nur bei Benutzeraktionen angezeigt
 * @param {string} message - Optionale Nachricht, die während des Ladevorgangs angezeigt wird
 * @param {React.ReactNode} children - Der Inhalt, über dem das Overlay angezeigt wird
 */
function LoadingOverlay({ isLoading, showOnlyForUserActions = false, message = 'Wird geladen...', children }) {
  // Zugriff auf den StateManager, um zu prüfen, ob es sich um eine Benutzeraktion handelt
  const shouldShowOverlay = () => {
    // Wenn showOnlyForUserActions=true ist, zeige das Overlay nur an, wenn es sich um eine Benutzeraktion handelt
    if (showOnlyForUserActions) {
      // Prüfe, ob es sich um eine Benutzeraktion handelt (nicht um einen Hintergrund-Refresh)
      const stateManager = window.stateManager;
      if (stateManager && stateManager.state && stateManager.state.loadingAction) {
        // Es ist eine Benutzeraktion, zeige das Overlay an
        return isLoading;
      }
      // Es ist kein Benutzeraktion, zeige das Overlay nicht an
      return false;
    }
    // Wenn showOnlyForUserActions=false ist, zeige das Overlay immer an, wenn isLoading=true ist
    return isLoading;
  };

  return (
    <div className="loading-container">
      {children}

      {shouldShowOverlay() && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            {message && <div className="loading-message">{message}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoadingOverlay;
