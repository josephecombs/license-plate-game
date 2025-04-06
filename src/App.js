import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Map from './components/Map';
import OAuthButton from './components/OAuthButton';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import './App.css';
import Cookies from 'js-cookie';

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.platechase.com'
  : 'http://localhost:8787';

function AppContent() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const sessionId = Cookies.get('session');
  const [gameState, setGameState] = useState(null);
  const [visitedStates, setVisitedStates] = useState(() => {
    const saved = localStorage.getItem('visitedStates');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);
  const progressPercentage = ((visitedStates.length / 50) * 100).toFixed(2);

  useEffect(() => {
    function handleResize() {
      setIsMobileView(window.innerWidth <= 768);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Handle redirect from 404 page
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get('redirect');
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [location, navigate]);

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
        const serverVisitedStates = data.visitedStates ?? [];
        setVisitedStates(serverVisitedStates);
        localStorage.setItem('visitedStates', JSON.stringify(serverVisitedStates));
      })
      .catch(error => console.error('Error fetching game state:', error));
    }
  }, [user, sessionId]);

  return (
    <div className="App">
      <nav className="App-nav">
        <div className="nav-left" ref={menuRef}>
          <button 
            className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/privacy-policy" onClick={() => setIsMenuOpen(false)}>Privacy Policy</Link>
            <Link to="/terms-of-service" onClick={() => setIsMenuOpen(false)}>Terms of Service</Link>
          </div>
        </div>
        <div className="nav-center">
          <Link to="/" className="logo-link">
            <h1 className="logo-text">Plate Chase</h1>
          </Link>
        </div>
        {user ? (
          <div className="nav-right">
            <span className="welcome-text">Welcome back, {user.name}</span>
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
              className="logout-link"
            >
              Logout
            </Link>
          </div>
        ) : (
          <div className="nav-right">
            <OAuthButton isMobile={isMobileView} />
          </div>
        )}
      </nav>
      <Routes>
        <Route path="/" element={
          <header className="App-header">
            <div className="mobile-game-info">
              <div className="progress-section">
                <div className="progress-header">
                  <h2>Progress: {progressPercentage}%</h2>
                  <button 
                    className="info-button"
                    onClick={() => setShowTooltip(!showTooltip)}
                    aria-label="Show game information"
                  >
                    ⓘ
                  </button>
                </div>
                <div className="mobile-progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progressPercentage}%` }}
                    aria-valuenow={progressPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
                {showTooltip && (
                  <div className="info-tooltip">
                    Welcome to Plate Chase! Click on states as you spot their license plates on the road. 
                    Your progress is automatically saved, and you can sync across devices by signing in.
                  </div>
                )}
              </div>
            </div>
            <Map user={user} visitedStates={visitedStates} setVisitedStates={setVisitedStates} />
          </header>
        } />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

