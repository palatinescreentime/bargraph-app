import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import CityPage from './pages/CityPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import SubmitPage from './pages/SubmitPage';
import AdminPage from './pages/AdminPage';

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

export default function App() {
  if (subdomain) {
    return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<CityPage subdomain={subdomain} />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
