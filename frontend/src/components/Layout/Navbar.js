import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Call the onLogout callback
    onLogout();

    // Redirect to home
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span>BeyondFire Cloud</span>
        </Link>

        <div className="navbar-menu">
          <a href="/" className="navbar-item">Home</a>
          <a href="/#features" className="navbar-item">Vorteile</a>
          <a href="/#services" className="navbar-item">Dienste</a>

          {user ? (
            <>
              <Link to="/dashboard" className="navbar-item">Dashboard</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="navbar-item admin-button">
                  Admin Panel
                </Link>
              )}
              <button onClick={handleLogout} className="navbar-item logout-button">
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-item">Anmelden</Link>
              <Link to="/register" className="navbar-item register-button">
                Registrieren
              </Link>
            </>
          )}

          <DarkModeToggle />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
