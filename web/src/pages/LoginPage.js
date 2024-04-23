import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LandingPageNavBar } from '../components/LandingPageNavBar';
import { LandingPageIntro } from '../components/LandingPageIntro';
import { LandingPageDescription } from '../components/LandingPageDescription';
import { LandingPagePromotion } from '../components/LandingPagePromotion';
import { Footer } from '../components/Footer';


export const LoginPage = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LandingPageNavBar />
      <LandingPageIntro />
      <LandingPageDescription />
      <LandingPagePromotion />
      <Footer />
    </GoogleOAuthProvider>
  );
};
