import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import FormInput from './FormInput';
import FormCheckbox from './FormCheckbox';
import Button from '../common/Button';
import './RegisterForm.css';

/**
 * RegisterForm Component - User registration form with validation
 */
export default function RegisterForm({ onNavigate, onSubmit }) {
  console.log('[RegisterForm] Component loaded/rendered', { hasOnSubmit: !!onSubmit, hasOnNavigate: !!onNavigate });
  const navigate = useNavigate();
  const { register, isLoading, error: contextError } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkSettings = () => {
      apiClient('/auth/system-settings')
        .then(data => {
          if (isMounted && data?.success && data?.settings) {
            setAllowRegistration(data.settings.allow_citizen_registration !== false);
          }
        })
        .catch(() => {});
    };
    checkSettings();
    const interval = setInterval(checkSettings, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getPasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 8) return 'weak';
    if (password.length < 12) return 'medium';
    return 'strong';
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Enter a valid 10-digit phone number';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms & Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    if (apiError) {
      setApiError('');
    }
  };

  const handleFormSubmit = async (e) => {
    console.log("[RegisterForm] Button clicked! Form is submitting...");
    e.preventDefault();
    console.log('[RegisterForm] Form submitted');

    if (!validateForm()) {
      console.log('[RegisterForm] Form validation failed');
      return;
    }

    setApiError('');

    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    console.log('[RegisterForm] Calling register with:', {
      email: formData.email,
      firstName,
      lastName,
      phone: formData.phone,
    });

    try {
      const result = await register(
        formData.email,
        formData.password,
        firstName,
        lastName,
        formData.phone
      );

      console.log('[RegisterForm] Register result:', result);

      if (result && result.success) {
        console.log('[RegisterForm] Registration successful');
        // Ensure new account starts with default English language
        try {
          localStorage.setItem('schemesathi-language', 'en');
        } catch (e) {}
        setSuccessMessage('Account created successfully! Redirecting to dashboard...');
        
        // Ensure onboarding modal will appear automatically on dashboard
        try {
          sessionStorage.removeItem('schemesathi_onboarding_skipped');
          if (result.user?.id) {
            sessionStorage.removeItem(`schemesathi_onboarding_skipped_${result.user.id}`);
          }
          sessionStorage.setItem('schemesathi_just_registered', 'true');
        } catch (e) {
          console.warn('[RegisterForm] sessionStorage error:', e);
        }

        // Save current user for session tracking and testing compatibility
        try {
          localStorage.setItem('currentUser', JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            registrationTime: new Date().toISOString()
          }));
        } catch (e) {}

        // Clear form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          agreeToTerms: false,
        });

        // Call onSubmit callback if provided (closes modal)
        if (onSubmit) {
          console.log('[RegisterForm] Calling onSubmit callback');
          onSubmit();
        }

        // Navigate to dashboard
        setTimeout(() => {
          console.log('[RegisterForm] Navigating to /dashboard');
          navigate('/dashboard');
        }, 500);
      } else {
        const errorMsg = result?.message || 'Registration failed. Please try again.';
        console.error('[RegisterForm] Registration failed:', errorMsg);
        setApiError(errorMsg);
      }
    } catch (error) {
      console.error('[RegisterForm] Registration error:', error);
      setApiError(error.message || 'An error occurred during registration. Please try again.');
    }
  };

  return (
    <div className="register-form-wrapper">
      <form onSubmit={handleFormSubmit} className="register-form" noValidate>
        {successMessage && (
          <div className="success-message" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        {!allowRegistration && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#be123c',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '8px',
            fontSize: '12px',
            lineHeight: '1.35',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa fa-triangle-exclamation" style={{ fontSize: '15px', flexShrink: 0, color: '#e11d48' }}></i>
            <div>
              <strong style={{ fontSize: '12px', display: 'block' }}>Citizen Signups Paused</strong>
              <span>New citizen registrations are temporarily paused by administration. Please try again later.</span>
            </div>
          </div>
        )}

        <div className="form-fields">
          <FormInput
            id="full-name"
            label="Full Name"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            name="fullName"
            placeholder="John Doe"
            error={errors.fullName}
            required
            autoComplete="name"
          />

          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            name="email"
            placeholder="you@example.com"
            error={errors.email}
            required
            autoComplete="email"
          />

          <FormInput
            id="phone"
            label="Phone Number"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            name="phone"
            placeholder="9876543210 (10-digit mobile number)"
            error={errors.phone}
            required
            autoComplete="tel"
            pattern="[0-9]{10}"
          />

          <div>
            <FormInput
              id="password"
              label="Create Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              name="password"
              placeholder="At least 8 characters"
              error={errors.password}
              required
              autoComplete="new-password"
            />

            {formData.password && (
              <div className="password-strength-container">
                <div className="strength-bar">
                  <div
                    className={`strength-indicator strength-${passwordStrength}`}
                  ></div>
                </div>
                <p className={`strength-text strength-text-${passwordStrength}`}>
                  Password strength: <strong>{passwordStrength}</strong>
                </p>
              </div>
            )}
          </div>

          <FormInput
            id="confirm-password"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            name="confirmPassword"
            placeholder="Re-enter your password"
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          <FormCheckbox
            id="agree-terms"
            labelElement={
              <>
                I agree to the{' '}
                <button
                  type="button"
                  className="policy-link"
                  onClick={() => onNavigate && onNavigate('terms')}
                >
                  Terms & Conditions
                </button>
                {' '}and{' '}
                <button
                  type="button"
                  className="policy-link"
                  onClick={() => onNavigate && onNavigate('privacy')}
                >
                  Privacy Policy
                </button>
              </>
            }
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            name="agreeToTerms"
            required
            error={errors.agreeToTerms}
          />
        </div>

        <Button
          variant="primary"
          size="large"
          fullWidth
          type="submit"
          disabled={isLoading || !allowRegistration}
        >
          {isLoading ? 'Creating Account...' : (!allowRegistration ? 'Registration Paused' : 'Create Account')}
        </Button>

        <div className="form-divider" style={{ margin: '4px 0' }}>
          <span>OR</span>
        </div>

        <p className="already-have-account" style={{ margin: '2px 0 4px 0', fontSize: '12px' }}>
          Already have an account?{' '}
          <button
            type="button"
            className="login-text-link"
            onClick={() => onNavigate && onNavigate('login')}
          >
            Login
          </button>
        </p>

        <div className="security-notice" style={{ marginTop: '2px' }}>
          <p className="security-text" style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>
            <span className="lock-icon">🔒</span>
            Your data is encrypted and protected
          </p>
        </div>
      </form>
    </div>
  );
}



