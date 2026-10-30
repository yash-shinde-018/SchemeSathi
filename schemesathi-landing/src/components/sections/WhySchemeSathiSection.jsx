import Container from '../common/Container';
import Icon from '../common/Icon';
import { features } from '../../utils/mockData';
import './WhySchemeSathiSection.css';

/**
 * Why SchemeSathi Section - Premium Glassmorphism Design
 * 
 * Features:
 * - Gradient background with 3D floating particles
 * - Large centered heading with gradient text
 * - 4 feature cards with glassmorphism effect
 * - Responsive grid: 1 column mobile, 2 columns tablet, 4 columns desktop
 * - Smooth hover effects with transform and glow
 * 
 * @returns {JSX.Element} Why SchemeSathi section component
 * 
 * @example
 * <WhySchemeSathiSection />
 */
function WhySchemeSathiSection() {
  return (
    <section 
      id="why-schemesathi"
      className="why-schemesathi"
      role="region"
      aria-label="Why choose SchemeSathi - Feature highlights"
    >
      <Container size="large">
        <div className="why-schemesathi__container">
          {/* Left Column - Heading Content */}
          <div className="why-schemesathi__content">
            <h2 className="why-schemesathi__heading">
              Government benefits,<br/>made easier to discover.
            </h2>
            <p className="why-schemesathi__subheading">
              SchemeSathi makes it simple to find and understand the government schemes that might benefit you. We handle the complexity so you can focus on what matters.
            </p>
          </div>

          {/* Right Column - Feature Grid */}
          <div className="why-schemesathi__features">
            {features.map((feature, index) => (
              <div key={feature.id} className="why-schemesathi__feature">
                <div className="why-schemesathi__number">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="why-schemesathi__feature-content">
                  <h3 className="why-schemesathi__feature-title">
                    {feature.title}
                  </h3>
                  <p className="why-schemesathi__feature-description">
                    {feature.description}
                  </p>
                </div>
                <div>
                  <Icon 
                    name={feature.icon} 
                    size={20} 
                    color="white" 
                    ariaHidden
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default WhySchemeSathiSection;
