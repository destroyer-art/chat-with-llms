import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';


export const LoginPage = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    console.log(tokenResponse)
    const idToken = tokenResponse.credential;
    try {
      const backendResponse = await fetch('http://localhost:5000/auth/google', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (backendResponse.ok) {
        console.log(backendResponse)
        const data = await backendResponse.json();
        const accessToken = data.access_token;
        // Store the access token in the browser's local storage
        localStorage.setItem('accessToken', accessToken);
        console.log('Google authentication successful');
        // Redirect to a protected route or homepage
        navigate('/chat');
        // Redirect or render the appropriate page/component
      } else {
        console.error('Google authentication failed');
      }
    } catch (error) {
      console.error('Error during Google authentication:', error);
    }
  };

  const handleGoogleFailure = (error) => {
    console.error('Google authentication error:', error);
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleFailure}
      />
    </GoogleOAuthProvider>
  );
};

