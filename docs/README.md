# BeyondFire Cloud

![BeyondFire Cloud Logo](../frontend/public/logo192.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Portainer](https://img.shields.io/badge/Portainer-Managed-blue)](https://www.portainer.io/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Integrated-orange)](https://www.cloudflare.com/)

## 📋 Inhaltsverzeichnis

- [Über das Projekt](#-über-das-projekt)
- [Funktionen](#-funktionen)
- [Technologien](#-technologien)
- [Erste Schritte](#-erste-schritte)
  - [Voraussetzungen](#voraussetzungen)
  - [Installation](#installation)
  - [Lokale Entwicklung](#lokale-entwicklung)
- [Deployment](#-deployment)
  - [Deployment mit Portainer](#deployment-mit-portainer)
  - [Docker-Build](#docker-build)
- [Nutzung](#-nutzung)
- [Verfügbare Docker-Container](#-verfügbare-docker-container)
  - [FE2 - Feuerwehr Einsatzleitsystem](#fe2---feuerwehr-einsatzleitsystem)
- [Roadmap](#-roadmap)
- [Mitwirken](#-mitwirken)
- [Lizenz](#-lizenz)
- [Kontakt](#-kontakt)

## 🚀 Über das Projekt

BeyondFire Cloud ist eine Webplattform, die es Kunden ermöglicht, sich zu registrieren, anzumelden und vordefinierte Docker-Container zu buchen. Die gebuchten Container werden mit kundenspezifischen Einstellungen bereitgestellt und über Cloudflare dynamisch zugänglich gemacht. Das Frontend und Backend werden als Portainer-Stack bereitgestellt.

Die Plattform bietet eine benutzerfreundliche Oberfläche für die Verwaltung von Docker-Containern, ohne dass tiefgreifende technische Kenntnisse erforderlich sind. Kunden können aus einer Auswahl vorkonfigurierter Container wählen und diese mit wenigen Klicks bereitstellen.

## ✨ Funktionen

- **Benutzerauthentifizierung**: Registrierung und Anmeldung für Kunden
- **Container-Katalog**: Auswahl an vorkonfigurierten Docker-Containern
- **Automatische Bereitstellung**: Einfache Buchung und Bereitstellung von Containern
- **Cloudflare-Integration**: Automatische DNS-Konfiguration für bereitgestellte Dienste
- **Portainer-Integration**: Verwaltung der Container über Portainer
- **Responsive Benutzeroberfläche**: Optimiert für Desktop und mobile Geräte

## 🛠 Technologien

- **Frontend**: React.js, CSS
- **Backend**: Node.js, Express
- **Datenbank**: JSON-Dateien (für Demo-Zwecke)
- **Container**: Docker, Docker Compose
- **Orchestrierung**: Portainer
- **DNS & Proxy**: Cloudflare

## 🏁 Erste Schritte

### Voraussetzungen

- Node.js (v18 oder höher)
- Docker und Docker Compose
- Portainer-Instanz (für Produktionsumgebung)
- Cloudflare-Konto (optional, für DNS-Integration)

### Installation

1. Klonen Sie das Repository
   ```bash
   git clone https://github.com/yourusername/beyondfire-cloud.git
   cd beyondfire-cloud
   ```

2. Erstellen Sie eine `.env`-Datei basierend auf `.env.example`
   ```bash
   cp .env.example .env
   # Bearbeiten Sie die .env-Datei mit Ihren Einstellungen
   ```

### Lokale Entwicklung

1. Installieren Sie die Abhängigkeiten:
   ```bash
   # Backend-Abhängigkeiten
   cd backend && npm install

   # Frontend-Abhängigkeiten
   cd frontend && npm install
   ```

2. Starten Sie die Entwicklungsserver:
   ```bash
   # Backend starten
   cd backend && npm run dev

   # Frontend starten (in einem neuen Terminal)
   cd frontend && npm start
   ```

3. Öffnen Sie Ihren Browser und navigieren Sie zu `http://localhost:3000`

## 🚢 Deployment

### Deployment mit Portainer

1. Loggen Sie sich in Ihre Portainer-Instanz ein
2. Navigieren Sie zu "Stacks" und klicken Sie auf "Add stack"
3. Geben Sie einen Namen für den Stack ein (z.B. "beyondfire-cloud")
4. Laden Sie die `docker-compose.yml` Datei hoch oder fügen Sie den Inhalt in das Web-Editor-Feld ein
5. Konfigurieren Sie die Umgebungsvariablen:
   - `PORTAINER_URL`: URL Ihrer Portainer-Instanz (z.B. http://localhost:9000)
   - `PORTAINER_USERNAME`: Ihr Portainer-Benutzername
   - `PORTAINER_PASSWORD`: Ihr Portainer-Passwort
   - `CLOUDFLARE_API_TOKEN`: Ihr Cloudflare API-Token (optional)
   - `CLOUDFLARE_ZONE_ID`: Ihre Cloudflare Zone-ID (optional)
   - `JWT_SECRET`: Ein sicherer Schlüssel für JWT-Token
   - `SERVER_IP`: Die öffentliche IP-Adresse Ihres Servers
6. Klicken Sie auf "Deploy the stack"

### Docker-Build

Alternativ können Sie den Stack auch direkt mit Docker Compose bauen und starten:

```bash
# Build der Docker-Images
docker-compose build

# Starten der Container
docker-compose up -d
```

## 📝 Nutzung

1. Öffnen Sie Ihren Browser und navigieren Sie zur URL Ihrer BeyondFire Cloud-Instanz
2. Registrieren Sie sich als neuer Benutzer oder melden Sie sich an
3. Durchsuchen Sie den Katalog verfügbarer Docker-Container
4. Wählen Sie einen Container aus und konfigurieren Sie ihn nach Ihren Wünschen
5. Klicken Sie auf "Buchen", um den Container bereitzustellen
6. Nach erfolgreicher Bereitstellung erhalten Sie Zugriffsinformationen für Ihren Container

## 🐳 Verfügbare Docker-Container

### FE2 - Feuerwehr Einsatzleitsystem

Das Alamos FE2 ist ein professionelles Einsatzleitsystem für Feuerwehren, das die Alarmierung und Einsatzkoordination optimiert.

**Funktionen:**
- Empfang und Verarbeitung von Alarmierungen
- Automatische Benachrichtigung von Einsatzkräften
- Einsatzdokumentation und -verwaltung
- Schnittstellen zu verschiedenen Alarmierungssystemen

**Technische Details:**
- Basiert auf dem offiziellen [Alamos FE2-Docker](https://github.com/alamos-gmbh/fe2-docker)
- Enthält MongoDB für die Datenspeicherung
- Nginx als Reverse-Proxy

## 🗺 Roadmap

- [ ] Integration weiterer Docker-Container
- [ ] Implementierung einer Datenbank für persistente Speicherung
- [ ] Erweiterung der Benutzerrollen (Admin, Kunde, etc.)
- [ ] Zahlungsintegration für kostenpflichtige Container
- [ ] Monitoring und Benachrichtigungssystem

## 👥 Mitwirken

Beiträge sind willkommen! Wenn Sie an diesem Projekt mitwirken möchten, folgen Sie bitte diesen Schritten:

1. Forken Sie das Repository
2. Erstellen Sie einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie den Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Weitere Informationen finden Sie in der [LICENSE](../LICENSE)-Datei.

## 📞 Kontakt

Projekt-Link: [https://github.com/yourusername/beyondfire-cloud](https://github.com/yourusername/beyondfire-cloud)

---

⭐ Entwickelt mit ❤️ für die Feuerwehr-Community ⭐
