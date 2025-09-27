import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

interface UserMenuProps {
  onNavigate?: (path: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { username, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    // Use navigation callback if provided, otherwise fallback to window.location
    if (onNavigate) {
      onNavigate('/login');
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem',
          backgroundColor: 'transparent',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: '#495057'
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      >
        <span style={{ marginRight: '0.5rem' }}>👤</span>
        <span>{username}</span>
        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.25rem',
            backgroundColor: 'white',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #dee2e6' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#495057' }}>
              {username}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              Development Mode
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#495057',
              transition: 'background-color 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;