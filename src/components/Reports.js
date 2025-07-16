import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.platechase.com'
  : 'http://localhost:8787';

// State mapping for readable names (matching backend)
const STATE_NAMES = {
	'01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
	'08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
	'12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
	'18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
	'23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
	'28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
	'33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
	'37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
	'41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
	'46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
	'51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
};

function Reports() {
  const [adminStatus, setAdminStatus] = useState(null);
  const [gameData, setGameData] = useState([]);
  const [monthYear, setMonthYear] = useState('');
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
        throw new Error('Access denied. Please log in to view reports.');
      } else {
        throw new Error('Failed to load reports.');
      }
    })
    .then(data => {
      setAdminStatus(data.message);
      setGameData(data.gameData || []);
      setMonthYear(data.monthYear || '');
      setLoading(false);
    })
    .catch(error => {
      setError(error.message);
      setLoading(false);
    });
  }, [sessionId]);

  const getStateName = (stateId) => {
    return STATE_NAMES[stateId] || stateId;
  };

  const getProgressColor = (progress) => {
    const num = parseFloat(progress);
    if (num >= 80) return '#4CAF50'; // Green
    if (num >= 60) return '#FF9800'; // Orange
    if (num >= 40) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  if (loading) {
    return (
      <div className="privacy-policy">
        <h1>Admin Reports</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#4285f4' }}>Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="privacy-policy">
        <h1>Reports</h1>
        <section>
          <h2>Access Denied</h2>
          <p>{error}</p>
          <p>Please log in to view reports.</p>
        </section>
      </div>
    );
  }

  const totalUsers = gameData.length;
  const totalStates = gameData.reduce((sum, user) => sum + (user.gameData?.visitedStates?.length || 0), 0);
  const averageProgress = totalUsers > 0 
    ? (gameData.reduce((sum, user) => sum + parseFloat(user.gameData?.progress || 0), 0) / totalUsers).toFixed(2)
    : 0;

  return (
    <div className="privacy-policy">
      <h1>Reports</h1>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </p>

      <section>
        <h2>Access Status</h2>
        <p style={{ color: '#4285f4', fontWeight: 'bold', fontSize: '1.1rem' }}>✅ {adminStatus}</p>
        <p>{adminStatus === 'Authenticated as Admin' ? 'You have full administrative access to the system.' : 'You have user access to anonymized reports.'}</p>
      </section>

      <section>
        <h2>Monthly Overview - {monthYear}</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalUsers}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Active Users</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalStates}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total States Spotted</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{averageProgress}%</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Average Progress</div>
          </div>
        </div>
      </section>

      <section>
        <h2>User Progress Details</h2>
        <p>Total registered users: <strong>{totalUsers}</strong></p>
        
        {totalUsers > 0 ? (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '1.5rem'
            }}>
              {gameData.map((user) => {
                const visitedStates = user.gameData?.visitedStates || [];
                const progress = user.gameData?.progress || '0.00';
                const progressColor = getProgressColor(progress);
                
                return (
                  <div key={user.email} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                          {user.email}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#888' }}>
                          {visitedStates.length} states spotted
                        </div>
                      </div>
                      <div style={{
                        background: progressColor,
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {progress}%
                      </div>
                    </div>
                    
                    {visitedStates.length > 0 && (
                      <div>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#888', 
                          marginBottom: '0.5rem',
                          fontWeight: '500'
                        }}>
                          States Collected:
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {visitedStates.map((stateId) => (
                            <span key={stateId} style={{
                              background: 'rgba(66, 133, 244, 0.1)',
                              color: '#4285f4',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '15px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              border: '1px solid rgba(66, 133, 244, 0.2)'
                            }}>
                              {getStateName(stateId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem',
            color: '#666',
            fontSize: '1.1rem'
          }}>
            No users found in the current month's data.
          </div>
        )}
      </section>

      <section>
        <h2>System Information</h2>
        <p>This reports panel provides real-time access to user data and system analytics for {monthYear}.</p>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          padding: '1rem', 
          borderRadius: '8px',
          marginTop: '1rem',
          fontSize: '0.9rem',
          color: '#888'
        }}>
          <strong>Data Source:</strong> Cloudflare Durable Objects<br/>
          <strong>Update Frequency:</strong> Real-time<br/>
          <strong>Access Level:</strong> {adminStatus === 'Authenticated as Admin' ? 'Administrator (Full Access)' : 'User (Anonymized Data)'}
        </div>
      </section>
    </div>
  );
}

export default Reports; 