import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FormInput from './FormInput';
import FormCheckbox from './FormCheckbox';
import Button from '../common/Button';
import './LoginForm.css';

/**
 * LoginForm Component - User login form with validation
 * 
 * Features:
 * - Email/phone number and password fields
 * - Remember me checkbox
 * - Form validation
 * - Loading state during submission
 * - Success and error messaging
 * - Links to register and forgot password pages
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onNavigate - Navigation callback (e.g., to forgot-password, register)
 * @returns {JSX.Element} Rendered login form
 */
export default function LoginForm({ onNavigate, onSubmit }) {
  const { login, isLoading, error: contextError } = useAuth();
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone number is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[0-9]{10}$/;
      if (!emailRegex.test(formData.emailOrPhone) && !phoneRegex.test(formData.emailOrPhone)) {
        newErrors.emailOrPhone = 'Enter a valid email or 10-digit phone number';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
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
    // Clear error when user starts typing
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setApiError('');

    // Call backend login
    const result = await login(formData.emailOrPhone, formData.password);

    if (result.success) {
      // Ensure newly logged-in user starts with default English language
      try {
        localStorage.setItem('schemesathi-language', 'en');
      } catch (e) {}

      // Save current user for session tracking and testing compatibility
      try {
        localStorage.setItem('currentUser', JSON.stringify({
          emailOrPhone: formData.emailOrPhone,
          user: result.user,
          loginTime: new Date().toISOString()
        }));
      } catch (e) {}

      // Call optional onSubmit callback if passed
      if (onSubmit) {
        try {
          onSubmit(formData);
        } catch (e) {}
      }

      setSuccessMessage('Login successful! Redirecting...');
      setFormData({ emailOrPhone: '', password: '', rememberMe: false });
      
      // Remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', formData.emailOrPhone);
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Redirect after brief delay (admin goes to /admin, citizen to /dashboard)
      setTimeout(() => {
        const role = (result.user?.role || '').toUpperCase();
        const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';
        window.location.href = isAdmin ? '/admin' : '/dashboard';
      }, 700);
    } else {
      setApiError(result.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-form-wrapper">
      <form onSubmit={handleSubmit} className="login-form" noValidate>
        {successMessage && (
          <div className="success-message" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        <div className="form-fields">
          <FormInput
            id="email-phone"
            label="Email or Phone Number"
            type="email"
            value={formData.emailOrPhone}
            onChange={handleInputChange}
            name="emailOrPhone"
            placeholder="example@email.com or 9876543210"
            error={errors.emailOrPhone}
            required
            autoComplete="email tel"
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            name="password"
            placeholder="Enter your password"
            error={errors.password}
            required
            autoComplete="current-password"
          />

          <div className="form-row-between">
            <FormCheckbox
              id="remember-me"
              label="Remember me on this device"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              name="rememberMe"
            />

            <button
              type="button"
              className="forgot-password-link"
              onClick={() => onNavigate && onNavigate('forgot-password')}
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="large"
          fullWidth
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>

        <div className="form-divider">
          <span>OR</span>
        </div>

        <p className="dont-have-account">
          Don't have an account?{' '}
          <button
            type="button"
            className="signup-text-link"
            onClick={() => onNavigate && onNavigate('register')}
          >
            Sign up
          </button>
        </p>

        <div className="security-notice">
          <p className="security-text">
            <span className="lock-icon">🔒</span>
            Your login is protected by SSL encryption
          </p>
        </div>
      </form>
    </div>
  );
}


