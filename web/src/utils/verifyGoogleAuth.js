export const verifyGoogleAuth = async () => {
    try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('No access token found');
            return false;
        }
        const response = await fetch('http://localhost:5000/verify', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
            console.info('Google authentication successful');
            return true;
        } else {
            console.error('Google authentication failed');
            return false;
        }
    }
    catch (error) {
        console.error('Error during Google authentication:', error);
        return false;
    }
};
