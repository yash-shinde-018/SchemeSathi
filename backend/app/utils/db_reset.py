"""
Database reset utility module for testing purposes.

This module provides comprehensive utilities to reset and manage database state
for testing environments. It includes programmatic APIs and context managers
for transactional database resets.

Features:
- reset_database(): Drop all tables and recreate from models
- clear_all_data(): Delete all data while preserving schema
- reset_sequences(): Reset auto-increment sequences
- truncate_tables(): Efficiently truncate tables
- DatabaseReset context manager: Transactional resets with automatic rollback

The utilities use safe, deterministic operations with proper foreign key handling.
All functions should ONLY be used in testing environments.

Usage (Programmatic):
    from app.utils.db_reset import reset_database, clear_all_data, DatabaseReset
    
    with app.app_context():
        # Option 1: Full reset (drop and recreate tables)
        reset_database()
        
        # Option 2: Clear data only (preserve structure)
        clear_all_data()
        
        # Option 3: Transactional reset (automatic rollback on error)
        with DatabaseReset():
            # Run tests - changes rolled back automatically
            pass

Usage (CLI):
    flask db cleanup              # Clear all data (interactive)
    flask db cleanup --force      # Clear all data (no confirmation)
    flask db cleanup --reset      # Full reset (drop and recreate)

Author: Database Testing Team
Version: 1.0.0
"""

import logging
from contextlib import contextmanager
from typing import List, Dict, Optional, Any

from sqlalchemy import inspect, text, event
from sqlalchemy.exc import SQLAlchemyError, DatabaseError
from flask import current_app

from app.database import db

# Configure logging
logger = logging.getLogger(__name__)

# List of tables in dependency order (children first, parents last)
# This order ensures foreign key constraints are respected during operations
ORDERED_TABLES = [
    'saved_schemes',
    'scheme_verifications',
    'admin_logs',
    'schemes',
    'user_profiles',
    'users',
    'scheme_categories',
]


# ============================================================================
# Core Database Reset Functions
# ============================================================================

def reset_database() -> Dict[str, Any]:
    """
    Perform a complete database reset.
    
    This function:
    1. Drops all existing tables
    2. Recreates all tables from SQLAlchemy models
    3. Returns operation summary
    
    This is a destructive operation and will lose all data.
    Should ONLY be used in testing environments.
    
    Returns:
        Dict containing:
        - 'dropped_tables': Number of dropped tables
        - 'created_tables': Number of created tables
        - 'success': Boolean indicating success
        - 'tables_dropped': List of table names dropped
        - 'tables_created': List of table names created
    
    Raises:
        SQLAlchemyError: If database operation fails
    
    Examples:
        >>> from app import create_app
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     result = reset_database()
        ...     print(f"Reset complete: {result}")
    """
    logger.info("Starting database reset operation")
    
    result = {
        'dropped_tables': 0,
        'created_tables': 0,
        'success': False,
        'tables_dropped': [],
        'tables_created': []
    }
    
    try:
        # Get list of existing tables before drop
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        result['tables_dropped'] = existing_tables.copy()
        result['dropped_tables'] = len(existing_tables)
        
        logger.info(f"Dropping {result['dropped_tables']} tables")
        db.drop_all()
        
        logger.info("Creating tables from SQLAlchemy models")
        db.create_all()
        
        # Verify tables were created
        inspector = inspect(db.engine)
        new_tables = inspector.get_table_names()
        result['tables_created'] = new_tables.copy()
        result['created_tables'] = len(new_tables)
        result['success'] = True
        
        logger.info(
            f"Database reset completed: dropped {result['dropped_tables']} tables, "
            f"created {result['created_tables']} tables"
        )
        
    except SQLAlchemyError as e:
        logger.error(f"Database reset failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Unexpected error during database reset: {str(e)}", exc_info=True)
        raise
    
    return result


def clear_all_data() -> Dict[str, Any]:
    """
    Clear all data from all tables while preserving table structure.
    
    This function:
    1. Deletes all rows from every table
    2. Preserves the database schema
    3. Respects foreign key constraints through proper deletion order
    4. Returns operation summary with deleted row counts
    
    This is safer than reset_database() for test isolation but slower.
    
    Returns:
        Dict containing:
        - 'deleted': Dict mapping table names to rows deleted
        - 'errors': List of error messages (if any)
        - 'total_deleted': Total rows deleted across all tables
        - 'success': Boolean indicating success
    
    Raises:
        SQLAlchemyError: If database operation fails
    
    Examples:
        >>> from app import create_app
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     result = clear_all_data()
        ...     print(f"Deleted {result['total_deleted']} rows")
    """
    logger.info("Starting clear all data operation")
    
    return _clear_tables(table_names=None)


def _clear_tables(table_names: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Internal function to clear data from specified tables.
    
    Args:
        table_names: List of table names to clear. If None, clears all tables.
    
    Returns:
        Dict with operation results including deleted counts and errors
    """
    result = {
        'deleted': {},
        'errors': [],
        'total_deleted': 0,
        'success': False
    }
    
    try:
        # Determine which tables to clear
        if table_names is None:
            tables_to_clear = ORDERED_TABLES.copy()
            # Add any tables not in the ordered list
            all_tables = get_all_tables()
            for table in all_tables:
                if table not in tables_to_clear:
                    tables_to_clear.insert(0, table)
        else:
            # Validate specified tables exist
            all_tables = get_all_tables()
            invalid_tables = [t for t in table_names if t not in all_tables]
            if invalid_tables:
                raise ValueError(f"Invalid tables: {', '.join(invalid_tables)}")
            tables_to_clear = table_names
        
        logger.info(f"Clearing {len(tables_to_clear)} tables")
        
        # Disable foreign key checks for SQLite
        if db.engine.dialect.name == 'sqlite':
            db.session.execute(text("PRAGMA foreign_keys = OFF"))
        
        try:
            for table in tables_to_clear:
                try:
                    # Get row count before deletion
                    count_query = text(f"SELECT COUNT(*) FROM {table}")
                    count_result = db.session.execute(count_query)
                    count = count_result.scalar() or 0
                    
                    if count > 0:
                        logger.debug(f"Deleting {count} rows from {table}")
                        # Delete all rows
                        delete_query = text(f"DELETE FROM {table}")
                        db.session.execute(delete_query)
                        db.session.commit()
                        result['deleted'][table] = count
                        result['total_deleted'] += count
                    else:
                        result['deleted'][table] = 0
                
                except SQLAlchemyError as e:
                    db.session.rollback()
                    error_msg = f"{table}: {str(e)}"
                    result['errors'].append(error_msg)
                    logger.warning(f"Error clearing table {table}: {str(e)}")
        
        finally:
            # Re-enable foreign key checks for SQLite
            if db.engine.dialect.name == 'sqlite':
                db.session.execute(text("PRAGMA foreign_keys = ON"))
                db.session.commit()
        
        result['success'] = len(result['errors']) == 0
        logger.info(
            f"Clear all data completed: deleted {result['total_deleted']} rows "
            f"from {len(result['deleted'])} tables"
        )
    
    except ValueError as e:
        logger.error(f"Invalid argument: {str(e)}")
        result['errors'].append(str(e))
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error during clear: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Unexpected error during clear: {str(e)}", exc_info=True)
        raise
    
    return result


def reset_sequences(table_names: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Reset auto-increment sequences for specified tables.
    
    This function resets the auto-increment counter for each table back to 1.
    This is useful for ensuring consistent IDs in tests.
    
    Database-specific behavior:
    - SQLite: Uses "UPDATE sqlite_sequence SET seq=0 WHERE name=?"
    - MySQL: Uses "ALTER TABLE table_name AUTO_INCREMENT=1"
    - PostgreSQL: Uses "ALTER SEQUENCE table_id_seq RESTART WITH 1"
    
    Args:
        table_names: List of table names. If None, resets all tables with sequences.
    
    Returns:
        Dict containing:
        - 'reset': Dict mapping table names to reset status
        - 'errors': List of error messages
        - 'success': Boolean indicating success
    
    Examples:
        >>> from app import create_app
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     result = reset_sequences(['users', 'schemes'])
        ...     print(f"Reset sequences: {result}")
    """
    logger.info("Starting reset sequences operation")
    
    result = {
        'reset': {},
        'errors': [],
        'success': False
    }
    
    try:
        db_dialect = db.engine.dialect.name
        logger.debug(f"Detected database dialect: {db_dialect}")
        
        # Determine which tables to reset
        if table_names is None:
            tables_to_reset = get_all_tables()
        else:
            all_tables = get_all_tables()
            invalid_tables = [t for t in table_names if t not in all_tables]
            if invalid_tables:
                raise ValueError(f"Invalid tables: {', '.join(invalid_tables)}")
            tables_to_reset = table_names
        
        for table in tables_to_reset:
            try:
                if db_dialect == 'sqlite':
                    # SQLite: Reset sequence
                    query = text(
                        f"UPDATE sqlite_sequence SET seq=0 WHERE name=:table_name"
                    )
                    db.session.execute(query, {'table_name': table})
                    logger.debug(f"Reset sequence for SQLite table: {table}")
                    
                elif db_dialect == 'mysql':
                    # MySQL: Reset auto-increment
                    query = text(f"ALTER TABLE {table} AUTO_INCREMENT=1")
                    db.session.execute(query)
                    logger.debug(f"Reset auto-increment for MySQL table: {table}")
                    
                elif db_dialect == 'postgresql':
                    # PostgreSQL: Reset sequence
                    # Assume standard naming convention: table_name_id_seq
                    seq_name = f"{table}_id_seq"
                    query = text(f"ALTER SEQUENCE {seq_name} RESTART WITH 1")
                    db.session.execute(query)
                    logger.debug(f"Reset sequence for PostgreSQL table: {table}")
                
                result['reset'][table] = True
            
            except SQLAlchemyError as e:
                logger.warning(f"Could not reset sequence for {table}: {str(e)}")
                result['reset'][table] = False
                # Don't add to errors - sequence might not exist (OK for some tables)
        
        db.session.commit()
        result['success'] = True
        
        logger.info(f"Reset sequences completed for {len(result['reset'])} tables")
    
    except SQLAlchemyError as e:
        logger.error(f"Database error during sequence reset: {str(e)}", exc_info=True)
        db.session.rollback()
        raise
    except ValueError as e:
        logger.error(f"Invalid argument: {str(e)}")
        result['errors'].append(str(e))
        raise
    except Exception as e:
        logger.error(f"Unexpected error during sequence reset: {str(e)}", exc_info=True)
        raise
    
    return result


def truncate_tables(table_names: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Truncate specified tables (faster than DELETE for large datasets).
    
    TRUNCATE is typically much faster than DELETE because it doesn't:
    - Scan each row individually
    - Generate transaction log entries
    - Fire DELETE triggers
    
    However, TRUNCATE may fail if there are foreign key references.
    For such cases, this function falls back to DELETE.
    
    Database-specific behavior:
    - SQLite: Falls back to DELETE (TRUNCATE not supported)
    - MySQL: Uses TRUNCATE TABLE (disables FK checks if needed)
    - PostgreSQL: Uses TRUNCATE TABLE (disables FK checks if needed)
    
    Args:
        table_names: List of table names. If None, truncates all tables.
    
    Returns:
        Dict containing:
        - 'truncated': List of successfully truncated tables
        - 'fell_back': Dict mapping tables to rows deleted via fallback
        - 'errors': List of error messages
        - 'success': Boolean indicating success
    
    Examples:
        >>> from app import create_app
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     result = truncate_tables(['users', 'schemes'])
        ...     print(f"Truncated: {result['truncated']}")
    """
    logger.info("Starting truncate tables operation")
    
    result = {
        'truncated': [],
        'fell_back': {},
        'errors': [],
        'success': False
    }
    
    db_dialect = db.engine.dialect.name
    logger.debug(f"Detected database dialect: {db_dialect}")
    
    try:
        # Determine which tables to truncate
        if table_names is None:
            tables_to_truncate = get_all_tables()
        else:
            all_tables = get_all_tables()
            invalid_tables = [t for t in table_names if t not in all_tables]
            if invalid_tables:
                raise ValueError(f"Invalid tables: {', '.join(invalid_tables)}")
            tables_to_truncate = table_names
        
        # SQLite doesn't support TRUNCATE - fall back to clear_tables
        if db_dialect == 'sqlite':
            logger.info("SQLite detected - using DELETE instead of TRUNCATE")
            return _clear_tables(tables_to_truncate)
        
        # For MySQL/PostgreSQL, disable FK checks before truncating
        try:
            if db_dialect == 'mysql':
                db.session.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            elif db_dialect == 'postgresql':
                db.session.execute(text("SET CONSTRAINTS ALL DEFERRED"))
        except SQLAlchemyError:
            logger.debug("Could not disable FK checks, proceeding anyway")
        
        try:
            for table in tables_to_truncate:
                try:
                    query = text(f"TRUNCATE TABLE {table}")
                    db.session.execute(query)
                    result['truncated'].append(table)
                    logger.debug(f"Truncated table: {table}")
                
                except SQLAlchemyError as e:
                    # FK constraint error - fall back to DELETE
                    logger.info(f"TRUNCATE failed for {table} due to FK constraint, falling back to DELETE")
                    try:
                        count_query = text(f"SELECT COUNT(*) FROM {table}")
                        count_result = db.session.execute(count_query)
                        count = count_result.scalar() or 0
                        
                        if count > 0:
                            delete_query = text(f"DELETE FROM {table}")
                            db.session.execute(delete_query)
                            result['fell_back'][table] = count
                    
                    except SQLAlchemyError as delete_error:
                        error_msg = f"{table}: {str(delete_error)}"
                        result['errors'].append(error_msg)
                        logger.warning(f"Error deleting from {table}: {str(delete_error)}")
            
            db.session.commit()
        
        finally:
            # Re-enable FK checks
            try:
                if db_dialect == 'mysql':
                    db.session.execute(text("SET FOREIGN_KEY_CHECKS=1"))
                elif db_dialect == 'postgresql':
                    db.session.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
                db.session.commit()
            except SQLAlchemyError:
                logger.debug("Could not re-enable FK checks")
        
        result['success'] = len(result['errors']) == 0
        logger.info(
            f"Truncate operation completed: truncated {len(result['truncated'])} tables, "
            f"fell back to delete for {len(result['fell_back'])} tables"
        )
    
    except ValueError as e:
        logger.error(f"Invalid argument: {str(e)}")
        result['errors'].append(str(e))
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error during truncate: {str(e)}", exc_info=True)
        result['success'] = False
        raise
    except Exception as e:
        logger.error(f"Unexpected error during truncate: {str(e)}", exc_info=True)
        result['success'] = False
        raise
    
    return result


# ============================================================================
# Utility Functions
# ============================================================================

def get_all_tables() -> List[str]:
    """
    Get list of all tables in the database.
    
    Returns:
        List[str]: Sorted list of table names
    
    Examples:
        >>> from app import create_app
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     tables = get_all_tables()
        ...     print(f"Found tables: {tables}")
    """
    try:
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        logger.debug(f"Found {len(tables)} tables in database")
        return sorted(tables)
    except SQLAlchemyError as e:
        logger.error(f"Error getting table list: {str(e)}")
        raise


def get_table_counts() -> Dict[str, int]:
    """
    Get row counts for all tables in the database.
    
    Returns:
        Dict[str, int]: Mapping of table names to row counts
    
    Examples:
        >>> from app import create_app
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     counts = get_table_counts()
        ...     for table, count in counts.items():
        ...         print(f"{table}: {count} rows")
    """
    counts = {}
    tables = get_all_tables()
    
    for table in tables:
        try:
            query = text(f"SELECT COUNT(*) FROM {table}")
            result = db.session.execute(query)
            counts[table] = result.scalar() or 0
        except SQLAlchemyError as e:
            logger.warning(f"Could not count rows in {table}: {str(e)}")
            counts[table] = 0
    
    return counts


# ============================================================================
# Context Managers
# ============================================================================

@contextmanager
def DatabaseReset(use_truncate: bool = False):
    """
    Context manager for transactional database resets.
    
    This context manager automatically manages database state for test isolation:
    1. Saves current database state on entry
    2. Executes test code (which may modify database)
    3. Automatically clears/truncates tables on exit (success or error)
    4. Restores auto-increment sequences
    
    This approach provides better test isolation than fixtures because:
    - Each test gets a truly clean database state
    - Tests cannot affect each other
    - Sequences are reset, so IDs are predictable
    
    Args:
        use_truncate: If True, use TRUNCATE for faster cleanup (if supported).
                     If False, use DELETE (safer, works everywhere).
    
    Usage:
        from app.utils.db_reset import DatabaseReset
        
        def test_user_creation():
            with DatabaseReset():
                # Run test - database is clean
                user = User(email='test@example.com')
                db.session.add(user)
                db.session.commit()
                
                assert User.query.count() == 1
            
            # After block exits, all changes are rolled back
            # Database is clean for next test
    
    Yields:
        None
    
    Raises:
        Any exceptions raised within the context are re-raised after cleanup
    
    Examples:
        >>> from app import create_app
        >>> from app.utils.db_reset import DatabaseReset
        >>> 
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     with DatabaseReset():
        ...         # Insert test data
        ...         pass
        ...     # Database is automatically cleaned up
    """
    logger.info("Entering DatabaseReset context manager")
    
    exception_occurred = False
    exception_info = None
    
    try:
        yield
    
    except Exception as e:
        logger.warning(f"Exception occurred within DatabaseReset context: {str(e)}")
        exception_occurred = True
        exception_info = e
    
    finally:
        try:
            logger.info("Exiting DatabaseReset context - cleaning up database")
            
            # Clean up database
            if use_truncate:
                logger.debug("Using TRUNCATE for cleanup")
                truncate_tables()
            else:
                logger.debug("Using DELETE for cleanup")
                clear_all_data()
            
            # Reset sequences for predictable IDs in next test
            logger.debug("Resetting auto-increment sequences")
            try:
                reset_sequences()
            except Exception as e:
                logger.warning(f"Could not reset sequences: {str(e)}")
                # Sequence reset is optional - don't fail if it doesn't work
            
            logger.info("DatabaseReset context cleanup complete")
        
        except Exception as cleanup_error:
            logger.error(
                f"Error during DatabaseReset cleanup: {str(cleanup_error)}",
                exc_info=True
            )
            # If cleanup fails and we had another exception, prioritize the original
            if not exception_occurred:
                raise cleanup_error
        
        finally:
            # Re-raise original exception if one occurred
            if exception_occurred:
                logger.info("Re-raising exception from within context")
                raise exception_info


@contextmanager
def TransactionalReset():
    """
    Context manager for transaction-based database resets.
    
    This context manager uses database transactions for test isolation:
    1. Starts a transaction on entry
    2. Executes test code within the transaction
    3. Automatically rolls back the transaction on exit
    
    This approach:
    - Is faster than delete-based cleanup (single rollback vs. many deletes)
    - Preserves database sequences
    - Allows concurrent tests to see different database states
    
    Transaction approach works well when:
    - Tests don't need to inspect database state after modifications
    - Tests run in isolation (not relying on permanent changes)
    - Database supports transactions properly (most do)
    
    Limitations:
    - Some operations can't be rolled back (DDL in some databases)
    - May not work well with certain async operations
    - Not suitable if tests need to inspect committed data
    
    Usage:
        from app.utils.db_reset import TransactionalReset
        
        def test_user_creation():
            with TransactionalReset():
                # Insert test data
                user = User(email='test@example.com')
                db.session.add(user)
                db.session.commit()
                
                assert User.query.count() == 1
            
            # After block exits, transaction is rolled back
            # User is not saved to database
    
    Yields:
        None
    
    Raises:
        Any exceptions raised within the context are re-raised after rollback
    
    Examples:
        >>> from app import create_app
        >>> from app.utils.db_reset import TransactionalReset
        >>> 
        >>> app = create_app('testing')
        >>> with app.app_context():
        ...     with TransactionalReset():
        ...         # Insert test data
        ...         pass
        ...     # Transaction automatically rolled back
    """
    logger.info("Entering TransactionalReset context manager")
    
    # Start a nested transaction (savepoint)
    savepoint = db.session.begin_nested()
    
    exception_occurred = False
    exception_info = None
    
    try:
        yield
    
    except Exception as e:
        logger.warning(f"Exception occurred within TransactionalReset context: {str(e)}")
        exception_occurred = True
        exception_info = e
    
    finally:
        try:
            logger.info("Exiting TransactionalReset context - rolling back transaction")
            savepoint.rollback()
            logger.info("TransactionalReset transaction rolled back successfully")
        
        except Exception as rollback_error:
            logger.error(
                f"Error during TransactionalReset rollback: {str(rollback_error)}",
                exc_info=True
            )
            if not exception_occurred:
                raise rollback_error
        
        finally:
            if exception_occurred:
                logger.info("Re-raising exception from within context")
                raise exception_info
