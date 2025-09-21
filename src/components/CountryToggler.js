import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  // { code: 'MX', name: 'Mexico', flag: '🇲🇽' }
];

const CountryToggler = ({ currentMapType }) => {
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
    <div className="country-toggler">
      <button 
        className="country-toggler-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select country"
      >
        <span className="country-flag">{currentCountry.flag}</span>
        <span className="country-name">{currentCountry.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="country-dropdown">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              className={`country-option ${country.code === currentMapType ? 'active' : ''}`}
              onClick={() => handleCountryChange(country.code)}
            >
              <span className="country-flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountryToggler;
