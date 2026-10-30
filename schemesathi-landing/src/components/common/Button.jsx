import PropTypes from 'prop-types';
import '../../styles/global.css';

/**
 * Button component with multiple variants and accessibility support
 */
export default function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  ariaLabel,
  className = '',
  type = 'button',
}) {
  // Build Bootstrap button classes
  const getVariantClass = () => {
    const variantMap = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      text: 'btn-text',
    };
    return variantMap[variant] || 'btn-primary';
  };

  const getSizeClass = () => {
    const sizeMap = {
      small: 'btn-sm',
      medium: '',
      large: 'btn-lg',
    };
    return sizeMap[size] || '';
  };

  const widthClass = fullWidth ? 'btn-full-width' : '';
  const variantClass = getVariantClass();
  const sizeClass = getSizeClass();

  const buttonClasses = ['btn', variantClass, sizeClass, widthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        '--focus-outline': 'var(--focus-outline)',
        '--focus-outline-offset': 'var(--focus-outline-offset)',
        '--transition-fast': 'var(--transition-fast)',
      }}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};
