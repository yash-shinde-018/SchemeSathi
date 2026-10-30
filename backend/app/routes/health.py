"""
Health check endpoints for SchemeSathi API.

Provides endpoints for monitoring application and database health:
- GET /health - Basic health check (returns 200 if healthy)
- GET /health/db - Database-specific health check
- GET /health/detailed - Comprehensive health report (admin-only)

All endpoints return JSON responses with health status and diagnostic information.
"""

from flask import Blueprint, jsonify, current_app
from functools import wraps
import logging

from app.utils.db_health import (
    test_connection,
    health_check as comprehensive_health_check,
    database_info,
    get_connection_stats
)
from app.utils.db_monitoring import (
    get_query_statistics,
    get_slow_queries,
    get_monitoring_report
)

logger = logging.getLogger(__name__)

# Create blueprint for health check routes
health_bp = Blueprint('health', __name__, url_prefix='/api/health')


# ========== Helper Functions ==========

def require_admin(f):
    """
    Decorator to require admin access for sensitive endpoints.
    
    For now, this is a placeholder. In production, check user role.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # TODO: Implement actual admin role checking when auth is implemented
        # For now, allow all requests for testing
        return f(*args, **kwargs)
    return decorated_function


# ========== Health Check Endpoints ==========

@health_bp.route('', methods=['GET'])
def health_check():
    """
    Basic health check endpoint.
    
    Returns 200 if the application and database are healthy.
    This is a lightweight check suitable for load balancers and monitoring tools.
    
    Response (200 OK):
        {
            "success": true,
            "message": "Application is healthy",
            "timestamp": "2024-01-15T10:30:45.123456",
            "status": "healthy"
        }
    
    Response (503 Service Unavailable):
        {
            "success": false,
            "message": "Database connection failed",
            "timestamp": "2024-01-15T10:30:45.123456",
            "status": "unhealthy",
            "error": "Connection refused"
        }
    """
    try:
        # Test basic connectivity
        connectivity_result = test_connection()
        
        if not connectivity_result['success']:
            return jsonify({
                'success': False,
                'message': 'Database connection failed',
                'timestamp': connectivity_result['timestamp'],
                'status': 'unhealthy',
                'error': connectivity_result['error']
            }), 503
        
        return jsonify({
            'success': True,
            'message': 'Application is healthy',
            'timestamp': connectivity_result['timestamp'],
            'status': 'healthy'
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Health check failed: {error_msg}", exc_info=True)
        
        return jsonify({
            'success': False,
            'message': 'Health check failed',
            'status': 'unhealthy',
            'error': error_msg
        }), 503


@health_bp.route('/db', methods=['GET'])
def database_health_check():
    """
    Database-specific health check endpoint.
    
    Tests database connectivity, query execution, and transaction handling.
    Returns more detailed information than the basic health check.
    
    Response (200 OK):
        {
            "success": true,
            "status": "healthy",
            "timestamp": "2024-01-15T10:30:45.123456",
            "checks": {
                "connectivity": {
                    "success": true,
                    "duration_ms": 5.23,
                    "timestamp": "2024-01-15T10:30:45.123456",
                    "error": null
                },
                "query_execution": {
                    "success": true,
                    "table_count": 8,
                    "duration_ms": 8.45,
                    "timestamp": "2024-01-15T10:30:45.123456",
                    "error": null
                },
                "transaction_handling": {
                    "success": true,
                    "duration_ms": 3.12,
                    "timestamp": "2024-01-15T10:30:45.123456",
                    "rollback_tested": true,
                    "error": null
                }
            }
        }
    
    Response (503 Service Unavailable):
        {
            "success": false,
            "status": "unhealthy",
            "error": "Database connection failed",
            "timestamp": "2024-01-15T10:30:45.123456"
        }
    """
    try:
        # Run comprehensive health check
        health_result = comprehensive_health_check()
        
        status_code = 200 if health_result['status'] == 'healthy' else 503
        
        return jsonify({
            'success': health_result['status'] == 'healthy',
            'status': health_result['status'],
            'timestamp': health_result['timestamp'],
            'checks': health_result['checks'],
            'overall_duration_ms': health_result['overall_duration_ms']
        }), status_code
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Database health check failed: {error_msg}", exc_info=True)
        
        return jsonify({
            'success': False,
            'status': 'unhealthy',
            'error': error_msg
        }), 503


@health_bp.route('/detailed', methods=['GET'])
@require_admin
def detailed_health_report():
    """
    Comprehensive health report endpoint (admin-only).
    
    Returns detailed health information including:
    - Database connectivity and performance
    - Database information and statistics
    - Connection pool status
    - Query performance statistics
    - Recently slow queries
    
    This endpoint provides the most comprehensive diagnostic information
    and should be restricted to administrators only.
    
    Response (200 OK):
        {
            "success": true,
            "timestamp": "2024-01-15T10:30:45.123456",
            "health": {
                "status": "healthy",
                "checks": {...},
                "overall_duration_ms": 15.67
            },
            "database_info": {
                "success": true,
                "database_type": "sqlite",
                "table_count": 8,
                "tables": [...]
            },
            "connection_pool": {
                "pool_type": "QueuePool",
                "pool_size": 10,
                "checked_out": 1,
                "overflow": 0,
                "available": 9
            },
            "query_statistics": {
                "total_queries": 156,
                "slow_queries": 3,
                "avg_duration_ms": 12.45,
                "max_duration_ms": 245.67
            },
            "slow_queries": [...]
        }
    
    Response (403 Forbidden):
        Admin access required (when auth is implemented)
    
    Response (500 Internal Server Error):
        {
            "success": false,
            "error": "Failed to generate report",
            "timestamp": "2024-01-15T10:30:45.123456"
        }
    """
    try:
        # Run comprehensive health check
        health_result = comprehensive_health_check()
        
        # Get database information
        db_info = database_info()
        
        # Get connection pool status
        pool_status = get_connection_stats()
        
        # Get query statistics
        query_stats = get_query_statistics()
        
        # Get slow queries
        slow_queries = get_slow_queries(limit=10)
        
        return jsonify({
            'success': True,
            'timestamp': health_result['timestamp'],
            'health': {
                'status': health_result['status'],
                'checks': health_result['checks'],
                'overall_duration_ms': health_result['overall_duration_ms']
            },
            'database_info': db_info,
            'connection_pool': pool_status,
            'query_statistics': query_stats,
            'slow_queries': slow_queries
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Detailed health report failed: {error_msg}", exc_info=True)
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'timestamp': __import__('datetime').datetime.utcnow().isoformat()
        }), 500


# ========== Additional Diagnostic Endpoints ==========

@health_bp.route('/query-stats', methods=['GET'])
def query_statistics():
    """
    Get query performance statistics (admin-only).
    
    Returns statistics about recent query execution including:
    - Total queries executed
    - Number of slow queries
    - Average, max, and min query durations
    - Slow query threshold
    
    Response (200 OK):
        {
            "success": true,
            "statistics": {
                "total_queries": 156,
                "slow_queries": 3,
                "slow_query_threshold_ms": 100,
                "avg_duration_ms": 12.45,
                "max_duration_ms": 245.67,
                "min_duration_ms": 1.23
            },
            "timestamp": "2024-01-15T10:30:45.123456"
        }
    """
    try:
        stats = get_query_statistics()
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'timestamp': __import__('datetime').datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to get query statistics: {error_msg}")
        
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500


@health_bp.route('/slow-queries', methods=['GET'])
def slow_queries_endpoint():
    """
    Get list of recently slow queries (admin-only).
    
    Query Parameters:
        - limit (int, optional): Maximum number of queries to return (default: 10)
    
    Response (200 OK):
        {
            "success": true,
            "slow_queries": [
                {
                    "query": "SELECT * FROM users WHERE...",
                    "duration_ms": 245.67,
                    "formatted_duration": "245.67ms",
                    "timestamp": "2024-01-15T10:30:45.123456"
                },
                ...
            ],
            "count": 3,
            "timestamp": "2024-01-15T10:30:45.123456"
        }
    """
    try:
        from flask import request
        
        limit = request.args.get('limit', default=10, type=int)
        limit = max(1, min(limit, 100))  # Clamp between 1-100
        
        slow_queries = get_slow_queries(limit=limit)
        
        return jsonify({
            'success': True,
            'slow_queries': slow_queries,
            'count': len(slow_queries),
            'timestamp': __import__('datetime').datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to get slow queries: {error_msg}")
        
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500


# ========== Utility Routes ==========

@health_bp.route('/status-page', methods=['GET'])
def status_page():
    """
    Get a human-readable status page.
    
    Returns a simple status overview suitable for monitoring dashboards.
    """
    try:
        health_result = comprehensive_health_check()
        
        # Create simple status message
        status_messages = {
            'healthy': '✓ All systems operational',
            'degraded': '⚠ Some systems experiencing issues',
            'unhealthy': '✗ Critical system failures'
        }
        
        message = status_messages.get(health_result['status'], 'Unknown status')
        
        return jsonify({
            'status': health_result['status'],
            'message': message,
            'timestamp': health_result['timestamp']
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': 'Status page unavailable',
            'error': str(e)
        }), 500
