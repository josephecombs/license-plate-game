import React from 'react';
import OAuthButton from './OAuthButton';
import FacebookButton from './FacebookButton';
import './LoginPage.css';

function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome to Plate Chase</h1>
          <p>Sign in to track your license plate progress and sync across devices</p>
        </div>
        
        <div className="login-buttons">
          <div className="login-button-group">
            <OAuthButton isMobile={false} />
            <FacebookButton isMobile={false} />
          </div>
          
          <div className="login-divider">
            <span>or</span>
          </div>
          
          <div className="login-button-group mobile">
            <OAuthButton isMobile={true} />
            <FacebookButton isMobile={true} />
          </div>
        </div>
        
        <div className="login-footer">
          <p>By signing in, you agree to our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
