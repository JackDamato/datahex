import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

interface LoginPageProps {
  onLoginSuccess?: (redirectPath?: string) => void;
  onNavigateToSignup?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Get redirect path from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('next') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onLoginSuccess) {
        onLoginSuccess(redirectPath);
      } else {
        window.location.href = redirectPath;
      }
    }
  }, [isAuthenticated, redirectPath, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        if (onLoginSuccess) {
          onLoginSuccess(redirectPath);
        } else {
          window.location.href = redirectPath;
        }
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#495057',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            DataHex Login
          </h1>
          <p style={{ 
            color: '#6c757d', 
            fontSize: '0.875rem',
            margin: 0 
          }}>
            Development Authentication
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="username" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="password" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isLoading || !username || !password ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading || !username || !password ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease-in-out'
            }}
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
            </span>
            <button
              type="button"
              onClick={onNavigateToSignup || (() => window.location.href = '/signup')}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Create Account
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '0.875rem',
          color: '#6c757d'
        }}>
          <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: '500' }}>
            Development Credentials:
          </p>
          <p style={{ margin: 0 }}>
            Username: <code>demo</code><br />
            Password: <code>demo</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;