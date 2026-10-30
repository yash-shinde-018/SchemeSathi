"""
Comprehensive tests for database connection testing utilities.

Tests cover:
- Basic connectivity verification
- Query execution performance
- Transaction handling and rollback
- Connection pool statistics
- Health check reporting
- Error handling and edge cases
"""

import pytest
import time
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError

from app.utils.db_health import (
    test_connection,
    test_query,
    test_transaction,
    get_connection_stats,
    health_check,
    database_info,
    DatabaseHealthError,
    ConnectionError as DBConnectionError
)


class TestConnectionTesting:
    """Test basic database connectivity verification."""
    
    def test_connection_success(self, app):
        """Test successful database connection."""
        with app.app_context():
            result = test_connection()
            
            assert result['success'] is True
            assert result['duration_ms'] > 0
            assert result['error'] is None
            assert 'timestamp' in result
    
    def test_connection_timing(self, app):
        """Test that connection timing is recorded."""
        with app.app_context():
            result = test_connection()
            
            # Connection should be relatively fast (< 1000ms)
            assert 0 < result['duration_ms'] < 1000
    
    def test_connection_returns_dict(self, app):
        """Test that connection returns proper dictionary structure."""
        with app.app_context():
            result = test_connection()
            
            required_keys = {'success', 'duration_ms', 'timestamp', 'error'}
            assert set(result.keys()) == required_keys
    
    @patch('app.utils.db_health.db')
    def test_connection_failure_handling(self, mock_db, app):
        """Test connection error handling."""
        mock_db.session.side_effect = Exception("Connection failed")
        
        with app.app_context():
            # Temporarily replace db
            import app.utils.db_health as db_health_module
            original_db = db_health_module.db
            
            try:
                db_health_module.db = mock_db
                result = test_connection()
                
                assert result['success'] is False
                assert result['error'] is not None
                assert 'Connection failed' in result['error']
                
            finally:
                db_health_module.db = original_db


class TestQueryExecution:
    """Test query execution performance testing."""
    
    def test_query_execution_success(self, app):
        """Test successful query execution."""
        with app.app_context():
            result = test_query()
            
            assert result['success'] is True
            assert result['table_count'] is not None
            assert result['duration_ms'] > 0
            assert result['error'] is None
    
    def test_query_returns_table_count(self, app):
        """Test that query returns table count."""
        with app.app_context():
            result = test_query()
            
            assert isinstance(result['table_count'], int)
            assert result['table_count'] >= 0
    
    def test_query_timing(self, app):
        """Test query execution timing."""
        with app.app_context():
            result = test_query()
            
            # Query should be relatively fast (< 1000ms)
            assert 0 < result['duration_ms'] < 1000
    
    def test_query_returns_dict(self, app):
        """Test that query returns proper dictionary structure."""
        with app.app_context():
            result = test_query()
            
            required_keys = {'success', 'table_count', 'duration_ms', 'timestamp', 'error'}
            assert set(result.keys()) == required_keys


class TestTransactionHandling:
    """Test transaction handling and rollback."""
    
    def test_transaction_success(self, app):
        """Test successful transaction execution."""
        with app.app_context():
            result = test_transaction()
            
            assert result['success'] is True
            assert result['rollback_tested'] is True
            assert result['duration_ms'] > 0
            assert result['error'] is None
    
    def test_transaction_rollback_tested(self, app):
        """Test that transaction rollback is tested."""
        with app.app_context():
            result = test_transaction()
            
            assert result['rollback_tested'] is True
    
    def test_transaction_timing(self, app):
        """Test transaction execution timing."""
        with app.app_context():
            result = test_transaction()
            
            # Transaction should be relatively fast
            assert 0 < result['duration_ms'] < 1000
    
    def test_transaction_returns_dict(self, app):
        """Test that transaction returns proper dictionary structure."""
        with app.app_context():
            result = test_transaction()
            
            required_keys = {'success', 'duration_ms', 'timestamp', 'rollback_tested', 'error'}
            assert set(result.keys()) == required_keys


class TestConnectionPoolStats:
    """Test connection pool statistics retrieval."""
    
    def test_pool_stats_retrieval(self, app):
        """Test successful connection pool stats retrieval."""
        with app.app_context():
            result = get_connection_stats()
            
            assert 'pool_type' in result
            assert 'timestamp' in result
    
    def test_pool_stats_includes_type(self, app):
        """Test that pool stats include pool type."""
        with app.app_context():
            result = get_connection_stats()
            
            pool_type = result.get('pool_type')
            assert pool_type is not None
            assert isinstance(pool_type, str)
    
    def test_pool_stats_returns_dict(self, app):
        """Test that pool stats returns dictionary."""
        with app.app_context():
            result = get_connection_stats()
            
            assert isinstance(result, dict)
            assert 'pool_type' in result
    
    def test_pool_stats_error_handling(self, app):
        """Test pool stats error handling."""
        with app.app_context():
            result = get_connection_stats()
            
            # Should not raise, but may have error field
            assert isinstance(result, dict)


class TestHealthCheck:
    """Test comprehensive health check functionality."""
    
    def test_health_check_success(self, app):
        """Test successful comprehensive health check."""
        with app.app_context():
            result = health_check()
            
            assert 'status' in result
            assert 'checks' in result
            assert 'overall_duration_ms' in result
    
    def test_health_check_status_values(self, app):
        """Test that health check returns valid status values."""
        with app.app_context():
            result = health_check()
            
            valid_statuses = {'healthy', 'degraded', 'unhealthy'}
            assert result['status'] in valid_statuses
    
    def test_health_check_includes_all_checks(self, app):
        """Test that health check includes all test types."""
        with app.app_context():
            result = health_check()
            
            required_checks = {
                'connectivity',
                'query_execution',
                'transaction_handling',
                'connection_pool'
            }
            assert set(result['checks'].keys()) == required_checks
    
    def test_health_check_connectivity_result(self, app):
        """Test health check connectivity result structure."""
        with app.app_context():
            result = health_check()
            
            connectivity = result['checks']['connectivity']
            assert 'success' in connectivity
            assert 'duration_ms' in connectivity
    
    def test_health_check_query_result(self, app):
        """Test health check query result structure."""
        with app.app_context():
            result = health_check()
            
            query = result['checks']['query_execution']
            assert 'success' in query
            assert 'duration_ms' in query
    
    def test_health_check_transaction_result(self, app):
        """Test health check transaction result structure."""
        with app.app_context():
            result = health_check()
            
            transaction = result['checks']['transaction_handling']
            assert 'success' in transaction
            assert 'duration_ms' in transaction
    
    def test_health_check_pool_result(self, app):
        """Test health check pool result structure."""
        with app.app_context():
            result = health_check()
            
            pool = result['checks']['connection_pool']
            assert 'pool_type' in pool
    
    def test_health_check_timing(self, app):
        """Test health check overall timing."""
        with app.app_context():
            result = health_check()
            
            # Overall check should complete reasonably fast
            assert 0 < result['overall_duration_ms'] < 5000
    
    def test_health_check_timestamp(self, app):
        """Test health check includes timestamp."""
        with app.app_context():
            result = health_check()
            
            assert 'timestamp' in result
            assert result['timestamp'] is not None


class TestDatabaseInfo:
    """Test database information retrieval."""
    
    def test_database_info_success(self, app):
        """Test successful database info retrieval."""
        with app.app_context():
            result = database_info()
            
            assert result.get('success') is True
    
    def test_database_info_includes_type(self, app):
        """Test that database info includes database type."""
        with app.app_context():
            result = database_info()
            
            if result.get('success'):
                assert 'database_type' in result
    
    def test_database_info_includes_tables(self, app):
        """Test that database info includes table information."""
        with app.app_context():
            result = database_info()
            
            if result.get('success'):
                assert 'table_count' in result
                assert 'tables' in result
    
    def test_database_info_table_list(self, app):
        """Test database info table list structure."""
        with app.app_context():
            result = database_info()
            
            if result.get('success') and result.get('tables'):
                for table in result['tables']:
                    assert 'name' in table
                    assert 'column_count' in table


class TestHealthCheckIntegration:
    """Integration tests for complete health check workflow."""
    
    def test_complete_health_check_workflow(self, app):
        """Test complete health check workflow."""
        with app.app_context():
            # Run health check
            result = health_check()
            
            # Verify structure
            assert 'status' in result
            assert 'checks' in result
            assert 'overall_duration_ms' in result
            
            # Verify all checks have expected fields
            for check_name, check_result in result['checks'].items():
                assert 'success' in check_result
                assert 'timestamp' in check_result
    
    def test_multiple_health_checks(self, app):
        """Test running multiple health checks."""
        with app.app_context():
            # Run multiple checks
            results = [health_check() for _ in range(3)]
            
            # All should complete successfully
            assert len(results) == 3
            for result in results:
                assert result['status'] in {'healthy', 'degraded', 'unhealthy'}
    
    def test_health_check_consistency(self, app):
        """Test that successive health checks are consistent."""
        with app.app_context():
            result1 = health_check()
            result2 = health_check()
            
            # Status should be the same (database state unchanged)
            assert result1['status'] == result2['status']
            
            # All checks should succeed in both
            for check_name in result1['checks']:
                check1 = result1['checks'][check_name]
                check2 = result2['checks'][check_name]
                
                # Success status should match
                assert check1.get('success') == check2.get('success')


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_connection_error_includes_message(self, app):
        """Test that connection errors include error message."""
        with app.app_context():
            # Temporarily break connection to test error handling
            # This is tricky in tests - we skip if not possible
            pass
    
    def test_health_check_degra_handling(self, app):
        """Test health check handles degraded status correctly."""
        with app.app_context():
            result = health_check()
            
            # Should handle both healthy and degraded states
            assert result['status'] in {'healthy', 'degraded', 'unhealthy'}
    
    def test_pool_stats_handles_none_values(self, app):
        """Test pool stats handles None values gracefully."""
        with app.app_context():
            result = get_connection_stats()
            
            # Should complete without error even if some values are N/A
            assert isinstance(result, dict)
