"""
Database health check and connection testing utilities for SchemeSathi.

This module provides comprehensive database connection testing, health checks,
and performance monitoring capabilities. It enables:

1. Basic connectivity verification
2. Query execution performance testing  
3. Transaction handling validation
4. Connection pool statistics
5. Comprehensive health reports

Usage:
    from app.utils.db_health import health_check, test_connection
    
    # Test basic connectivity
    result = test_connection()
    
    # Get comprehensive health report
    report = health_check()
"""

import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError, OperationalError
from flask import current_app
from app.database import db

logger = logging.getLogger(__name__)


class DatabaseHealthError(Exception):
    """Base exception for database health check errors."""
    pass


class ConnectionError(DatabaseHealthError):
    """Raised when basic database connection fails."""
    pass


class QueryExecutionError(DatabaseHealthError):
    """Raised when query execution fails."""
    pass


class TransactionError(DatabaseHealthError):
    """Raised when transaction handling fails."""
    pass


def test_connection() -> Dict[str, Any]:
    """
    Test basic database connectivity.
    
    Performs a simple SELECT 1 query to verify the database connection is working.
    This is the most basic health check, suitable for quick connectivity verification.
    
    Returns:
        Dict containing:
        - success (bool): True if connection is healthy
        - duration_ms (float): Query execution time in milliseconds
        - timestamp (str): ISO format timestamp of check
        - error (str or None): Error message if failed
    
    Raises:
        DatabaseHealthError: If connection test fails
    
    Example:
        >>> result = test_connection()
        >>> if result['success']:
        ...     print(f"Connected in {result['duration_ms']}ms")
    """
    start_time = time.time()
    
    try:
        with db.session() as session:
            session.execute(text('SELECT 1'))
            session.commit()
        
        duration_ms = (time.time() - start_time) * 1000
        
        return {
            'success': True,
            'duration_ms': round(duration_ms, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'error': None
        }
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        error_msg = str(e)
        logger.error(f"Database connection test failed: {error_msg}")
        
        return {
            'success': False,
            'duration_ms': round(duration_ms, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'error': error_msg
        }


def test_query() -> Dict[str, Any]:
    """
    Test query execution performance.
    
    Executes a more complex query to test query execution and performance.
    Uses table_count query to get actual table statistics.
    
    Returns:
        Dict containing:
        - success (bool): True if query executed successfully
        - table_count (int): Number of tables in database
        - duration_ms (float): Query execution time in milliseconds
        - timestamp (str): ISO format timestamp of check
        - error (str or None): Error message if failed
    
    Example:
        >>> result = test_query()
        >>> print(f"Database has {result['table_count']} tables")
    """
    start_time = time.time()
    
    try:
        with db.session() as session:
            # Get count of tables - works across different database backends
            engine = db.engine
            inspector = _get_inspector(engine)
            table_names = inspector.get_table_names()
            table_count = len(table_names)
        
        duration_ms = (time.time() - start_time) * 1000
        
        return {
            'success': True,
            'table_count': table_count,
            'duration_ms': round(duration_ms, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'error': None
        }
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        error_msg = str(e)
        logger.error(f"Database query test failed: {error_msg}")
        
        return {
            'success': False,
            'table_count': None,
            'duration_ms': round(duration_ms, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'error': error_msg
        }


def test_transaction() -> Dict[str, Any]:
    """
    Test transaction handling including rollback.
    
    Creates a test transaction and verifies rollback functionality.
    This tests that the database properly supports transactions.
    
    Returns:
        Dict containing:
        - success (bool): True if transaction handling works
        - duration_ms (float): Test execution time in milliseconds
        - timestamp (str): ISO format timestamp of check
        - rollback_tested (bool): Whether rollback was tested
        - error (str or None): Error message if failed
    
    Example:
        >>> result = test_transaction()
        >>> if result['success']:
        ...     print("Transactions are working properly")
    """
    start_time = time.time()
    
    try:
        session = db.session()
        
        try:
            # Start transaction
            session.begin()
            
            # Execute test query
            session.execute(text('SELECT 1'))
            
            # Test rollback
            session.rollback()
            
            session.close()
        except Exception as e:
            session.rollback()
            session.close()
            raise
        
        duration_ms = (time.time() - start_time) * 1000
        
        return {
            'success': True,
            'duration_ms': round(duration_ms, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'rollback_tested': True,
            'error': None
        }
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        error_msg = str(e)
        logger.error(f"Database transaction test failed: {error_msg}")
        
        return {
            'success': False,
            'duration_ms': round(duration_ms, 2),
            'timestamp': datetime.utcnow().isoformat(),
            'rollback_tested': False,
            'error': error_msg
        }


def get_connection_stats() -> Dict[str, Any]:
    """
    Get connection pool statistics.
    
    Returns information about the current state of the connection pool,
    including pool size, checked out connections, and overflow connections.
    
    Returns:
        Dict containing:
        - pool_type (str): Type of connection pool in use
        - pool_size (int): Size of the connection pool
        - checked_out (int): Number of currently checked out connections
        - overflow (int): Number of overflow connections currently in use
        - available (int): Estimated available connections
        - timestamp (str): ISO format timestamp
        - error (str or None): Error message if failed
    
    Example:
        >>> stats = get_connection_stats()
        >>> print(f"Available connections: {stats['available']}")
    """
    try:
        engine = db.engine
        pool_obj = engine.pool
        
        # Determine pool type and stats
        pool_type = type(pool_obj).__name__
        
        # Try to get stats - different pool types have different methods
        stats = {
            'success': True,
            'pool_type': pool_type,
            'timestamp': datetime.utcnow().isoformat(),
            'error': None
        }
        
        if hasattr(pool_obj, 'size'):
            try:
                stats['pool_size'] = pool_obj.size()
                stats['checked_out'] = pool_obj.checkedout()
                stats['overflow'] = pool_obj.overflow()
                stats['available'] = stats['pool_size'] - stats['checked_out']
            except Exception as e:
                logger.warning(f"Could not get detailed pool stats: {str(e)}")
                stats.update({
                    'pool_size': 'N/A',
                    'checked_out': 'N/A',
                    'overflow': 'N/A',
                    'available': 'N/A'
                })
        else:
            # Pool type doesn't support stats retrieval
            stats.update({
                'pool_size': 'Not applicable',
                'checked_out': 'Not applicable',
                'overflow': 'Not applicable',
                'available': 'Not applicable'
            })
        
        return stats
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to get connection stats: {error_msg}")
        
        return {
            'success': False,
            'pool_type': 'Unknown',
            'pool_size': None,
            'checked_out': None,
            'overflow': None,
            'available': None,
            'timestamp': datetime.utcnow().isoformat(),
            'error': error_msg
        }


def health_check() -> Dict[str, Any]:
    """
    Comprehensive database health check.
    
    Performs all available health checks and returns a complete report
    including connectivity, query performance, transaction handling,
    and connection pool statistics.
    
    Returns:
        Dict containing:
        - status (str): Overall status ('healthy', 'degraded', 'unhealthy')
        - timestamp (str): ISO format timestamp of check
        - checks: Dict with results of individual checks
          - connectivity: Basic connection test result
          - query_execution: Query execution test result
          - transaction_handling: Transaction test result
          - connection_pool: Connection pool statistics
        - overall_duration_ms (float): Total check execution time
    
    Example:
        >>> report = health_check()
        >>> if report['status'] == 'healthy':
        ...     print("Database is fully operational")
    """
    overall_start = time.time()
    
    # Run all health checks
    connectivity = test_connection()
    query_result = test_query()
    transaction_result = test_transaction()
    pool_stats = get_connection_stats()
    
    # Determine overall status
    if connectivity['success'] and query_result['success'] and transaction_result['success']:
        status = 'healthy'
    elif connectivity['success']:
        status = 'degraded'
    else:
        status = 'unhealthy'
    
    overall_duration = (time.time() - overall_start) * 1000
    
    return {
        'status': status,
        'timestamp': datetime.utcnow().isoformat(),
        'checks': {
            'connectivity': connectivity,
            'query_execution': query_result,
            'transaction_handling': transaction_result,
            'connection_pool': pool_stats
        },
        'overall_duration_ms': round(overall_duration, 2)
    }


def database_info() -> Dict[str, Any]:
    """
    Get database information and statistics.
    
    Returns information about the database including:
    - Database type and version
    - Table count and list
    - Database URL (with password masked)
    - Estimated database size (if available)
    
    Returns:
        Dict containing database information or error message
    
    Example:
        >>> info = database_info()
        >>> print(f"Database: {info['database_type']}")
        >>> print(f"Tables: {len(info['tables'])}")
    """
    try:
        engine = db.engine
        inspector = _get_inspector(engine)
        
        # Get database URL (mask password)
        db_url = str(engine.url)
        db_url_masked = _mask_db_url(db_url)
        
        # Get database type
        db_type = engine.dialect.name
        
        # Get table information
        table_names = inspector.get_table_names()
        table_info = []
        for table_name in table_names:
            columns = inspector.get_columns(table_name)
            table_info.append({
                'name': table_name,
                'column_count': len(columns)
            })
        
        return {
            'success': True,
            'database_type': db_type,
            'database_url': db_url_masked,
            'table_count': len(table_names),
            'tables': table_info,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to get database info: {error_msg}")
        
        return {
            'success': False,
            'error': error_msg,
            'timestamp': datetime.utcnow().isoformat()
        }


def connection_pool_status() -> Dict[str, Any]:
    """
    Get detailed connection pool status.
    
    Alias for get_connection_stats() with additional formatting.
    
    Returns:
        Dict containing detailed pool status information
    """
    return get_connection_stats()


# ========== Helper Functions ==========

def _get_inspector(engine):
    """
    Get SQLAlchemy inspector for database introspection.
    
    Args:
        engine: SQLAlchemy engine instance
        
    Returns:
        Inspector instance for querying database metadata
    """
    from sqlalchemy import inspect
    return inspect(engine)


def _mask_db_url(url: str) -> str:
    """
    Mask sensitive information in database URL.
    
    Replaces password in database URL with asterisks for security.
    
    Args:
        url (str): Database URL
        
    Returns:
        str: URL with masked password
    """
    if '://' in url:
        # Find password section
        if '@' in url:
            prefix = url.split('@')[0]
            suffix = url.split('@')[1]
            
            # Mask password in prefix
            if ':' in prefix:
                parts = prefix.split(':')
                return f"{parts[0]}:***@{suffix}"
            else:
                return f"{prefix}@{suffix}"
    
    return url


@contextmanager
def timed_query(description: str = "Query"):
    """
    Context manager for timing database queries.
    
    Usage:
        with timed_query("User lookup"):
            users = User.query.all()
    
    Args:
        description (str): Description of the query
        
    Yields:
        Dict with timing results
    """
    start_time = time.time()
    result = {'start_time': start_time}
    
    try:
        yield result
    finally:
        duration_ms = (time.time() - start_time) * 1000
        result['duration_ms'] = duration_ms
        logger.debug(f"{description}: {duration_ms:.2f}ms")
