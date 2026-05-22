import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CityPage from './pages/CityPage';

function getSubdomain() {
  const hostname = window.location.hostname;
  if (
    hostname === 'bargraph.city' ||
    hostname === 'www.bargraph.city' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return null;
  }
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
}

const subdomain = getSubdomain();

function ComingSoon() {
  return (
    <div style={{
      background: '#000',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
    }}>
      <p>Coming soon.</p>
    </div>
  );
}

export default function App() {
  if (subdomain) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<CityPage subdomain={subdomain} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/submit" element={<ComingSoon />} />
        <Route path="/admin" element={<ComingSoon />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
