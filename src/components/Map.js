import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const Map = () => {
  const [visitedStates, setVisitedStates] = useState(() => {
    const saved = localStorage.getItem('visitedStates');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastClickedState, setLastClickedState] = useState(null);

  useEffect(() => {
    localStorage.setItem('visitedStates', JSON.stringify(visitedStates));
  }, [visitedStates]);

  const handleStateClick = (stateId) => {
    setLastClickedState(stateId);
    setVisitedStates((prev) =>
      prev.includes(stateId) ? prev.filter((id) => id !== stateId) : [...prev, stateId]
    );
    // Reset the animation trigger after animation completes
    setTimeout(() => setLastClickedState(null), 1000);
  };

  const calculateProgress = () => {
    return ((visitedStates.length / 50) * 100).toFixed(2);
  };

  return (
    <div>
      <h2>License Plate Game</h2>
      <p>Progress: {calculateProgress()}%</p>
      <ComposableMap projection="geoAlbersUsa">
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