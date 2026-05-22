import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'jrgerberich@gmail.com';

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid #333',
  borderTop: '3px solid #fff',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={spinnerStyle} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentUser) {
    sessionStorage.setItem('bargraphIntendedDestination', location.pathname + location.search);
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && currentUser.email !== ADMIN_EMAIL) {
    return (
      <div style={{
        background: '#000', color: '#fff', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'sans-serif',
      }}>
        <h1 style={{ fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '3rem', marginBottom: '1rem' }}>
          ACCESS DENIED
        </h1>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>
          You don&apos;t have permission to view this page.
        </p>
        <a href="/" style={{ color: '#4ab8e8', textDecoration: 'none' }}>← Back to home</a>
      </div>
    );
  }

  return children;
}
