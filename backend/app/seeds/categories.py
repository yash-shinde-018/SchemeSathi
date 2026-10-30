"""
Category seeder module for SchemeSathi.

Provides flexible category seeding functionality through the CategorySeeder class.
Handles creation, updating, clearing, and management of scheme categories with
comprehensive data validation and error handling.

Features:
- Seed all 10 standard categories
- Seed individual categories
- Clear/delete categories
- Update existing categories
- Retrieve category information
- Duplicate prevention
- Error handling and logging
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from flask import current_app
from app.database import db
from app.models import SchemeCategory


# Standard category definitions with all required fields
CATEGORIES = [
    {
        'name': 'Education',
        'description': 'Government schemes supporting education and scholarships for students at all levels'
    },
    {
        'name': 'Healthcare',
        'description': 'Medical assistance, health insurance, and wellness schemes for health protection'
    },
    {
        'name': 'Agriculture',
        'description': 'Support for farmers and agricultural development, crop insurance, and farming assistance'
    },
    {
        'name': 'Employment',
        'description': 'Job creation and employment support programs for skill development and employment'
    },
    {
        'name': 'Housing',
        'description': 'Affordable housing and construction assistance for home ownership and shelter'
    },
    {
        'name': 'Women & Child Welfare',
        'description': 'Programs supporting women empowerment, safety, and welfare of children'
    },
    {
        'name': 'Senior Citizen',
        'description': 'Benefits and support programs designed for elderly citizens and pensioners'
    },
    {
        'name': 'Social Welfare',
        'description': 'Social security and welfare schemes for vulnerable groups and economically weak sections'
    },
    {
        'name': 'Business & Entrepreneurship',
        'description': 'Support for startups, business development, and entrepreneurship initiatives'
    },
    {
        'name': 'Other',
        'description': 'Other government schemes and benefits not covered by specific categories'
    }
]

# Icon and color mappings for categories
CATEGORY_ICONS = {
    'Education': '🎓',
    'Healthcare': '🏥',
    'Agriculture': '🌾',
    'Employment': '💼',
    'Housing': '🏠',
    'Women & Child Welfare': '👩',
    'Senior Citizen': '👴',
    'Social Welfare': '🤝',
    'Business & Entrepreneurship': '🚀',
    'Other': '📋'
}

CATEGORY_COLORS = {
    'Education': '#3B82F6',
    'Healthcare': '#EF4444',
    'Agriculture': '#10B981',
    'Employment': '#8B5CF6',
    'Housing': '#F59E0B',
    'Women & Child Welfare': '#EC4899',
    'Senior Citizen': '#6366F1',
    'Social Welfare': '#14B8A6',
    'Business & Entrepreneurship': '#F97316',
    'Other': '#64748B'
}


class CategorySeeder:
    """
    Seeder class for managing scheme categories.
    
    Provides methods for creating, updating, deleting, and managing scheme categories
    with comprehensive error handling and validation.
    
    Methods:
        seed_all() - Seed all 10 standard categories
        seed_by_name(category_name) - Seed a specific category by name
        clear_all() - Delete all categories
        update_category(name, **kwargs) - Update an existing category
        get_category(name) - Retrieve a category by name
        get_all_categories() - Retrieve all categories
        category_exists(name) - Check if category exists
    """
    
    def __init__(self):
        """Initialize the CategorySeeder."""
        self.logger = current_app.logger if current_app else None
    
    @staticmethod
    def _log(message: str, level: str = 'info'):
        """
        Log a message using Flask logger if available.
        
        Args:
            message (str): Message to log
            level (str): Log level (info, warning, error, debug)
        """
        if current_app:
            getattr(current_app.logger, level, print)(message)
        else:
            print(message)
    
    def seed_all(self, skip_duplicates: bool = True) -> Dict[str, Any]:
        """
        Seed all 10 standard categories.
        
        Creates all standard categories in the database. Optionally skips
        categories that already exist to prevent duplicates.
        
        Args:
            skip_duplicates (bool): Skip categories that already exist (default: True)
        
        Returns:
            dict: Result summary with:
                - created: Number of categories created
                - skipped: Number of categories skipped
                - failed: Number of categories that failed
                - categories: List of created category names
        
        Raises:
            Exception: If database error occurs
        """
        result = {
            'created': 0,
            'skipped': 0,
            'failed': 0,
            'categories': [],
            'errors': []
        }
        
        try:
            self._log(f"Seeding {len(CATEGORIES)} categories...")
            
            for category_data in CATEGORIES:
                try:
                    # Check if category already exists
                    existing = self.category_exists(category_data['name'])
                    
                    if existing and skip_duplicates:
                        self._log(f"  ⊘ Skipping '{category_data['name']}' (already exists)", 'debug')
                        result['skipped'] += 1
                        continue
                    
                    # Create new category with icon and color from mappings
                    category_name = category_data['name']
                    category = SchemeCategory(
                        name=category_name,
                        description=category_data['description'],
                        icon=CATEGORY_ICONS.get(category_name, '📋'),
                        color=CATEGORY_COLORS.get(category_name, '#64748B')
                    )
                    db.session.add(category)
                    result['categories'].append(category_name)
                    result['created'] += 1
                    self._log(f"  ✓ Created category: {category_name}", 'debug')
                    
                except Exception as e:
                    self._log(f"  ✗ Failed to create '{category_data['name']}': {str(e)}", 'error')
                    result['failed'] += 1
                    result['errors'].append(str(e))
            
            # Commit all changes
            db.session.commit()
            self._log(f"✓ Successfully seeded categories: {result['created']} created, {result['skipped']} skipped")
            
            return result
            
        except Exception as e:
            db.session.rollback()
            self._log(f"✗ Error seeding categories: {str(e)}", 'error')
            raise
    
    def seed_by_name(self, category_name: str) -> Optional[SchemeCategory]:
        """
        Seed a specific category by name.
        
        Creates a single category if it doesn't already exist.
        
        Args:
            category_name (str): Name of category to seed (must match CATEGORIES)
        
        Returns:
            SchemeCategory: Created category object or None if not found/failed
        
        Raises:
            ValueError: If category name not found in standard categories
            Exception: If database error occurs
        """
        try:
            # Find category definition
            category_def = None
            for cat in CATEGORIES:
                if cat['name'].lower() == category_name.lower():
                    category_def = cat
                    break
            
            if not category_def:
                self._log(f"Category '{category_name}' not found in standard categories", 'warning')
                raise ValueError(f"Category '{category_name}' not found in standard categories")
            
            # Check if already exists
            if self.category_exists(category_name):
                self._log(f"Category '{category_name}' already exists", 'debug')
                return self.get_category(category_name)
            
            # Create category with icon and color from mappings
            category = SchemeCategory(
                name=category_def['name'],
                description=category_def['description'],
                icon=CATEGORY_ICONS.get(category_def['name'], '📋'),
                color=CATEGORY_COLORS.get(category_def['name'], '#64748B')
            )
            db.session.add(category)
            db.session.commit()
            self._log(f"✓ Created category: {category_name}")
            
            return category
            
        except Exception as e:
            db.session.rollback()
            self._log(f"✗ Error seeding category '{category_name}': {str(e)}", 'error')
            raise
    
    def clear_all(self, confirm: bool = False) -> Dict[str, Any]:
        """
        Delete all categories from the database.
        
        WARNING: This is a destructive operation that cannot be undone!
        
        Args:
            confirm (bool): Must be True to proceed (safety check)
        
        Returns:
            dict: Result summary with:
                - deleted: Number of categories deleted
                - message: Status message
        
        Raises:
            ValueError: If confirm is not True
            Exception: If database error occurs
        """
        if not confirm:
            raise ValueError("Must confirm deletion by passing confirm=True")
        
        try:
            self._log("Clearing all categories...")
            
            # Delete all categories (cascade will handle related data)
            count = SchemeCategory.query.delete()
            db.session.commit()
            
            result = {
                'deleted': count,
                'message': f'Deleted {count} categories'
            }
            
            self._log(f"✓ Cleared {count} categories")
            return result
            
        except Exception as e:
            db.session.rollback()
            self._log(f"✗ Error clearing categories: {str(e)}", 'error')
            raise
    
    def update_category(self, name: str, **kwargs) -> Optional[SchemeCategory]:
        """
        Update an existing category with new data.
        
        Args:
            name (str): Name of category to update
            **kwargs: Fields to update (name, description, icon, color)
        
        Returns:
            SchemeCategory: Updated category object or None if not found
        
        Raises:
            ValueError: If category not found or invalid fields provided
            Exception: If database error occurs
        """
        try:
            category = self.get_category(name)
            if not category:
                raise ValueError(f"Category '{name}' not found")
            
            # Valid fields that can be updated (matches SchemeCategory model fields)
            valid_fields = {'name', 'description', 'icon', 'color'}
            
            # Check for invalid fields
            invalid_fields = set(kwargs.keys()) - valid_fields
            if invalid_fields:
                raise ValueError(f"Invalid fields: {', '.join(invalid_fields)}")
            
            # Update fields
            for field, value in kwargs.items():
                if hasattr(category, field):
                    setattr(category, field, value)
            
            category.updated_at = datetime.utcnow()
            db.session.commit()
            
            self._log(f"✓ Updated category: {name}")
            return category
            
        except Exception as e:
            db.session.rollback()
            self._log(f"✗ Error updating category '{name}': {str(e)}", 'error')
            raise
    
    def get_category(self, name: str) -> Optional[SchemeCategory]:
        """
        Retrieve a category by name.
        
        Args:
            name (str): Category name (case-insensitive)
        
        Returns:
            SchemeCategory: Category object or None if not found
        """
        try:
            return SchemeCategory.query.filter_by(name=name).first()
        except Exception as e:
            self._log(f"✗ Error retrieving category '{name}': {str(e)}", 'error')
            return None
    
    def get_all_categories(self, active_only: bool = False) -> List[SchemeCategory]:
        """
        Retrieve all categories.
        
        Args:
            active_only (bool): Only return active categories (default: False)
        
        Returns:
            list: List of SchemeCategory objects ordered by ID
        """
        try:
            query = SchemeCategory.query
            
            # Note: active_only parameter kept for API compatibility,
            # but SchemeCategory doesn't have is_active field
            return query.order_by(SchemeCategory.id).all()
            
        except Exception as e:
            self._log(f"✗ Error retrieving categories: {str(e)}", 'error')
            return []
    
    def category_exists(self, name: str) -> bool:
        """
        Check if a category exists by name.
        
        Args:
            name (str): Category name (case-insensitive)
        
        Returns:
            bool: True if category exists, False otherwise
        """
        try:
            return SchemeCategory.query.filter_by(name=name).first() is not None
        except Exception:
            return False
    
    @staticmethod
    def _create_category(**data) -> SchemeCategory:
        """
        Internal method to create a SchemeCategory object.
        
        Args:
            **data: Category data (name, description, icon, color)
        
        Returns:
            SchemeCategory: New SchemeCategory instance (not yet saved)
        """
        return SchemeCategory(
            name=data.get('name'),
            description=data.get('description'),
            icon=data.get('icon'),
            color=data.get('color')
        )
