import React, { useState, useEffect } from 'react';
import './ServiceLogs.css';

const ServiceLogs = ({ bookingId, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/bookings/${bookingId}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data.logs || []);
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [bookingId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, bookingId]);

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'direct':
        return '#4caf50'; // Green
      case 'portainer':
        return '#2196f3'; // Blue
      case 'docker-compose':
        return '#ff9800'; // Orange
      default:
        return '#9e9e9e'; // Grey
    }
  };

  return (
    <div className="service-logs-modal">
      <div className="service-logs-content">
        <div className="service-logs-header">
          <h2>Service Logs</h2>
          <div className="service-logs-actions">
            <button 
              className={`refresh-button ${autoRefresh ? 'active' : ''}`} 
              onClick={toggleAutoRefresh}
            >
              {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
            </button>
            <button className="refresh-button" onClick={fetchLogs}>
              Refresh
            </button>
            <button className="close-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        
        <div className="service-logs-body">
          {loading && <div className="loading">Loading logs...</div>}
          
          {error && <div className="error">Error: {error}</div>}
          
          {!loading && !error && logs.length === 0 && (
            <div className="no-logs">No logs available</div>
          )}
          
          {logs.length > 0 && (
            <div className="logs-container">
              <div className="logs-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: getSourceColor('direct') }}></span>
                  <span>Direct Deployment</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: getSourceColor('portainer') }}></span>
                  <span>Portainer</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: getSourceColor('docker-compose') }}></span>
                  <span>Docker Compose</span>
                </div>
              </div>
              
              <pre className="logs-output">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="log-line"
                    style={{ borderLeft: `4px solid ${getSourceColor(log.source)}` }}
                  >
                    <span className="log-source">[{log.source}]</span> {log.message}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceLogs;
