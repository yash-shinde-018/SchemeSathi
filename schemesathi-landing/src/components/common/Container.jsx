import PropTypes from 'prop-types';
import '../../styles/global.css';

/**
 * Container component with responsive max-width and padding
 * 
 * @component
 * @description A responsive layout container that adapts padding and max-width based on viewport size.
 * Implements mobile-first approach with progressive enhancement at larger breakpoints.
 * Automatically centers content horizontally using flexbox and margin auto.
 * 
 * Responsive behavior:
 * - Mobile (<768px): 100% width with 1rem padding
 * - Tablet (768px-1024px): 100% width with 1.5rem padding, max-width 800px
 * - Desktop (1024px+): max-width 1200px with 2rem padding
 * - Large Desktop (1920px+): max-width 1400px with 2rem padding
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Container content
 * @param {string} [props.className] - Additional CSS classes
 * @param {'small' | 'medium' | 'large'} [props.size='large'] - Size variant affecting max-width
 * 
 * @returns {JSX.Element} Rendered container div with responsive styling
 * 
 * @example
 * <Container size="large">
 *   <h1>Main content area</h1>
 *   <p>This content will be responsive</p>
 * </Container>
 * 
 * @example
 * <Container size="small" className="my-custom-class">
 *   <p>Narrower container</p>
 * </Container>
 */
export default function Container({
  children,
  className = '',
  size = 'large',
}) {
  // Map size to max-width value (for future use with custom CSS or style overrides)
  const _sizeMap = {
    small: '600px',
    medium: '900px',
    large: '1200px',
  };

  // Container style object with media query support via CSS
  const containerStyle = {
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: 'var(--container-padding-mobile)',
    paddingRight: 'var(--container-padding-mobile)',
    maxWidth: '100%', // Will be overridden by media queries
    boxSizing: 'border-box',
  };

  // Build className with size information
  const containerClasses = [
    'container',
    `container-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      style={containerStyle}
    >
      {/* 
        Responsive styles are applied via global CSS media queries
        The container class in global.css handles the responsive behavior:
        - Mobile: 100% width with 1rem padding
        - Tablet (768px+): 100% width with 1.5rem padding
        - Desktop (1024px+): max-width 1200px with 2rem padding
        - Large Desktop (1920px+): max-width 1400px with 2rem padding
        
        For size variants, add additional CSS rules if needed in global.css
      */}
      {children}
    </div>
  );
}

Container.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};
