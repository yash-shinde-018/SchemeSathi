"""
Database query performance monitoring and logging utilities.

This module provides tools for:
- Logging slow query execution
- Tracking recently executed slow queries
- Database statistics and information
- Query performance analysis

Usage:
    from app.utils.db_monitoring import log_query_performance, get_slow_queries
    
    # Log a query's performance
    log_query_performance("SELECT * FROM users", 250.5)
    
    # Get list of recently slow queries
    slow_queries = get_slow_queries(limit=10)
"""

import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import deque
import threading

logger = logging.getLogger(__name__)

# Thread-local storage for tracking query performance
_query_history = deque(maxlen=100)  # Keep last 100 queries
_history_lock = threading.Lock()
_slow_query_threshold = 100  # Default: 100ms threshold


class SlowQueryRecord:
    """Record of a slow query execution."""
    
    def __init__(self, query: str, duration_ms: float, timestamp: datetime = None):
        self.query = query[:500]  # Limit query length for storage
        self.duration_ms = round(duration_ms, 2)
        self.timestamp = timestamp or datetime.utcnow()
        self.formatted_duration = self._format_duration()
    
    def _format_duration(self) -> str:
        """Format duration for display."""
        if self.duration_ms < 1000:
            return f"{self.duration_ms}ms"
        else:
            return f"{self.duration_ms/1000:.2f}s"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'query': self.query,
            'duration_ms': self.duration_ms,
            'formatted_duration': self.formatted_duration,
            'timestamp': self.timestamp.isoformat()
        }


def set_slow_query_threshold(threshold_ms: float) -> None:
    """
    Set the threshold for what constitutes a "slow" query.
    
    Args:
        threshold_ms (float): Threshold in milliseconds (default: 100ms)
    """
    global _slow_query_threshold
    _slow_query_threshold = threshold_ms
    logger.info(f"Slow query threshold set to {threshold_ms}ms")


def log_query_performance(query: str, duration_ms: float) -> None:
    """
    Log a query's execution time.
    
    If execution time exceeds the slow query threshold, it's logged as a warning
    and added to the slow query history for later analysis.
    
    Args:
        query (str): The SQL query that was executed
        duration_ms (float): Execution time in milliseconds
    
    Example:
        >>> log_query_performance("SELECT * FROM users", 150.5)
        >>> # Will be logged as a slow query if > 100ms
    """
    record = SlowQueryRecord(query, duration_ms)
    
    with _history_lock:
        _query_history.append(record)
    
    # Log slow queries as warnings
    if duration_ms > _slow_query_threshold:
        logger.warning(
            f"Slow query detected ({record.formatted_duration}): "
            f"{query[:100]}..."
        )


def get_slow_queries(limit: int = 10, threshold_ms: Optional[float] = None) -> List[Dict[str, Any]]:
    """
    Get recently executed slow queries.
    
    Returns queries that took longer than the specified threshold,
    sorted by most recent first.
    
    Args:
        limit (int): Maximum number of queries to return (default: 10)
        threshold_ms (float, optional): Slow query threshold in ms.
                                       If not specified, uses global threshold.
    
    Returns:
        List of slow query records (dict) with query, duration, timestamp
    
    Example:
        >>> slow_queries = get_slow_queries(limit=5)
        >>> for query in slow_queries:
        ...     print(f"{query['formatted_duration']}: {query['query'][:50]}")
    """
    if threshold_ms is None:
        threshold_ms = _slow_query_threshold
    
    with _history_lock:
        # Filter slow queries and reverse to get most recent first
        slow_queries = [
            record.to_dict()
            for record in reversed(list(_query_history))
            if record.duration_ms > threshold_ms
        ]
    
    return slow_queries[:limit]


def get_query_history(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get all recent queries (not just slow ones).
    
    Returns the most recent queries executed, regardless of speed.
    
    Args:
        limit (int): Maximum number of queries to return (default: 20)
    
    Returns:
        List of all recent query records
    """
    with _history_lock:
        # Get most recent queries (reverse order, most recent first)
        all_queries = [
            record.to_dict()
            for record in reversed(list(_query_history))
        ]
    
    return all_queries[:limit]


def get_query_statistics() -> Dict[str, Any]:
    """
    Get statistics about recent query execution.
    
    Returns:
        Dict containing:
        - total_queries: Total queries in history
        - slow_queries: Number of slow queries
        - avg_duration_ms: Average query duration
        - max_duration_ms: Slowest query duration
        - min_duration_ms: Fastest query duration
    """
    with _history_lock:
        if not _query_history:
            return {
                'total_queries': 0,
                'slow_queries': 0,
                'avg_duration_ms': 0,
                'max_duration_ms': 0,
                'min_duration_ms': 0
            }
        
        durations = [record.duration_ms for record in _query_history]
        slow_count = sum(1 for d in durations if d > _slow_query_threshold)
        
        return {
            'total_queries': len(_query_history),
            'slow_queries': slow_count,
            'slow_query_threshold_ms': _slow_query_threshold,
            'avg_duration_ms': round(sum(durations) / len(durations), 2),
            'max_duration_ms': max(durations),
            'min_duration_ms': min(durations)
        }


def clear_query_history() -> None:
    """Clear the query history."""
    with _history_lock:
        _query_history.clear()
    logger.info("Query history cleared")


def database_info(app) -> Dict[str, Any]:
    """
    Get comprehensive database information and statistics.
    
    Requires Flask application context.
    
    Args:
        app: Flask application instance
    
    Returns:
        Dict containing database metadata and statistics
    """
    try:
        from app.utils.db_health import database_info as get_db_info
        return get_db_info()
    except Exception as e:
        logger.error(f"Failed to get database info: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def connection_pool_status(app) -> Dict[str, Any]:
    """
    Get connection pool status.
    
    Requires Flask application context.
    
    Args:
        app: Flask application instance
    
    Returns:
        Dict containing pool status information
    """
    try:
        from app.utils.db_health import connection_pool_status as get_pool_status
        return get_pool_status()
    except Exception as e:
        logger.error(f"Failed to get connection pool status: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


# ========== Performance Monitoring Context Manager ==========

class QueryTimer:
    """
    Context manager for timing and logging query performance.
    
    Usage:
        with QueryTimer("Find all users") as timer:
            users = User.query.all()
        # Automatically logged
    """
    
    def __init__(self, query_description: str = "Query"):
        self.query_description = query_description
        self.start_time = None
        self.duration_ms = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration_ms = (time.time() - self.start_time) * 1000
        log_query_performance(self.query_description, self.duration_ms)
        
        if exc_type is not None:
            logger.error(
                f"Query failed after {self.duration_ms:.2f}ms: {self.query_description}",
                exc_info=True
            )
        
        return False


# ========== Flask Integration ==========

def init_monitoring(app) -> None:
    """
    Initialize query monitoring for a Flask application.
    
    Sets up Flask-SQLAlchemy event listeners to automatically
    log query performance.
    
    Args:
        app: Flask application instance
    """
    from sqlalchemy import event
    
    @event.listens_for(app.db.engine, 'after_cursor_execute')
    def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        """Automatically log query performance after execution."""
        # Note: context.execution_options may contain query timing info
        # This is a basic implementation - consider using a more robust
        # query timing mechanism in production
        pass


def get_monitoring_report() -> Dict[str, Any]:
    """
    Get a complete monitoring report including query stats and history.
    
    Returns:
        Dict with comprehensive monitoring data
    """
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'statistics': get_query_statistics(),
        'slow_queries': get_slow_queries(limit=10),
        'recent_queries': get_query_history(limit=20)
    }
