"""
Database CLI commands for SchemeSathi.

This module provides Flask CLI commands for database operations:
- db-init: Initialize database (idempotent, safe to run multiple times)
- db-reset: Reset database (destructive, requires confirmation)
- db-seed: Seed database with sample data
- db seed-categories: Seed scheme categories

All commands are registered under the 'db' command group (flask db-*).

Example usage:
    flask db-init                    # Initialize database
    flask db-seed                    # Seed with sample data
    flask db seed-categories         # Seed all 10 categories
    flask db reset                   # Reset database (interactive confirmation)
    flask db reset --force           # Reset database (skip confirmation)
"""

import click
from flask import current_app
from flask.cli import with_appcontext
from app.database import db
from app.cli.utils import (
    get_db_version,
    confirm_action,
    seed_sample_data,
    print_db_info,
    table_exists,
    get_table_row_count,
    pretty_print_result
)
from app.cli.seed_categories import seed_categories_command
from app.utils.db_cleanup import register_cleanup_command


@click.group()
def db_cli_group():
    """
    Database management commands group.
    
    Provides commands for initializing, resetting, and seeding the database.
    All commands require an application context.
    """
    pass


@db_cli_group.command('init')
@with_appcontext
def db_init():
    """
    Initialize database (idempotent).
    
    This command:
    1. Checks if alembic_version table exists (indicates previous initialization)
    2. If not initialized: Creates all tables from SQLAlchemy models
    3. If already initialized: Skips (idempotent - safe to run multiple times)
    4. Returns success message with schema version
    
    This is safe to run multiple times - it will only initialize if needed.
    
    Example:
        $ flask db-init
        ✓ Database initialized successfully
        Schema Version: 1.0.0
    """
    try:
        click.echo("\n🔧 Initializing database...\n")
        
        # Print database information
        print_db_info()
        
        # Check if already initialized (look for any table)
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if existing_tables:
            click.echo(f"✓ Database already initialized with {len(existing_tables)} tables")
            click.echo(f"  Tables: {', '.join(existing_tables[:3])}")
            if len(existing_tables) > 3:
                click.echo(f"    ... and {len(existing_tables) - 3} more")
            
            # Get schema version
            version = get_db_version()
            if version:
                click.echo(f"✓ Schema Version: {version}")
            
            click.echo("\n✅ Database is already initialized (idempotent - no changes made)\n")
            return
        
        # Create all tables
        click.echo("Creating database tables...")
        db.create_all()
        
        # Verify creation
        inspector = db.inspect(db.engine)
        new_tables = inspector.get_table_names()
        
        if new_tables:
            click.echo(f"✓ Created {len(new_tables)} tables:")
            for table in new_tables:
                count = get_table_row_count(table)
                click.echo(f"  ✓ {table:.<35} ({count} rows)")
            
            version = get_db_version()
            if version:
                click.echo(f"\n✓ Schema Version: {version}")
            
            click.echo("\n✅ Database initialized successfully!\n")
        else:
            click.echo("⚠️  Warning: Database tables may not have been created properly\n")
    
    except Exception as e:
        click.echo(f"❌ Error initializing database: {str(e)}", err=True)
        current_app.logger.error(f"Database init failed: {str(e)}", exc_info=True)
        raise click.Abort()


@db_cli_group.command('reset')
@click.option('--force', is_flag=True, help='Skip confirmation prompt')
@with_appcontext
def db_reset(force):
    """
    Reset database (DANGEROUS - drops all tables).
    
    This command:
    1. Prompts for user confirmation (unless --force flag is used)
    2. Drops all database tables
    3. Recreates all tables from SQLAlchemy models
    4. Optionally seeds with sample data
    
    WARNING: This is destructive and cannot be undone!
    Use only in development environments.
    
    Example:
        $ flask db-reset              # Interactive confirmation
        $ flask db-reset --force      # Skip confirmation
    """
    try:
        click.echo("\n🔴 DATABASE RESET - DESTRUCTIVE OPERATION")
        click.echo("This will DROP ALL TABLES and cannot be undone!\n")
        
        # Print database information
        print_db_info()
        
        # Check if database has data
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if existing_tables:
            row_counts = {}
            total_rows = 0
            for table in existing_tables:
                count = get_table_row_count(table)
                row_counts[table] = count
                total_rows += count
            
            click.echo(f"⚠️  Database has {len(existing_tables)} tables with {total_rows} total rows:")
            for table, count in row_counts.items():
                click.echo(f"  • {table:.<35} {count} rows")
        else:
            click.echo("✓ Database is empty (no tables exist)")
        
        click.echo()
        
        # Require confirmation unless --force flag
        if not force:
            if not confirm_action(
                "Are you sure you want to drop all tables and reset the database? "
                "This cannot be undone!",
                default=False
            ):
                click.echo("❌ Database reset cancelled\n")
                return
        else:
            click.echo("✓ Forced reset (skipping confirmation prompt)\n")
        
        # Drop all tables
        click.echo("Dropping all tables...")
        db.drop_all()
        click.echo("✓ All tables dropped")
        
        # Recreate all tables
        click.echo("Recreating database tables...")
        db.create_all()
        
        # Verify recreation
        inspector = db.inspect(db.engine)
        new_tables = inspector.get_table_names()
        click.echo(f"✓ Recreated {len(new_tables)} tables")
        
        click.echo("\n✅ Database reset complete!\n")
        
        # Offer to seed data
        if not force:
            if click.confirm("Would you like to seed the database with sample data?", default=True):
                db_seed.invoke(click.Context(db_seed))
        
    except Exception as e:
        click.echo(f"❌ Error resetting database: {str(e)}", err=True)
        current_app.logger.error(f"Database reset failed: {str(e)}", exc_info=True)
        raise click.Abort()


@db_cli_group.command('seed')
@with_appcontext
def db_seed():
    """
    Seed database with sample data.
    
    This command creates:
    - 10 scheme categories (Education, Healthcare, etc.)
    - 1 admin user (admin@schemesathi.com / AdminPassword123!)
    - 5 sample regular users (user1-5@example.com / Password123!)
    - Sample user profiles with location information
    
    Safe to run multiple times - skips creation if data already exists.
    
    Example:
        $ flask db-seed
    """
    try:
        click.echo("\n🌱 Seeding database with sample data...\n")
        
        # Check if database is initialized
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables:
            click.echo("⚠️  Database not initialized. Run 'flask db-init' first.\n")
            return
        
        # Create sample data
        result = seed_sample_data()
        
        # Print summary
        pretty_print_result("Sample Data Creation Summary", {
            'Categories Created': result['categories_created'],
            'Users Created': result['users_created'],
            'Schemes Created': result['schemes_created'],
            'Saved Schemes Created': result['saved_schemes_created']
        })
        
        click.echo("✅ Sample data seeded successfully!\n")
        click.echo("Available test accounts:")
        click.echo("  Admin: admin@schemesathi.com / AdminPassword123!")
        click.echo("  User:  user1@example.com / Password123!")
        click.echo()
        
    except Exception as e:
        click.echo(f"❌ Error seeding database: {str(e)}", err=True)
        current_app.logger.error(f"Database seed failed: {str(e)}", exc_info=True)
        raise click.Abort()


@db_cli_group.command('info')
@with_appcontext
def db_info():
    """
    Display database information and statistics.
    
    Shows:
    - Database engine type
    - Database name
    - Number of tables
    - Schema version
    - Row counts for each table
    
    Example:
        $ flask db info
    """
    try:
        click.echo()
        print_db_info()
        
        # Print table statistics
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        if tables:
            click.echo("📊 Table Statistics:")
            total_rows = 0
            for table in sorted(tables):
                count = get_table_row_count(table)
                total_rows += count
                click.echo(f"  • {table:.<35} {count:>10} rows")
            click.echo(f"  {'':.<35} {'-'*10}")
            click.echo(f"  {'TOTAL':.<35} {total_rows:>10} rows")
            click.echo()
        else:
            click.echo("⚠️  No tables found in database\n")
    
    except Exception as e:
        click.echo(f"❌ Error retrieving database info: {str(e)}", err=True)
        current_app.logger.error(f"Database info failed: {str(e)}", exc_info=True)
        raise click.Abort()


@db_cli_group.command('migrate')
@with_appcontext
def db_migrate():
    """
    Run pending database migrations.
    
    Uses Alembic to apply any pending schema changes.
    This is typically done via 'flask db upgrade' with Flask-Migrate,
    but this command provides a shorthand.
    
    Example:
        $ flask db migrate
    """
    try:
        click.echo("\n📝 Running pending migrations...\n")
        
        # Import after app context is available
        from flask_migrate import upgrade
        
        upgrade()
        
        click.echo("\n✅ Migrations completed successfully!\n")
    
    except Exception as e:
        click.echo(f"❌ Error running migrations: {str(e)}", err=True)
        current_app.logger.error(f"Migration failed: {str(e)}", exc_info=True)
        raise click.Abort()


# Register the seed-categories command with the db group
db_cli_group.add_command(seed_categories_command)

# Register the cleanup command
register_cleanup_command(db_cli_group)
