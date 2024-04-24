import { useNavigate } from 'react-router-dom';

export const useGoogleAuth = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    console.log('Google authentication success:', tokenResponse)

    const idToken = tokenResponse.access_token;

    try {
      const backendResponse = await fetch('http://localhost:5000/auth/google', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        let accessToken = data.accessToken;
        let profilePicture = data.user.picture;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('profilePicture', profilePicture);
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
