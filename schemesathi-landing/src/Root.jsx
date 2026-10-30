import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExploreSchemes from './pages/ExploreSchemes';
import SchemeDetailsPage from './pages/SchemeDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function Root() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Landing page (no header/footer wrapper for hero) */}
          <Route path="/" element={<App />} />

          {/* Auth pages */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />

          {/* Authenticated pages (with header/footer) */}
          <Route
            path="/dashboard"
            element={
              <>
                <Header />
                <main className="main-content">
                  <DashboardPage />
                </main>
                <Footer />
              </>
            }
          />

          <Route
            path="/schemes/explore"
            element={
              <>
                <Header />
                <main className="main-content">
                  <ExploreSchemes />
                </main>
                <Footer />
              </>
            }
          />

          <Route
            path="/schemes/:id"
            element={
              <>
                <Header />
                <main className="main-content">
                  <SchemeDetailsPage />
                </main>
                <Footer />
              </>
            }
          />

          <Route
            path="/profile"
            element={
              <>
                <Header />
                <main className="main-content">
                  <UserProfilePage />
                </main>
                <Footer />
              </>
            }
          />

          {/* Admin pages */}
          <Route
            path="/admin"
            element={
              <>
                <Header />
                <main className="main-content">
                  <AdminDashboardPage />
                </main>
                <Footer />
              </>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
