"""
Database fixture loading utility for testing.

Provides utilities to seed test data consistently across tests.
Includes:
- Fixture loading from JSON/dictionaries
- Bulk data creation
- Snapshot and restore functionality

Usage:
    from app.utils.db_fixtures import FixtureLoader, create_test_data
    
    loader = FixtureLoader()
    fixtures = loader.load_from_dict({...})
    
    # Or use convenience functions
    data = create_test_data(
        users=2,
        schemes_per_category=5,
    )
"""

import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime, timedelta
import logging

from app.database import db
from app.models import (
    User, UserProfile, SchemeCategory, Scheme, SavedScheme,
    SchemeVerification, AdminLog, UserRole, AccountStatus,
    Gender, Education, SocialCategory, DisabilityStatus,
    GovtLevel, SchemeStatus
)

logger = logging.getLogger(__name__)


class FixtureLoader:
    """
    Fixture loader for seeding test data from dictionaries or JSON.
    
    Provides methods to load complex test data structures including
    relationships and nested objects.
    
    Example:
        loader = FixtureLoader()
        fixtures = {
            'users': [
                {
                    'email': 'user1@example.com',
                    'password': 'Password123!',
                    'first_name': 'Test',
                    'last_name': 'User',
                    'phone': '+91-1234567890'
                }
            ],
            'categories': [
                {
                    'name': 'Education',
                    'description': 'Educational schemes',
                    'icon': '📚',
                    'color': '#0066cc'
                }
            ]
        }
        result = loader.load_from_dict(fixtures)
    """
    
    def __init__(self):
        """Initialize fixture loader."""
        self.created_entities = {
            'users': [],
            'profiles': [],
            'categories': [],
            'schemes': [],
            'saved_schemes': [],
            'verifications': [],
            'admin_logs': []
        }
    
    def load_from_dict(self, fixtures: Dict[str, Any]) -> Dict[str, List[Any]]:
        """
        Load fixtures from dictionary structure.
        
        Args:
            fixtures: Dictionary with keys like 'users', 'categories', 'schemes'
            
        Returns:
            Dictionary mapping entity types to created instances
            
        Raises:
            ValueError: If fixture format is invalid
            IntegrityError: If data violates database constraints
        """
        logger.info("Loading fixtures from dictionary")
        
        try:
            # Load categories first (no dependencies)
            if 'categories' in fixtures:
                self._load_categories(fixtures['categories'])
            
            # Load users and their profiles
            if 'users' in fixtures:
                self._load_users(fixtures['users'])
            
            # Load schemes (depends on categories)
            if 'schemes' in fixtures:
                self._load_schemes(fixtures['schemes'])
            
            # Load saved schemes (depends on users and schemes)
            if 'saved_schemes' in fixtures:
                self._load_saved_schemes(fixtures['saved_schemes'])
            
            # Load verifications (depends on schemes and users)
            if 'verifications' in fixtures:
                self._load_verifications(fixtures['verifications'])
            
            # Load admin logs
            if 'admin_logs' in fixtures:
                self._load_admin_logs(fixtures['admin_logs'])
            
            logger.info(f"Fixture loading complete: {self._get_summary()}")
            return self.created_entities
        
        except Exception as e:
            logger.error(f"Error loading fixtures: {str(e)}")
            db.session.rollback()
            raise
    
    def load_from_file(self, filepath: str) -> Dict[str, List[Any]]:
        """
        Load fixtures from JSON file.
        
        Args:
            filepath: Path to JSON fixture file
            
        Returns:
            Dictionary mapping entity types to created instances
            
        Raises:
            FileNotFoundError: If file doesn't exist
            json.JSONDecodeError: If JSON is invalid
        """
        logger.info(f"Loading fixtures from file: {filepath}")
        
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Fixture file not found: {filepath}")
        
        with open(path, 'r') as f:
            fixtures = json.load(f)
        
        return self.load_from_dict(fixtures)
    
    def _load_categories(self, categories: List[Dict]) -> None:
        """Load SchemeCategory fixtures."""
        for cat_data in categories:
            category = SchemeCategory(
                name=cat_data.get('name'),
                description=cat_data.get('description', ''),
                icon=cat_data.get('icon', '📋'),
                color=cat_data.get('color', '#000000')
            )
            db.session.add(category)
            self.created_entities['categories'].append(category)
        
        db.session.commit()
        logger.debug(f"Loaded {len(categories)} categories")
    
    def _load_users(self, users: List[Dict]) -> None:
        """Load User and UserProfile fixtures."""
        for user_data in users:
            # Create user
            user = User(
                email=user_data.get('email'),
                first_name=user_data.get('first_name', 'Test'),
                last_name=user_data.get('last_name', 'User'),
                phone=user_data.get('phone', '+91-1234567890'),
                role=user_data.get('role', UserRole.USER.value),
                account_status=user_data.get('account_status', AccountStatus.ACTIVE.value)
            )
            
            # Set password
            if 'password' in user_data:
                user.set_password(user_data['password'])
            else:
                user.set_password('TestPassword123!')
            
            db.session.add(user)
            db.session.flush()
            self.created_entities['users'].append(user)
            
            # Create profile
            profile_data = user_data.get('profile', {})
            profile = UserProfile(
                user_id=user.id,
                date_of_birth=profile_data.get('date_of_birth'),
                gender=profile_data.get('gender', Gender.OTHER.value),
                state=profile_data.get('state', 'Test State'),
                district=profile_data.get('district', 'Test District'),
                city=profile_data.get('city', 'Test City'),
                occupation=profile_data.get('occupation'),
                education=profile_data.get('education', Education.BACHELOR.value),
                income=profile_data.get('income'),
                social_category=profile_data.get('social_category', SocialCategory.GENERAL.value),
                disability_status=profile_data.get('disability_status', DisabilityStatus.NO.value)
            )
            db.session.add(profile)
            self.created_entities['profiles'].append(profile)
        
        db.session.commit()
        logger.debug(f"Loaded {len(users)} users with profiles")
    
    def _load_schemes(self, schemes: List[Dict]) -> None:
        """Load Scheme fixtures."""
        for scheme_data in schemes:
            # Get category
            category_name = scheme_data.get('category')
            category = None
            if category_name:
                category = SchemeCategory.query.filter_by(name=category_name).first()
            
            if not category:
                # Create default category if not found
                category = SchemeCategory.query.first()
                if not category:
                    raise ValueError(f"Category '{category_name}' not found and no default available")
            
            scheme = Scheme(
                name=scheme_data.get('name'),
                slug=scheme_data.get('slug'),
                description=scheme_data.get('description', ''),
                govt_level=scheme_data.get('govt_level', GovtLevel.CENTRAL.value),
                state=scheme_data.get('state'),
                ministry=scheme_data.get('ministry', 'Test Ministry'),
                category_id=category.id,
                tags=scheme_data.get('tags', []),
                eligibility=scheme_data.get('eligibility', {}),
                exclusions=scheme_data.get('exclusions', []),
                benefits=scheme_data.get('benefits', {}),
                application_process=scheme_data.get('application_process', ''),
                documents=scheme_data.get('documents', []),
                faqs=scheme_data.get('faqs', []),
                application_mode=scheme_data.get('application_mode', 'ONLINE'),
                official_url=scheme_data.get('official_url', 'https://example.com'),
                myscheme_url=scheme_data.get('myscheme_url'),
                status=scheme_data.get('status', SchemeStatus.ACTIVE.value)
            )
            db.session.add(scheme)
            self.created_entities['schemes'].append(scheme)
        
        db.session.commit()
        logger.debug(f"Loaded {len(schemes)} schemes")
    
    def _load_saved_schemes(self, saved_schemes: List[Dict]) -> None:
        """Load SavedScheme fixtures."""
        for saved_data in saved_schemes:
            user = User.query.filter_by(email=saved_data.get('user_email')).first()
            scheme = Scheme.query.filter_by(name=saved_data.get('scheme_name')).first()
            
            if not user or not scheme:
                logger.warning(f"Cannot create SavedScheme: user or scheme not found")
                continue
            
            saved = SavedScheme(
                user_id=user.id,
                scheme_id=scheme.id
            )
            db.session.add(saved)
            self.created_entities['saved_schemes'].append(saved)
        
        db.session.commit()
        logger.debug(f"Loaded {len(saved_schemes)} saved schemes")
    
    def _load_verifications(self, verifications: List[Dict]) -> None:
        """Load SchemeVerification fixtures."""
        for verif_data in verifications:
            scheme = Scheme.query.filter_by(name=verif_data.get('scheme_name')).first()
            verified_by_user = None
            
            if verif_data.get('verified_by_email'):
                verified_by_user = User.query.filter_by(
                    email=verif_data.get('verified_by_email')
                ).first()
            
            if not scheme:
                logger.warning(f"Cannot create verification: scheme not found")
                continue
            
            verif = SchemeVerification(
                scheme_id=scheme.id,
                official_source_verified=verif_data.get('official_source_verified', False),
                eligibility_verified=verif_data.get('eligibility_verified', False),
                benefits_verified=verif_data.get('benefits_verified', False),
                documents_verified=verif_data.get('documents_verified', False),
                application_process_verified=verif_data.get('application_process_verified', False),
                url_verified=verif_data.get('url_verified', False),
                verification_notes=verif_data.get('verification_notes'),
                verified_by=verified_by_user.id if verified_by_user else None
            )
            db.session.add(verif)
            self.created_entities['verifications'].append(verif)
        
        db.session.commit()
        logger.debug(f"Loaded {len(verifications)} verifications")
    
    def _load_admin_logs(self, admin_logs: List[Dict]) -> None:
        """Load AdminLog fixtures."""
        for log_data in admin_logs:
            admin_user = None
            if log_data.get('admin_email'):
                admin_user = User.query.filter_by(email=log_data.get('admin_email')).first()
            
            log = AdminLog(
                admin_id=admin_user.id if admin_user else None,
                action=log_data.get('action'),
                entity_type=log_data.get('entity_type'),
                entity_id=log_data.get('entity_id'),
                details=log_data.get('details', {}),
                timestamp=datetime.utcnow()
            )
            db.session.add(log)
            self.created_entities['admin_logs'].append(log)
        
        db.session.commit()
        logger.debug(f"Loaded {len(admin_logs)} admin logs")
    
    def _get_summary(self) -> str:
        """Get summary of loaded entities."""
        summary = []
        for entity_type, entities in self.created_entities.items():
            if entities:
                summary.append(f"{entity_type}={len(entities)}")
        return ", ".join(summary)


def create_test_data(
    num_users: int = 1,
    num_categories: int = 3,
    num_schemes_per_category: int = 2,
    num_saved_schemes: int = 0,
    create_verifications: bool = False
) -> Dict[str, List[Any]]:
    """
    Create test data conveniently.
    
    Args:
        num_users: Number of users to create
        num_categories: Number of categories to create
        num_schemes_per_category: Number of schemes per category
        num_saved_schemes: Number of user-scheme associations to create
        create_verifications: Whether to create verifications for schemes
    
    Returns:
        Dictionary with created entities
        
    Example:
        >>> data = create_test_data(num_users=5, num_categories=2)
        >>> print(f"Created {len(data['users'])} users")
    """
    logger.info(
        f"Creating test data: {num_users} users, {num_categories} categories, "
        f"{num_schemes_per_category} schemes per category"
    )
    
    fixtures = {
        'categories': [
            {
                'name': f'Category {i}',
                'description': f'Test category {i}',
                'icon': '📋',
                'color': f'#{i:06x}'
            }
            for i in range(num_categories)
        ],
        'users': [
            {
                'email': f'user{i}@example.com',
                'first_name': f'User',
                'last_name': f'{i}',
                'phone': f'+91-{i:010d}',
                'profile': {
                    'state': f'State {i % 5}',
                    'district': f'District {i % 10}',
                    'city': f'City {i % 15}'
                }
            }
            for i in range(num_users)
        ],
        'schemes': []
    }
    
    # Create schemes for each category
    scheme_count = 0
    for cat_idx in range(num_categories):
        for scheme_idx in range(num_schemes_per_category):
            scheme_count += 1
            fixtures['schemes'].append({
                'name': f'Scheme {scheme_count}',
                'slug': f'scheme-{scheme_count}',
                'description': f'Test scheme {scheme_count}',
                'category': f'Category {cat_idx}',
                'govt_level': 'CENTRAL' if scheme_count % 2 == 0 else 'STATE',
                'ministry': f'Ministry {cat_idx}',
                'official_url': f'https://example.com/scheme{scheme_count}'
            })
    
    # Create saved schemes
    if num_saved_schemes > 0:
        fixtures['saved_schemes'] = [
            {
                'user_email': f'user{i % num_users}@example.com',
                'scheme_name': f'Scheme {(i % (num_categories * num_schemes_per_category)) + 1}'
            }
            for i in range(num_saved_schemes)
        ]
    
    # Create verifications
    if create_verifications:
        fixtures['verifications'] = [
            {
                'scheme_name': f'Scheme {i + 1}',
                'official_source_verified': True,
                'eligibility_verified': True,
                'benefits_verified': True,
                'verified_by_email': f'user0@example.com'
            }
            for i in range(min(3, scheme_count))
        ]
    
    loader = FixtureLoader()
    return loader.load_from_dict(fixtures)
