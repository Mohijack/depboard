import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceList from './ServiceList';
import BookingList from './BookingList';

function Dashboard({ user }) {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Funktion zum Abrufen der Daten
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch available services
      const servicesResponse = await fetch('/api/services');
      const servicesData = await servicesResponse.json();

      if (!servicesResponse.ok) {
        throw new Error(servicesData.error || 'Failed to fetch services');
      }

      setServices(servicesData.services);

      // Fetch user bookings
      const bookingsResponse = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const bookingsData = await bookingsResponse.json();

      if (!bookingsResponse.ok) {
        throw new Error(bookingsData.error || 'Failed to fetch bookings');
      }

      setBookings(bookingsData.bookings);
      console.log('Bookings updated:', bookingsData.bookings);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialer Aufruf beim Laden der Komponente
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    fetchData();

    // Automatische Aktualisierung alle 10 Sekunden
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing dashboard...');
      fetchData();
    }, 10000);

    // Aufräumen beim Unmounten der Komponente
    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const handleBookService = async (serviceId, customName, customDomain, licenseInfo) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serviceId,
          customName,
          customDomain,
          licenseInfo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book service');
      }

      // Add the new booking to the list
      setBookings([...bookings, data.booking]);

      return { success: true, booking: data.booking };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleDeployService = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy service');
      }

      // Update booking status in the list
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'deploying' }
          : booking
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleSuspendService = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}/suspend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to suspend service');
      }

      // Update booking status in the list
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'suspended' }
          : booking
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleResumeService = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume service');
      }

      // Update booking status in the list
      setBookings(bookings.map(booking =>
        booking.id === bookingId
          ? { ...booking, status: 'active' }
          : booking
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleDeleteService = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete service');
      }

      // Remove booking from the list
      setBookings(bookings.filter(booking => booking.id !== bookingId));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Willkommen, {user.name}</h1>
          <p>Verwalten Sie Ihre FE2-Dienste</p>
        </div>
        <button className="refresh-button" onClick={fetchData} title="Dashboard aktualisieren">
          <span className="refresh-icon">&#x21bb;</span> Aktualisieren
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Ihre Dienste</h2>
          <BookingList
            bookings={bookings}
            onDeploy={handleDeployService}
            onSuspend={handleSuspendService}
            onResume={handleResumeService}
            onDelete={handleDeleteService}
          />
        </div>

        <div className="dashboard-section">
          <h2>Verfügbare Dienste</h2>
          <ServiceList
            services={services}
            onBook={handleBookService}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
