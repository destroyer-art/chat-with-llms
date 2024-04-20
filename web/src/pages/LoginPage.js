import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LandingPageNavBar } from '../components/LandingPageNavBar';

export const LoginPage = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LandingPageNavBar />
      <div className="grid grid-cols-2 gap-4">

      </div>
    </GoogleOAuthProvider>
  );
};
