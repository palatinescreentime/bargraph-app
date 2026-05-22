import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Signing you in…');

  useEffect(() => {
    async function handleCallback() {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setError('Invalid or expired sign-in link. Please request a new one.');
        return;
      }

      let email = localStorage.getItem('bargraphSignInEmail');
      if (!email) {
        email = window.prompt('Please enter your email to confirm sign-in:');
      }
      if (!email) {
        setError('Email is required to complete sign-in.');
        return;
      }

      try {
        await signInWithEmailLink(auth, email, window.location.href);
        localStorage.removeItem('bargraphSignInEmail');

        const destination = sessionStorage.getItem('bargraphIntendedDestination') || '/';
        sessionStorage.removeItem('bargraphIntendedDestination');
        navigate(destination, { replace: true });
      } catch (err) {
        setError(err.message || 'Sign-in failed. The link may have expired.');
      }
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div style={{
        background: '#000', color: '#fff', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Sign-in failed</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem', maxWidth: 380 }}>{error}</p>
        <a href="/auth" style={{ color: '#4ab8e8', textDecoration: 'none' }}>
          ← Request a new sign-in link
        </a>
      </div>
    );
  }

  return (
    <div style={{
      background: '#000', color: '#fff', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #333', borderTop: '3px solid #fff',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        marginBottom: '1.5rem',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#888' }}>{status}</p>
    </div>
  );
}
