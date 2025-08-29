import React from 'react';
import './BannedUserModal.css';

const BannedUserModal = ({ isOpen, onClose, banData }) => {
  if (!isOpen) return null;

  const banDate = new Date(banData?.bannedAt * 1000).toLocaleDateString();
  
  return (
    <div className="banned-modal-overlay" onClick={onClose}>
      <div className="banned-modal" onClick={(e) => e.stopPropagation()}>
        <div className="banned-modal-header">
          <span className="banned-icon">🚫</span>
          <h2>ACCESS DENIED</h2>
          <span className="banned-icon">🚫</span>
        </div>
        
        <div className="banned-modal-content">
          <div className="banned-message">
            <p className="banned-title">Oh no! You've been BANNED! 😤</p>
            <p className="banned-subtitle">Your account has been suspended for violating our terms of service.</p>
          </div>
          
          <div className="banned-details">
            <div className="ban-info">
              <span className="ban-label">Banned on:</span>
              <span className="ban-value">{banDate}</span>
            </div>
            <div className="ban-info">
              <span className="ban-label">Reason:</span>
              <span className="ban-value">Disrespecting the website</span>
            </div>
          </div>
          
          <div className="banned-consequences">
            <p>🚫 You can no longer log states</p>
            <p>🚫 You can no longer modify your progress</p>
            <p>🚫 You can still view your current progress (if any)</p>
          </div>
          
          <div className="banned-footer">
            <p className="banned-note">
              <strong>Note:</strong> This ban is permanent. 
              If you believe this was a mistake, you can contact support, 
              but good luck with that! 😏
            </p>
          </div>
        </div>
        
        <button className="banned-modal-close" onClick={onClose}>
          Fine, I'll leave 😒
        </button>
      </div>
    </div>
  );
};

export default BannedUserModal;
