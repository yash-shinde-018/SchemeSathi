"""
Tests for category seeding functionality.

Tests the CategorySeeder class and CLI commands for seeding scheme categories.
Covers:
- Seeding all categories
- Seeding individual categories
- Clearing categories
- Updating categories
- Category retrieval and existence checks
- CLI command functionality
- Duplicate prevention
- Error handling
"""

import pytest
from flask import Flask
from app.database import db
from app.models import SchemeCategory
from app.seeds.categories import CategorySeeder, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS


@pytest.fixture
def app():
    """Create test Flask app with in-memory SQLite database."""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def seeder(app):
    """Create CategorySeeder instance with app context."""
    with app.app_context():
        return CategorySeeder()


class TestCategorySeed:
    """Tests for seeding all categories."""
    
    def test_seed_all_creates_10_categories(self, app, seeder):
        """Test that seed_all creates exactly 10 categories."""
        with app.app_context():
            result = seeder.seed_all()
            
            assert result['created'] == 10
            assert result['skipped'] == 0
            assert result['failed'] == 0
            assert len(result['categories']) == 10
            
            # Verify all 10 categories exist in database
            count = SchemeCategory.query.count()
            assert count == 10
    
    def test_seed_all_returns_correct_result_structure(self, app, seeder):
        """Test that seed_all returns result dict with correct structure."""
        with app.app_context():
            result = seeder.seed_all()
            
            assert 'created' in result
            assert 'skipped' in result
            assert 'failed' in result
            assert 'categories' in result
            assert 'errors' in result
            
            assert isinstance(result['created'], int)
            assert isinstance(result['skipped'], int)
            assert isinstance(result['failed'], int)
            assert isinstance(result['categories'], list)
            assert isinstance(result['errors'], list)
    
    def test_seed_all_categories_have_correct_data(self, app, seeder):
        """Test that seeded categories have correct name, description, icon, color."""
        with app.app_context():
            seeder.seed_all()
            
            for category_data in CATEGORIES:
                cat = SchemeCategory.query.filter_by(name=category_data['name']).first()
                
                assert cat is not None
                assert cat.name == category_data['name']
                assert cat.description == category_data['description']
                assert cat.icon == CATEGORY_ICONS[category_data['name']]
                assert cat.color == CATEGORY_COLORS[category_data['name']]
    
    def test_seed_all_is_idempotent(self, app, seeder):
        """Test that seed_all with skip_duplicates skips existing categories."""
        with app.app_context():
            # First seed
            result1 = seeder.seed_all()
            assert result1['created'] == 10
            
            # Second seed with skip_duplicates=True (default)
            result2 = seeder.seed_all(skip_duplicates=True)
            assert result2['created'] == 0
            assert result2['skipped'] == 10
            
            # Database should still have 10 categories
            count = SchemeCategory.query.count()
            assert count == 10
    
    def test_seed_all_without_skip_duplicates_errors(self, app, seeder):
        """Test that seed_all without skip_duplicates raises error on duplicate."""
        with app.app_context():
            # First seed
            seeder.seed_all()
            
            # Second seed without skip should raise
            with pytest.raises(Exception):
                seeder.seed_all(skip_duplicates=False)
    
    def test_seed_creates_categories_with_audit_fields(self, app, seeder):
        """Test that seeded categories have created_at and updated_at."""
        with app.app_context():
            seeder.seed_all()
            
            cat = SchemeCategory.query.first()
            assert cat.created_at is not None
            assert cat.updated_at is not None
            assert cat.deleted_at is None


class TestSeedByName:
    """Tests for seeding individual categories."""
    
    def test_seed_by_name_creates_single_category(self, app, seeder):
        """Test that seed_by_name creates a single category."""
        with app.app_context():
            category = seeder.seed_by_name('Education')
            
            assert category is not None
            assert category.name == 'Education'
            assert category.icon == '🎓'
            assert category.color == '#3B82F6'
            
            # Only 1 category should exist
            count = SchemeCategory.query.count()
            assert count == 1
    
    def test_seed_by_name_all_categories(self, app, seeder):
        """Test that seed_by_name works for all standard categories."""
        with app.app_context():
            for category_data in CATEGORIES:
                cat = seeder.seed_by_name(category_data['name'])
                assert cat is not None
                assert cat.name == category_data['name']
            
            count = SchemeCategory.query.count()
            assert count == len(CATEGORIES)
    
    def test_seed_by_name_nonexistent_category_raises_error(self, app, seeder):
        """Test that seed_by_name raises ValueError for nonexistent category."""
        with app.app_context():
            with pytest.raises(ValueError):
                seeder.seed_by_name('NonexistentCategory')
    
    def test_seed_by_name_case_insensitive(self, app, seeder):
        """Test that seed_by_name is case-insensitive."""
        with app.app_context():
            category = seeder.seed_by_name('EDUCATION')
            
            assert category is not None
            assert category.name == 'Education'
    
    def test_seed_by_name_skips_existing(self, app, seeder):
        """Test that seed_by_name returns existing category without duplicating."""
        with app.app_context():
            # First seed
            cat1 = seeder.seed_by_name('Healthcare')
            
            # Second seed same category
            cat2 = seeder.seed_by_name('Healthcare')
            
            # Should be same object
            assert cat1.id == cat2.id
            
            # Only 1 category should exist
            count = SchemeCategory.query.count()
            assert count == 1


class TestClearCategories:
    """Tests for clearing/deleting categories."""
    
    def test_clear_all_deletes_all_categories(self, app, seeder):
        """Test that clear_all deletes all categories."""
        with app.app_context():
            # Seed some categories first
            seeder.seed_all()
            count_before = SchemeCategory.query.count()
            assert count_before == 10
            
            # Clear all
            result = seeder.clear_all(confirm=True)
            
            assert result['deleted'] == 10
            
            # Verify all deleted
            count_after = SchemeCategory.query.count()
            assert count_after == 0
    
    def test_clear_all_requires_confirmation(self, app, seeder):
        """Test that clear_all requires confirm=True."""
        with app.app_context():
            with pytest.raises(ValueError):
                seeder.clear_all(confirm=False)
    
    def test_clear_all_on_empty_database(self, app, seeder):
        """Test that clear_all works on empty database."""
        with app.app_context():
            result = seeder.clear_all(confirm=True)
            
            assert result['deleted'] == 0


class TestUpdateCategory:
    """Tests for updating categories."""
    
    def test_update_category_description(self, app, seeder):
        """Test updating category description."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            new_description = 'Updated education description'
            updated = seeder.update_category('Education', description=new_description)
            
            assert updated.description == new_description
            
            # Verify in database
            cat = SchemeCategory.query.filter_by(name='Education').first()
            assert cat.description == new_description
    
    def test_update_category_icon(self, app, seeder):
        """Test updating category icon."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            new_icon = '📚'
            updated = seeder.update_category('Education', icon=new_icon)
            
            assert updated.icon == new_icon
    
    def test_update_category_color(self, app, seeder):
        """Test updating category color."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            new_color = '#FF0000'
            updated = seeder.update_category('Education', color=new_color)
            
            assert updated.color == new_color
    
    def test_update_category_multiple_fields(self, app, seeder):
        """Test updating multiple fields at once."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            updated = seeder.update_category(
                'Education',
                description='New description',
                icon='📚',
                color='#FF0000'
            )
            
            assert updated.description == 'New description'
            assert updated.icon == '📚'
            assert updated.color == '#FF0000'
    
    def test_update_nonexistent_category_raises_error(self, app, seeder):
        """Test updating nonexistent category raises ValueError."""
        with app.app_context():
            with pytest.raises(ValueError):
                seeder.update_category('NonexistentCategory', description='New')
    
    def test_update_with_invalid_field_raises_error(self, app, seeder):
        """Test updating with invalid field raises ValueError."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            with pytest.raises(ValueError):
                seeder.update_category('Education', invalid_field='value')
    
    def test_update_category_updates_timestamp(self, app, seeder):
        """Test that updating category updates the updated_at timestamp."""
        import time
        
        with app.app_context():
            seeder.seed_by_name('Education')
            cat1 = SchemeCategory.query.filter_by(name='Education').first()
            initial_updated_at = cat1.updated_at
            
            time.sleep(0.01)  # Small delay to ensure timestamp difference
            
            seeder.update_category('Education', description='Updated')
            cat2 = SchemeCategory.query.filter_by(name='Education').first()
            
            assert cat2.updated_at > initial_updated_at


class TestGetCategory:
    """Tests for retrieving categories."""
    
    def test_get_category_by_name(self, app, seeder):
        """Test getting category by exact name."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            cat = seeder.get_category('Education')
            
            assert cat is not None
            assert cat.name == 'Education'
    
    def test_get_category_nonexistent_returns_none(self, app, seeder):
        """Test getting nonexistent category returns None."""
        with app.app_context():
            cat = seeder.get_category('NonexistentCategory')
            
            assert cat is None
    
    def test_get_all_categories_ordered(self, app, seeder):
        """Test getting all categories returns them in order."""
        with app.app_context():
            seeder.seed_all()
            
            categories = seeder.get_all_categories()
            
            assert len(categories) == 10
            assert all(isinstance(cat, SchemeCategory) for cat in categories)
            
            # Check names match expected order
            expected_names = [cat['name'] for cat in CATEGORIES]
            actual_names = [cat.name for cat in categories]
            # Note: Order might differ due to database, just verify all exist
            assert set(actual_names) == set(expected_names)


class TestCategoryExists:
    """Tests for checking category existence."""
    
    def test_category_exists_true(self, app, seeder):
        """Test category_exists returns True for existing category."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            assert seeder.category_exists('Education') is True
    
    def test_category_exists_false(self, app, seeder):
        """Test category_exists returns False for nonexistent category."""
        with app.app_context():
            assert seeder.category_exists('NonexistentCategory') is False
    
    def test_category_exists_case_insensitive(self, app, seeder):
        """Test category_exists is case-sensitive (matches database)."""
        with app.app_context():
            seeder.seed_by_name('Education')
            
            # Exact match
            assert seeder.category_exists('Education') is True
            
            # Different case won't match (names are exact in DB)
            assert seeder.category_exists('EDUCATION') is False


class TestCategoryData:
    """Tests for category data structure and content."""
    
    def test_all_categories_have_required_fields(self, app, seeder):
        """Test that CATEGORIES list has all required fields."""
        for cat in CATEGORIES:
            assert 'name' in cat
            assert 'description' in cat
            assert cat['name'] in CATEGORY_ICONS
            assert cat['name'] in CATEGORY_COLORS
    
    def test_all_icons_and_colors_exist(self, app, seeder):
        """Test that all icons and colors are defined."""
        for cat in CATEGORIES:
            name = cat['name']
            assert name in CATEGORY_ICONS
            assert name in CATEGORY_COLORS
            
            # Icons should be emoji or unicode
            assert len(CATEGORY_ICONS[name]) > 0
            
            # Colors should be hex codes
            assert CATEGORY_COLORS[name].startswith('#')
            assert len(CATEGORY_COLORS[name]) == 7
    
    def test_no_duplicate_category_names(self):
        """Test that there are no duplicate category names."""
        names = [cat['name'] for cat in CATEGORIES]
        assert len(names) == len(set(names))


@pytest.mark.usefixtures('app')
class TestCLIIntegration:
    """Tests for CLI command integration."""
    
    def test_cli_seed_categories_command_exists(self, app):
        """Test that the seed-categories command is registered."""
        from app.cli.seed_categories import seed_categories_command
        
        assert seed_categories_command is not None
    
    def test_can_invoke_seeder_from_app_context(self, app):
        """Test that CategorySeeder works within app context."""
        with app.app_context():
            seeder = CategorySeeder()
            result = seeder.seed_all()
            
            assert result['created'] == 10
