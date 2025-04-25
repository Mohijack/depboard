import React from 'react';
import './LoadingOverlay.css';

/**
 * LoadingOverlay-Komponente
 * Zeigt eine Ladeanimation über dem Inhalt an, ohne ihn auszublenden
 * 
 * @param {boolean} isLoading - Gibt an, ob der Ladevorgang aktiv ist
 * @param {string} message - Optionale Nachricht, die während des Ladevorgangs angezeigt wird
 * @param {React.ReactNode} children - Der Inhalt, über dem das Overlay angezeigt wird
 */
function LoadingOverlay({ isLoading, message = 'Wird geladen...', children }) {
  return (
    <div className="loading-container">
      {children}
      
      {isLoading && (
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
