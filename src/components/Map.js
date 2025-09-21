import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { API_BASE_URL, getCurrentMonthYear } from '../App';
import Cookies from 'js-cookie';
import StateToggleList from './StateToggleList';
import LoginModal from './LoginModal';
import NewMonthModal from './NewMonthModal';
import { CANADIAN_PROVINCES } from '../constants/states';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const canadaGeoUrl = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/canada.geojson";
const mexicoGeoUrl = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/mexico.geojson";
// const mexicoGeoUrl = "https://raw.githubusercontent.com/open-mexico/mexico-geojson/master/mexico.geojson";

const Map = ({ user, visitedStates, setVisitedStates, gameKey, mapType, onBannedUser }) => {
  const [lastClickedState, setLastClickedState] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [pendingStateChange, setPendingStateChange] = useState(null);


  useEffect(() => {
    localStorage.setItem('visitedStates', JSON.stringify(visitedStates));
  }, [visitedStates]);

  useEffect(() => {
    console.log('Map component received mapType:', mapType);
  }, [mapType]);

  const handleStateClick = async (stateId) => {
    // If user is not logged in, show the login modal instead
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Check for gameKey mismatch before making changes
    const currentMonthYear = getCurrentMonthYear();
    if ((gameKey && gameKey !== currentMonthYear)) {
      console.warn(`🚨 GAME KEY MISMATCH DETECTED!`, {
        storedGameKey: gameKey,
        currentMonthYear: currentMonthYear,
        action: 'state_click',
        stateId: stateId,
        timestamp: new Date().toISOString()
      });
      
      // Store the pending state change and show the modal
      setPendingStateChange(stateId);
      setShowNewMonthModal(true);
      return; // Don't proceed with the state change yet
    }

    setLastClickedState(stateId);
    const newVisitedStates = visitedStates.includes(stateId) 
      ? visitedStates.filter((id) => id !== stateId) 
      : [...visitedStates, stateId];
    
    setVisitedStates(newVisitedStates);
    
    // Send to server since user is logged in
    try {
      const response = await fetch(`${API_BASE_URL}/game`, {
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

      console.log({response})
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.error === 'Account banned') {
          // Revert the state change since the user is banned
          setVisitedStates(visitedStates);
          if (onBannedUser) {
            onBannedUser(errorData);
          }
          return;
        } else {
          console.error('Failed to save game state:', errorData);
          // Revert the state change on any error
          setVisitedStates(visitedStates);
        }
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
      // Revert the state change on network error
      setVisitedStates(visitedStates);
    }

    // Reset the animation trigger after animation completes
    setTimeout(() => setLastClickedState(null), 1000);
  };

  // Handler for both map and list clicks
  const handleStateClickWithLogin = async (stateId) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    await handleStateClick(stateId);
  };

  const calculateProgress = () => {
    return ((visitedStates.length / 50) * 100).toFixed(2);
  };

  // Handle new month modal actions
  const handleNewMonthConfirm = () => {
    // Clear game state and localStorage
    setVisitedStates([]);
    localStorage.removeItem('visitedStates');
    localStorage.removeItem('gameKey');
    
    // Close modal and clear pending state
    setShowNewMonthModal(false);
    setPendingStateChange(null);
    
    // If there was a pending state change, apply it now
    if (pendingStateChange) {
      const newVisitedStates = [pendingStateChange];
      setVisitedStates(newVisitedStates);
      localStorage.setItem('visitedStates', JSON.stringify(newVisitedStates));
      
      // Send to server
      sendStateToServer(newVisitedStates);
    }
  };

  const handleNewMonthCancel = () => {
    // Just close the modal without clearing anything
    setShowNewMonthModal(false);
    setPendingStateChange(null);
  };

  // Helper function to send state to server
  const sendStateToServer = async (newVisitedStates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/game`, {
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

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403 && errorData.error === 'Account banned') {
          if (onBannedUser) {
            onBannedUser(errorData);
          }
          return;
        } else {
          console.error('Failed to save game state:', errorData);
        }
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  };

  // Render different content based on mapType
  if (mapType === 'US' || mapType === 'CAN' || mapType === 'MX') {

    let realUrl = geoUrl;
    let projection = "geoAlbersUsa";
    let className = "us-map";

     if (mapType === 'CAN') { 
       realUrl = canadaGeoUrl;
       projection = "geoConicEqualArea";
       className = "canada-map";
     }

    if (mapType === 'MX') { 
      realUrl = mexicoGeoUrl;
      projection = "geoConicEqualArea";
      className = "mexico-map";
    }

    let pconfig;
    if (mapType === 'CAN') {
      pconfig = {
        rotate: [96, 0, 0],     // central meridian ~96°W; north stays "up"
        scale: 800,             // tune to taste
        center: [-0, 64],     // shift center north to show more territories
        parallels: [49, 80],   // extend north to show more territories
        clipExtent: [[0, 0], [100, 500]]  // crop bottom empty space
      }  
    } else if (mapType === 'MX') {
      pconfig = {
        rotate: [102, 0, 0],     // central meridian ~102°W; north stays "up"
        scale: 1500,             // tune to taste
        center: [0, 24],        // shift center to better fit Mexico
        parallels: [17, 32]      // adjust to fit Mexico's latitude range
      }
    }
    
    return (
      <div className="map-container">
        <div className="header-content">
          <div className="progress">Progress: {calculateProgress()}%</div>
          <div className="game-description">
            Welcome to Plate Chase! Click on states as you spot their license plates on the road. Your progress is automatically saved, and you can sync across devices by signing in.
          </div>
        </div>
        <ComposableMap 
          projection={projection} 
          className={className}
          projectionConfig={pconfig}
        >
          <Geographies geography={realUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // console.log(geo.id);

                let tempId = geo.id;
                console.log({geo});

                if (!tempId && geo.properties && geo.properties.name) {
                  // Look up Canadian province ID from name
                  // if (mapType === 'CAN') {
                  tempId = CANADIAN_PROVINCES[geo.properties.name];
                  // }
                }

                if (!tempId && geo.properties && geo.properties.name) {
                  // Look up Mexican province ID from name
                  // tempId = MEXICAN_STATES[geo.properties.name];
                }


                const isVisited = visitedStates.includes(tempId);
                const isAnimating = lastClickedState === tempId;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleStateClick(tempId)}
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
          onStateClick={handleStateClickWithLogin}
          gameKey={gameKey}
          mapType={mapType}
        />
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
        <NewMonthModal 
          isOpen={showNewMonthModal}
          onClose={handleNewMonthCancel}
          onConfirm={handleNewMonthConfirm}
          previousMonth={gameKey}
          currentMonth={getCurrentMonthYear()}
        />
      </div>
    );
  }

  // For non-US maps, show the map parameter value
  return (
    <div className="map-container">
      <div className="header-content">
        <div className="progress">Progress: {calculateProgress()}%</div>
        <div className="game-description">
          Welcome to Plate Chase! Click on states as you spot their license plates on the road. Your progress is automatically saved, and you can sync across devices by signing in.
        </div>
        <div className="map-type-display">
          <h2>Map Type: {mapType}</h2>
          <p>This map type is not yet implemented. Current map parameter: {mapType}</p>
        </div>
      </div>
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      <NewMonthModal 
        isOpen={showNewMonthModal}
        onClose={handleNewMonthCancel}
        onConfirm={handleNewMonthConfirm}
        previousMonth={gameKey}
        currentMonth={getCurrentMonthYear()}
      />
    </div>
  );
};

export default Map; 