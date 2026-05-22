import React from 'react';

export default function NotFoundPage({ subdomain }) {
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
        {subdomain ? `${subdomain}.bargraph.city` : 'This city'} isn&apos;t mapped yet.
      </h1>
      <a
        href="https://bargraph.city/submit"
        style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '1rem', display: 'block' }}
      >
        Want to see it here? Submit this city →
      </a>
      <a
        href="https://bargraph.city"
        style={{ color: '#888', textDecoration: 'none' }}
      >
        ← Back to all cities
      </a>
    </div>
  );
}
