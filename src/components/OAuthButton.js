import React from 'react';
import GoogleButton from 'react-google-button';

function OAuthButton() {
  const isLocal = process.env.NODE_ENV === 'development';
  const clientId = process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID;
  // const clientSecret = process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = isLocal ? 'http://localhost:8787/sessions/new' : '/sessions/new';
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&access_type=offline`;

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