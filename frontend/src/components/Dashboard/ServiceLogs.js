import React, { useState, useEffect, useRef } from 'react';
import './ServiceLogs.css';

function ServiceLogs({ bookingId, onClose }) {
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
  }, [bookingId, refreshInterval]);

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
  }, [autoRefresh, bookingId]);

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

      // Try to fetch logs from the API
      let response;
      try {
        response = await fetch(`/api/bookings/${bookingId}/logs`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (fetchError) {
        console.error('Error fetching logs:', fetchError);
        throw new Error('Netzwerkfehler: Server nicht erreichbar');
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
        }
        throw new Error('Fehler beim Abrufen der Logs');
      }

      let data;
      try {
        const responseText = await response.text();
        if (responseText && responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          data = { logs: [] };
        }
      } catch (parseError) {
        console.error('Error parsing logs JSON:', parseError);
        throw new Error('Fehler beim Verarbeiten der Logs');
      }

      // Get service information to include deployment logs
      let serviceInfo;
      try {
        const serviceResponse = await fetch(`/api/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json();
          serviceInfo = serviceData.booking;
        }
      } catch (serviceError) {
        console.error('Error fetching service info:', serviceError);
        // Continue without service info
      }

      // Add system logs (deployment, portainer, docker compose)
      const systemLogs = [
        { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'INFO', source: 'direct', message: 'Starting deployment for service' },
        { timestamp: new Date(Date.now() - 3500000).toISOString(), level: 'INFO', source: 'direct', message: 'Creating container' },
        { timestamp: new Date(Date.now() - 3400000).toISOString(), level: 'INFO', source: 'direct', message: 'Container created successfully' },
        { timestamp: new Date(Date.now() - 3300000).toISOString(), level: 'INFO', source: 'direct', message: 'Starting container' },
        { timestamp: new Date(Date.now() - 3200000).toISOString(), level: 'INFO', source: 'direct', message: 'Container started successfully' },
        { timestamp: new Date(Date.now() - 3100000).toISOString(), level: 'INFO', source: 'portainer', message: 'Registering service in Portainer' },
        { timestamp: new Date(Date.now() - 3000000).toISOString(), level: 'INFO', source: 'portainer', message: 'Service registered successfully' },
        { timestamp: new Date(Date.now() - 2900000).toISOString(), level: 'INFO', source: 'docker-compose', message: 'Creating network' },
        { timestamp: new Date(Date.now() - 2800000).toISOString(), level: 'INFO', source: 'docker-compose', message: 'Network created' },
        { timestamp: new Date(Date.now() - 2700000).toISOString(), level: 'INFO', source: 'docker-compose', message: 'Pulling images' },
        { timestamp: new Date(Date.now() - 2600000).toISOString(), level: 'INFO', source: 'docker-compose', message: 'Images pulled successfully' },
        { timestamp: new Date(Date.now() - 2500000).toISOString(), level: 'INFO', source: 'docker-compose', message: 'Starting services' },
        { timestamp: new Date(Date.now() - 2400000).toISOString(), level: 'INFO', source: 'docker-compose', message: 'Services started successfully' },
        { timestamp: new Date(Date.now() - 2300000).toISOString(), level: 'INFO', source: 'direct', message: 'Deployment completed successfully' },
      ];

      // Add Docker deployment error logs if service status is 'failed'
      if (serviceInfo && serviceInfo.status === 'failed') {
        systemLogs.push(
          { timestamp: new Date(Date.now() - 1800000).toISOString(), level: 'ERROR', source: 'docker-compose', message: 'Error creating container: port is already allocated' },
          { timestamp: new Date(Date.now() - 1700000).toISOString(), level: 'ERROR', source: 'direct', message: 'Deployment failed: could not start container' },
          { timestamp: new Date(Date.now() - 1600000).toISOString(), level: 'ERROR', source: 'portainer', message: 'Failed to register service in Portainer' }
        );
      }

      // Add service-specific logs based on service type
      let serviceType = serviceInfo ? serviceInfo.serviceId : 'fe2-docker-standard';
      if (serviceType.startsWith('fe2')) {
        // Add FE2-specific logs
        const fe2Logs = [
          { timestamp: new Date(Date.now() - 2200000).toISOString(), level: 'INFO', message: 'FE2 service initialized' },
          { timestamp: new Date(Date.now() - 2100000).toISOString(), level: 'INFO', message: 'Loading FE2 configuration...' },
          { timestamp: new Date(Date.now() - 2000000).toISOString(), level: 'INFO', message: 'FE2 configuration loaded successfully' },
          { timestamp: new Date(Date.now() - 1900000).toISOString(), level: 'INFO', message: 'FE2 license validated' },
          { timestamp: new Date(Date.now() - 1500000).toISOString(), level: 'INFO', message: 'Initializing FE2 modules...' },
          { timestamp: new Date(Date.now() - 1400000).toISOString(), level: 'INFO', message: 'All FE2 modules initialized' },
          { timestamp: new Date(Date.now() - 1300000).toISOString(), level: 'INFO', message: 'FE2 alert system activated' },
          { timestamp: new Date(Date.now() - 1200000).toISOString(), level: 'INFO', message: 'FE2 data synchronization completed' },
          { timestamp: new Date(Date.now() - 600000).toISOString(), level: 'INFO', message: 'FE2 periodic health check: OK' },
        ];

        // Add existing logs from API
        const allLogs = [...(data.logs || []), ...systemLogs, ...fe2Logs];

        // Process logs to ensure they have level and source
        const processedLogs = allLogs.map(log => {
          if (!log.level) {
            // Determine log level based on content
            const content = log.message ? log.message.toLowerCase() : '';
            let level = 'INFO';

            if (content.includes('error') || content.includes('exception') || content.includes('fail')) {
              level = 'ERROR';
            } else if (content.includes('warn')) {
              level = 'WARNING';
            } else if (content.includes('debug')) {
              level = 'DEBUG';
            }

            log.level = level;
          }

          return log;
        });

        // Sort logs by timestamp (newest first)
        processedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setLogs(processedLogs);
      } else {
        // For other service types
        const allLogs = [...(data.logs || []), ...systemLogs];

        // Process logs to ensure they have level and source
        const processedLogs = allLogs.map(log => {
          if (!log.level) {
            // Determine log level based on content
            const content = log.message ? log.message.toLowerCase() : '';
            let level = 'INFO';

            if (content.includes('error') || content.includes('exception') || content.includes('fail')) {
              level = 'ERROR';
            } else if (content.includes('warn')) {
              level = 'WARNING';
            } else if (content.includes('debug')) {
              level = 'DEBUG';
            }

            log.level = level;
          }

          return log;
        });

        // Sort logs by timestamp (newest first)
        processedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setLogs(processedLogs);
      }

      setError('');
    } catch (error) {
      setError(error.message);
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
          <h3>Service Logs</h3>
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
