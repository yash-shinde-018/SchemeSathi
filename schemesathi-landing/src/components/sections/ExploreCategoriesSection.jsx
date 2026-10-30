import Container from '../common/Container';
import { exploreCategories } from '../../utils/mockData';
import './ExploreCategoriesSection.css';

/**
 * Explore Categories Section - Grid of category cards with emojis
 * 
 * Features:
 * - Display 8 category cards with emojis, titles, and descriptions
 * - Responsive: 1 column mobile, 2 columns tablet, 4 columns desktop
 * - Each card is clickable (for Phase 2 integration)
 * - Modern minimalist design matching site aesthetic
 * - Hover effects for better interactivity
 * 
 * @returns {JSX.Element} Explore categories section component
 * 
 * @example
 * <ExploreCategoriesSection />
 */
function ExploreCategoriesSection() {
  const handleCategoryClick = (category) => {
    // TODO: In Phase 2, navigate to category page or filter results
    console.log('Category clicked:', category.id);
  };

  return (
    <section 
      id="explore-categories"
      className="explore-categories"
      role="region"
      aria-label="Explore schemes by category"
    >
      <Container size="large">
        {/* Section Header */}
        <div className="explore-categories__header">
          <h2 className="explore-categories__heading">
            Explore Schemes by Category
          </h2>
          <p className="explore-categories__subtitle">
            Find benefits and support programs based on what matters to you.
          </p>
        </div>

        {/* Categories Grid */}
        <ul className="explore-categories__grid">
          {exploreCategories.map((category) => (
            <li key={category.id} className="explore-categories__card-wrapper">
              <button 
                className="explore-categories__card"
                onClick={() => handleCategoryClick(category)}
                aria-label={`Explore ${category.title} schemes`}
              >
                <div className="explore-categories__card-title">
                  {category.title}
                </div>
                <p className="explore-categories__card-description">
                  {category.description}
                </p>
              </button>
            </li>
          ))}
        </ul>

        {/* More Categories Text with Bounce Animation */}
        <div className="explore-categories__footer">
          <div className="explore-categories__more">
            <span className="explore-categories__more-text">More Categories</span>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ExploreCategoriesSection;
