import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Button from '../common/Button';
import LanguageSelector from '../common/LanguageSelector';
import { NAVIGATION_ITEMS, DEFAULTS, MOBILE_NAV_ITEMS, BREAKPOINTS } from '../../utils/constants';
import './Navigation.css';

/**
 * Navigation Component - Responsive menu for desktop and mobile
 * 
 * Features:
 * - Desktop: Horizontal menu with all items visible
 * - Mobile: Modern floating bottom navigation with curved design
 *   - 4 primary nav items (Explore, Categories, Saved, Profile)
 *   - Floating circular FAB "Find Schemes" button
 *   - Glass morphism surface with backdrop blur
 *   - Curved notched design around FAB
 *   - Smooth transitions and hover effects
 * - Keyboard navigation support (Tab, Escape, Arrow keys)
 * - Focus management on menu open/close
 * - Smooth scroll to sections via anchor links
 * - Accessibility compliance (ARIA labels, 44px touch targets)
 * - Support for safe area insets (iPhone notch, etc.)
 * 
 * @param {Object} props - Component props
 * @param {function} [props.onLanguageChange] - Callback when language is changed
 * @param {function} [props.onNavigate] - Callback for page navigation
 * @param {string} [props.currentLanguage='en'] - Current selected language
 * @param {string} [props.activeNavItem] - Currently active nav item ID
 * @returns {JSX.Element} Navigation menu component
 * 
 * @example
 * <Navigation 
 *   currentLanguage="en" 
 *   activeNavItem="explore"
 *   onLanguageChange={(lang) => setLanguage(lang)}
 *   onNavigate={(page) => setPage(page)}
 * />
 */
function Navigation({ onLanguageChange, onNavigate, currentLanguage = DEFAULTS.language, activeNavItem = 'explore' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const [activeNav, setActiveNav] = useState(activeNavItem);
  const [isFloatingButtonAnimating, setIsFloatingButtonAnimating] = useState(false);
  const hamburgerButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const floatingButtonRef = useRef(null);
  const floatingNavRef = useRef(null);

  // Monitor screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const large = window.innerWidth >= BREAKPOINTS.desktop;
      setIsLargeScreen(large);
      // Close mobile menu when resizing to desktop
      if (large && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // Handle keyboard events in mobile menu and floating nav
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape key to close mobile menu (old) or floating nav
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          e.preventDefault();
          setIsMobileMenuOpen(false);
          // Return focus to hamburger button
          hamburgerButtonRef.current?.focus();
        }
      }

      // Arrow key navigation for floating nav
      if (!isLargeScreen && floatingNavRef.current && e.key.startsWith('Arrow')) {
        const navItems = floatingNavRef.current.querySelectorAll('button[data-nav-item]');
        if (navItems.length === 0) return;

        const currentIndex = Array.from(navItems).findIndex(
          (item) => item.dataset.navItem === activeNav
        );

        let nextIndex = currentIndex;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % navItems.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + navItems.length) % navItems.length;
        }

        if (nextIndex !== currentIndex) {
          e.preventDefault();
          navItems[nextIndex].focus();
          setActiveNav(navItems[nextIndex].dataset.navItem);
        }
      }

      // Tab key navigation within old mobile menu (if still exists for backward compat)
      if (e.key === 'Tab' && mobileMenuRef.current) {
        const focusableElements = mobileMenuRef.current.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isLargeScreen, activeNav]);

  // Close menu when clicking outside (old mobile menu)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && 
          !hamburgerButtonRef.current?.contains(e.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close menu when a link is clicked
  const handleNavItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle floating nav item click
  const handleFloatingNavItemClick = (itemId, href) => {
    setActiveNav(itemId);
    setIsFloatingButtonAnimating(true);
    setTimeout(() => setIsFloatingButtonAnimating(false), 250);

    // Navigate to href if it's a section
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Handle floating "Find Schemes" button click
  const handleFindSchemesClick = () => {
    setIsFloatingButtonAnimating(true);
    setTimeout(() => setIsFloatingButtonAnimating(false), 250);

    // Navigate to find-schemes or scroll to categories
    const categoriesSection = document.querySelector('#categories');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLanguageChange = (language) => {
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      {isLargeScreen && (
        <nav
          className="navigation navigation--desktop"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Desktop Menu */}
          <ul className="navigation__menu navigation__menu--desktop">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.id} className="navigation__item">
                  <Link
                    to={item.href}
                    className={`navigation__link ${isActive ? 'navigation__link--active' : ''}`}
                    onClick={(e) => {
                      if (item.href.startsWith('#')) {
                        e.preventDefault();
                        if (location.pathname === '/') {
                          const target = document.querySelector(item.href);
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                          }
                        } else {
                          navigate('/' + item.href);
                        }
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Primary CTA Button */}
          <Button
            variant="primary"
            size="medium"
            className="navigation__cta"
            onClick={() => {
              if (onNavigate) {
                onNavigate('register');
              } else {
                navigate('/login?mode=register');
              }
            }}
          >
            Register
          </Button>
        </nav>
      )}

      {/* Mobile Floating Curved Navigation */}
      {!isLargeScreen && (
        <nav
          ref={floatingNavRef}
          className="navigation navigation--mobile-floating"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {/* Floating Navigation Container with Curved Design */}
          <div className="floating-nav__container">
            {/* Curved background with notch for FAB */}
            <svg
              className="floating-nav__curve"
              viewBox="0 0 375 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Path: smooth curve up to notch center */}
              <path
                d="M 0 100 L 0 40 Q 50 20, 100 20 Q 120 20, 140 35 Q 155 45, 170 45 L 205 45 Q 220 45, 235 35 Q 255 20, 275 20 Q 325 20, 375 40 L 375 100 Z"
                fill="url(#curveGradient)"
                opacity="0.82"
              />
              <defs>
                <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.82)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.82)" />
                </linearGradient>
              </defs>
            </svg>

            {/* Navigation Items Container */}
            <div className="floating-nav__items">
              {MOBILE_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  data-nav-item={item.id}
                  className={`floating-nav__item ${activeNav === item.id ? 'floating-nav__item--active' : ''}`}
                  onClick={() => handleFloatingNavItemClick(item.id, item.href)}
                  aria-label={item.ariaLabel || item.label}
                  aria-current={activeNav === item.id ? 'page' : undefined}
                  title={item.label}
                >
                  <span className="floating-nav__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="floating-nav__label">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Floating FAB Button - "Find Schemes" */}
            <button
              ref={floatingButtonRef}
              className={`floating-nav__fab ${isFloatingButtonAnimating ? 'floating-nav__fab--active' : ''}`}
              onClick={handleFindSchemesClick}
              aria-label="Find government schemes"
              title="Find Schemes"
            >
              <svg
                className="floating-nav__fab-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Magnifying glass icon */}
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span className="floating-nav__fab-label">Find</span>
            </button>
          </div>

          {/* Backdrop blur overlay (for iOS) */}
          <div className="floating-nav__backdrop" aria-hidden="true" />
        </nav>
      )}
    </>
  );
}

export default Navigation;
