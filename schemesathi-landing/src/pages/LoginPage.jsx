import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import './LoginPage.css';

/**
 * LoginPage Component - Complete login page layout
 */
export default function LoginPage({ onNavigate }) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFormSubmit = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const role = (u?.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'SUPERADMIN') {
          navigate('/admin');
          return;
        }
      }
    } catch (e) {}
    navigate('/dashboard');
  };

  const handleNavigation = (page) => {
    if (onNavigate) {
      onNavigate(page);
    } else if (page === 'dashboard') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          const role = (u?.role || '').toUpperCase();
          if (role === 'ADMIN' || role === 'SUPERADMIN') {
            navigate('/admin');
            return;
          }
        }
      } catch (e) {}
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Column - Branding (hidden on mobile) */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="branding-icon">🏛️</div>
            <h2 className="branding-title">Welcome to SchemeSathi</h2>
            <p className="branding-description">
              Discover government schemes tailored to your needs
            </p>

            <div className="benefits-list">
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span className="benefit-text">Find schemes easily</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span className="benefit-text">Get instant eligibility check</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span className="benefit-text">Apply online in minutes</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✓</span>
                <span className="benefit-text">Track your applications</span>
              </div>
            </div>

            <div className="trust-badges">
              <div className="badge">
                <span className="badge-icon">🔒</span>
                <span className="badge-text">Secure</span>
              </div>
              <div className="badge">
                <span className="badge-icon">✓</span>
                <span className="badge-text">Verified</span>
              </div>
              <div className="badge">
                <span className="badge-icon">🌍</span>
                <span className="badge-text">Official</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="login-form-container">
          <div className="form-card">
            <LoginForm
              onSubmit={handleFormSubmit}
              onNavigate={handleNavigation}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
