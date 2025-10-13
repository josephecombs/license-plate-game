import React from 'react';

function FacebookButton({ isMobile }) {
  const isLocal = process.env.NODE_ENV === 'development';
  const redirectUri = isLocal ? 'http://localhost:8787/sessions/new' : 'https://api.platechase.com/sessions/new';
  const clientId = '25193055553659682'; // Facebook App ID
  const oauthUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email,public_profile`;

  const handleClick = () => {
    window.location.href = oauthUrl;
  };

  if (isMobile) {
    return (
      <button 
        onClick={handleClick}
        className="facebook-button mobile"
        aria-label="Sign in with Facebook"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
        </svg>
        <span>Continue with Facebook</span>
      </button>
    );
  }

  return (
    <button 
      onClick={handleClick}
      className="facebook-button desktop"
      aria-label="Sign in with Facebook"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
      </svg>
      <span>Continue with Facebook</span>
    </button>
  );
}

export default FacebookButton;
