import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser, refreshSession } from '../services/auth';
import { Box } from '@cloudscape-design/components';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const check = async () => {
      const user = getCurrentUser();
      if (!user) { setChecking(false); return; }
      // Try to refresh the session (handles expired idToken)
      const token = await refreshSession();
      setAuthenticated(!!token);
      setChecking(false);
    };
    check();
  }, []);

  if (checking) return <Box padding="l">Loading...</Box>;
  if (!authenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
