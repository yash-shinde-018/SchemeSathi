import { useState } from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import './RegisterPage.css';

/**
 * RegisterPage Component - Complete registration page layout
 * 
 * Features:
 * - Two-column layout (desktop) / single column (mobile)
 * - Glassmorphic form card
 * - Branding and trust messaging
 * - Responsive design
 * - Navigation handling
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onNavigate - Navigation callback to switch pages
 * @returns {JSX.Element} Rendered registration page
 */
export default function RegisterPage({ onNavigate }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (formData) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onNavigate('login');
    }, 1000);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Column - Branding (hidden on mobile) */}
        <div className="register-branding">
          <div className="branding-content">
            <div className="branding-icon">🚀</div>
            <h2 className="branding-title">Get Started Today</h2>
            <p className="branding-description">
              Find and apply for government schemes that match your needs
            </p>

            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span className="feature-title">Smart Matching</span>
                <span className="feature-text">AI-powered scheme recommendations</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-title">Quick Apply</span>
                <span className="feature-text">Complete applications in minutes</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span className="feature-title">Track Progress</span>
                <span className="feature-text">Real-time application status</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤝</span>
                <span className="feature-title">Expert Support</span>
                <span className="feature-text">Help when you need it</span>
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-number">500K+</div>
                <div className="stat-label">Users</div>
              </div>
              <div className="stat">
                <div className="stat-number">200+</div>
                <div className="stat-label">Schemes</div>
              </div>
              <div className="stat">
                <div className="stat-number">₹1000Cr</div>
                <div className="stat-label">Disbursed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Registration Form */}
        <div className="register-form-container">
          <div className="form-card">
            <RegisterForm
              onSubmit={handleFormSubmit}
              onNavigate={onNavigate}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
