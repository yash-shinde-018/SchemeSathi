import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';
import { DEFAULTS } from '../../utils/constants';
import logo from '../../assets/logo.png';
import './Header.css';

/**
 * Header Component - Fixed navbar with logo and navigation
 * 
 * Features:
 * - Fixed position at top of page (60px minimum height)
 * - Semi-transparent background with smooth transitions
 * - Logo/brand on left
 * - Navigation menu in center
 * - Language selector and CTA button on right (desktop)
 * - Responsive hamburger menu on mobile
 * - Smooth scroll behavior with focus management
 * 
 * @param {Object} props - Component props
 * @param {function} [props.onLanguageChange] - Callback when language changes
 * @param {function} [props.onNavigate] - Callback for page navigation
 * @param {string} [props.currentLanguage='en'] - Current language
 * @returns {JSX.Element} Fixed header component
 */
function Header({ onLanguageChange, onNavigate, currentLanguage = DEFAULTS.language }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Logo - Positioned in top-left corner outside navbar */}
      <div className="header__logo-corner">
        <Link to="/" className="header__logo-link" title="SchemeSathi - Go to home">
          <img 
            src={logo} 
            alt="SchemeSathi Logo" 
            className="header__logo-corner-image"
          />
        </Link>
      </div>

      <header
        className={`header ${isScrolled ? 'header--scrolled' : ''}`}
        role="banner"
      >
        <div className="header__container">
          {/* Navigation */}
          <Navigation
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
            onNavigate={onNavigate}
          />
        </div>
      </header>
    </>
  );
}

export default Header;
