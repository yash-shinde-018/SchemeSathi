import Card from '../common/Card';
import Container from '../common/Container';
import Icon from '../common/Icon';
import { categories } from '../../utils/mockData';
import './CategoriesSection.css';

/**
 * Categories Discovery Section - Display 10 scheme categories
 * 
 * Features:
 * - Display 10 category cards in responsive grid
 * - Grid layout: 1 col (mobile) → 2 cols (480px) → 3 cols (768px) → 5 cols (1024px)
 * - Hover effects with elevation and icon scale
 * - Interactive cards with keyboard navigation
 * - Uses Card component for consistency
 * 
 * @returns {JSX.Element} Categories section component
 * 
 * @example
 * <CategoriesSection />
 */
function CategoriesSection() {
  return (
    <section 
      id="categories"
      className="categories"
      role="region"
      aria-label="Explore schemes by category"
    >
      <Container size="large">
        <h2 className="categories__heading">
          Explore Schemes by Category
        </h2>

        <div className="categories__grid">
          {categories.map((category) => (
            <Card
              key={category.id}
              title={category.name}
              description={`${category.schemeCount} schemes available`}
              icon={<Icon name={category.icon} size={32} color="primary-main" ariaHidden />}
              elevation="md"
              interactive
              onClick={() => {
                // TODO: Navigate to category detail page (Phase 2)
                console.log(`Clicked category: ${category.name}`);
              }}
              className="categories__card"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default CategoriesSection;
