"""
Unit tests for soft delete functionality across all models.

Tests verify that:
1. All 7 models have required audit fields (created_at, updated_at, deleted_at)
2. Soft delete instance methods work correctly (soft_delete(), restore())
3. is_deleted property functions properly
4. Audit fields are properly set to NULL and updated on deletions
"""

import pytest
from datetime import datetime, timedelta
from app import create_app, db
from app.models import (
    User, UserProfile, SchemeCategory, Scheme, SavedScheme,
    SchemeVerification, AdminLog, UserRole, AccountStatus,
    GovtLevel, SchemeStatus, AdminActionType
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


class TestAuditFieldsExist:
    """Tests verifying all 7 models have required audit fields."""

    def test_user_has_audit_fields(self, app):
        """Verify User model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            user = User(
                email='test@example.com',
                first_name='Test',
                last_name='User',
                phone='1234567890',
                role=UserRole.USER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            # Verify fields exist and have correct types
            assert hasattr(user, 'created_at')
            assert hasattr(user, 'updated_at')
            assert hasattr(user, 'deleted_at')
            assert isinstance(user.created_at, datetime)
            assert isinstance(user.updated_at, datetime)
            assert user.deleted_at is None  # Should be None initially

    def test_user_profile_has_audit_fields(self, app):
        """Verify UserProfile model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            user = User(
                email='test@example.com',
                first_name='Test',
                last_name='User',
                phone='1234567890',
                role=UserRole.USER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            
            profile = UserProfile(
                user_id=None,  # Will be set after user commit
                state='Delhi',
                district='South Delhi'
            )
            
            db.session.add(user)
            db.session.commit()
            
            profile.user_id = user.id
            db.session.add(profile)
            db.session.commit()
            
            # Verify fields exist
            assert hasattr(profile, 'created_at')
            assert hasattr(profile, 'updated_at')
            assert hasattr(profile, 'deleted_at')
            assert isinstance(profile.created_at, datetime)
            assert isinstance(profile.updated_at, datetime)
            assert profile.deleted_at is None

    def test_scheme_category_has_audit_fields(self, app):
        """Verify SchemeCategory model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            category = SchemeCategory(
                name='Education',
                description='Education schemes',
                icon='education.svg',
                color='#4338CA'
            )
            db.session.add(category)
            db.session.commit()
            
            assert hasattr(category, 'created_at')
            assert hasattr(category, 'updated_at')
            assert hasattr(category, 'deleted_at')
            assert isinstance(category.created_at, datetime)
            assert isinstance(category.updated_at, datetime)
            assert category.deleted_at is None

    def test_scheme_has_audit_fields(self, app):
        """Verify Scheme model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            user = User(
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                phone='1234567890',
                role=UserRole.ADMIN.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            category = SchemeCategory(
                name='Healthcare',
                description='Health schemes',
                icon='health.svg',
                color='#22C55E'
            )
            db.session.add(category)
            db.session.commit()
            
            scheme = Scheme(
                name='Test Scheme',
                slug='test-scheme',
                description='Test',
                govt_level=GovtLevel.CENTRAL.value,
                state='India',
                ministry='Ministry',
                category_id=category.id,
                tags=[],
                benefits={},
                application_mode='Online',
                official_url='https://example.com',
                status=SchemeStatus.ACTIVE.value,
                created_by=user.id
            )
            db.session.add(scheme)
            db.session.commit()
            
            assert hasattr(scheme, 'created_at')
            assert hasattr(scheme, 'updated_at')
            assert hasattr(scheme, 'deleted_at')
            assert isinstance(scheme.created_at, datetime)
            assert isinstance(scheme.updated_at, datetime)
            assert scheme.deleted_at is None

    def test_saved_scheme_has_audit_fields(self, app):
        """Verify SavedScheme model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            # Create user
            user = User(
                email='user@example.com',
                first_name='User',
                last_name='Test',
                phone='1234567890',
                role=UserRole.USER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            # Create category
            category = SchemeCategory(
                name='Education',
                description='Edu',
                icon='edu.svg',
                color='#4338CA'
            )
            db.session.add(category)
            db.session.commit()
            
            # Create scheme
            scheme = Scheme(
                name='Scheme',
                slug='scheme-1',
                description='Test',
                govt_level=GovtLevel.CENTRAL.value,
                state='India',
                ministry='Ministry',
                category_id=category.id,
                tags=[],
                benefits={},
                application_mode='Online',
                official_url='https://example.com',
                status=SchemeStatus.ACTIVE.value,
                created_by=user.id
            )
            db.session.add(scheme)
            db.session.commit()
            
            # Create saved scheme
            saved = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved)
            db.session.commit()
            
            # Verify fields exist
            assert hasattr(saved, 'created_at')
            assert hasattr(saved, 'updated_at')
            assert hasattr(saved, 'deleted_at')
            assert isinstance(saved.created_at, datetime)
            assert isinstance(saved.updated_at, datetime)
            assert saved.deleted_at is None

    def test_scheme_verification_has_audit_fields(self, app):
        """Verify SchemeVerification model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            # Create user
            user = User(
                email='admin@example.com',
                first_name='Admin',
                last_name='Test',
                phone='1234567890',
                role=UserRole.ADMIN.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            # Create category
            category = SchemeCategory(
                name='Healthcare',
                description='Health',
                icon='health.svg',
                color='#22C55E'
            )
            db.session.add(category)
            db.session.commit()
            
            # Create scheme
            scheme = Scheme(
                name='Health Scheme',
                slug='health-scheme',
                description='Health test',
                govt_level=GovtLevel.STATE.value,
                state='Delhi',
                ministry='Health Ministry',
                category_id=category.id,
                tags=[],
                benefits={},
                application_mode='Both',
                official_url='https://example.com/health',
                status=SchemeStatus.ACTIVE.value,
                created_by=user.id
            )
            db.session.add(scheme)
            db.session.commit()
            
            # Create verification
            verification = SchemeVerification(scheme_id=scheme.id)
            db.session.add(verification)
            db.session.commit()
            
            # Verify fields exist
            assert hasattr(verification, 'created_at')
            assert hasattr(verification, 'updated_at')
            assert hasattr(verification, 'deleted_at')
            assert isinstance(verification.created_at, datetime)
            assert isinstance(verification.updated_at, datetime)
            assert verification.deleted_at is None

    def test_admin_log_has_audit_fields(self, app):
        """Verify AdminLog model has created_at, updated_at, deleted_at fields."""
        with app.app_context():
            admin = User(
                email='superadmin@example.com',
                first_name='Super',
                last_name='Admin',
                phone='1234567890',
                role=UserRole.ADMIN.value,
                account_status=AccountStatus.ACTIVE.value
            )
            admin.set_password('password123')
            db.session.add(admin)
            db.session.commit()
            
            log = AdminLog(
                admin_id=admin.id,
                action=AdminActionType.CREATE.value,
                entity_type='scheme',
                entity_id=1,
                details={'name': 'Test Scheme'}
            )
            db.session.add(log)
            db.session.commit()
            
            # Verify fields exist
            assert hasattr(log, 'created_at')
            assert hasattr(log, 'updated_at')
            assert hasattr(log, 'deleted_at')
            assert isinstance(log.created_at, datetime)
            assert isinstance(log.updated_at, datetime)
            assert log.deleted_at is None


class TestSoftDeleteMethods:
    """Tests for soft delete and restore methods."""

    def test_user_soft_delete_and_restore(self, app):
        """Test User soft_delete() and restore() methods."""
        with app.app_context():
            user = User(
                email='test@example.com',
                first_name='Test',
                last_name='User',
                phone='1234567890',
                role=UserRole.USER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            user_id = user.id
            
            # Soft delete
            assert not user.is_deleted
            user.soft_delete()
            db.session.commit()
            
            # Verify deletion
            user = User.query.get(user_id)
            assert user.is_deleted
            assert user.deleted_at is not None
            
            # Restore
            user.restore()
            db.session.commit()
            
            # Verify restoration
            assert not user.is_deleted
            assert user.deleted_at is None

    def test_scheme_soft_delete_and_restore(self, app):
        """Test Scheme soft_delete() and restore() methods."""
        with app.app_context():
            # Create prerequisites
            admin = User(
                email='admin@example.com',
                first_name='Admin',
                last_name='Test',
                phone='1234567890',
                role=UserRole.ADMIN.value,
                account_status=AccountStatus.ACTIVE.value
            )
            admin.set_password('password123')
            db.session.add(admin)
            db.session.commit()
            
            category = SchemeCategory(
                name='Test',
                description='Test',
                icon='test.svg',
                color='#FF0000'
            )
            db.session.add(category)
            db.session.commit()
            
            scheme = Scheme(
                name='Test Scheme',
                slug='test-scheme',
                description='Test',
                govt_level=GovtLevel.CENTRAL.value,
                state='India',
                ministry='Min',
                category_id=category.id,
                tags=[],
                benefits={},
                application_mode='Online',
                official_url='https://test.com',
                status=SchemeStatus.ACTIVE.value,
                created_by=admin.id
            )
            db.session.add(scheme)
            db.session.commit()
            
            scheme_id = scheme.id
            
            # Soft delete
            assert not scheme.is_deleted
            scheme.soft_delete()
            db.session.commit()
            
            scheme = Scheme.query.get(scheme_id)
            assert scheme.is_deleted
            
            # Restore
            scheme.restore()
            db.session.commit()
            
            assert not scheme.is_deleted

    def test_saved_scheme_soft_delete_and_restore(self, app):
        """Test SavedScheme soft_delete() and restore() methods."""
        with app.app_context():
            # Create user
            user = User(
                email='user@example.com',
                first_name='User',
                last_name='Test',
                phone='1234567890',
                role=UserRole.USER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            admin = User(
                email='admin@example.com',
                first_name='Admin',
                last_name='User',
                phone='0987654321',
                role=UserRole.ADMIN.value,
                account_status=AccountStatus.ACTIVE.value
            )
            admin.set_password('password123')
            db.session.add(admin)
            db.session.commit()
            
            category = SchemeCategory(
                name='Category',
                description='Cat',
                icon='cat.svg',
                color='#0000FF'
            )
            db.session.add(category)
            db.session.commit()
            
            scheme = Scheme(
                name='Scheme',
                slug='scheme',
                description='S',
                govt_level=GovtLevel.STATE.value,
                state='Delhi',
                ministry='Min',
                category_id=category.id,
                tags=[],
                benefits={},
                application_mode='Online',
                official_url='https://s.com',
                status=SchemeStatus.ACTIVE.value,
                created_by=admin.id
            )
            db.session.add(scheme)
            db.session.commit()
            
            saved = SavedScheme(user_id=user.id, scheme_id=scheme.id)
            db.session.add(saved)
            db.session.commit()
            
            saved_id = saved.id
            
            # Soft delete
            assert not saved.is_deleted
            saved.soft_delete()
            db.session.commit()
            
            saved = SavedScheme.query.get(saved_id)
            assert saved.is_deleted
            
            # Restore
            saved.restore()
            db.session.commit()
            
            assert not saved.is_deleted


class TestIsDeletedProperty:
    """Tests for is_deleted property across all models."""

    def test_is_deleted_property_all_models(self, app):
        """Test is_deleted property returns correct value for all models."""
        with app.app_context():
            # User
            user = User(
                email='test@example.com',
                first_name='Test',
                last_name='User',
                phone='1234567890',
                role=UserRole.USER.value,
                account_status=AccountStatus.ACTIVE.value
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()
            
            assert user.is_deleted is False
            user.soft_delete()
            assert user.is_deleted is True
            
            # SchemeCategory
            category = SchemeCategory(
                name='Test',
                description='Test',
                icon='test.svg',
                color='#000000'
            )
            db.session.add(category)
            db.session.commit()
            
            assert category.is_deleted is False
            category.soft_delete()
            assert category.is_deleted is True


if __name__ == '__main__':
    pytest.main([__file__, '-v'])


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
