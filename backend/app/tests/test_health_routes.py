"""
Tests for health check API endpoints.

Tests cover:
- GET /health - Basic health check
- GET /health/db - Database health check
- GET /health/detailed - Detailed health report
- GET /health/query-stats - Query statistics
- GET /health/slow-queries - Slow queries list
- HTTP status codes and error handling
"""

import pytest
import json
from datetime import datetime


class TestBasicHealthEndpoint:
    """Tests for GET /api/health endpoint."""
    
    def test_health_endpoint_returns_200(self, client, app):
        """Test that health endpoint returns 200 OK when healthy."""
        with app.app_context():
            response = client.get('/api/health')
            
            assert response.status_code == 200
    
    def test_health_endpoint_returns_json(self, client, app):
        """Test that health endpoint returns JSON."""
        with app.app_context():
            response = client.get('/api/health')
            
            assert response.content_type == 'application/json'
            data = json.loads(response.data)
            assert isinstance(data, dict)
    
    def test_health_endpoint_success_field(self, client, app):
        """Test that health response includes success field."""
        with app.app_context():
            response = client.get('/api/health')
            data = json.loads(response.data)
            
            assert 'success' in data
            assert isinstance(data['success'], bool)
    
    def test_health_endpoint_status_field(self, client, app):
        """Test that health response includes status field."""
        with app.app_context():
            response = client.get('/api/health')
            data = json.loads(response.data)
            
            assert 'status' in data
            assert data['status'] in {'healthy', 'degraded', 'unhealthy'}
    
    def test_health_endpoint_message_field(self, client, app):
        """Test that health response includes message field."""
        with app.app_context():
            response = client.get('/api/health')
            data = json.loads(response.data)
            
            assert 'message' in data
            assert isinstance(data['message'], str)
    
    def test_health_endpoint_timestamp_field(self, client, app):
        """Test that health response includes timestamp."""
        with app.app_context():
            response = client.get('/api/health')
            data = json.loads(response.data)
            
            assert 'timestamp' in data
            # Should be ISO format
            assert 'T' in data['timestamp']
    
    def test_health_endpoint_healthy_response(self, client, app):
        """Test that health endpoint returns healthy response."""
        with app.app_context():
            response = client.get('/api/health')
            data = json.loads(response.data)
            
            assert data['success'] is True
            assert data['status'] == 'healthy'


class TestDatabaseHealthEndpoint:
    """Tests for GET /api/health/db endpoint."""
    
    def test_db_health_endpoint_returns_200(self, client, app):
        """Test that db health endpoint returns 200 OK."""
        with app.app_context():
            response = client.get('/api/health/db')
            
            assert response.status_code == 200
    
    def test_db_health_endpoint_returns_json(self, client, app):
        """Test that db health endpoint returns JSON."""
        with app.app_context():
            response = client.get('/api/health/db')
            
            assert response.content_type == 'application/json'
            data = json.loads(response.data)
            assert isinstance(data, dict)
    
    def test_db_health_includes_success_field(self, client, app):
        """Test that db health response includes success field."""
        with app.app_context():
            response = client.get('/api/health/db')
            data = json.loads(response.data)
            
            assert 'success' in data
            assert isinstance(data['success'], bool)
    
    def test_db_health_includes_status_field(self, client, app):
        """Test that db health response includes status field."""
        with app.app_context():
            response = client.get('/api/health/db')
            data = json.loads(response.data)
            
            assert 'status' in data
            assert data['status'] in {'healthy', 'degraded', 'unhealthy'}
    
    def test_db_health_includes_checks(self, client, app):
        """Test that db health response includes individual checks."""
        with app.app_context():
            response = client.get('/api/health/db')
            data = json.loads(response.data)
            
            assert 'checks' in data
            assert isinstance(data['checks'], dict)
    
    def test_db_health_checks_structure(self, client, app):
        """Test that db health checks have proper structure."""
        with app.app_context():
            response = client.get('/api/health/db')
            data = json.loads(response.data)
            
            expected_checks = {
                'connectivity',
                'query_execution',
                'transaction_handling',
                'connection_pool'
            }
            
            assert set(data['checks'].keys()) == expected_checks
    
    def test_db_health_includes_duration(self, client, app):
        """Test that db health response includes overall duration."""
        with app.app_context():
            response = client.get('/api/health/db')
            data = json.loads(response.data)
            
            assert 'overall_duration_ms' in data
            assert isinstance(data['overall_duration_ms'], (int, float))


class TestDetailedHealthEndpoint:
    """Tests for GET /api/health/detailed endpoint."""
    
    def test_detailed_health_endpoint_returns_200(self, client, app):
        """Test that detailed health endpoint returns 200 OK."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            
            assert response.status_code == 200
    
    def test_detailed_health_endpoint_returns_json(self, client, app):
        """Test that detailed health endpoint returns JSON."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            
            assert response.content_type == 'application/json'
            data = json.loads(response.data)
            assert isinstance(data, dict)
    
    def test_detailed_health_includes_success(self, client, app):
        """Test that detailed response includes success field."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            data = json.loads(response.data)
            
            assert 'success' in data
            assert data['success'] is True
    
    def test_detailed_health_includes_health_section(self, client, app):
        """Test that detailed response includes health section."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            data = json.loads(response.data)
            
            assert 'health' in data
            assert 'status' in data['health']
            assert 'checks' in data['health']
    
    def test_detailed_health_includes_database_info(self, client, app):
        """Test that detailed response includes database info."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            data = json.loads(response.data)
            
            assert 'database_info' in data
            if data['database_info'].get('success'):
                assert 'database_type' in data['database_info']
    
    def test_detailed_health_includes_connection_pool(self, client, app):
        """Test that detailed response includes connection pool info."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            data = json.loads(response.data)
            
            assert 'connection_pool' in data
            assert 'pool_type' in data['connection_pool']
    
    def test_detailed_health_includes_query_statistics(self, client, app):
        """Test that detailed response includes query statistics."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            data = json.loads(response.data)
            
            assert 'query_statistics' in data
            stats = data['query_statistics']
            assert 'total_queries' in stats
            assert 'slow_queries' in stats
    
    def test_detailed_health_includes_slow_queries(self, client, app):
        """Test that detailed response includes slow queries."""
        with app.app_context():
            response = client.get('/api/health/detailed')
            data = json.loads(response.data)
            
            assert 'slow_queries' in data
            assert isinstance(data['slow_queries'], list)


class TestQueryStatsEndpoint:
    """Tests for GET /api/health/query-stats endpoint."""
    
    def test_query_stats_returns_200(self, client, app):
        """Test that query stats endpoint returns 200 OK."""
        with app.app_context():
            response = client.get('/api/health/query-stats')
            
            assert response.status_code == 200
    
    def test_query_stats_returns_json(self, client, app):
        """Test that query stats endpoint returns JSON."""
        with app.app_context():
            response = client.get('/api/health/query-stats')
            
            assert response.content_type == 'application/json'
            data = json.loads(response.data)
            assert isinstance(data, dict)
    
    def test_query_stats_includes_statistics(self, client, app):
        """Test that query stats response includes statistics."""
        with app.app_context():
            response = client.get('/api/health/query-stats')
            data = json.loads(response.data)
            
            assert 'success' in data
            assert 'statistics' in data
    
    def test_query_stats_structure(self, client, app):
        """Test that query stats have proper structure."""
        with app.app_context():
            response = client.get('/api/health/query-stats')
            data = json.loads(response.data)
            
            stats = data['statistics']
            assert 'total_queries' in stats
            assert 'slow_queries' in stats
            assert 'avg_duration_ms' in stats


class TestSlowQueriesEndpoint:
    """Tests for GET /api/health/slow-queries endpoint."""
    
    def test_slow_queries_returns_200(self, client, app):
        """Test that slow queries endpoint returns 200 OK."""
        with app.app_context():
            response = client.get('/api/health/slow-queries')
            
            assert response.status_code == 200
    
    def test_slow_queries_returns_json(self, client, app):
        """Test that slow queries endpoint returns JSON."""
        with app.app_context():
            response = client.get('/api/health/slow-queries')
            
            assert response.content_type == 'application/json'
            data = json.loads(response.data)
            assert isinstance(data, dict)
    
    def test_slow_queries_includes_list(self, client, app):
        """Test that slow queries response includes list."""
        with app.app_context():
            response = client.get('/api/health/slow-queries')
            data = json.loads(response.data)
            
            assert 'slow_queries' in data
            assert isinstance(data['slow_queries'], list)
    
    def test_slow_queries_includes_count(self, client, app):
        """Test that slow queries response includes count."""
        with app.app_context():
            response = client.get('/api/health/slow-queries')
            data = json.loads(response.data)
            
            assert 'count' in data
            assert isinstance(data['count'], int)
    
    def test_slow_queries_limit_parameter(self, client, app):
        """Test that slow queries respects limit parameter."""
        with app.app_context():
            response = client.get('/api/health/slow-queries?limit=5')
            data = json.loads(response.data)
            
            assert len(data['slow_queries']) <= 5
    
    def test_slow_queries_default_limit(self, client, app):
        """Test that slow queries uses default limit."""
        with app.app_context():
            response = client.get('/api/health/slow-queries')
            data = json.loads(response.data)
            
            # Default limit is 10
            assert len(data['slow_queries']) <= 10


class TestStatusPageEndpoint:
    """Tests for GET /api/health/status-page endpoint."""
    
    def test_status_page_returns_200(self, client, app):
        """Test that status page endpoint returns 200 OK."""
        with app.app_context():
            response = client.get('/api/health/status-page')
            
            assert response.status_code == 200
    
    def test_status_page_returns_json(self, client, app):
        """Test that status page endpoint returns JSON."""
        with app.app_context():
            response = client.get('/api/health/status-page')
            
            assert response.content_type == 'application/json'
            data = json.loads(response.data)
            assert isinstance(data, dict)
    
    def test_status_page_includes_status(self, client, app):
        """Test that status page includes status field."""
        with app.app_context():
            response = client.get('/api/health/status-page')
            data = json.loads(response.data)
            
            assert 'status' in data
            assert data['status'] in {'healthy', 'degraded', 'unhealthy'}
    
    def test_status_page_includes_message(self, client, app):
        """Test that status page includes message field."""
        with app.app_context():
            response = client.get('/api/health/status-page')
            data = json.loads(response.data)
            
            assert 'message' in data
            assert isinstance(data['message'], str)


class TestHealthEndpointIntegration:
    """Integration tests for health endpoints."""
    
    def test_multiple_endpoint_calls(self, client, app):
        """Test calling multiple health endpoints in sequence."""
        with app.app_context():
            endpoints = [
                '/api/health',
                '/api/health/db',
                '/api/health/query-stats'
            ]
            
            for endpoint in endpoints:
                response = client.get(endpoint)
                assert response.status_code == 200
    
    def test_health_endpoints_consistency(self, client, app):
        """Test that health endpoints show consistent status."""
        with app.app_context():
            response1 = client.get('/api/health')
            response2 = client.get('/api/health/db')
            
            data1 = json.loads(response1.data)
            data2 = json.loads(response2.data)
            
            # Both should report healthy or both degraded
            assert data1['status'] == data2['status']
    
    def test_health_check_response_times(self, client, app):
        """Test that health check endpoints respond in reasonable time."""
        with app.app_context():
            import time
            
            start = time.time()
            response = client.get('/api/health')
            elapsed = time.time() - start
            
            # Health check should complete in < 5 seconds
            assert elapsed < 5.0
            assert response.status_code == 200


class TestHealthErrorHandling:
    """Test error handling in health endpoints."""
    
    def test_invalid_limit_parameter(self, client, app):
        """Test that invalid limit parameter is handled."""
        with app.app_context():
            response = client.get('/api/health/slow-queries?limit=abc')
            
            # Should handle gracefully with default or error
            assert response.status_code in (200, 400)
    
    def test_negative_limit_parameter(self, client, app):
        """Test that negative limit parameter is clamped."""
        with app.app_context():
            response = client.get('/api/health/slow-queries?limit=-10')
            data = json.loads(response.data)
            
            # Should clamp to valid range (1-100)
            assert len(data['slow_queries']) <= 100
    
    def test_excessive_limit_parameter(self, client, app):
        """Test that excessive limit parameter is clamped."""
        with app.app_context():
            response = client.get('/api/health/slow-queries?limit=1000')
            data = json.loads(response.data)
            
            # Should clamp to max 100
            assert len(data['slow_queries']) <= 100
