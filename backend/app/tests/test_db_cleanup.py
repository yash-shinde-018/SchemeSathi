"""
Tests for database reset/cleanup utility.

Tests both programmatic API and CLI commands for database cleanup.
"""

import pytest
from click.testing import CliRunner
from app import create_app
from app.database import db
from app.models import User, UserProfile, SchemeCategory, Scheme
from app.utils.db_cleanup import (
    get_all_tables,
    get_table_counts,
    clear_tables,
    clear_all_tables,
    reset_database,
)


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def sample_data(app):
    """Create sample data for testing cleanup operations."""
    with app.app_context():
        # Create a user
        user = User(
            email='test@example.com',
            first_name='Test',
            last_name='User',
            phone='+91-1234567890',
            role='USER'
        )
        user.set_password('Password123!')
        db.session.add(user)
        db.session.flush()
        
        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            state='Test State',
            district='Test District'
        )
        db.session.add(profile)
        
        # Create category
        category = SchemeCategory(
            name='Test Category',
            description='Test category description',
            icon='📝',
            color='#000000'
        )
        db.session.add(category)
        db.session.flush()
        
        # Create scheme
        scheme = Scheme(
            name='Test Scheme',
            slug='test-scheme',
            description='Test scheme description',
            govt_level='CENTRAL',
            ministry='Test Ministry',
            category_id=category.id,
            application_mode='ONLINE',
            official_url='https://example.com'
        )
        db.session.add(scheme)
        
        db.session.commit()
        
        yield {
            'user_id': user.id,
            'profile_id': profile.id,
            'category_id': category.id,
            'scheme_id': scheme.id
        }


class TestGetAllTables:
    """Tests for get_all_tables function."""
    
    def test_returns_list_of_tables(self, app):
        """Should return a list of all tables in the database."""
        with app.app_context():
            tables = get_all_tables()
            
            assert isinstance(tables, list)
            assert len(tables) > 0
            assert 'users' in tables
            assert 'schemes' in tables
            assert 'scheme_categories' in tables
    
    def test_empty_database_still_has_tables(self, app):
        """Should return tables even when database has no data."""
        with app.app_context():
            tables = get_all_tables()
            
            # Tables should exist even with no data
            assert len(tables) > 0


class TestGetTableCounts:
    """Tests for get_table_counts function."""
    
    def test_returns_counts_for_all_tables(self, app):
        """Should return row counts for all tables."""
        with app.app_context():
            counts = get_table_counts()
            
            assert isinstance(counts, dict)
            assert 'users' in counts
            assert 'schemes' in counts
    
    def test_empty_tables_return_zero(self, app):
        """Should return 0 for empty tables."""
        with app.app_context():
            counts = get_table_counts()
            
            # All tables should have 0 rows initially
            assert counts['users'] == 0
            assert counts['schemes'] == 0
    
    def test_counts_after_data_insert(self, app, sample_data):
        """Should return correct counts after inserting data."""
        with app.app_context():
            counts = get_table_counts()
            
            assert counts['users'] == 1
            assert counts['user_profiles'] == 1
            assert counts['scheme_categories'] == 1
            assert counts['schemes'] == 1


class TestClearTables:
    """Tests for clear_tables function."""
    
    def test_clear_all_tables(self, app, sample_data):
        """Should clear all tables when no specific tables provided."""
        with app.app_context():
            result = clear_tables()
            
            assert 'deleted' in result
            assert 'errors' in result
            assert len(result['errors']) == 0
            
            # Verify all tables are empty
            assert User.query.count() == 0
            assert UserProfile.query.count() == 0
            assert SchemeCategory.query.count() == 0
            assert Scheme.query.count() == 0
    
    def test_clear_specific_tables(self, app, sample_data):
        """Should clear only specified tables."""
        with app.app_context():
            result = clear_tables(['schemes', 'users'])
            
            assert 'deleted' in result
            assert 'schemes' in result['deleted']
            assert 'users' in result['deleted']
            
            # Verify specified tables are empty
            assert Scheme.query.count() == 0
            assert User.query.count() == 0
            
            # Verify other tables still have data
            assert SchemeCategory.query.count() == 1
    
    def test_clear_nonexistent_table_raises_error(self, app):
        """Should raise ValueError for non-existent table."""
        with app.app_context():
            with pytest.raises(ValueError, match="does not exist"):
                clear_tables(['nonexistent_table'])
    
    def test_returns_deleted_counts(self, app, sample_data):
        """Should return counts of deleted rows."""
        with app.app_context():
            result = clear_tables(['users'])
            
            # Should have deleted 1 user
            assert result['deleted']['users'] == 1


class TestClearAllTables:
    """Tests for clear_all_tables function."""
    
    def test_clears_all_data(self, app, sample_data):
        """Should clear all data from all tables."""
        with app.app_context():
            result = clear_all_tables()
            
            assert 'deleted' in result
            assert len(result['deleted']) > 0
            
            # Verify all tables are empty
            assert User.query.count() == 0
            assert UserProfile.query.count() == 0
            assert SchemeCategory.query.count() == 0
            assert Scheme.query.count() == 0
    
    def test_preserves_table_structure(self, app, sample_data):
        """Should preserve table structure after clearing."""
        with app.app_context():
            clear_all_tables()
            
            # Tables should still exist
            tables = get_all_tables()
            assert 'users' in tables
            assert 'schemes' in tables


class TestResetDatabase:
    """Tests for reset_database function."""
    
    def test_resets_database(self, app, sample_data):
        """Should drop and recreate all tables."""
        with app.app_context():
            result = reset_database()
            
            assert result['success'] is True
            assert result['dropped_tables'] > 0
            assert result['created_tables'] > 0
            assert result['dropped_tables'] == result['created_tables']
    
    def test_all_tables_recreated(self, app, sample_data):
        """Should recreate all tables after reset."""
        with app.app_context():
            original_tables = get_all_tables()
            result = reset_database()
            
            assert result['success'] is True
            
            # All original tables should still exist
            new_tables = get_all_tables()
            assert set(original_tables) == set(new_tables)
    
    def test_data_cleared_after_reset(self, app, sample_data):
        """Should have no data after reset."""
        with app.app_context():
            reset_database()
            
            # All tables should be empty
            assert User.query.count() == 0
            assert UserProfile.query.count() == 0
            assert SchemeCategory.query.count() == 0
            assert Scheme.query.count() == 0


class TestCleanupCLI:
    """Tests for CLI cleanup command."""
    
    @pytest.fixture
    def runner(self):
        """Create CLI runner."""
        return CliRunner()
    
    def test_cleanup_shows_current_state(self, app, runner):
        """Should show current database state."""
        with app.app_context():
            result = runner.invoke(app.cli, ['db', 'cleanup', '--dry-run'])
            
            assert result.exit_code == 0
            assert 'Current Database State' in result.output
            assert 'TOTAL' in result.output
    
    def test_cleanup_dry_run_no_changes(self, app, sample_data, runner):
        """Dry run should not make any changes."""
        with app.app_context():
            result = runner.invoke(app.cli, ['db', 'cleanup', '--dry-run'])
            
            assert result.exit_code == 0
            assert 'DRY RUN' in result.output
            assert 'no changes made' in result.output
            
            # Data should still exist
            assert User.query.count() == 1
    
    def test_cleanup_with_force(self, app, sample_data, runner):
        """Should clear all data with --force flag."""
        with app.app_context():
            result = runner.invoke(app.cli, ['db', 'cleanup', '--force'])
            
            assert result.exit_code == 0
            assert 'Cleared' in result.output
            assert 'cleanup complete' in result.output
            
            # Verify data is cleared
            assert User.query.count() == 0
    
    def test_cleanup_with_reset_flag(self, app, sample_data, runner):
        """Should perform full reset with --reset flag."""
        with app.app_context():
            result = runner.invoke(app.cli, ['db', 'cleanup', '--reset', '--force'])
            
            assert result.exit_code == 0
            assert 'reset complete' in result.output
            assert User.query.count() == 0
    
    def test_cleanup_specific_tables(self, app, sample_data, runner):
        """Should clear only specified tables."""
        with app.app_context():
            result = runner.invoke(
                app.cli,
                ['db', 'cleanup', '--tables', 'schemes', '--force']
            )
            
            assert result.exit_code == 0
            assert Scheme.query.count() == 0
            # Other tables should still have data
            assert User.query.count() == 1
    
    def test_cleanup_cancellation(self, app, sample_data, runner):
        """Should cancel operation when not confirmed."""
        with app.app_context():
            # Run without --force (will prompt, which we don't answer)
            result = runner.invoke(app.cli, ['db', 'cleanup'], input='n\n')
            
            assert 'cancelled' in result.output
            
            # Data should still exist
            assert User.query.count() == 1
    
    def test_cleanup_invalid_table(self, app, runner):
        """Should show error for invalid table name."""
        with app.app_context():
            result = runner.invoke(
                app.cli,
                ['db', 'cleanup', '--tables', 'invalid_table', '--force']
            )
            
            # Should fail with error
            assert result.exit_code != 0
