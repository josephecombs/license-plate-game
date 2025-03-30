import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Map from './components/Map';
import OAuthButton from './components/OAuthButton';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import './App.css';
import Cookies from 'js-cookie';

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.platechase.com'
  : 'http://localhost:8787';

function App() {
  const [user, setUser] = useState(null);
  const sessionId = Cookies.get('session');
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      console.log('Session ID is null or undefined, skipping fetch.');
      return;
    }

    console.log('Fetching session validation for:', sessionId);

    fetch(`${API_BASE_URL}/validate-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: sessionId,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.valid) {
        setUser(data.user);
      } else {
        console.log('Session not valid:', data);
      }
    })
    .catch(error => console.error('Error validating session:', error));
  }, [sessionId]);

  useEffect(() => {
    if (user && sessionId) {
      fetch(`${API_BASE_URL}/game`, {
        method: 'GET',
        headers: {
          'Authorization': sessionId
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setGameState(data);
      })
      .catch(error => console.error('Error fetching game state:', error));
    }
  }, [user, sessionId]);

  return (
    <Router>
      <div className="App">
        <nav className="App-nav">
          <div className="nav-left">
            <Link to="/">Home</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
          {user && (
            <div className="nav-right">
              Welcome back, {user.name}
              <Link 
                to="/" 
                onClick={(e) => {
                  e.preventDefault();
                  if (process.env.NODE_ENV === 'production') {
                    Cookies.remove('session', { domain: 'www.platechase.com' });
                    Cookies.remove('session', { domain: '.platechase.com' });
                  } else {
                    Cookies.remove('session');
                  }
                  localStorage.clear();
                  setUser(null);
                  window.location.reload();
                }}
                style={{ marginLeft: '20px', color: '#666' }}
              >
                Logout
              </Link>
            </div>
          )}
        </nav>
        <Routes>
          <Route path="/" element={
            <header className="App-header">
              {!user && <OAuthButton />}
              <Map user={user} />
            </header>
          } />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

