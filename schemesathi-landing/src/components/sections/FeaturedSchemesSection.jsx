import Button from '../common/Button';
import Container from '../common/Container';
import Icon from '../common/Icon';
import { schemes } from '../../utils/mockData';
import './FeaturedSchemesSection.css';

/**
 * Featured Schemes Section - Display 4 featured schemes
 * 
 * Features:
 * - Display 4 featured scheme cards with detailed information
 * - Card layout includes: name, agency, description, eligibility, benefits, CTA
 * - Responsive grid: 1 col (mobile) → 2 cols (768px) → 4 cols (1024px)
 * - Uses Card component for consistency
 * 
 * @returns {JSX.Element} Featured schemes section component
 * 
 * @example
 * <FeaturedSchemesSection />
 */
function FeaturedSchemesSection() {
  return (
    <section 
      id="featured-schemes"
      className="featured-schemes"
      role="region"
      aria-label="Featured government schemes section"
    >
      <Container size="large">
        <h2 className="featured-schemes__heading">
          Featured Government Schemes
        </h2>

        <div className="featured-schemes__grid">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="featured-schemes__card-wrapper">
              <article className="featured-schemes__scheme-card">
                {/* Scheme Header */}
                <div className="featured-schemes__card-header">
                  <h3 className="featured-schemes__scheme-name">
                    {scheme.name}
                  </h3>
                  <p className="featured-schemes__agency">
                    {scheme.agency}
                  </p>
                </div>

                {/* Description */}
                <p className="featured-schemes__description">
                  {scheme.description}
                </p>

                {/* Eligibility Highlights */}
                <div className="featured-schemes__section">
                  <h4 className="featured-schemes__section-title">
                    <Icon 
                      name="bi-check-circle" 
                      size={18} 
                      color="status-success"
                      ariaHidden
                    />
                    Eligibility
                  </h4>
                  <ul className="featured-schemes__criteria-list">
                    {scheme.eligibility.slice(0, 3).map((criterion, index) => (
                      <li key={index}>{criterion}</li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="featured-schemes__section">
                  <h4 className="featured-schemes__section-title">
                    <Icon 
                      name="bi-gift" 
                      size={18} 
                      color="status-success"
                      ariaHidden
                    />
                    Benefits
                  </h4>
                  <ul className="featured-schemes__benefits-list">
                    {scheme.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="featured-schemes__footer">
                  <Button
                    variant="primary"
                    size="medium"
                    fullWidth
                    onClick={() => {
                      // TODO: Navigate to scheme detail page (Phase 2)
                      console.log(`Clicked scheme: ${scheme.name}`);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </article>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default FeaturedSchemesSection;
