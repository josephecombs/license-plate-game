import React from 'react';
import GoogleButton from 'react-google-button';

function OAuthButton() {
  const isLocal = process.env.NODE_ENV === 'development';
  const oauthUrl = isLocal ? 'http://localhost:8787/sessions/new' : '/sessions/new';

  return (
    <div>
      <GoogleButton
        onClick={() => {
          window.location.href = oauthUrl;
        }}
      />
    </div>
  );
}

export default OAuthButton; 