/**
 * Einfacher State Manager für reaktive Updates
 * Implementiert das Observer-Pattern für reaktive Updates
 */
class StateManager {
  constructor() {
    this.state = {
      services: [],
      lastUpdate: null,
      isLoading: false,
      error: null,
    };
    this.observers = [];
  }

  // Registriere einen Observer (Komponente)
  subscribe(observer) {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  // Benachrichtige alle Observer über Änderungen
  notify() {
    this.observers.forEach(observer => observer(this.state));
  }

  // Aktualisiere den State und benachrichtige Observer
  updateState(newState) {
    this.state = { ...this.state, ...newState, lastUpdate: new Date() };
    this.notify();
  }

  // Services abrufen
  async fetchServices(isAdmin = false) {
    try {
      this.updateState({ isLoading: true, error: null });
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      const endpoint = isAdmin ? '/api/admin/services' : '/api/bookings';
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
        }
        throw new Error(`Fehler beim Abrufen der Services: ${response.status}`);
      }

      const data = await response.json();
      const services = isAdmin ? data.services : data.bookings;
      
      this.updateState({ 
        services: services || [], 
        isLoading: false 
      });
      
      return services || [];
    } catch (error) {
      console.error('Error in fetchServices:', error);
      this.updateState({ 
        error: error.message, 
        isLoading: false 
      });
      return this.state.services; // Return current services on error
    }
  }

  // Service-Aktion ausführen (deploy, suspend, resume, delete)
  async performServiceAction(serviceId, action, isAdmin = false) {
    try {
      this.updateState({ isLoading: true, error: null });
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      const endpoint = isAdmin 
        ? `/api/admin/services/${serviceId}/${action}`
        : `/api/bookings/${serviceId}/${action}`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Fehler bei der Aktion ${action}: ${response.status}`);
      }

      const data = await response.json();
      
      // Aktualisiere den Service im State
      const updatedServices = this.state.services.map(service => 
        service.id === serviceId 
          ? { ...service, status: data.status || service.status }
          : service
      );
      
      // Bei Löschen, entferne den Service aus dem State
      if (action === 'delete') {
        const filteredServices = this.state.services.filter(service => service.id !== serviceId);
        this.updateState({ 
          services: filteredServices, 
          isLoading: false,
          actionSuccess: `Service erfolgreich gelöscht`
        });
      } else {
        this.updateState({ 
          services: updatedServices, 
          isLoading: false,
          actionSuccess: `Aktion ${action} erfolgreich ausgeführt`
        });
      }
      
      // Nach kurzer Zeit die Erfolgsmeldung zurücksetzen
      setTimeout(() => {
        this.updateState({ actionSuccess: null });
      }, 3000);
      
      return true;
    } catch (error) {
      console.error(`Error in performServiceAction (${action}):`, error);
      this.updateState({ 
        error: error.message, 
        isLoading: false 
      });
      return false;
    }
  }

  // Simuliere WebSocket-Updates (für Echtzeit-Updates)
  startPolling(interval = 10000, isAdmin = false) {
    // Stoppe vorherige Polling-Intervalle
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Starte neues Polling
    this.pollingInterval = setInterval(() => {
      this.fetchServices(isAdmin);
    }, interval);
    
    return () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    };
  }

  // Bereinige Ressourcen
  cleanup() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.observers = [];
  }
}

// Singleton-Instanz
const stateManager = new StateManager();
export default stateManager;
