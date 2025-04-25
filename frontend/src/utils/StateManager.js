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
      loadingAction: null,
      loadingServiceId: null,
      error: null,
      actionSuccess: null,
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
      this.updateState({
        isLoading: true,
        loadingAction: 'fetch',
        loadingServiceId: null,
        error: null
      });
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
      const newServices = isAdmin ? data.services : data.bookings;

      // Vergleiche die neuen Services mit den vorhandenen
      const currentServices = this.state.services || [];
      let hasChanges = false;

      // Überprüfe, ob sich die Anzahl der Services geändert hat
      if (!currentServices.length || currentServices.length !== newServices.length) {
        hasChanges = true;
      } else {
        // Überprüfe, ob sich der Status eines Services geändert hat
        for (const newService of newServices) {
          const existingService = currentServices.find(s => s.id === newService.id);
          if (!existingService || existingService.status !== newService.status) {
            hasChanges = true;
            break;
          }
        }
      }

      // Wenn es Änderungen gibt, aktualisiere den State
      if (hasChanges) {
        console.log('Services have changed, updating state');
        this.updateState({
          services: newServices || [],
          isLoading: false,
          loadingAction: null,
          loadingServiceId: null
        });
      } else {
        // Wenn keine Änderungen, aktualisiere nur den Loading-Status
        this.updateState({
          isLoading: false,
          loadingAction: null,
          loadingServiceId: null
        });
      }

      // Überprüfe, ob es Services im "deploying"-Status gibt
      const deployingServices = newServices.filter(service => service.status === 'deploying');
      if (deployingServices.length > 0) {
        // Wenn es Services im "deploying"-Status gibt, starte ein schnelleres Polling
        this.checkDeployingServices(isAdmin);
      }

      return newServices || [];
    } catch (error) {
      console.error('Error in fetchServices:', error);
      this.updateState({
        error: error.message,
        isLoading: false,
        loadingAction: null,
        loadingServiceId: null
      });
      return this.state.services; // Return current services on error
    }
  }

  // Service-Aktion ausführen (deploy, suspend, resume, delete)
  async performServiceAction(serviceId, action, isAdmin = false) {
    try {
      // Aktualisiere den Ladezustand mit spezifischen Informationen
      this.updateState({
        isLoading: true,
        loadingAction: action,
        loadingServiceId: serviceId,
        error: null
      });
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      // Sofortige Statusaktualisierung für bessere Reaktivität
      if (action === 'deploy') {
        // Aktualisiere den Service-Status sofort auf "deploying"
        const updatedServices = this.state.services.map(service =>
          service.id === serviceId
            ? { ...service, status: 'deploying' }
            : service
        );
        this.updateState({ services: updatedServices });

        // Starte sofort ein schnelleres Polling
        this.checkDeployingServices(isAdmin);
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
          loadingAction: null,
          loadingServiceId: null,
          actionSuccess: `Service erfolgreich gelöscht`
        });
      } else {
        this.updateState({
          services: updatedServices,
          isLoading: false,
          loadingAction: null,
          loadingServiceId: null,
          actionSuccess: `Aktion ${action} erfolgreich ausgeführt`
        });
      }

      // Nach kurzer Zeit die Erfolgsmeldung zurücksetzen
      setTimeout(() => {
        this.updateState({ actionSuccess: null });
      }, 3000);

      // Sofort nach der Aktion die Services erneut abrufen
      setTimeout(() => {
        this.fetchServices(isAdmin);
      }, 1000);

      return true;
    } catch (error) {
      console.error(`Error in performServiceAction (${action}):`, error);
      this.updateState({
        error: error.message,
        isLoading: false,
        loadingAction: null,
        loadingServiceId: null
      });

      // Bei einem Fehler die Services erneut abrufen
      setTimeout(() => {
        this.fetchServices(isAdmin);
      }, 1000);

      return false;
    }
  }

  // Simuliere WebSocket-Updates (für Echtzeit-Updates)
  startPolling(interval = 10000, isAdmin = false) {
    // Stoppe vorherige Polling-Intervalle
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Speichere die aktuelle Konfiguration
    this.pollingConfig = { interval, isAdmin };

    // Starte neues Polling
    this.pollingInterval = setInterval(() => {
      this.fetchServices(isAdmin);

      // Überprüfe Services im "deploying"-Status und erhöhe die Polling-Frequenz
      this.checkDeployingServices(isAdmin);
    }, interval);

    return () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
    };
  }

  // Überprüfe Services im "deploying"-Status und erhöhe die Polling-Frequenz
  checkDeployingServices(isAdmin = false) {
    const deployingServices = this.state.services.filter(service =>
      service.status === 'deploying'
    );

    // Wenn es Services im "deploying"-Status gibt, erhöhe die Polling-Frequenz
    if (deployingServices.length > 0) {
      console.log(`${deployingServices.length} services are currently deploying, increasing polling frequency`);

      // Stoppe das normale Polling
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      // Starte ein schnelleres Polling (alle 2 Sekunden)
      this.pollingInterval = setInterval(() => {
        this.fetchServices(isAdmin);

        // Überprüfe, ob noch Services im "deploying"-Status sind
        const stillDeploying = this.state.services.some(service =>
          service.status === 'deploying'
        );

        // Wenn keine Services mehr im "deploying"-Status sind, kehre zur normalen Polling-Frequenz zurück
        if (!stillDeploying && this.pollingConfig) {
          console.log('No more deploying services, returning to normal polling frequency');
          clearInterval(this.pollingInterval);
          this.startPolling(this.pollingConfig.interval, this.pollingConfig.isAdmin);
        }
      }, 2000); // Schnelleres Polling alle 2 Sekunden
    }
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
