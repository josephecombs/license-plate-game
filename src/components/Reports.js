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
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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

  const openModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
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

  // Filter out banned users for statistics and main list
  const nonBannedUsers = gameData.filter(user => !user.bannedAt || typeof user.bannedAt !== 'number');
  const bannedUsers = gameData.filter(user => user.bannedAt && typeof user.bannedAt === 'number');
  
  const totalUsers = nonBannedUsers.length;
  const totalStates = nonBannedUsers.reduce((sum, user) => sum + (user.gameData?.visitedStates?.length || 0), 0);
  const averageProgress = totalUsers > 0 
    ? (nonBannedUsers.reduce((sum, user) => sum + parseFloat(user.gameData?.progress || 0), 0) / totalUsers).toFixed(2)
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
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>
          Statistics shown below exclude banned users
        </p>
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
            <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem' }}>
              {bannedUsers.length > 0 && `+${bannedUsers.length} banned`}
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalStates}</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>States by Active Users</div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            color: 'white',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{averageProgress}%</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Avg Progress (Active)</div>
          </div>
        </div>
      </section>

      <section>
        <h2>Active User Progress Details</h2>
        <p>Total active users: <strong>{totalUsers}</strong> | Banned users: <strong style={{ color: '#f44336' }}>{bannedUsers.length}</strong></p>
        
        {totalUsers > 0 ? (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
              gap: '1.5rem'
            }}>
              {nonBannedUsers.map((user) => {
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                            {user.email}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#888' }}>
                            {visitedStates.length} states spotted
                          </div>
                        </div>
                        {adminStatus === 'Authenticated as Admin' && (
                          <button
                            onClick={() => openModal(user)}
                            style={{
                              background: 'rgba(66, 133, 244, 0.1)',
                              color: '#4285f4',
                              border: '1px solid rgba(66, 133, 244, 0.3)',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(66, 133, 244, 0.2)';
                              e.target.style.borderColor = 'rgba(66, 133, 244, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(66, 133, 244, 0.1)';
                              e.target.style.borderColor = 'rgba(66, 133, 244, 0.3)';
                            }}
                          >
                            More Actions
                          </button>
                        )}
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

      {/* More Actions Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0, color: '#fff' }}>
                More Actions - {selectedUser?.email}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = '#888'}
              >
                ×
              </button>
            </div>
            
            <div style={{ color: '#ccc', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '1.5rem' }}>
                Administrative actions for user: <strong>{selectedUser?.email}</strong>
              </p>
              
              {/* Show current ban status */}
              {selectedUser?.bannedAt && (
                <div style={{
                  background: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#f44336', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    🚫 User is currently banned
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#888' }}>
                    Banned on: {new Date(selectedUser.bannedAt * 1000).toLocaleDateString()}
                  </div>
                </div>
              )}
              
              {/* Ban/Unban button */}
              {selectedUser?.bannedAt ? (
                <button
                  onClick={async () => {
                    const confirmUnban = window.confirm(
                      `Are you sure you want to unban ${selectedUser?.email}?\n\n` +
                      `This action will:\n` +
                      `• Remove the ban from the user\n` +
                      `• Allow them to access the system again\n` +
                      `• Preserve their existing game data\n\n`
                    );
                    
                    if (confirmUnban) {
                      try {
                        const response = await fetch(`${API_BASE_URL}/users/unban`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': sessionId
                          },
                          body: JSON.stringify({ email: selectedUser.email })
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          alert(`User ${selectedUser.email} has been unbanned successfully.`);
                          closeModal();
                          // Refresh the page to show updated data
                          window.location.reload();
                        } else {
                          const errorData = await response.json();
                          alert(`Failed to unban user: ${errorData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('Error unbanning user:', error);
                        alert(`Error unbanning user: ${error.message}`);
                      }
                    }
                  }}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#45a049';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#4CAF50';
                  }}
                >
                  ✅ Unban User
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const confirmBan = window.confirm(
                      `Are you sure you want to ban ${selectedUser?.email}?\n\n` +
                      `This action will:\n` +
                      `• Mark the user as banned\n` +
                      `• Prevent future access to the system\n`
                    );
                    
                    if (confirmBan) {
                      try {
                        const response = await fetch(`${API_BASE_URL}/users/ban`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': sessionId
                          },
                          body: JSON.stringify({ email: selectedUser.email })
                        });
                        
                        if (response.ok) {
                          const result = await response.json();
                          alert(`User ${selectedUser.email} has been banned successfully.`);
                          closeModal();
                          // Refresh the page to show updated data
                          window.location.reload();
                        } else {
                          const errorData = await response.json();
                          alert(`Failed to ban user: ${errorData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('Error banning user:', error);
                        alert(`Error banning user: ${error.message}`);
                      }
                    }
                  }}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#d32f2f';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f44336';
                  }}
                >
                  🚫 Ban User
                </button>
              )}
              
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#888', 
                marginTop: '1rem',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                This action will permanently remove the user and all associated data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banned Users Section */}
      {(() => {
        if (bannedUsers.length > 0 && adminStatus === 'Authenticated as Admin') {
          return (
            <section>
              <h2>Banned Users</h2>
              <p style={{ color: '#f44336', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                ⚠️ The following users have been banned from the system
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
                gap: '1.5rem'
              }}>
                {bannedUsers.map((user) => {
                  const visitedStates = user.gameData?.visitedStates || [];
                  const progress = user.gameData?.progress || '0.00';
                  const bannedDate = new Date(user.bannedAt * 1000).toLocaleDateString();
                  
                  return (
                    <div key={user.email} style={{
                      background: 'rgba(244, 67, 54, 0.1)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(244, 67, 54, 0.3)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      position: 'relative'
                    }}>
                      {/* Banned Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '1rem',
                        background: '#f44336',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '15px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        Banned
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem', 
                            marginBottom: '0.25rem',
                            color: '#f44336'
                          }}>
                            {user.email}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#888' }}>
                            Banned on: {bannedDate}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#888' }}>
                            {visitedStates.length} states spotted
                          </div>
                        </div>
                        <div style={{
                          background: '#f44336',
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
                                background: 'rgba(244, 67, 54, 0.1)',
                                color: '#f44336',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '15px',
                                fontSize: '0.8rem',
                                fontWeight: '500',
                                border: '1px solid rgba(244, 67, 54, 0.2)'
                              }}>
                                {getStateName(stateId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* More Actions Button for Banned Users */}
                      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => openModal(user)}
                          style={{
                            background: 'rgba(76, 175, 80, 0.1)',
                            color: '#4CAF50',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(76, 175, 80, 0.2)';
                            e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(76, 175, 80, 0.1)';
                            e.target.style.borderColor = 'rgba(76, 175, 80, 0.3)';
                          }}
                        >
                          More Actions
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      })()}
    </div>
  );
}

export default Reports; 