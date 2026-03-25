import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, loginWithRole } from '../services/auth';
import {
  Container,
  Header,
  FormField,
  Input,
  Button,
  SpaceBetween,
  Alert,
} from '@cloudscape-design/components';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get role and target path from state (if coming from role selection)
  const state = location.state as { targetRole?: 'technician' | 'manager' | 'expert'; targetPath?: string } | undefined;
  const targetRole = state?.targetRole;
  const targetPath = state?.targetPath;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (targetRole) {
        // Login with specific role
        await loginWithRole(username, password, targetRole);
        // Navigate to target path
        navigate(targetPath || '/role-selection');
      } else {
        // Default login (technician)
        await login(username, password);
        navigate('/role-selection');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Container
        header={<Header variant="h1">Experience Compressor</Header>}
      >
        <form onSubmit={handleSubmit}>
          <SpaceBetween size="l">
            {error && (
              <Alert type="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <FormField label="Username">
              <Input
                value={username}
                onChange={({ detail }) => setUsername(detail.value)}
                placeholder="Enter your username"
                autoComplete="username"
              />
            </FormField>

            <FormField label="Password">
              <Input
                value={password}
                onChange={({ detail }) => setPassword(detail.value)}
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </FormField>

            <Button
              variant="primary"
              loading={loading}
              fullWidth
              formAction="submit"
            >
              Login
            </Button>
          </SpaceBetween>
        </form>
      </Container>
    </div>
  );
}
