import Container from '../common/Container';
import Icon from '../common/Icon';
import { trustItems } from '../../utils/mockData';
import './TrustStripSection.css';

/**
 * Trust Strip Section - Minimalist horizontal trust indicators
 * 
 * Features:
 * - 4 small, minimalist trust items
 * - Horizontal layout with icons and text
 * - Light background and subtle styling
 * - Responsive: 1 column mobile, 2 columns tablet, 4 columns desktop
 * - No large cards - compact and efficient design
 * 
 * @returns {JSX.Element} Trust strip section component
 * 
 * @example
 * <TrustStripSection />
 */
function TrustStripSection() {
  return (
    <section 
      id="trust-strip"
      className="trust-strip"
      role="region"
      aria-label="Trust and credibility indicators"
    >
      <Container size="large">
        <ul className="trust-strip__items">
          {trustItems.map((item) => (
            <li key={item.id} className="trust-strip__item">
              <div className="trust-strip__icon-wrapper">
                <Icon 
                  name={item.icon} 
                  size={24} 
                  color="primary-main"
                  ariaHidden
                />
              </div>
              <div className="trust-strip__content">
                <h3 className="trust-strip__title">
                  {item.title}
                </h3>
                <p className="trust-strip__description">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export default TrustStripSection;
