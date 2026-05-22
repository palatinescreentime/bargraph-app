import React from 'react';
import { useCity } from '../hooks/useCity';
import BarGraph from '../components/BarGraph';
import NotFoundPage from './NotFoundPage';
import PendingPage from './PendingPage';

export default function CityPage({ subdomain }) {
  const { loading, notFound, pending, city, venues, categories, error } = useCity(subdomain);

  if (loading) {
    return (
      <div style={{
        background: '#000',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #333',
          borderTop: '3px solid #fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || error) return <NotFoundPage subdomain={subdomain} />;
  if (pending) return <PendingPage city={city} />;

  return <BarGraph city={city} bars={venues} categories={categories} />;
}
