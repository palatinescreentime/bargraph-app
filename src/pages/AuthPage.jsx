// REMINDER: Add bargraph.city and bargraph-app.vercel.app to Firebase Console
// → Authentication → Settings → Authorized domains

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send sign-in link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: '#000', color: '#fff', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'sans-serif', padding: '2rem',
    }}>
      <style>{`
        .auth-input {
          background: #0f0f0f;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          padding: 14px 18px;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus { border-color: #4ab8e8; }
        .auth-btn {
          background: #4ab8e8;
          border: none;
          border-radius: 8px;
          color: #000;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 14px 18px;
          text-transform: uppercase;
          transition: opacity 0.2s;
          width: 100%;
        }
        .auth-btn:hover:not(:disabled) { opacity: 0.85; }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <a href="/" style={{ textDecoration: 'none', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'Impact, "Arial Black", "Arial Narrow", sans-serif',
          fontSize: 'clamp(1.8rem, 6vw, 3rem)',
          letterSpacing: '0.05em',
          color: '#fff',
        }}>
          THE BAR GRAPH
        </h1>
      </a>

      <div style={{
        background: '#0f0f0f',
        border: '1px solid #1e1e1e',
        borderRadius: '12px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
      }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Check your email</h2>
            <p style={{ color: '#888', lineHeight: 1.6 }}>
              We sent a sign-in link to <strong style={{ color: '#fff' }}>{email}</strong>.
              Click the link in the email to continue.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              style={{ background: 'none', border: 'none', color: '#4ab8e8', cursor: 'pointer', marginTop: '1.5rem', fontSize: '0.9rem' }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>Sign in</h2>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              We&apos;ll send you a magic link — no password needed.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              {error && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {error}
                </p>
              )}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ color: '#444', fontSize: '0.8rem', marginTop: '2rem', textAlign: 'center' }}>
        Sign in to submit venues or new cities.
      </p>
    </div>
  );
}
