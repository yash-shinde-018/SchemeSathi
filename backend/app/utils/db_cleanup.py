"""
Database reset/cleanup utility for testing purposes.

This module provides utilities to reset and clean the database for testing:
- reset_database: Drop all tables and recreate them
- clear_all_tables: Delete all data while preserving table structure
- clear_tables: Delete data from specific tables
- get_table_counts: Get row counts for all tables

These utilities are designed for testing environments and should NOT be used
in production. They provide both programmatic API and CLI commands.

Usage (Programmatic):
    from app.utils.db_cleanup import reset_database, clear_all_tables
    
    with app.app_context():
        # Option 1: Full reset (drop and recreate tables)
        reset_database()
        
        # Option 2: Clear data only (preserve structure)
        deleted_counts = clear_all_tables()
        
        # Option 3: Clear specific tables
        deleted_counts = clear_tables(['users', 'schemes'])

Usage (CLI):
    flask db cleanup              # Clear all data (interactive)
    flask db cleanup --force      # Clear all data (no confirmation)
    flask db cleanup --reset      # Full reset (drop and recreate)
    flask db cleanup --tables users,schemes  # Clear specific tables
"""

import click
from flask import current_app
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Dict, Optional

from app.database import db


# List of tables in order of dependencies (children first, parents last)
# This order ensures foreign key constraints are respected during deletion
DEFAULT_TABLE_ORDER = [
    'saved_schemes',
    'scheme_verifications',
    'admin_logs',
    'schemes',
    'user_profiles',
    'users',
    'scheme_categories',
]


def get_all_tables() -> List[str]:
    """
    Get list of all tables in the database.
    
    Returns:
        List[str]: List of table names in the database
    """
    inspector = inspect(db.engine)
    return inspector.get_table_names()


def get_table_counts() -> Dict[str, int]:
    """
    Get row counts for all tables in the database.
    
    Returns:
        Dict[str, int]: Dictionary mapping table names to row counts
    """
    counts = {}
    tables = get_all_tables()
    
    for table in tables:
        try:
            result = db.session.execute(text(f"SELECT COUNT(*) FROM {table}"))
            counts[table] = result.scalar() or 0
        except SQLAlchemyError:
            counts[table] = 0
    
    return counts


def clear_tables(table_names: Optional[List[str]] = None) -> Dict[str, int]:
    """
    Clear data from specified tables while preserving table structure.
    
    Deletes all rows from the specified tables in the correct order to
    respect foreign key constraints. Tables are cleared in reverse
    dependency order (children before parents).
    
    Args:
        table_names: List of table names to clear. If None, clears all tables.
    
    Returns:
        Dict[str, int]: Dictionary with 'deleted' count for each table
    
    Raises:
        SQLAlchemyError: If database operation fails
        ValueError: If specified table doesn't exist
    """
    result = {'deleted': {}, 'errors': []}
    
    # Get all tables if none specified
    if table_names is None:
        tables_to_clear = DEFAULT_TABLE_ORDER.copy()
        # Add any tables not in the default order
        all_tables = get_all_tables()
        for table in all_tables:
            if table not in tables_to_clear:
                tables_to_clear.insert(0, table)
    else:
        # Validate specified tables exist
        all_tables = get_all_tables()
        for table in table_names:
            if table not in all_tables:
                raise ValueError(f"Table '{table}' does not exist in the database")
        tables_to_clear = table_names
    
    # Disable foreign key checks for SQLite to allow deletion in any order
    if db.engine.dialect.name == 'sqlite':
        db.session.execute(text("PRAGMA foreign_keys = OFF"))
    
    try:
        for table in tables_to_clear:
            try:
                # Get count before deletion
                count_result = db.session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = count_result.scalar() or 0
                
                # Delete all rows
                db.session.execute(text(f"DELETE FROM {table}"))
                db.session.commit()
                
                result['deleted'][table] = count
                
            except SQLAlchemyError as e:
                db.session.rollback()
                result['errors'].append(f"{table}: {str(e)}")
                current_app.logger.error(f"Error clearing table {table}: {str(e)}")
    
    finally:
        # Re-enable foreign key checks for SQLite
        if db.engine.dialect.name == 'sqlite':
            db.session.execute(text("PRAGMA foreign_keys = ON"))
            db.session.commit()
    
    return result


def clear_all_tables() -> Dict[str, int]:
    """
    Clear data from all tables while preserving table structure.
    
    This is a convenience wrapper around clear_tables() that clears all tables.
    
    Returns:
        Dict[str, int]: Dictionary with 'deleted' count for each table
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    return clear_tables(None)


def reset_database() -> Dict[str, any]:
    """
    Reset the database by dropping and recreating all tables.
    
    This performs a complete database reset:
    1. Drops all existing tables
    2. Recreates all tables from SQLAlchemy models
    3. Returns summary of the operation
    
    WARNING: This is destructive and cannot be undone!
    
    Returns:
        Dict[str, any]: Summary with 'dropped_tables' and 'created_tables' counts
    
    Raises:
        SQLAlchemyError: If database operation fails
    """
    result = {
        'dropped_tables': 0,
        'created_tables': 0,
        'success': False
    }
    
    try:
        # Get count of existing tables
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        result['dropped_tables'] = len(existing_tables)
        
        # Drop all tables
        db.drop_all()
        
        # Recreate all tables from models
        db.create_all()
        
        # Verify tables were created
        inspector = inspect(db.engine)
        new_tables = inspector.get_table_names()
        result['created_tables'] = len(new_tables)
        result['success'] = True
        
        current_app.logger.info(
            f"Database reset complete: dropped {result['dropped_tables']} tables, "
            f"created {result['created_tables']} tables"
        )
        
    except SQLAlchemyError as e:
        current_app.logger.error(f"Database reset failed: {str(e)}")
        raise
    
    return result


def truncate_tables(table_names: Optional[List[str]] = None) -> Dict[str, int]:
    """
    Truncate specified tables (faster than DELETE, but may not work with FKs).
    
    TRUNCATE is faster than DELETE because it doesn't scan each row and
    doesn't generate as much transaction log. However, it may fail if
    there are foreign key references.
    
    For SQLite, this falls back to DELETE as SQLite doesn't support TRUNCATE.
    
    Args:
        table_names: List of table names to truncate. If None, truncates all tables.
    
    Returns:
        Dict[str, int]: Dictionary with operation results
    """
    result = {'truncated': [], 'errors': []}
    
    # SQLite doesn't support TRUNCATE, use DELETE instead
    if db.engine.dialect.name == 'sqlite':
        return clear_tables(table_names)
    
    tables_to_truncate = table_names if table_names else get_all_tables()
    
    for table in tables_to_truncate:
        try:
            db.session.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
            db.session.commit()
            result['truncated'].append(table)
        except SQLAlchemyError as e:
            db.session.rollback()
            result['errors'].append(f"{table}: {str(e)}")
    
    return result


# ============================================================================
# CLI Command Integration
# ============================================================================

def register_cleanup_command(cli_group):
    """
    Register the cleanup CLI command with a Flask CLI group.
    
    Args:
        cli_group: Click group to register the command with
    """
    @cli_group.command('cleanup')
    @click.option('--force', is_flag=True, help='Skip confirmation prompt')
    @click.option('--reset', is_flag=True, help='Full reset (drop and recreate tables)')
    @click.option('--tables', type=str, help='Comma-separated list of specific tables to clear')
    @click.option('--dry-run', is_flag=True, help='Show what would be deleted without actually deleting')
    def db_cleanup(force: bool, reset: bool, tables: Optional[str], dry_run: bool):
        """
        Clean up database tables for testing purposes.
        
        This command provides flexible database cleanup options:
        - By default: Clear all data while preserving table structure
        - With --reset: Drop and recreate all tables (full reset)
        - With --tables: Clear only specified tables
        
        WARNING: This is destructive and should only be used in development/testing!
        
        Examples:
            flask db cleanup                    # Clear all data (interactive)
            flask db cleanup --force            # Clear all data (no confirmation)
            flask db cleanup --reset            # Full reset (drop and recreate)
            flask db cleanup --tables users     # Clear only users table
            flask db cleanup --dry-run          # Preview what would be deleted
        """
        try:
            # Parse table list if provided
            table_list = None
            if tables:
                table_list = [t.strip() for t in tables.split(',')]
            
            # Show current state
            click.echo("\n📊 Current Database State:")
            counts = get_table_counts()
            total_rows = sum(counts.values())
            
            for table, count in sorted(counts.items()):
                click.echo(f"  • {table:.<35} {count:>10} rows")
            click.echo(f"  {'':.<35} {'-'*10}")
            click.echo(f"  {'TOTAL':.<35} {total_rows:>10} rows\n")
            
            # Dry run mode - just show what would happen
            if dry_run:
                if reset:
                    click.echo("🔍 DRY RUN - Would perform full reset:")
                    click.echo(f"  - Drop {len(counts)} tables")
                    click.echo(f"  - Recreate {len(counts)} tables from models")
                elif table_list:
                    click.echo(f"🔍 DRY RUN - Would clear {len(table_list)} tables:")
                    for table in table_list:
                        click.echo(f"  - {table}: {counts.get(table, 0)} rows would be deleted")
                else:
                    click.echo(f"🔍 DRY RUN - Would clear all {len(counts)} tables:")
                    for table, count in counts.items():
                        click.echo(f"  - {table}: {count} rows would be deleted")
                click.echo("\n✅ Dry run complete (no changes made)\n")
                return
            
            # Require confirmation unless --force flag
            if not force:
                if reset:
                    warning_msg = "This will DROP ALL TABLES and recreate them. Data will be LOST!"
                elif table_list:
                    warning_msg = f"This will delete ALL DATA from {len(table_list)} tables: {', '.join(table_list)}"
                else:
                    warning_msg = f"This will delete ALL DATA from {len(counts)} tables. Continue?"
                
                if not click.confirm(f"\n⚠️  {warning_msg}", default=False):
                    click.echo("❌ Operation cancelled\n")
                    return
            else:
                click.echo("✓ Forced cleanup (skipping confirmation prompt)\n")
            
            # Perform the cleanup operation
            if reset:
                click.echo("🔄 Performing full database reset...")
                result = reset_database()
                
                if result['success']:
                    click.echo(f"✓ Dropped {result['dropped_tables']} tables")
                    click.echo(f"✓ Created {result['created_tables']} tables")
                    click.echo("\n✅ Database reset complete!\n")
                else:
                    click.echo("❌ Database reset failed\n")
                    
            else:
                click.echo("🧹 Clearing database tables...")
                result = clear_tables(table_list)
                
                if result['errors']:
                    click.echo("⚠️  Some tables had errors:")
                    for error in result['errors']:
                        click.echo(f"  ❌ {error}")
                
                total_deleted = sum(result['deleted'].values())
                click.echo(f"\n✓ Cleared {len(result['deleted'])} tables ({total_deleted} total rows deleted)")
                
                if result['deleted']:
                    click.echo("\nDeleted rows per table:")
                    for table, count in result['deleted'].items():
                        click.echo(f"  • {table:.<35} {count:>10} rows")
                
                click.echo("\n✅ Database cleanup complete!\n")
        
        except ValueError as e:
            click.echo(f"❌ Error: {str(e)}\n", err=True)
            raise click.Abort()
        except SQLAlchemyError as e:
            click.echo(f"❌ Database error: {str(e)}\n", err=True)
            current_app.logger.error(f"Database cleanup failed: {str(e)}", exc_info=True)
            raise click.Abort()
        except Exception as e:
            click.echo(f"❌ Unexpected error: {str(e)}\n", err=True)
            current_app.logger.error(f"Database cleanup failed: {str(e)}", exc_info=True)
            raise click.Abort()
    
    return db_cleanup
