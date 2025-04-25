import React, { useState, useEffect, useRef } from 'react';
import './LogViewer.css';

function LogViewer() {
  const [logType, setLogType] = useState('frontend');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [filterText, setFilterText] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [copySuccess, setCopySuccess] = useState('');
  const logsEndRef = useRef(null);

  useEffect(() => {
    fetchLogs();
    fetchServices();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [logType, selectedService]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, logType, selectedService]);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/services', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Check if token exists
      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      // For service logs, ensure a service is selected
      if (logType === 'service' && !selectedService) {
        setLogs([]);
        setError('Bitte wählen Sie einen Service aus, um die Logs anzuzeigen.');
        setLoading(false);
        return;
      }

      let url = `/api/admin/logs/${logType}`;
      if (logType === 'service' && selectedService) {
        url = `/api/admin/logs/service/${selectedService}`;
      }

      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
          }
          throw new Error(`Fehler beim Abrufen der Logs (Status: ${response.status})`);
        }

        const data = await response.json();

        // Ensure logs is always an array
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        } else {
          console.warn('API returned logs in unexpected format:', data);
          setLogs([]);
        }

        setError('');
      } catch (fetchError) {
        // Handle network errors specifically
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Netzwerkfehler: Server nicht erreichbar. Bitte überprüfen Sie Ihre Verbindung.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error in fetchLogs:', error);
      setError(error.message);

      // If we had logs before, keep them instead of showing an empty state
      if (logs.length === 0) {
        // Generate mock logs for demonstration
        const mockLogs = generateMockLogs(logType);
        setLogs(mockLogs);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate mock logs for demonstration
  const generateMockLogs = (type) => {
    const now = new Date();
    const baseTime = now.getTime();

    const mockLogs = [];

    // Add some mock logs based on the type
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(baseTime - i * 60000).toISOString();
      let message = '';

      switch (type) {
        case 'frontend':
          message = `[Frontend] ${i % 3 === 0 ? 'INFO' : i % 3 === 1 ? 'WARNING' : 'ERROR'}: Sample frontend log entry ${i + 1}`;
          break;
        case 'backend':
          message = `[Backend] ${i % 3 === 0 ? 'INFO' : i % 3 === 1 ? 'WARNING' : 'ERROR'}: Sample backend log entry ${i + 1}`;
          break;
        case 'service':
          message = `[Service] ${i % 3 === 0 ? 'INFO' : i % 3 === 1 ? 'WARNING' : 'ERROR'}: Sample service log entry ${i + 1}`;
          break;
        default:
          message = `[System] INFO: Sample log entry ${i + 1}`;
      }

      mockLogs.push({ timestamp, message });
    }

    return mockLogs;
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleLogTypeChange = (type) => {
    setLogType(type);
    setSelectedService('');
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = () => {
    try {
      // Format logs for clipboard - using already filtered logs
      const formattedLogs = filteredLogs.map(log =>
        `${log.timestamp} [${getLogLevel(log)}] ${log.message}`
      ).join('\n');

      // Fallback method for copying text
      const textArea = document.createElement('textarea');
      textArea.value = formattedLogs;

      // Make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);

      // Select and copy the text
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopySuccess('Logs kopiert!');
      } else {
        // Try the modern API as fallback
        navigator.clipboard.writeText(formattedLogs)
          .then(() => setCopySuccess('Logs kopiert!'))
          .catch(err => {
            setCopySuccess('Fehler beim Kopieren');
            console.error('Failed to copy logs: ', err);
          });
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setCopySuccess('');
      }, 2000);
    } catch (err) {
      setCopySuccess('Fehler beim Kopieren');
      console.error('Failed to copy logs: ', err);
    }
  };

  const getLogLevelClass = (log) => {
    if (!log || !log.message) return '';

    const content = log.message.toLowerCase();
    if (content.includes('error') || content.includes('exception') || content.includes('fail')) {
      return 'log-error';
    } else if (content.includes('warn')) {
      return 'log-warning';
    } else if (content.includes('debug')) {
      return 'log-debug';
    } else if (content.includes('info')) {
      return 'log-info';
    } else {
      // Default to info for unrecognized log levels
      return 'log-info';
    }
  };

  const getLogLevel = (log) => {
    if (!log || !log.message) return 'INFO';

    const content = log.message.toLowerCase();
    if (content.includes('error') || content.includes('exception') || content.includes('fail')) {
      return 'ERROR';
    } else if (content.includes('warn')) {
      return 'WARNING';
    } else if (content.includes('debug')) {
      return 'DEBUG';
    } else {
      // Default to INFO for unrecognized log levels or if message contains 'info'
      return 'INFO';
    }
  };

  const filteredLogs = logs.filter(log => {
    // Filter by level
    if (filterLevel !== 'all' && getLogLevel(log) !== filterLevel) {
      return false;
    }

    // Filter by search text
    if (filterText && !log.message.toLowerCase().includes(filterText.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="log-viewer">
      <div className="log-viewer-header">
        <h2>System Logs</h2>
        <div className="log-actions">
          <button
            className={`refresh-button ${autoRefresh ? 'active' : ''}`}
            onClick={toggleAutoRefresh}
          >
            {autoRefresh ? 'Auto-Refresh An' : 'Auto-Refresh Aus'}
          </button>
          <button className="refresh-button" onClick={fetchLogs}>
            <span className="refresh-icon">&#x21bb;</span> Aktualisieren
          </button>
        </div>
      </div>

      <div className="log-controls">
        <div className="log-type-tabs">
          <button
            className={`log-type-tab ${logType === 'frontend' ? 'active' : ''}`}
            onClick={() => handleLogTypeChange('frontend')}
          >
            Frontend
          </button>
          <button
            className={`log-type-tab ${logType === 'backend' ? 'active' : ''}`}
            onClick={() => handleLogTypeChange('backend')}
          >
            Backend
          </button>
          <button
            className={`log-type-tab ${logType === 'service' ? 'active' : ''}`}
            onClick={() => handleLogTypeChange('service')}
          >
            Services
          </button>
        </div>

        <div className="log-filters">
          <div className="filter-row">
            {logType === 'service' && (
              <div className="service-selector">
                <select
                  value={selectedService}
                  onChange={handleServiceChange}
                  className="service-select"
                >
                  <option value="">Wählen Sie einen Service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.customName} ({service.domain})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="level-filter">
              <label>Log-Level:</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="level-select"
              >
                <option value="all">Alle</option>
                <option value="ERROR">Error</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>

            <div className="search-filter">
              <input
                type="text"
                placeholder="Logs filtern..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="logs-container">
        {loading && logs.length === 0 ? (
          <div className="loading">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-logs">
            {filterText ? 'Keine Logs gefunden, die dem Filter entsprechen' : 'Keine Logs verfügbar'}
          </div>
        ) : (
          <div className="logs-output">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`log-line ${getLogLevelClass(log)}`}
              >
                <span className="log-timestamp">{log.timestamp}</span>
                <span className="log-level">{getLogLevel(log)}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="log-stats">
        <div className="log-count">
          {filteredLogs.length} Logs angezeigt
          {filterText && ` (gefiltert aus ${logs.length})`}
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <div className="log-actions-container">
          <div className="log-bottom-row">
            <div className="log-legend">
              <div className="legend-item">
                <span className="legend-color error-color"></span>
                <span>Error</span>
              </div>
              <div className="legend-item">
                <span className="legend-color warning-color"></span>
                <span>Warning</span>
              </div>
              <div className="legend-item">
                <span className="legend-color info-color"></span>
                <span>Info</span>
              </div>
              <div className="legend-item">
                <span className="legend-color debug-color"></span>
                <span>Debug</span>
              </div>
            </div>

            <div className="button-container">
              <button
                className="copy-button"
                onClick={copyToClipboard}
                title="Gefilterte Logs kopieren"
                disabled={filteredLogs.length === 0}
              >
                <span className="copy-icon">📋</span> Logs kopieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>


  );
}

export default LogViewer;
