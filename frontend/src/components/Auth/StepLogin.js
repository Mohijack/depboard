import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function StepLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call the onLogin callback
      onLogin(data.user);

      // Redirect to booking step 2
      navigate('/booking?step=2');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Anmelden</h2>
        <p>Melden Sie sich an, um mit dem Buchungsprozess fortzufahren.</p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Anmeldung läuft...' : 'Anmelden & Fortfahren'}
          </button>
        </form>
        <p className="auth-link">
          Noch kein Konto?{' '}
          <span onClick={() => navigate('/register?redirect=booking')}>Registrieren</span>
        </p>
        <div className="auth-back-link">
          <span onClick={() => navigate('/booking')}>Zurück zum Buchungsprozess</span>
        </div>
        <div className="admin-info">
          <p>Admin-Zugang: <strong>admin@beyondfire.cloud</strong> / <strong>AdminPW!</strong></p>
        </div>
      </div>
    </div>
  );
}

export default StepLogin;
