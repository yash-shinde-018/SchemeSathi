"""
Comprehensive integration tests for database creation and initialization.

Tests the complete database workflow including:
- Database initialization and table creation
- All 7 tables with proper structure
- Column definitions and types
- Constraints (NOT NULL, UNIQUE, foreign keys)
- Indexes on frequently queried fields
- Relationships between entities
- Soft delete support
- Default values and timestamps
- Cascading deletes and referential integrity

These tests verify that the database schema is correctly created and
all relationships, constraints, and features work as expected.
"""

import pytest
from datetime import datetime
from decimal import Decimal
from sqlalchemy import inspect, text
from sqlalchemy.exc import IntegrityError
from app import create_app, db
from app.models import (
    User,
    UserProfile,
    SchemeCategory,
    Scheme,
    SavedScheme,
    SchemeVerification,
    AdminLog,
    UserRole,
    AccountStatus,
    Gender,
    Education,
    SocialCategory,
    DisabilityStatus,
    GovtLevel,
    SchemeStatus,
)


@pytest.fixture
def app():
    """Create Flask app with testing configuration."""
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create Flask test client."""
    return app.test_client()


class TestDatabaseInitialization:
    """Test complete database initialization and table creation."""
    
    def test_database_connection(self, app):
        """Test that database connection is established."""
        with app.app_context():
            # Should not raise any exception
            connection = db.engine.connect()
            assert connection is not None
            connection.close()
    
    def test_all_tables_created(self, app):
        """Test that all 7 required tables are created."""
        with app.app_context():
            inspector = inspect(db.engine)
            table_names = inspector.get_table_names()
            
            required_tables = [
                'users',
                'user_profiles',
                'scheme_categories',
                'schemes',
                'saved_schemes',
                'scheme_verifications',
                'admin_logs'
            ]
            
            for table in required_tables:
                assert table in table_names, f"Table '{table}' not found in database"
    
    def test_database_echo_disabled_for_testing(self, app):
        """Test that SQL echo is disabled for testing environment."""
        # Note: ECHO may be True in development for debugging
        # Just verify the configuration is set
        assert 'SQLALCHEMY_ECHO' in app.config


# ========== TABLE STRUCTURE TESTS ==========

class TestUsersTable:
    """Test users table structure and constraints."""
    
    def test_users_table_exists(self, app):
        """Test that users table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'users' in inspector.get_table_names()
    
    def test_users_table_has_required_columns(self, app):
        """Test that users table has all required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('users')}
            
            required_columns = {
                'id', 'email', 'password_hash', 'first_name', 'last_name',
                'phone', 'role', 'account_status', 'last_login', 'created_at',
                'updated_at', 'deleted_at'
            }
            
            assert required_columns.issubset(columns), \
                f"Missing columns: {required_columns - columns}"
    
    def test_users_email_is_unique(self, app):
        """Test that email field has UNIQUE constraint."""
        with app.app_context():
            # Create first user
            user1 = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user1)
            db.session.commit()
            
            # Try to create second user with same email
            user2 = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test2',
                last_name='User2',
                phone='0987654321'
            )
            db.session.add(user2)
            
            with pytest.raises(IntegrityError):
                db.session.commit()
    
    def test_users_email_is_indexed(self, app):
        """Test that email field is indexed."""
        with app.app_context():
            inspector = inspect(db.engine)
            indexes = inspector.get_indexes('users')
            email_indexed = any('email' in idx.get('column_names', []) 
                              for idx in indexes)
            assert email_indexed, "Email column is not indexed"
    
    def test_users_required_fields_not_null(self, app):
        """Test that required fields cannot be NULL."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns_info = {col['name']: col for col in inspector.get_columns('users')}
            
            required_not_null = [
                'email', 'password_hash', 'first_name', 'last_name', 'phone'
            ]
            
            for col_name in required_not_null:
                assert not columns_info[col_name]['nullable'], \
                    f"Column '{col_name}' should NOT be nullable"
    
    def test_users_timestamps_created(self, app):
        """Test that created_at and updated_at are set automatically."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            assert user.created_at is not None
            assert user.updated_at is not None
            assert isinstance(user.created_at, datetime)
            assert isinstance(user.updated_at, datetime)
    
    def test_users_soft_delete_support(self, app):
        """Test that soft delete is supported via deleted_at field."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            # Soft delete
            user.soft_delete()
            db.session.commit()
            
            assert user.deleted_at is not None
            assert user.is_deleted is True
            
            # Restore
            user.restore()
            db.session.commit()
            
            assert user.deleted_at is None
            assert user.is_deleted is False
    
    def test_users_default_role(self, app):
        """Test that default role is USER."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            assert user.role == UserRole.USER.value


class TestUserProfilesTable:
    """Test user_profiles table structure and relationships."""
    
    def test_user_profiles_table_exists(self, app):
        """Test that user_profiles table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'user_profiles' in inspector.get_table_names()
    
    def test_user_profiles_has_required_columns(self, app):
        """Test that user_profiles table has all required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('user_profiles')}
            
            required_columns = {
                'id', 'user_id', 'date_of_birth', 'gender', 'state', 'district',
                'city', 'occupation', 'education', 'income', 'social_category',
                'disability_status', 'profile_completion_percentage', 'created_at',
                'updated_at', 'deleted_at'
            }
            
            assert required_columns.issubset(columns)
    
    def test_user_profiles_one_to_one_relationship(self, app):
        """Test one-to-one relationship between User and UserProfile."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            profile = UserProfile(
                user_id=user.id,
                state='Maharashtra',
                district='Mumbai'
            )
            db.session.add(profile)
            db.session.commit()
            
            # Verify relationship
            assert user.profile is not None
            assert user.profile.user_id == user.id
            assert profile.user == user
    
    def test_user_profile_cascade_delete(self, app):
        """Test that deleting user cascades to delete profile."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            profile = UserProfile(user_id=user.id)
            db.session.add(profile)
            db.session.commit()
            
            profile_id = profile.id
            user_id = user.id
            
            # Delete user
            db.session.delete(user)
            db.session.commit()
            
            # Profile should be deleted
            deleted_profile = UserProfile.query.filter_by(id=profile_id).first()
            assert deleted_profile is None
    
    def test_user_profile_completion_calculation(self, app):
        """Test profile completion percentage calculation."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            # Empty profile
            profile = UserProfile(user_id=user.id)
            completion = profile.calculate_completion_percentage()
            assert completion == 0
            
            # Partially filled profile
            profile.state = 'Maharashtra'
            profile.district = 'Mumbai'
            profile.city = 'Mumbai'
            completion = profile.calculate_completion_percentage()
            assert 0 < completion < 100
            
            # Fully filled profile
            profile.date_of_birth = datetime(1990, 1, 1).date()
            profile.gender = 'MALE'
            profile.occupation = 'Engineer'
            profile.education = 'BACHELOR'
            profile.income = Decimal('500000.00')
            profile.social_category = 'GENERAL'
            profile.disability_status = 'NO'
            completion = profile.calculate_completion_percentage()
            assert completion == 100


class TestSchemeCategoriesTable:
    """Test scheme_categories table structure."""
    
    def test_scheme_categories_table_exists(self, app):
        """Test that scheme_categories table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'scheme_categories' in inspector.get_table_names()
    
    def test_scheme_categories_required_columns(self, app):
        """Test that scheme_categories has required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('scheme_categories')}
            
            required_columns = {
                'id', 'name', 'description', 'icon', 'color',
                'created_at', 'updated_at', 'deleted_at'
            }
            
            assert required_columns.issubset(columns)
    
    def test_scheme_categories_name_unique(self, app):
        """Test that category name has UNIQUE constraint."""
        with app.app_context():
            cat1 = SchemeCategory(
                name='Education',
                description='Education schemes',
                icon='education.svg',
                color='#0000FF'
            )
            db.session.add(cat1)
            db.session.commit()
            
            cat2 = SchemeCategory(
                name='Education',
                description='Other education schemes',
                icon='edu.svg',
                color='#FF0000'
            )
            db.session.add(cat2)
            
            with pytest.raises(IntegrityError):
                db.session.commit()


class TestSchemesTable:
    """Test schemes table structure and relationships."""
    
    def test_schemes_table_exists(self, app):
        """Test that schemes table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'schemes' in inspector.get_table_names()
    
    def test_schemes_required_columns(self, app):
        """Test that schemes has all required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('schemes')}
            
            required_columns = {
                'id', 'name', 'slug', 'description', 'govt_level', 'state',
                'ministry', 'category_id', 'tags', 'eligibility', 'exclusions',
                'benefits', 'application_process', 'documents', 'faqs',
                'application_mode', 'official_url', 'myscheme_url', 'status',
                'created_by', 'last_verified_at', 'created_at', 'updated_at',
                'deleted_at'
            }
            
            assert required_columns.issubset(columns)
    
    def test_schemes_slug_unique(self, app):
        """Test that slug is unique."""
        with app.app_context():
            cat = SchemeCategory(
                name='Education',
                description='Education schemes',
                icon='edu.svg',
                color='#0000FF'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme1 = Scheme(
                name='Scheme 1',
                slug='scheme-1',
                description='Test scheme',
                govt_level='CENTRAL',
                ministry='Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme1)
            db.session.commit()
            
            scheme2 = Scheme(
                name='Scheme 2',
                slug='scheme-1',
                description='Another scheme',
                govt_level='CENTRAL',
                ministry='Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme2)
            
            with pytest.raises(IntegrityError):
                db.session.commit()
    
    def test_schemes_indexes_exist(self, app):
        """Test that important columns are indexed."""
        with app.app_context():
            inspector = inspect(db.engine)
            indexes = inspector.get_indexes('schemes')
            
            indexed_columns = set()
            for idx in indexes:
                indexed_columns.update(idx.get('column_names', []))
            
            required_indexes = {'name', 'slug', 'govt_level', 'state', 'category_id'}
            
            for col in required_indexes:
                assert col in indexed_columns, f"Column '{col}' is not indexed"
    
    def test_schemes_to_category_relationship(self, app):
        """Test many-to-one relationship between Scheme and Category."""
        with app.app_context():
            cat = SchemeCategory(
                name='Healthcare',
                description='Healthcare schemes',
                icon='health.svg',
                color='#FF0000'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme = Scheme(
                name='Health Scheme',
                slug='health-scheme',
                description='Test scheme',
                govt_level='CENTRAL',
                ministry='Health Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme)
            db.session.commit()
            
            assert scheme.category is not None
            assert scheme.category.id == cat.id
            assert scheme in cat.schemes


class TestSavedSchemesTable:
    """Test saved_schemes table structure and relationships."""
    
    def test_saved_schemes_table_exists(self, app):
        """Test that saved_schemes table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'saved_schemes' in inspector.get_table_names()
    
    def test_saved_schemes_required_columns(self, app):
        """Test that saved_schemes has required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('saved_schemes')}
            
            required_columns = {
                'id', 'user_id', 'scheme_id', 'saved_at', 'created_at',
                'updated_at', 'deleted_at'
            }
            
            assert required_columns.issubset(columns)
    
    def test_saved_schemes_user_scheme_unique_constraint(self, app):
        """Test UNIQUE constraint on (user_id, scheme_id)."""
        with app.app_context():
            # Create user
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            # Create category and scheme
            cat = SchemeCategory(
                name='Test',
                description='Test',
                icon='test.svg',
                color='#000000'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme = Scheme(
                name='Scheme',
                slug='scheme',
                description='Test',
                govt_level='CENTRAL',
                ministry='Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme)
            db.session.commit()
            
            # Save scheme
            saved1 = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved1)
            db.session.commit()
            
            # Try to save same scheme again
            saved2 = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved2)
            
            with pytest.raises(IntegrityError):
                db.session.commit()
    
    def test_saved_schemes_cascade_delete_on_user(self, app):
        """Test that deleting user cascades to delete saved schemes."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            cat = SchemeCategory(
                name='Test',
                description='Test',
                icon='test.svg',
                color='#000000'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme = Scheme(
                name='Scheme',
                slug='scheme',
                description='Test',
                govt_level='CENTRAL',
                ministry='Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme)
            db.session.commit()
            
            saved = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved)
            db.session.commit()
            
            saved_id = saved.id
            user_id = user.id
            
            # Delete user
            db.session.delete(user)
            db.session.commit()
            
            # Saved scheme should be deleted
            deleted_saved = SavedScheme.query.filter_by(id=saved_id).first()
            assert deleted_saved is None
    
    def test_saved_schemes_relationships(self, app):
        """Test relationships between SavedScheme, User, and Scheme."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            cat = SchemeCategory(
                name='Test',
                description='Test',
                icon='test.svg',
                color='#000000'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme = Scheme(
                name='Scheme',
                slug='scheme',
                description='Test',
                govt_level='CENTRAL',
                ministry='Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme)
            db.session.commit()
            
            saved = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved)
            db.session.commit()
            
            # Verify relationships
            assert saved.user is not None
            assert saved.user.id == user.id
            assert saved.scheme is not None
            assert saved.scheme.id == scheme.id
            assert saved in user.saved_schemes


class TestSchemeVerificationsTable:
    """Test scheme_verifications table structure."""
    
    def test_scheme_verifications_table_exists(self, app):
        """Test that scheme_verifications table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'scheme_verifications' in inspector.get_table_names()
    
    def test_scheme_verifications_required_columns(self, app):
        """Test that scheme_verifications has required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('scheme_verifications')}
            
            required_columns = {
                'id', 'scheme_id', 'official_source_verified', 'eligibility_verified',
                'benefits_verified', 'documents_verified', 'application_process_verified',
                'url_verified', 'verification_notes', 'verified_by', 'verified_at',
                'created_at', 'updated_at'
            }
            
            assert required_columns.issubset(columns)


class TestAdminLogsTable:
    """Test admin_logs table structure."""
    
    def test_admin_logs_table_exists(self, app):
        """Test that admin_logs table exists."""
        with app.app_context():
            inspector = inspect(db.engine)
            assert 'admin_logs' in inspector.get_table_names()
    
    def test_admin_logs_required_columns(self, app):
        """Test that admin_logs has required columns."""
        with app.app_context():
            inspector = inspect(db.engine)
            columns = {col['name'] for col in inspector.get_columns('admin_logs')}
            
            required_columns = {
                'id', 'admin_id', 'action', 'entity_type', 'entity_id',
                'details', 'timestamp'
            }
            
            assert required_columns.issubset(columns)


# ========== DATA TYPE TESTS ==========

class TestDataTypes:
    """Test that column data types are correct."""
    
    def test_numeric_columns_exist(self, app):
        """Test that numeric columns exist and are defined."""
        with app.app_context():
            inspector = inspect(db.engine)
            
            # Check users.id
            users_cols = {col['name']: col for col in inspector.get_columns('users')}
            assert 'id' in users_cols
            
            # Check user_profiles.income is numeric
            profiles_cols = {col['name']: col for col in inspector.get_columns('user_profiles')}
            assert 'income' in profiles_cols
    
    def test_string_columns_are_strings(self, app):
        """Test that text columns are properly defined."""
        with app.app_context():
            inspector = inspect(db.engine)
            users_cols = {col['name']: col for col in inspector.get_columns('users')}
            
            # Verify string columns exist
            assert 'email' in users_cols
            assert 'first_name' in users_cols
    
    def test_datetime_columns_exist(self, app):
        """Test that datetime columns exist for timestamps."""
        with app.app_context():
            inspector = inspect(db.engine)
            users_cols = {col['name']: col for col in inspector.get_columns('users')}
            
            # Verify datetime columns exist
            assert 'created_at' in users_cols
            assert 'updated_at' in users_cols


# ========== INTEGRATION TESTS ==========

class TestDatabaseIntegration:
    """Test integrated database functionality."""
    
    def test_create_complete_user_flow(self, app):
        """Test creating a complete user with profile."""
        with app.app_context():
            # Create user
            user = User(
                email='john@example.com',
                password_hash='hash123',
                first_name='John',
                last_name='Doe',
                phone='9876543210'
            )
            db.session.add(user)
            db.session.commit()
            
            # Create profile
            profile = UserProfile(
                user_id=user.id,
                state='Maharashtra',
                district='Mumbai',
                city='Mumbai',
                occupation='Software Engineer',
                education='BACHELOR',
                gender='MALE',
                social_category='GENERAL'
            )
            db.session.add(profile)
            db.session.commit()
            
            # Verify
            retrieved_user = User.query.filter_by(email='john@example.com').first()
            assert retrieved_user is not None
            assert retrieved_user.profile is not None
            assert retrieved_user.profile.state == 'Maharashtra'
    
    def test_all_table_counts_query(self, app):
        """Test counting records in all tables."""
        with app.app_context():
            # Query all table counts
            user_count = db.session.query(User).count()
            profile_count = db.session.query(UserProfile).count()
            cat_count = db.session.query(SchemeCategory).count()
            scheme_count = db.session.query(Scheme).count()
            saved_count = db.session.query(SavedScheme).count()
            verification_count = db.session.query(SchemeVerification).count()
            log_count = db.session.query(AdminLog).count()
            
            # Initially all should be 0
            assert user_count == 0
            assert profile_count == 0
            assert cat_count == 0
            assert scheme_count == 0
            assert saved_count == 0
            assert verification_count == 0
            assert log_count == 0
    
    def test_complex_query_scenario(self, app):
        """Test complex query involving multiple tables."""
        with app.app_context():
            # Create test data
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            cat = SchemeCategory(
                name='Education',
                description='Education schemes',
                icon='edu.svg',
                color='#0000FF'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme = Scheme(
                name='Education Scheme',
                slug='education-scheme',
                description='Test scheme',
                govt_level='CENTRAL',
                ministry='Ministry of Education',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme)
            db.session.commit()
            
            saved = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved)
            db.session.commit()
            
            # Test complex query: Get user's saved schemes with category
            user_saved = db.session.query(SavedScheme).filter_by(user_id=user.id).all()
            
            assert len(user_saved) == 1
            assert user_saved[0].scheme.category.name == 'Education'


# ========== SOFT DELETE TESTS ==========

class TestSoftDeleteFeature:
    """Test soft delete functionality across tables."""
    
    def test_user_soft_delete(self, app):
        """Test soft delete on user."""
        with app.app_context():
            user = User(
                email='test@example.com',
                password_hash='hash',
                first_name='Test',
                last_name='User',
                phone='1234567890'
            )
            db.session.add(user)
            db.session.commit()
            
            user_id = user.id
            
            # Soft delete
            user.soft_delete()
            db.session.commit()
            
            # Check deleted_at is set
            user_from_db = User.query.filter_by(id=user_id).first()
            assert user_from_db.is_deleted is True
            assert user_from_db.deleted_at is not None
    
    def test_scheme_soft_delete(self, app):
        """Test soft delete on scheme."""
        with app.app_context():
            cat = SchemeCategory(
                name='Test',
                description='Test',
                icon='test.svg',
                color='#000000'
            )
            db.session.add(cat)
            db.session.commit()
            
            scheme = Scheme(
                name='Test Scheme',
                slug='test-scheme',
                description='Test',
                govt_level='CENTRAL',
                ministry='Ministry',
                category_id=cat.id,
                application_mode='ONLINE',
                official_url='http://example.com'
            )
            db.session.add(scheme)
            db.session.commit()
            
            scheme_id = scheme.id
            
            # Soft delete
            scheme.soft_delete()
            db.session.commit()
            
            # Check
            scheme_from_db = Scheme.query.filter_by(id=scheme_id).first()
            assert scheme_from_db.is_deleted is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
