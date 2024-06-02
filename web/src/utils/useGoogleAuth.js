import { useNavigate } from 'react-router-dom';

export const useGoogleAuth = () => {
  const navigate = useNavigate();

  const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';

  const handleGoogleSuccess = async (tokenResponse) => {

    const idToken = tokenResponse.access_token;

    try {
      const backendResponse = await fetch(`${API_HOST}/auth/google`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        let accessToken = data.accessToken;
        let profilePicture = data.user.picture;
        let username = data.user.name;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('profilePicture', profilePicture);
        localStorage.setItem('username', username);
        navigate('/chat');
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

  return { handleGoogleSuccess, handleGoogleFailure };
};
