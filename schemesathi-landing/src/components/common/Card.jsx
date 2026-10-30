import PropTypes from 'prop-types';
import '../../styles/global.css';

/**
 * Card component with elevation levels and interactive support
 * 
 * @component
 * @description A flexible card component that adapts based on interactivity.
 * Non-interactive cards use semantic <article> tag, while interactive cards use <button role="article">.
 * Supports optional image, icon, title, description, and custom children.
 * Features hover effects with elevation changes and keyboard navigation support.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.title] - Card title heading
 * @param {string} [props.description] - Card description text
 * @param {React.ReactNode} [props.icon] - Icon element to display
 * @param {string} [props.image] - Image URL or path
 * @param {Function} [props.onClick] - Click handler for interactive cards
 * @param {React.ReactNode} [props.children] - Custom content (overrides title/description/icon)
 * @param {string} [props.className] - Additional CSS classes
 * @param {'sm' | 'md' | 'lg'} [props.elevation='md'] - Shadow elevation level
 * @param {boolean} [props.interactive] - Explicitly set interactivity (defaults to !!onClick)
 * 
 * @returns {JSX.Element} Rendered card component with semantic HTML
 * 
 * @example
 * // Static card
 * <Card title="Feature" description="This is a feature" elevation="lg" />
 * 
 * @example
 * // Interactive card
 * <Card title="Clickable" icon={<Icon />} onClick={() => navigate('/')} />
 * 
 * @example
 * // Custom content
 * <Card elevation="sm">
 *   <h3>Custom Card</h3>
 *   <p>Any JSX content here</p>
 * </Card>
 */
export default function Card({
  title,
  description,
  icon,
  image,
  onClick,
  children,
  className = '',
  elevation = 'md',
  interactive = false,
}) {
  // Determine if card should be interactive
  const isInteractive = interactive || !!onClick;

  // Map elevation to CSS shadow variables
  const getElevationClass = () => {
    const elevationMap = {
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    };
    return elevationMap[elevation] || 'var(--shadow-md)';
  };

  // Build card classes
  const cardClasses = [
    'card',
    isInteractive && 'card-interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Card content
  const cardContent = (
    <>
      {image && (
        <div className="card-image" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
          <img
            src={image}
            alt={title || 'Card image'}
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      )}

      {icon && (
        <div className="card-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
          {icon}
        </div>
      )}

      {children ? (
        <div className="card-content">{children}</div>
      ) : (
        <>
          {title && (
            <h3 className="card-title" style={{ marginBottom: 'var(--spacing-sm)', fontSize: 'var(--font-size-h3)' }}>
              {title}
            </h3>
          )}
          {description && (
            <p className="card-description" style={{ marginBottom: 0, color: 'var(--color-text-secondary)' }}>
              {description}
            </p>
          )}
        </>
      )}
    </>
  );

  // Inline styles for card styling
  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--card-padding)',
    boxShadow: getElevationClass(),
    transition: 'all var(--transition-fast)',
    cursor: isInteractive ? 'pointer' : 'default',
    border: '1px solid var(--border-color-light)',
  };

  // Interactive card hover styles
  if (isInteractive) {
    cardStyle['&:hover'] = {
      boxShadow: 'var(--shadow-lg)',
      transform: 'translateY(-4px)',
    };
  }

  if (isInteractive) {
    return (
      <button
        role="article"
        className={cardClasses}
        onClick={onClick}
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = getElevationClass();
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <article className={cardClasses} style={cardStyle}>
      {cardContent}
    </article>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  image: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  elevation: PropTypes.oneOf(['sm', 'md', 'lg']),
  interactive: PropTypes.bool,
};
