import React from 'react';

const US_STATES = [
  { name: 'Alabama', id: '01' },
  { name: 'Alaska', id: '02' },
  { name: 'Arizona', id: '04' },
  { name: 'Arkansas', id: '05' },
  { name: 'California', id: '06' },
  { name: 'Colorado', id: '08' },
  { name: 'Connecticut', id: '09' },
  { name: 'Delaware', id: '10' },
  { name: 'District of Columbia', id: '11' },
  { name: 'Florida', id: '12' },
  { name: 'Georgia', id: '13' },
  { name: 'Hawaii', id: '15' },
  { name: 'Idaho', id: '16' },
  { name: 'Illinois', id: '17' },
  { name: 'Indiana', id: '18' },
  { name: 'Iowa', id: '19' },
  { name: 'Kansas', id: '20' },
  { name: 'Kentucky', id: '21' },
  { name: 'Louisiana', id: '22' },
  { name: 'Maine', id: '23' },
  { name: 'Maryland', id: '24' },
  { name: 'Massachusetts', id: '25' },
  { name: 'Michigan', id: '26' },
  { name: 'Minnesota', id: '27' },
  { name: 'Mississippi', id: '28' },
  { name: 'Missouri', id: '29' },
  { name: 'Montana', id: '30' },
  { name: 'Nebraska', id: '31' },
  { name: 'Nevada', id: '32' },
  { name: 'New Hampshire', id: '33' },
  { name: 'New Jersey', id: '34' },
  { name: 'New Mexico', id: '35' },
  { name: 'New York', id: '36' },
  { name: 'North Carolina', id: '37' },
  { name: 'North Dakota', id: '38' },
  { name: 'Ohio', id: '39' },
  { name: 'Oklahoma', id: '40' },
  { name: 'Oregon', id: '41' },
  { name: 'Pennsylvania', id: '42' },
  { name: 'Rhode Island', id: '44' },
  { name: 'South Carolina', id: '45' },
  { name: 'South Dakota', id: '46' },
  { name: 'Tennessee', id: '47' },
  { name: 'Texas', id: '48' },
  { name: 'Utah', id: '49' },
  { name: 'Vermont', id: '50' },
  { name: 'Virginia', id: '51' },
  { name: 'Washington', id: '53' },
  { name: 'West Virginia', id: '54' },
  { name: 'Wisconsin', id: '55' },
  { name: 'Wyoming', id: '56' }
];

// onStateClick handles login logic and toggling
const StateToggleList = ({ visitedStates, onStateClick }) => {
  return (
    <div className="state-toggle-list">
      <h2>State List</h2>
      <div className="state-grid">
        {US_STATES.map((state) => {
          const isVisited = visitedStates.includes(state.id);
          return (
            <button
              key={state.id}
              className={`state-toggle-button ${isVisited ? 'visited' : ''}`}
              onClick={() => onStateClick(state.id)}
            >
              {isVisited && (
                <svg 
                  className="checkmark-icon" 
                  viewBox="0 0 24 24" 
                  width="16" 
                  height="16"
                >
                  <path 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    d="M2 12L9 19L22 6"
                  />
                </svg>
              )}
              {state.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StateToggleList; 