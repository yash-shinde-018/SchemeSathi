import './FormCheckbox.css';

/**
 * FormCheckbox Component - Accessible checkbox with label
 * 
 * Features:
 * - Accessible label association
 * - Custom styled checkbox
 * - Support for links within label
 * - Error states for validation
 * - Focus visible state
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique checkbox ID
 * @param {string} [props.label] - Checkbox label text
 * @param {React.ReactNode} [props.labelElement] - Custom label JSX (can include links)
 * @param {boolean} props.checked - Current checkbox state
 * @param {Function} props.onChange - Change handler callback
 * @param {boolean} [props.required] - Whether field is required
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.disabled] - Whether checkbox is disabled
 * @returns {JSX.Element} Rendered checkbox component
 */
export default function FormCheckbox({
  id,
  label,
  labelElement,
  checked,
  onChange,
  name,
  required,
  error,
  disabled = false,
}) {
  const handleClick = () => {
    if (!disabled) {
      const fakeEvent = {
        target: {
          name: name || id,
          type: 'checkbox',
          checked: !checked
        }
      };
      onChange(fakeEvent);
    }
  };

  return (
    <div className="form-checkbox-wrapper">
      <div className="checkbox-container" onClick={handleClick}>
        <div className={`checkbox-box ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
          {checked && (
            <svg viewBox="0 0 20 20" fill="white" className="checkmark-icon">
              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
            </svg>
          )}
        </div>
        
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="checkbox-input-hidden"
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          tabIndex={-1}
        />
        
        <label htmlFor={id} className="checkbox-label" onClick={(e) => e.stopPropagation()}>
          {labelElement || label}
          {required && <span className="required-indicator" aria-label="required">*</span>}
        </label>
      </div>

      {error && (
        <div id={`${id}-error`} className="checkbox-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
