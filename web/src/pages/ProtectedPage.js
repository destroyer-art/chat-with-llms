import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ProtectedPage = ({ children }) => {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem('accessToken');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_HOST}/verify`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          console.info('Google authentication successful');
          setIsAuthenticated(true);
          // check current route
          if (window.location.pathname === '/') {
            navigate('/chat');
          }
        } else {
          console.error('Google authentication failed');
          navigate('/');
        }
      } catch (error) {
        console.error('Error during Google authentication:', error);
        navigate('/');
      }
    };

    if (accessToken) {
      verifyToken();
    } else {
      navigate('/');
    }
  }, [accessToken, navigate]);

  return isAuthenticated ? <>{children}</> : null;
};