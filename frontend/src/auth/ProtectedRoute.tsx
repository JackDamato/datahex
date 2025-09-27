import React, { ReactNode, useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: ReactNode;
  onRedirect?: (loginUrl: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  onRedirect 
}) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      // Prevent infinite redirect loops - don't redirect if already on login page
      if (window.location.pathname === '/login') {
        return;
      }
      
      // For now, we'll use a simple redirect mechanism
      // When react-router-dom is available, this will be replaced with navigate()
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `/login?next=${encodeURIComponent(currentPath)}`;
      
      if (onRedirect) {
        onRedirect(loginUrl);
      } else {
        // Fallback: redirect using window.location
        window.location.href = loginUrl;
      }
    }
  }, [isAuthenticated, onRedirect]);

  if (!isAuthenticated) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default ProtectedRoute;