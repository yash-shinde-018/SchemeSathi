import Container from '../common/Container';
import Icon from '../common/Icon';
import { workflows } from '../../utils/mockData';
import card1 from '../../assets/card1.png';
import card2 from '../../assets/card2.png';
import card3 from '../../assets/card3.png';
import card4 from '../../assets/card4.png';
import './HowItWorksSection.css';

/**
 * How It Works Section - 4-step visual flow with card images
 * 
 * Features:
 * - Display 4 workflow steps with card images
 * - Vertical layout on mobile, horizontal on desktop
 * - Connectors/arrows between steps
 * - Card images at the top of each step
 * - Hover effects on step cards
 * 
 * @returns {JSX.Element} How it works section component
 * 
 * @example
 * <HowItWorksSection />
 */
function HowItWorksSection() {
  const cardImages = [card1, card2, card3, card4];

  return (
    <section 
      id="how-it-works"
      className="how-it-works"
      role="region"
      aria-label="How it works section with 4 steps"
    >
      <Container size="large">
        <h2 className="how-it-works__heading">
          Finding the Right Scheme is Simple
        </h2>

        <ol className="how-it-works__steps">
          {workflows.map((step, index) => (
            <li key={step.id} className="how-it-works__step-item">
              <div className="how-it-works__step">
                <div className="how-it-works__step-image">
                  <img 
                    src={cardImages[index]} 
                    alt={step.title}
                    loading="lazy"
                  />
                </div>
                <div className="how-it-works__step-content">
                  <h3 className="how-it-works__step-title">
                    {step.title}
                  </h3>
                  <p className="how-it-works__step-description">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Connector Line (not after last step) */}
              {index < workflows.length - 1 && (
                <div className="how-it-works__connector" aria-hidden="true"></div>
              )}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export default HowItWorksSection;
