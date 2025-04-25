import React, { useState, useEffect } from 'react';
import './UserManagement.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userServices, setUserServices] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Check if token exists
      if (!token) {
        throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.');
      }

      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
          }
          throw new Error('Fehler beim Abrufen der Benutzer');
        }

        const data = await response.json();
        setUsers(data.users || []);
        setError('');
      } catch (fetchError) {
        // Handle network errors specifically
        if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Netzwerkfehler: Server nicht erreichbar. Bitte überprüfen Sie Ihre Verbindung.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      setError(error.message);

      // If users were previously loaded, keep them instead of showing an empty state
      if (users.length === 0) {
        // Set mock data for demonstration if needed
        // setUsers(mockUsers);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserServices = async (userId) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${userId}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user services');
      }

      const data = await response.json();
      setUserServices(data.services);
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    await fetchUserServices(user.id);
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserServices([]);
    setNewPassword('');
    setNewRole('');
    setActionSuccess('');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      setActionSuccess('Passwort erfolgreich zurückgesetzt');
      setNewPassword('');
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    try {
      setActionLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to change role');
      }

      // Update user in the list
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, role: newRole } : user
      ));

      // Update selected user
      setSelectedUser({ ...selectedUser, role: newRole });

      setActionSuccess('Rolle erfolgreich geändert');
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove user from the list
      setUsers(users.filter(user => user.id !== selectedUser.id));

      setActionSuccess('Benutzer erfolgreich gelöscht');

      // Close the details modal after a short delay
      setTimeout(() => {
        closeUserDetails();
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  if (loading && users.length === 0) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>Benutzerverwaltung</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="refresh-button" onClick={fetchUsers}>
            <span className="refresh-icon">&#x21bb;</span> Aktualisieren
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {actionSuccess && <div className="success-message">{actionSuccess}</div>}

      {selectedUser ? (
        <div className="user-details-modal">
          <div className="user-details-content">
            <div className="user-details-header">
              <h3>{selectedUser.name}</h3>
              <button className="close-button" onClick={closeUserDetails}>×</button>
            </div>

            <div className="user-details-body">
              <div className="detail-section">
                <h4>Benutzerinformationen</h4>
                <div className="detail-row">
                  <span className="detail-label">ID:</span>
                  <span className="detail-value">{selectedUser.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedUser.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">E-Mail:</span>
                  <span className="detail-value">{selectedUser.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Rolle:</span>
                  <span className="detail-value">
                    <span className={`role-badge role-${selectedUser.role}`}>
                      {selectedUser.role}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Registriert am:</span>
                  <span className="detail-value">
                    {new Date(selectedUser.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Passwort zurücksetzen</h4>
                <div className="password-reset-form">
                  <input
                    type="password"
                    placeholder="Neues Passwort"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="password-input"
                  />
                  <button
                    className="action-button reset-button"
                    onClick={handleResetPassword}
                    disabled={actionLoading || !newPassword}
                  >
                    {actionLoading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h4>Rolle ändern</h4>
                <div className="role-change-form">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="role-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    className="action-button role-button"
                    onClick={handleChangeRole}
                    disabled={actionLoading || newRole === selectedUser.role}
                  >
                    {actionLoading ? 'Wird geändert...' : 'Rolle ändern'}
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <h4>Services des Benutzers</h4>
                {userServices.length === 0 ? (
                  <div className="empty-services">
                    Dieser Benutzer hat keine Services gebucht.
                  </div>
                ) : (
                  <div className="user-services-list">
                    {userServices.map(service => (
                      <div key={service.id} className="user-service-item">
                        <div className="service-info">
                          <div className="service-name">{service.customName}</div>
                          <div className="service-type">{service.serviceId}</div>
                          <div className="service-domain">{service.domain}</div>
                        </div>
                        <div className="service-status">
                          <span className={`status-badge ${service.status}`}>
                            {service.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="detail-section danger-zone">
                <h4>Gefahrenzone</h4>
                <p className="danger-text">
                  Das Löschen eines Benutzers ist permanent und kann nicht rückgängig gemacht werden.
                  Alle Services des Benutzers werden ebenfalls gelöscht.
                </p>
                <button
                  className="action-button delete-button"
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Wird gelöscht...' : 'Benutzer löschen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="users-table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? 'Keine Benutzer gefunden' : 'Keine Benutzer vorhanden'}
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Rolle</th>
                  <th>Registriert am</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="action-button view-button"
                        onClick={() => handleViewUser(user)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default UserManagement;
