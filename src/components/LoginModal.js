import React from 'react';
import OAuthButton from './OAuthButton';

function LoginModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-content">
          <h2 className="login-modal-title">🚨 SIGN IN REQUIRED 🚨</h2>
          <div className="login-modal-message">
            <p className="login-modal-text">
              <strong>YOU MUST SIGN IN WITH GOOGLE TO PLAY PLATECHASE</strong>
            </p>
            <p className="login-modal-subtext">
              No login, no game. It's that simple.
            </p>
          </div>
          <div className="login-modal-button-container">
            <OAuthButton isMobile={false} />
          </div>
          <button 
            className="login-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal; 