import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { API_BASE_URL } from '../App';
import Cookies from 'js-cookie';

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
        <h2>Plate Chase</h2>
        <p className="progress">Progress: {calculateProgress()}%</p>
      </div>
      <div className="game-description">
        <p>Welcome to Plate Chase! Click on states as you spot their license plates on the road. Your progress is automatically saved, and you can sync across devices by signing in.</p>
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
                      fill: isVisited ? "#FF5722" : "#ECEFF1",
                      stroke: isAnimating ? "#FFF" : "#2196F3",
                      strokeWidth: isAnimating ? 0.5 : 2,
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
      <style>
        {`
          .map-container {
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header-content {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }

          .game-description {
            text-align: center;
            margin-bottom: 15px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.8em;
            
            @media (min-width: 768px) {
              font-size: 0.5em;
            }
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .header-content h2 {
            margin: 0;
          }

          .progress {
            margin: 0;
            font-size: 1.2em;
          }

          .us-map {
            width: 100%;
            height: auto;
            max-height: 70vh;
          }
          
          @media (min-width: 768px) {
            .map-container {
              width: 70%;
            }
          }
          
          @keyframes pulse {
            0% {
              fill: #FF5722;
            }
            25% {
              fill: #2196F3;
            }
            75% {
              fill: #2196F3;
            }
            100% {
              fill: #FF5722;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Map; 