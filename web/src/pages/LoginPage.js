import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';


export const LoginPage = () => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    const idToken = tokenResponse.credential;
    try {
      const backendResponse = await fetch('http://localhost:5000/auth/google', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        let accessToken = data.accessToken;
        // Store the access token in the browser's local storage
        localStorage.setItem('accessToken', accessToken);
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
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="mb-4"> {/* Placeholder for any other login methods or information */} </div>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                render={renderProps => (
                  <button
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign in with Google
                  </button>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

