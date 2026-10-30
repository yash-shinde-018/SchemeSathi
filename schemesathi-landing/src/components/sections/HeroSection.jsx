import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Container from '../common/Container';
import Icon from '../common/Icon';
import heroImage from '../../assets/heroimage.png';
import './HeroSection.css';

/**
 * Hero Section - Redesigned to Match Design Image
 * 
 * Features:
 * - Left side: Text content with eyebrow, headline, subheading, CTA button, and trust badges
 * - Right side: Central SchemeSathi card with category icons in orbital pattern
 * - Glassmorphic design with subtle animations
 * - Trust badges with icons and descriptive text
 * - Responsive layout (stacked on mobile)
 * 
 * @param {Object} props - Component props
 * @param {Function} [props.onNavigate] - Navigation callback function
 * @returns {JSX.Element} Redesigned hero section
 */
function HeroSection({ onNavigate }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBrowseClick = () => {
    const categoriesSection = document.querySelector('#categories');
    if (categoriesSection) {
      categoriesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Trust badges data
  const trustBadges = [
    {
      icon: 'bi-shield-check',
      title: 'Official sources',
      subtitle: 'From government portals',
    },
    {
      icon: 'bi-file-earmark-text',
      title: 'Simple discovery',
      subtitle: 'Easy to understand',
    },
    {
      icon: 'bi-people-fill',
      title: 'For every citizen',
      subtitle: 'Free to use',
    },
  ];

  return (
    <section 
      id="home"
      className="hero" 
      role="region"
      aria-label="Hero section - Find Government Schemes"
    >
      <Container size="large">
        <div className="hero__wrapper">
          {/* Left Side - Text Content */}
          <div className="hero__content">
            {/* Eyebrow */}
            <div className="hero__eyebrow">
              YOUR GUIDE TO GOVERNMENT BENEFITS
            </div>
            
            {/* Headline with gradient */}
            <h1 className="hero__headline">
              Find Government Schemes <span className="hero__headline-accent">Made for You</span>
            </h1>
            
            {/* Subheading */}
            <p className="hero__subheading">
              Discover government schemes and benefits that may be relevant to your age, income, occupation, education and location.
            </p>

            {/* CTA Button - Single button as per design */}
            <div className="hero__cta">
              <Button
                variant="primary"
                size="large"
                onClick={handleBrowseClick}
              >
                Browse Schemes →
              </Button>
            </div>

            {/* Trust Badges Section */}
            <div className="hero__badges">
              {trustBadges.map((badge, idx) => (
                <div key={idx} className="hero__badge">
                  <Icon 
                    name={badge.icon} 
                    size={24} 
                    color="secondary" 
                    ariaHidden 
                  />
                  <div className="hero__badge-text">
                    <div className="hero__badge-title">{badge.title}</div>
                    <div className="hero__badge-subtitle">{badge.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Hero Image */}
          {!isMobile && (
            <div className="hero__visual">
              <img 
                src={heroImage} 
                alt="SchemeSathi scheme discovery visual"
                loading="lazy"
                className="hero__visual-img"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

export default HeroSection;
