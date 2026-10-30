import PropTypes from 'prop-types';
import '../../styles/global.css';

/**
 * Icon component with size variants and accessibility support
 * 
 * @component
 * @description A flexible icon component supporting Bootstrap Icons or inline SVG.
 * Provides multiple size options (16px, 20px, 24px, 32px) and color customization via CSS variables.
 * Includes proper ARIA attributes for accessibility (aria-hidden for decorative, ariaLabel for functional).
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Icon class name (e.g., 'bi-search' for Bootstrap Icons)
 * @param {16 | 20 | 24 | 32} [props.size=24] - Icon size in pixels
 * @param {string} [props.color='text-primary'] - CSS variable name for color (without '--color-' prefix)
 * @param {string} [props.ariaLabel] - Accessibility label for functional icons
 * @param {boolean} [props.ariaHidden=false] - Hide from screen readers (for decorative icons)
 * @param {string} [props.className] - Additional CSS classes
 * 
 * @returns {JSX.Element} Rendered icon element (<i> tag for Bootstrap Icons, <svg> for inline SVG)
 * 
 * @example
 * // Decorative icon
 * <Icon name="bi-star" size={24} ariaHidden />
 * 
 * @example
 * // Functional icon with label
 * <Icon name="bi-search" size={20} ariaLabel="Search" />
 * 
 * @example
 * // Custom color
 * <Icon name="bi-check-circle" size={32} color="status-success" />
 */
export default function Icon({
  name,
  size = 24,
  color = 'text-primary',
  ariaLabel,
  ariaHidden = false,
  className = '',
}) {
  // Map size to CSS variable or pixel value
  const sizeMap = {
    16: '16px',
    20: '20px',
    24: '24px',
    32: '32px',
  };

  const iconSize = sizeMap[size] || '24px';

  // Build color CSS variable
  const colorVar = color.startsWith('--') ? color : `--color-${color}`;

  // Common icon styles
  const iconStyle = {
    display: 'inline-block',
    width: iconSize,
    height: iconSize,
    verticalAlign: 'middle',
    color: `var(${colorVar})`,
    lineHeight: 1,
    flexShrink: 0, // Prevent icon from shrinking in flex containers
  };

  // Determine if it's a Bootstrap Icon (class-based) or inline SVG
  const isBootstrapIcon = name && name.startsWith('bi-');

  const iconClasses = [
    isBootstrapIcon && 'bi',
    isBootstrapIcon && name,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const ariaProps = {
    ...(ariaHidden && { 'aria-hidden': 'true' }),
    ...(ariaLabel && !ariaHidden && { 'aria-label': ariaLabel }),
  };

  if (isBootstrapIcon) {
    return (
      <i
        className={iconClasses}
        style={iconStyle}
        {...ariaProps}
      />
    );
  }

  // Fallback for custom icons or SVG names
  // This assumes SVG files are stored in public/icons or similar
  return (
    <svg
      className={`icon icon-${name} ${className}`.trim()}
      style={iconStyle}
      {...ariaProps}
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.oneOf([16, 20, 24, 32]),
  color: PropTypes.string,
  ariaLabel: PropTypes.string,
  ariaHidden: PropTypes.bool,
  className: PropTypes.string,
};
