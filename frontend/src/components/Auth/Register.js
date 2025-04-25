import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isBookingRedirect = new URLSearchParams(location.search).get('redirect') === 'booking';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful, redirect to appropriate login page
      if (isBookingRedirect) {
        navigate('/login-step', { state: { message: 'Registrierung erfolgreich! Bitte melden Sie sich an, um mit dem Buchungsprozess fortzufahren.' } });
      } else {
        navigate('/login', { state: { message: 'Registrierung erfolgreich! Bitte melden Sie sich an.' } });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Registrieren</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label htmlFor="company">Feuerwehr/Organisation (Optional)</label>
            <input
              type="text"
              id="company"
              value={formData.company}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrierung läuft...' : 'Registrieren'}
          </button>
        </form>
        <p className="auth-link">
          Bereits ein Konto?{' '}
          <span onClick={() => navigate(isBookingRedirect ? '/login-step' : '/login')}>Anmelden</span>
        </p>
        {isBookingRedirect && (
          <div className="auth-back-link">
            <span onClick={() => navigate('/booking')}>Zurück zum Buchungsprozess</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
