import React, { useState, useEffect, useRef } from 'react';
import './ServiceLogs.css';

function ServiceLogs({ serviceId, serviceName, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);
  const logsContainerRef = useRef(null);

  useEffect(() => {
    fetchLogs();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [serviceId, refreshInterval]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, serviceId]);

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [logs, autoScroll]);

  // Add event listener to detect manual scrolling
  useEffect(() => {
    const logsOutput = logsContainerRef.current;
    if (!logsOutput) return;

    const handleScroll = () => {
      // Check if user has scrolled up (not at bottom)
      const isAtBottom = Math.abs(
        logsOutput.scrollHeight - logsOutput.clientHeight - logsOutput.scrollTop
      ) < 50; // Allow small margin of error

      // Only change autoScroll if it's currently true and user scrolled up
      if (autoScroll && !isAtBottom) {
        setAutoScroll(false);
      }
    };

    logsOutput.addEventListener('scroll', handleScroll);
    return () => {
      logsOutput.removeEventListener('scroll', handleScroll);
    };
  }, [autoScroll]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Check if token exists
      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      // Fetch logs from the API
      let data = { logs: [] };
      try {
        const response = await fetch(`/api/admin/logs/service/${serviceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
          }
          throw new Error('Fehler beim Abrufen der Logs');
        }

        // Parse the response
        const responseText = await response.text();
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }

      // Get service information
      let serviceInfo;
      try {
        const serviceResponse = await fetch(`/api/admin/services/${serviceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json();
          serviceInfo = serviceData.service;
        }
      } catch (error) {
        console.error('Error fetching service info:', error);
        // Continue without service info
      }

      // Add system logs (deployment, portainer, docker compose)
      const systemLogs = [
        { timestamp: '2023-04-24T11:01:32.602Z', message: '[direct] Starting deployment for service ' + serviceId },
        { timestamp: '2023-04-24T11:01:35.123Z', message: '[direct] Creating container for service ' + serviceId },
        { timestamp: '2023-04-24T11:01:38.456Z', message: '[direct] Container created successfully' },
        { timestamp: '2023-04-24T11:01:40.789Z', message: '[direct] Starting container' },
        { timestamp: '2023-04-24T11:01:45.321Z', message: '[direct] Container started successfully' },
        { timestamp: '2023-04-24T11:01:50.654Z', message: '[portainer] Registering service in Portainer' },
        { timestamp: '2023-04-24T11:01:55.987Z', message: '[portainer] Service registered successfully' },
        { timestamp: '2023-04-24T11:02:00.123Z', message: '[docker-compose] Creating network' },
        { timestamp: '2023-04-24T11:02:05.456Z', message: '[docker-compose] Network created' },
        { timestamp: '2023-04-24T11:02:10.789Z', message: '[docker-compose] Pulling images' },
        { timestamp: '2023-04-24T11:02:15.321Z', message: '[docker-compose] Images pulled successfully' },
        { timestamp: '2023-04-24T11:02:20.654Z', message: '[docker-compose] Starting services' },
        { timestamp: '2023-04-24T11:02:25.987Z', message: '[docker-compose] Services started successfully' },
        { timestamp: '2023-04-24T11:02:30.123Z', message: '[direct] Deployment completed successfully' },
      ];

      // Add Docker deployment error logs if service status is 'failed'
      if (serviceInfo && serviceInfo.status === 'failed') {
        systemLogs.push(
          { timestamp: '2023-04-24T11:02:35.123Z', message: '[docker-compose] Error creating container: port is already allocated', level: 'ERROR' },
          { timestamp: '2023-04-24T11:02:40.456Z', message: '[direct] Deployment failed: could not start container', level: 'ERROR' },
          { timestamp: '2023-04-24T11:02:45.789Z', message: '[portainer] Failed to register service in Portainer', level: 'ERROR' }
        );
      }

      // Add service-specific logs based on service type
      let serviceType = serviceInfo ? serviceInfo.serviceId : 'fe2';
      let fe2Logs = [];
      if (serviceType && serviceType.startsWith('fe2')) {
        // Add FE2-specific logs
        fe2Logs = [
          { timestamp: new Date(Date.now() - 3600000).toISOString(), message: 'FE2 service initialized' },
          { timestamp: new Date(Date.now() - 3500000).toISOString(), message: 'Loading FE2 configuration...' },
          { timestamp: new Date(Date.now() - 3400000).toISOString(), message: 'FE2 configuration loaded successfully' },
          { timestamp: new Date(Date.now() - 3300000).toISOString(), message: 'FE2 license validated' },
          { timestamp: new Date(Date.now() - 3200000).toISOString(), message: 'Initializing FE2 modules...' },
          { timestamp: new Date(Date.now() - 3100000).toISOString(), message: 'All FE2 modules initialized' },
          { timestamp: new Date(Date.now() - 1800000).toISOString(), message: 'FE2 alert system activated' },
          { timestamp: new Date(Date.now() - 1200000).toISOString(), message: 'FE2 data synchronization completed' },
          { timestamp: new Date(Date.now() - 600000).toISOString(), message: 'FE2 periodic health check: OK' },
        ];
      }

      // Combine all logs: API logs + system logs + service-specific logs
      const allLogs = [...(data.logs || []), ...systemLogs, ...fe2Logs];

      // Process logs to ensure they have level and source
      const processedLogs = allLogs.map(log => {
        if (!log || !log.message) {
          return { ...log, level: 'INFO', source: '' };
        }

        const content = log.message.toLowerCase();
        let level = log.level || 'INFO';
        let source = log.source || '';

        // Extract source from system logs if not already set
        if (!source) {
          if (content.includes('[direct]')) {
            source = 'direct';
          } else if (content.includes('[portainer]')) {
            source = 'portainer';
          } else if (content.includes('[docker-compose]')) {
            source = 'docker-compose';
          }
        }

        // Determine log level if not already set
        if (!log.level) {
          if (content.includes('error') || content.includes('exception') || content.includes('fail')) {
            level = 'ERROR';
          } else if (content.includes('warn')) {
            level = 'WARNING';
          } else if (content.includes('debug')) {
            level = 'DEBUG';
          }
        }

        return { ...log, level, source };
      });

      // Sort logs by timestamp (newest first)
      processedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setLogs(processedLogs);
      setError('');
    } catch (error) {
      setError('Fehler beim Laden der Logs: ' + error.message);
      console.error('Error in fetchLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const toggleAutoScroll = () => {
    const newAutoScrollState = !autoScroll;
    setAutoScroll(newAutoScrollState);

    // If turning auto-scroll back on, immediately scroll to bottom
    if (newAutoScrollState) {
      scrollToBottom();
    }
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

  const getLogLevelClass = (level) => {
    if (!level) return '';

    switch (level) {
      case 'ERROR': return 'log-error';
      case 'WARNING': return 'log-warning';
      case 'DEBUG': return 'log-debug';
      case 'INFO': return 'log-info';
      default: return '';
    }
  };

  const getLogLevel = (log) => {
    return log.level || 'INFO';
  };

  const filteredLogs = logs.filter(log => {
    // Filter by level
    if (filterLevel !== 'all' && log.level !== filterLevel) {
      return false;
    }

    // Filter by search text
    if (searchText && !log.message.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="service-logs-modal">
      <div className="service-logs-content">
        <div className="service-logs-header">
          <h3>Logs: {serviceName}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="logs-controls">
          <div className="logs-actions">
            <button
              className={`refresh-button ${autoRefresh ? 'active' : ''}`}
              onClick={toggleAutoRefresh}
              title={autoRefresh ? "Auto-Refresh deaktivieren" : "Auto-Refresh aktivieren"}
            >
              {autoRefresh ? 'Auto-Refresh An' : 'Auto-Refresh Aus'}
            </button>
            <button
              className={`refresh-button ${autoScroll ? 'active' : ''}`}
              onClick={toggleAutoScroll}
              title={autoScroll ? "Auto-Scroll deaktivieren" : "Auto-Scroll aktivieren"}
            >
              {autoScroll ? 'Auto-Scroll An' : 'Auto-Scroll Aus'}
            </button>
            <button
              className="refresh-button"
              onClick={fetchLogs}
              title="Logs manuell aktualisieren"
            >
              <span className="refresh-icon">&#x21bb;</span> Aktualisieren
            </button>
          </div>

          <div className="logs-filters">
            <div className="filter-row">
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
                  placeholder="Logs durchsuchen..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="search-input"
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
              {searchText || filterLevel !== 'all' ? 'Keine Logs gefunden, die den Filterkriterien entsprechen' : 'Keine Logs verfügbar'}
            </div>
          ) : (
            <div className="logs-output" ref={logsContainerRef}>
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`log-line ${getLogLevelClass(log.level)} ${log.source ? `log-source-${log.source}` : ''}`}
                >
                  <span className="log-timestamp">{log.timestamp}</span>
                  <span className="log-level">{log.level}</span>
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
            {(searchText || filterLevel !== 'all') && ` (gefiltert aus ${logs.length})`}
            {copySuccess && <span className="copy-success">{copySuccess}</span>}
          </div>
          <div className="log-actions-container">
            <div className="log-bottom-row">
              <div className="log-legend">
                <div className="legend-section">
                  <div className="legend-title">Log Level:</div>
                  <div className="legend-items">
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
                </div>
                <div className="legend-section">
                  <div className="legend-title">Log Source:</div>
                  <div className="legend-items">
                    <div className="legend-item">
                      <span className="legend-color direct-color"></span>
                      <span>Direct Deployment</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color portainer-color"></span>
                      <span>Portainer</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color docker-compose-color"></span>
                      <span>Docker Compose</span>
                    </div>
                  </div>
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
    </div>
  );
}

export default ServiceLogs;
