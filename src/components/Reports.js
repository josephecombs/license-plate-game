import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.platechase.com'
  : 'http://localhost:8787';

function Reports() {
  const [adminStatus, setAdminStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sessionId = Cookies.get('session');

  useEffect(() => {
    if (!sessionId) {
      setError('No session found. Please log in.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/reports`, {
      method: 'GET',
      headers: {
        'Authorization': sessionId
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else if (response.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      } else {
        throw new Error('Failed to check admin status.');
      }
    })
    .then(data => {
      setAdminStatus(data.message);
      setUsers(data.users || []);
      setLoading(false);
    })
    .catch(error => {
      setError(error.message);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="privacy-policy">
        <h1>Admin Reports</h1>
        <p>Checking admin status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="privacy-policy">
        <h1>Admin Reports</h1>
        <section>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <p>This page is restricted to administrators only.</p>
        </section>
      </div>
    );
  }

  const userCount = users.length;

  return (
    <div className="privacy-policy">
      <h1>Admin Reports</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <section>
        <h2>Admin Status</h2>
        <p style={{ color: '#4285f4', fontWeight: 'bold' }}>✅ {adminStatus}</p>
        <p>You have full administrative access to the system.</p>
      </section>

      <section>
        <h2>User Registry</h2>
        <p>Total registered users: <strong>{userCount}</strong></p>
        
        {userCount > 0 ? (
          <div style={{ marginTop: '1rem' }}>
            <h3>All Users:</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem',
              marginTop: '1rem'
            }}>
              {users.map((user) => (
                <div key={user.email} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#888' }}>{user.email}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>No users found in the current month's data.</p>
        )}
      </section>

      <section>
        <h2>System Information</h2>
        <p>This admin panel provides real-time access to user data and system analytics.</p>
      </section>
    </div>
  );
}

export default Reports; 