import React from 'react';

function OAuthButton() {
  const isLocal = process.env.NODE_ENV === 'development';
  const oauthUrl = isLocal ? 'http://localhost:8787/sessions/new' : '/sessions/new';

  return (
    <div>
      <a href={oauthUrl}>Login with Google</a>
    </div>
  );
}

export default OAuthButton; 