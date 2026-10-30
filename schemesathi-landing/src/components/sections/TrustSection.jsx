import Container from '../common/Container';
import Icon from '../common/Icon';
import './TrustSection.css';

/**
 * Trust & Verification Section - Trust indicators and disclaimer
 * 
 * Features:
 * - Trust messaging and verification indicators
 * - Trust badges (Verified from Official Sources, etc.)
 * - Important disclaimer
 * - Calm, reassuring design
 * 
 * @returns {JSX.Element} Trust section component
 * 
 * @example
 * <TrustSection />
 */
function TrustSection() {
  const trustIndicators = [
    {
      id: 1,
      icon: 'bi-shield-check',
      label: 'Verified from Official Sources',
    },
    {
      id: 2,
      icon: 'bi-file-text',
      label: 'Data from Government Portals',
    },
    {
      id: 3,
      icon: 'bi-arrow-clockwise',
      label: 'Updated Regularly',
    },
  ];

  return (
    <section 
      id="trust"
      className="trust"
      role="region"
      aria-label="Trust and verification section"
    >
      <Container size="large">
        <div className="trust__content">
          {/* Main Message */}
          <div className="trust__message">
            <h2 className="trust__heading">
              Information You Can Verify
            </h2>
            <p className="trust__text">
              SchemeSathi helps you discover government schemes using information from government and official public sources. 
              Always confirm current eligibility and application requirements on the official scheme or application portal.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="trust__indicators">
            {trustIndicators.map((indicator) => (
              <div key={indicator.id} className="trust__indicator">
                <Icon 
                  name={indicator.icon} 
                  size={32} 
                  color="status-success"
                  ariaHidden
                />
                <span className="trust__indicator-label">
                  {indicator.label}
                </span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="trust__disclaimer">
            <div className="trust__disclaimer-icon">
              <Icon 
                name="bi-info-circle" 
                size={20} 
                color="status-info"
                ariaHidden
              />
            </div>
            <div className="trust__disclaimer-content">
              <h3 className="trust__disclaimer-title">Important Note</h3>
              <p className="trust__disclaimer-text">
                SchemeSathi is an information and discovery platform. Final eligibility and approval are determined by the respective 
                government authority. We recommend always visiting the official government website or contacting the scheme authority 
                directly for the most current and accurate information.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default TrustSection;
