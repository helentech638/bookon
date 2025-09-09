import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Verify token with backend
      const isValid = await authService.verifyToken();
      if (isValid) {
        const userData = authService.getUser();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        // Token is invalid, clear auth data
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      authService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    logout,
    checkAuth
  };
};
