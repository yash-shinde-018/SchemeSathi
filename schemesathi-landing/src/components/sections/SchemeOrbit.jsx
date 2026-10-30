import { useState } from 'react';
import Icon from '../common/Icon';
import './SchemeOrbit.css';

/**
 * SchemeOrbit Component - Premium Interactive Scheme Ecosystem
 * 
 * Features:
 * - Data-driven 7-category orbital system
 * - Central SchemeSathi hub with glassmorphic design
 * - SVG orbital connecting lines
 * - 3D depth effects with CSS transforms
 * - Interactive hover states with scale and shadow effects
 * - Keyboard accessible with focus-visible states
 * - Responsive design across all breakpoints
 * - Respects prefers-reduced-motion preference
 * 
 * @param {Object} props - Component props
 * @param {Array} props.categories - Optional category data override
 * @param {number} props.animationSpeed - Optional animation speed multiplier (default: 1)
 * @returns {JSX.Element} SchemeOrbit ecosystem visual
 */
function SchemeOrbit({ categories: customCategories, animationSpeed = 1 }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Default 7 categories as per specification
  const defaultCategories = [
    {
      id: 'education',
      name: 'Education &\nScholarships',
      icon: 'bi-book-fill',
      position: 'top-left',
      color: 'rgba(147, 51, 234, 0.1)',
      order: 0,
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      icon: 'bi-heart-fill',
      position: 'top-right',
      color: 'rgba(239, 68, 68, 0.1)',
      order: 1,
    },
    {
      id: 'agriculture',
      name: 'Agriculture',
      icon: 'bi-leaf',
      position: 'right-upper',
      color: 'rgba(34, 197, 94, 0.1)',
      order: 2,
    },
    {
      id: 'housing',
      name: 'Housing',
      icon: 'bi-house-fill',
      position: 'right-lower',
      color: 'rgba(14, 165, 233, 0.1)',
      order: 3,
    },
    {
      id: 'employment',
      name: 'Employment &\nSkills',
      icon: 'bi-briefcase-fill',
      position: 'bottom-right',
      color: 'rgba(245, 158, 11, 0.1)',
      order: 4,
    },
    {
      id: 'women-child',
      name: 'Women & Child\nWelfare',
      icon: 'bi-person-fill',
      position: 'bottom-left',
      color: 'rgba(236, 72, 153, 0.1)',
      order: 5,
    },
    {
      id: 'senior-disability',
      name: 'Senior Citizens &\nDisability Support',
      icon: 'bi-person-wheelchair',
      position: 'left-upper',
      color: 'rgba(59, 130, 246, 0.1)',
      order: 6,
    },
  ];

  const categories = customCategories || defaultCategories;

  // Calculate SVG orbital lines
  const renderOrbitalLines = () => {
    const centerX = 200;
    const centerY = 200;
    const orbitalRadius = 140;

    // Calculate positions for lines (connect some nodes to center)
    const lines = [
      {
        id: 'line-0',
        path: `M ${centerX} ${centerY} Q ${centerX + 50} ${centerY - 80} ${
          centerX + orbitalRadius * Math.cos((0 * Math.PI) / 3.5) - centerX * 0.5
        } ${centerY + orbitalRadius * Math.sin((0 * Math.PI) / 3.5) - centerY * 0.5}`,
      },
      {
        id: 'line-1',
        path: `M ${centerX} ${centerY} Q ${centerX + 80} ${centerY + 50} ${
          centerX + orbitalRadius * Math.cos((1.5 * Math.PI) / 3.5) - centerX * 0.5
        } ${centerY + orbitalRadius * Math.sin((1.5 * Math.PI) / 3.5) - centerY * 0.5}`,
      },
      {
        id: 'line-2',
        path: `M ${centerX} ${centerY} Q ${centerX - 80} ${centerY + 50} ${
          centerX + orbitalRadius * Math.cos((3 * Math.PI) / 3.5) - centerX * 0.5
        } ${centerY + orbitalRadius * Math.sin((3 * Math.PI) / 3.5) - centerY * 0.5}`,
      },
      {
        id: 'line-3',
        path: `M ${centerX} ${centerY} Q ${centerX - 50} ${centerY - 80} ${
          centerX + orbitalRadius * Math.cos((4.5 * Math.PI) / 3.5) - centerX * 0.5
        } ${centerY + orbitalRadius * Math.sin((4.5 * Math.PI) / 3.5) - centerY * 0.5}`,
      },
    ];

    return (
      <svg
        className="scheme-orbit-lines"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {lines.map((line) => (
          <path
            key={line.id}
            d={line.path}
            stroke="rgba(67, 56, 202, 0.15)"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
    );
  };

  return (
    <div
      className="scheme-orbit"
      role="region"
      aria-label="Government Schemes Ecosystem"
      style={animationSpeed !== 1 ? { '--animation-speed': animationSpeed } : {}}
    >
      {/* Ambient gradient background */}
      <div className="scheme-orbit-background">
        <div className="scheme-orbit-glow scheme-orbit-glow--indigo"></div>
        <div className="scheme-orbit-glow scheme-orbit-glow--teal"></div>
      </div>

      {/* Orbital connecting lines */}
      {renderOrbitalLines()}

      {/* Central Hub */}
      <div className="scheme-orbit-container">
        <div
          className="scheme-orbit-central"
          role="img"
          aria-label="SchemeSathi - Government Schemes Guide"
        >
          <div className="scheme-orbit-central-glow"></div>
          <div className="scheme-orbit-central-content">
            <div className="scheme-orbit-central-logo">SchemeSathi</div>
            <div className="scheme-orbit-central-tagline">Government Schemes</div>
          </div>
        </div>

        {/* Category Nodes */}
        {categories.map((category) => (
          <div
            key={category.id}
            className={`scheme-orbit-item ${
              hoveredCategory === category.id ? 'is-hovered' : ''
            }`}
            style={{
              '--orbit-index': category.order,
              '--orbit-count': categories.length,
              '--category-color': category.color,
            }}
            onMouseEnter={() => setHoveredCategory(category.id)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <button
              className="scheme-orbit-node"
              type="button"
              aria-label={`Explore ${category.name.replace(/\n/g, ' ')} schemes`}
              onFocus={() => setHoveredCategory(category.id)}
              onBlur={() => setHoveredCategory(null)}
            >
              <div className="scheme-orbit-node-icon-wrapper">
                <Icon
                  name={category.icon}
                  size={24}
                  color="primary"
                  ariaHidden
                />
              </div>
              <span className="scheme-orbit-node-label">{category.name}</span>
            </button>

            {/* Hover tooltip */}
            {hoveredCategory === category.id && (
              <div
                className="scheme-orbit-tooltip"
                role="tooltip"
                aria-hidden="true"
              >
                Explore {category.name.replace(/\n/g, ' ')} →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SchemeOrbit;
