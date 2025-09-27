import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';

interface SignupPageProps {
  onSignupSuccess?: (redirectPath?: string) => void;
  onNavigateToLogin?: () => void;
}

interface UserData {
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

export const SignupPage: React.FC<SignupPageProps> = ({ 
  onSignupSuccess, 
  onNavigateToLogin 
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Get redirect path from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('next') || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (onSignupSuccess) {
        onSignupSuccess(redirectPath);
      } else {
        window.location.href = redirectPath;
      }
    }
  }, [isAuthenticated, redirectPath, onSignupSuccess]);

  const getStoredUsers = (): UserData[] => {
    try {
      const users = localStorage.getItem('registeredUsers');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  };

  const saveUser = (userData: UserData) => {
    const users = getStoredUsers();
    users.push(userData);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  };

  const userExists = (username: string, email: string): boolean => {
    const users = getStoredUsers();
    return users.some(user => 
      user.username.toLowerCase() === username.toLowerCase() || 
      user.email.toLowerCase() === email.toLowerCase()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validation
      if (!username || !email || !password || !confirmPassword) {
        setError('All fields are required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (userExists(username, email)) {
        setError('Username or email already exists');
        return;
      }

      // Save user data to localStorage
      const userData: UserData = {
        username,
        email,
        password, // In real app, this would be hashed!
        createdAt: new Date().toISOString()
      };

      saveUser(userData);

      // Automatically log the user in after successful signup
      const loginResult = await login(username, password);
      
      if (loginResult.success) {
        if (onSignupSuccess) {
          onSignupSuccess(redirectPath);
        } else {
          window.location.href = redirectPath;
        }
      } else {
        setError('Account created but login failed. Please try logging in.');
      }
    } catch (err) {
      setError('An unexpected error occurred during signup');
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
            Create Account
          </h1>
          <p style={{ 
            color: '#6c757d', 
            fontSize: '0.875rem',
            margin: 0 
          }}>
            Join DataHex (Development Mode)
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

          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="email" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label 
              htmlFor="confirmPassword" 
              style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '500',
                color: '#495057'
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !email || !password || !confirmPassword}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: isLoading || !username || !email || !password || !confirmPassword ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: isLoading || !username || !email || !password || !confirmPassword ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease-in-out',
              marginBottom: '1rem'
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
              Already have an account?{' '}
            </span>
            <button
              type="button"
              onClick={onNavigateToLogin || (() => window.location.href = '/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sign In
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
            Development Mode Notice:
          </p>
          <p style={{ margin: 0 }}>
            User data is stored in browser localStorage only. This is not secure and should not be used in production.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;