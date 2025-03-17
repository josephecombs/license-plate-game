import React from 'react';
import Map from './components/Map';
import OAuthButton from './components/OAuthButton';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Map />
        <OAuthButton />
      </header>
    </div>
  );
}

export default App;
