import React from 'react';

const NewMonthModal = ({ isOpen, onClose, onConfirm, previousMonth, currentMonth }) => {
  if (!isOpen) return null;

  // Extract just the month name from the month-year strings
  const getMonthName = (monthYearString) => {
    if (!monthYearString) return '';
    return monthYearString.split('-')[0];
  };

  const previousMonthName = getMonthName(previousMonth);
  const currentMonthName = getMonthName(currentMonth);

  return (
    <div className="modal-overlay">
      <div className="modal-content new-month-modal">
        <div className="modal-header">
          <div className="emoji-row">🌙⏰✨</div>
          <h2>The Calendar Turns!</h2>
          <div className="emoji-row">✨☀️🌙</div>
        </div>
        <div className="modal-body">
          <div className="whimsical-message">
            <p>Good job in <strong>{previousMonthName}</strong>!</p>
            <p>The calendar has turned, and we find ourselves in <strong>{currentMonthName}</strong>!</p>
            <p>✨ We will clear your map and start the journey of life anew ✨</p>
            <p>Every ending is a new beginning, and every month brings fresh adventures!</p>
          </div>
          <div className="modal-actions">
            <button 
              className="modal-button cancel-button" 
              onClick={onClose}
            >
              Not Yet
            </button>
            <button 
              className="modal-button confirm-button" 
              onClick={onConfirm}
            >
              Begin Anew! 🌟
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMonthModal;
