import React, { useEffect, useState } from 'react';
import Map from './components/Map';
import OAuthButton from './components/OAuthButton';
import './App.css';
import Cookies from 'js-cookie';

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

    fetch('http://localhost:8787/validate-session', {
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
  }, [sessionId]); // Depend explicitly on sessionId to run when it changes

  useEffect(() => {
    if (user && sessionId) {
      fetch('http://localhost:8787/game', {
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
    <div className="App">
      <header className="App-header">
        <Map />
        {user ? <p>Welcome back, {user.name}</p> : <OAuthButton />}
      </header>
    </div>
  );
}

export default App;

