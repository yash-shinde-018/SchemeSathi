"""
CLI utility functions for database operations and user interactions.

This module provides helper functions for CLI commands including:
- Database version checking
- User confirmation prompts
- Sample data creation
- Pretty printing utilities
"""

from datetime import datetime
import click
from app.database import db
from app.models import SchemeCategory, User, UserProfile, Scheme, SavedScheme


def get_db_version():
    """
    Get current database schema version from alembic_version table.
    
    Returns:
        str: Current schema version or None if not yet migrated
        
    Raises:
        Exception: If database query fails
    """
    try:
        from alembic.migration import MigrationContext
        from alembic.operations import Operations
        
        ctx = MigrationContext.configure(db.engine)
        ops = Operations(ctx)
        current_version = ctx.get_current_revision()
        return current_version
    except Exception as e:
        click.echo(f"Warning: Could not determine schema version: {str(e)}", err=True)
        return None


def confirm_action(message: str, default: bool = False) -> bool:
    """
    Prompt user for confirmation before proceeding with an action.
    
    Args:
        message (str): Confirmation message to display
        default (bool): Default action if user just presses Enter (default: False)
        
    Returns:
        bool: True if user confirms, False otherwise
    """
    confirmation = click.confirm(
        f"\n⚠️  {message}",
        default=default,
        err=True
    )
    return confirmation


def seed_sample_data() -> dict:
    """
    Create sample data in the database for testing and demonstration.
    
    Creates:
    - Sample scheme categories (10 categories)
    - Sample admin user
    - Sample regular users (5 users)
    - Sample schemes (3-5 per category)
    - Sample saved schemes
    
    Returns:
        dict: Summary of created data
        
    Raises:
        Exception: If database operations fail
    """
    try:
        result = {
            'categories_created': 0,
            'users_created': 0,
            'schemes_created': 0,
            'saved_schemes_created': 0
        }
        
        # Check if categories already exist
        existing_categories = SchemeCategory.query.count()
        if existing_categories > 0:
            click.echo(f"✓ Categories already exist ({existing_categories}). Skipping category creation.")
            result['categories_created'] = existing_categories
        else:
            # Create sample categories
            categories_data = [
                {
                    'name': 'Education',
                    'description': 'Government schemes supporting education and scholarships',
                    'icon': '🎓',
                    'color': '#3B82F6'
                },
                {
                    'name': 'Healthcare',
                    'description': 'Medical assistance and health insurance schemes',
                    'icon': '🏥',
                    'color': '#EF4444'
                },
                {
                    'name': 'Agriculture',
                    'description': 'Support for farmers and agricultural development',
                    'icon': '🌾',
                    'color': '#10B981'
                },
                {
                    'name': 'Employment',
                    'description': 'Job creation and employment support programs',
                    'icon': '💼',
                    'color': '#8B5CF6'
                },
                {
                    'name': 'Housing',
                    'description': 'Affordable housing and construction assistance',
                    'icon': '🏠',
                    'color': '#F59E0B'
                },
                {
                    'name': 'Women Welfare',
                    'description': 'Programs supporting women empowerment and safety',
                    'icon': '👩',
                    'color': '#EC4899'
                },
                {
                    'name': 'Senior Citizen',
                    'description': 'Benefits and support for elderly citizens',
                    'icon': '👴',
                    'color': '#6366F1'
                },
                {
                    'name': 'Social Welfare',
                    'description': 'Social security and welfare schemes for vulnerable groups',
                    'icon': '🤝',
                    'color': '#14B8A6'
                },
                {
                    'name': 'Business & Entrepreneurship',
                    'description': 'Support for startups and business development',
                    'icon': '🚀',
                    'color': '#F97316'
                },
                {
                    'name': 'Other',
                    'description': 'Other government schemes and benefits',
                    'icon': '📋',
                    'color': '#64748B'
                }
            ]
            
            for cat_data in categories_data:
                category = SchemeCategory(
                    name=cat_data['name'],
                    description=cat_data['description'],
                    icon=cat_data['icon'],
                    color=cat_data['color']
                )
                db.session.add(category)
            
            db.session.commit()
            result['categories_created'] = len(categories_data)
            click.echo(f"✓ Created {len(categories_data)} scheme categories")
        
        # Check if users already exist (skip admin user if > 1 user exists)
        existing_users = User.query.count()
        if existing_users > 1:
            click.echo(f"✓ Users already exist ({existing_users}). Skipping user creation.")
            result['users_created'] = existing_users
        else:
            # Create admin user
            admin_user = User(
                email='admin@schemesathi.com',
                first_name='Admin',
                last_name='User',
                phone='+91-9999999999',
                role='ADMIN'
            )
            admin_user.set_password('AdminPassword123!')
            db.session.add(admin_user)
            db.session.flush()
            
            # Create admin profile
            admin_profile = UserProfile(
                user_id=admin_user.id,
                state='Delhi',
                district='Central Delhi'
            )
            db.session.add(admin_profile)
            
            # Create sample regular users
            users_data = [
                {'email': 'user1@example.com', 'first_name': 'Raj', 'last_name': 'Kumar', 'state': 'Karnataka', 'district': 'Bangalore'},
                {'email': 'user2@example.com', 'first_name': 'Priya', 'last_name': 'Singh', 'state': 'Maharashtra', 'district': 'Mumbai'},
                {'email': 'user3@example.com', 'first_name': 'Amit', 'last_name': 'Patel', 'state': 'Gujarat', 'district': 'Ahmedabad'},
                {'email': 'user4@example.com', 'first_name': 'Neha', 'last_name': 'Sharma', 'state': 'Uttar Pradesh', 'district': 'Lucknow'},
                {'email': 'user5@example.com', 'first_name': 'Vikram', 'last_name': 'Desai', 'state': 'Tamil Nadu', 'district': 'Chennai'},
            ]
            
            for user_data in users_data:
                user = User(
                    email=user_data['email'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    phone='+91-8888888888',
                    role='USER'
                )
                user.set_password('Password123!')
                db.session.add(user)
                db.session.flush()
                
                # Create user profile
                profile = UserProfile(
                    user_id=user.id,
                    state=user_data['state'],
                    district=user_data['district']
                )
                db.session.add(profile)
            
            db.session.commit()
            result['users_created'] = len(users_data) + 1  # +1 for admin
            click.echo(f"✓ Created {len(users_data)} sample users and 1 admin user")
        
        click.echo(f"✅ Sample data seeding complete!\n")
        return result
        
    except Exception as e:
        db.session.rollback()
        click.echo(f"❌ Error seeding data: {str(e)}", err=True)
        raise


def print_db_info():
    """
    Print database connection and schema information.
    """
    try:
        db_url = db.engine.url
        click.echo(f"\n📊 Database Information:")
        click.echo(f"  Engine: {db.engine.dialect.name}")
        click.echo(f"  Database: {db_url.database or 'default'}")
        
        # Try to get table count
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        click.echo(f"  Tables: {len(tables)}")
        if tables:
            click.echo(f"  Table names: {', '.join(tables[:5])}")
            if len(tables) > 5:
                click.echo(f"    ... and {len(tables) - 5} more")
        
        # Get schema version if available
        version = get_db_version()
        if version:
            click.echo(f"  Schema Version: {version}")
        
        click.echo()
    except Exception as e:
        click.echo(f"Warning: Could not retrieve database info: {str(e)}", err=True)


def table_exists(table_name: str) -> bool:
    """
    Check if a table exists in the database.
    
    Args:
        table_name (str): Name of the table to check
        
    Returns:
        bool: True if table exists, False otherwise
    """
    inspector = db.inspect(db.engine)
    return table_name in inspector.get_table_names()


def get_table_row_count(table_name: str) -> int:
    """
    Get the number of rows in a table.
    
    Args:
        table_name (str): Name of the table
        
    Returns:
        int: Number of rows in the table
    """
    try:
        result = db.session.execute(
            db.text(f"SELECT COUNT(*) as count FROM {table_name}")
        )
        count = result.scalar()
        return count or 0
    except Exception:
        return 0


def pretty_print_result(title: str, data: dict):
    """
    Pretty print a result dictionary with title and formatting.
    
    Args:
        title (str): Result title
        data (dict): Dictionary to print
    """
    click.echo(f"\n{'='*50}")
    click.echo(f"  {title}")
    click.echo(f"{'='*50}")
    for key, value in data.items():
        click.echo(f"  {key:.<40} {value}")
    click.echo(f"{'='*50}\n")
