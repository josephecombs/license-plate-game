import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const Map = () => {
  const [visitedStates, setVisitedStates] = useState(() => {
    const saved = localStorage.getItem('visitedStates');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('visitedStates', JSON.stringify(visitedStates));
  }, [visitedStates]);

  const handleStateClick = (stateId) => {
    setVisitedStates((prev) =>
      prev.includes(stateId) ? prev.filter((id) => id !== stateId) : [...prev, stateId]
    );
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
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => handleStateClick(geo.id)}
                style={{
                  default: {
                    fill: visitedStates.includes(geo.id) ? "#FF5722" : "#ECEFF1",
                    outline: "none",
                  },
                  hover: {
                    fill: "#FF5722",
                    outline: "none",
                  },
                  pressed: {
                    fill: "#FF5722",
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};

export default Map; 