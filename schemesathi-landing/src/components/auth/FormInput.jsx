import { useState } from 'react';
import './FormInput.css';

/**
 * FormInput Component - Reusable text input wrapper with validation
 * 
 * Features:
 * - Show/hide toggle for password fields
 * - Error message display
 * - Accessible labels and error associations
 * - Focus and disabled states
 * - Responsive design
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique input ID for accessibility
 * @param {string} props.label - Input label text
 * @param {string} props.type - Input type (text, email, password, tel, etc.)
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Change handler callback
 * @param {string} props.name - Input name attribute
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.required] - Whether field is required
 * @param {string} [props.autoComplete] - Autocomplete attribute
 * @param {string} [props.pattern] - Input pattern for validation
 * @param {string} [props.helpText] - Helper text below input
 * @param {boolean} [props.disabled] - Whether input is disabled
 * @returns {JSX.Element} Rendered form input component
 */
export default function FormInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  name,
  placeholder,
  error,
  required,
  autoComplete,
  pattern,
  helpText,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  const handleTogglePassword = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  return (
    <div className="form-input-wrapper">
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>

      <div className="form-input-container">
        <input
          id={id}
          name={name || id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          pattern={pattern}
          className={`form-input ${error ? 'form-input--error' : ''}`}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          aria-invalid={!!error}
        />

        {isPasswordField && (
          <button
            type="button"
            className="password-toggle"
            onClick={handleTogglePassword}
            onMouseDown={(e) => e.preventDefault()}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <span className="toggle-icon">👁️</span>
            ) : (
              <span className="toggle-icon">👁️‍🗨️</span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div id={`${id}-error`} className="form-error" role="alert">
          {error}
        </div>
      )}

      {helpText && !error && (
        <div id={`${id}-help`} className="form-help-text">
          {helpText}
        </div>
      )}
    </div>
  );
}
