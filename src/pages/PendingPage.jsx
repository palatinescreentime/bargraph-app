import React from 'react';

export default function PendingPage({ city }) {
  return (
    <div style={{
      background: '#000',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        {city?.name || 'This city'} is coming soon.
      </h1>
      {city?.foundedBy && (
        <p style={{ color: '#aaa', marginBottom: '1rem' }}>
          Pioneered by {city.foundedBy}
        </p>
      )}
      <a
        href="https://bargraph.city"
        style={{ color: '#888', textDecoration: 'none' }}
      >
        ← Back to all cities
      </a>
    </div>
  );
}
