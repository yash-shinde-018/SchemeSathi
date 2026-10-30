import Button from '../common/Button';
import Container from '../common/Container';
import './CTASection.css';

/**
 * Final Call-To-Action Section - Encourage user engagement
 * 
 * Features:
 * - Engaging heading and supporting text
 * - Primary CTA button with premium styling (Start Discovering Schemes)
 * - Beautiful gradient background
 * - Centered, prominent layout
 * - Responsive design
 * 
 * @param {Object} props - Component props
 * @param {Function} [props.onNavigate] - Navigation callback function
 * @returns {JSX.Element} CTA section component
 * 
 * @example
 * <CTASection onNavigate={handleNavigate} />
 */
function CTASection({ onNavigate }) {
  const handleFindSchemes = () => {
    if (onNavigate) {
      onNavigate('register');
    } else {
      console.log('Navigate to scheme discovery');
    }
  };

  return (
    <section 
      id="cta"
      className="cta"
      role="region"
      aria-label="Call to action section"
    >
      <Container size="large">
        <div className="cta__content">
          <h2 className="cta__heading">
            Ready to find the schemes that are right for you?
          </h2>
          <p className="cta__text">
            Answer a few simple questions and discover schemes that may match your situation.
          </p>

          <div className="cta__buttons">
            <Button
              variant="primary"
              size="large"
              onClick={handleFindSchemes}
              className="cta__button-primary"
            >
              Start Discovering Schemes
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default CTASection;
