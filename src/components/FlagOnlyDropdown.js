import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' }
];

const FlagOnlyDropdown = ({ currentMapType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentCountry = COUNTRIES.find(country => country.code === currentMapType) || COUNTRIES[0];

  const handleCountryChange = (countryCode) => {
    const params = new URLSearchParams(location.search);
    params.set('map', countryCode);
    navigate(`/?${params.toString()}`, { replace: true });
    setIsOpen(false);
  };

  return (
    <div className="flag-only-dropdown">
      <button 
        className="flag-only-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Select country, currently ${currentCountry.name}`}
        title={currentCountry.name}
      >
        <span className="flag-emoji">{currentCountry.flag}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="flag-dropdown">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              className={`flag-option ${country.code === currentMapType ? 'active' : ''}`}
              onClick={() => handleCountryChange(country.code)}
              title={country.name}
            >
              <span className="flag-emoji">{country.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlagOnlyDropdown;
