import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { API_BASE_URL } from '../App';
import Cookies from 'js-cookie';
import StateToggleList from './StateToggleList';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const Map = ({ user, visitedStates, setVisitedStates }) => {
  const [lastClickedState, setLastClickedState] = useState(null);

  useEffect(() => {
    localStorage.setItem('visitedStates', JSON.stringify(visitedStates));
  }, [visitedStates]);

  const handleStateClick = async (stateId) => {
    setLastClickedState(stateId);
    const newVisitedStates = visitedStates.includes(stateId) 
      ? visitedStates.filter((id) => id !== stateId) 
      : [...visitedStates, stateId];
    
    setVisitedStates(newVisitedStates);
    
    // Only send to server if user is logged in
    if (user) {
      try {
        await fetch(`${API_BASE_URL}/game`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': Cookies.get('session')
          },
          body: JSON.stringify({
            visitedStates: newVisitedStates,
            progress: ((newVisitedStates.length / 50) * 100).toFixed(2)
          })
        });
      } catch (error) {
        console.error('Failed to save game state:', error);
      }
    }

    // Reset the animation trigger after animation completes
    setTimeout(() => setLastClickedState(null), 1000);
  };

  const calculateProgress = () => {
    return ((visitedStates.length / 50) * 100).toFixed(2);
  };

  return (
    <div className="map-container">
      <div className="header-content">
        <div className="progress">Progress: {calculateProgress()}%</div>
        <div className="game-description">
          Welcome to Plate Chase! Click on states as you spot their license plates on the road. Your progress is automatically saved, and you can sync across devices by signing in.
        </div>
      </div>
      <ComposableMap projection="geoAlbersUsa" className="us-map">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isVisited = visitedStates.includes(geo.id);
              const isAnimating = lastClickedState === geo.id;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => handleStateClick(geo.id)}
                  tabIndex={-1}
                  style={{
                    default: {
                      fill: isVisited ? "#FF5722" : "#ECEFF1",
                      stroke: "#FFF",
                      strokeWidth: 0.5,
                      transition: "all 0.3s ease",
                      animation: isAnimating ? "pulse 1s ease-in-out" : "none",
                      outline: "none",
                    },
                    hover: {
                      fill: "#2196F3",
                      stroke: "#FFF",
                      strokeWidth: 0.5,
                      cursor: "pointer",
                      outline: "none",
                    },
                    pressed: {
                      fill: isVisited ? "#FF5722" : "#ECEFF1",
                      stroke: "#FFF",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    active: {
                      fill: isVisited ? "#FF5722" : "#ECEFF1",
                      stroke: "#FFF",
                      strokeWidth: 0.5,
                      outline: "none",
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <StateToggleList 
        visitedStates={visitedStates} 
        onStateToggle={handleStateClick} 
      />
    </div>
  );
};

export default Map; 