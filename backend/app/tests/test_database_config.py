"""
Unit tests for database configuration module.

Tests cover:
- Database configuration selection for different environments
- Connection string builders
- Pool configuration for dev/test/prod
- Database initialization
- Connection health checks
"""

import pytest
import os
from app.database import (
    db,
    get_database_config,
    DevelopmentDatabaseConfig,
    TestingDatabaseConfig,
    ProductionDatabaseConfig,
    build_sqlite_url,
    build_mysql_url,
    build_postgresql_url,
    init_database,
    check_database_connection,
    PoolDiagnostics,
)


class TestDatabaseConfigSelection:
    """Test selecting database configuration for different environments."""
    
    def test_get_development_config(self):
        """Test getting development database configuration."""
        config = get_database_config('development')
        assert isinstance(config, DevelopmentDatabaseConfig)
        assert config.POOL_SIZE == 5
        assert config.MAX_OVERFLOW == 5
        assert config.ECHO is True
    
    def test_get_testing_config(self):
        """Test getting testing database configuration."""
        config = get_database_config('testing')
        assert isinstance(config, TestingDatabaseConfig)
        assert config.ECHO is False
        assert config.RECORD_QUERIES is False
    
    def test_get_production_config(self):
        """Test getting production database configuration."""
        config = get_database_config('production')
        assert isinstance(config, ProductionDatabaseConfig)
        assert config.POOL_SIZE == 20
        assert config.MAX_OVERFLOW == 40
        assert config.ECHO is False
    
    def test_invalid_config_raises_error(self):
        """Test that invalid environment name raises error."""
        with pytest.raises(ValueError, match='Invalid environment'):
            get_database_config('invalid_env')
    
    def test_default_config_from_env(self):
        """Test that default config uses FLASK_ENV environment variable."""
        # Save current env
        original_env = os.getenv('FLASK_ENV')
        
        try:
            os.environ['FLASK_ENV'] = 'testing'
            config = get_database_config()
            assert isinstance(config, TestingDatabaseConfig)
        finally:
            # Restore original env
            if original_env:
                os.environ['FLASK_ENV'] = original_env
            else:
                os.environ.pop('FLASK_ENV', None)


class TestDevelopmentConfig:
    """Test development configuration specifics."""
    
    def test_development_url(self):
        """Test development database URL."""
        config = DevelopmentDatabaseConfig()
        url = config.get_database_url()
        assert url == 'sqlite:///schemesathi_dev.db' or url.startswith('sqlite:///')
    
    def test_development_pool_settings(self):
        """Test development pool configuration."""
        config = DevelopmentDatabaseConfig()
        assert config.POOL_SIZE == 5
        assert config.MAX_OVERFLOW == 5
        assert config.POOL_PRE_PING is True
        assert config.TRACK_MODIFICATIONS is True


class TestTestingConfig:
    """Test testing configuration specifics."""
    
    def test_testing_url(self):
        """Test testing database URL is in-memory SQLite."""
        config = TestingDatabaseConfig()
        url = config.get_database_url()
        assert url == 'sqlite:///:memory:'
    
    def test_testing_pool_disabled(self):
        """Test testing configuration disables pooling."""
        config = TestingDatabaseConfig()
        assert config.MAX_OVERFLOW == 0


class TestProductionConfig:
    """Test production configuration specifics."""
    
    def test_production_requires_database_url(self):
        """Test that production config requires DATABASE_URL environment variable."""
        config = ProductionDatabaseConfig()
        
        # Save current env
        original_url = os.getenv('DATABASE_URL')
        
        try:
            # Remove DATABASE_URL
            os.environ.pop('DATABASE_URL', None)
            
            # Should raise error when trying to get URL
            with pytest.raises(ValueError, match='DATABASE_URL.*not set'):
                config.get_database_url()
        finally:
            # Restore original env
            if original_url:
                os.environ['DATABASE_URL'] = original_url
    
    def test_production_pool_settings(self):
        """Test production pool configuration."""
        config = ProductionDatabaseConfig()
        assert config.POOL_SIZE == 20
        assert config.MAX_OVERFLOW == 40
        assert config.POOL_PRE_PING is True
        assert config.ECHO is False


class TestConnectionStringBuilders:
    """Test database connection string builders."""
    
    def test_sqlite_url_builder(self):
        """Test SQLite connection string builder."""
        url = build_sqlite_url('test.db')
        assert url == 'sqlite:///test.db'
    
    def test_mysql_url_builder(self):
        """Test MySQL connection string builder."""
        url = build_mysql_url('user', 'pass', 'localhost', 3306, 'mydb')
        assert 'mysql+pymysql://' in url
        assert 'user' in url
        assert 'localhost' in url
        assert 'mydb' in url
    
    def test_mysql_url_encodes_password(self):
        """Test MySQL builder encodes special characters in password."""
        url = build_mysql_url('user', 'p@ss!word', 'localhost', 3306, 'mydb')
        # @ in password should be encoded as %40
        assert '%40' in url
    
    def test_postgresql_url_builder(self):
        """Test PostgreSQL connection string builder."""
        url = build_postgresql_url('user', 'pass', 'localhost', 5432, 'mydb')
        assert 'postgresql://' in url
        assert 'user' in url
        assert 'localhost' in url
        assert 'mydb' in url
    
    def test_postgresql_url_encodes_password(self):
        """Test PostgreSQL builder encodes special characters in password."""
        url = build_postgresql_url('user', 'p@ss!word', 'localhost', 5432, 'mydb')
        # @ in password should be encoded as %40
        assert '%40' in url


class TestDatabaseInitialization:
    """Test database initialization with Flask app."""
    
    def test_init_database_with_testing_config(self):
        """Test database initialization with testing configuration."""
        from flask import Flask
        test_app = Flask(__name__)
        
        config = TestingDatabaseConfig()
        init_database(test_app, config)
        
        # Check that configuration was applied
        assert 'SQLALCHEMY_DATABASE_URI' in test_app.config
        assert 'SQLALCHEMY_ENGINE_OPTIONS' in test_app.config
        assert test_app.config['SQLALCHEMY_DATABASE_URI'] == 'sqlite:///:memory:'
    
    def test_init_database_applies_pool_settings(self):
        """Test that init_database applies pool configuration."""
        from flask import Flask
        test_app = Flask(__name__)
        
        config = DevelopmentDatabaseConfig()
        init_database(test_app, config)
        
        engine_options = test_app.config['SQLALCHEMY_ENGINE_OPTIONS']
        
        # SQLite file-based doesn't use full options, but should have some settings
        assert isinstance(engine_options, dict)
        assert len(engine_options) > 0


class TestDatabaseConnection:
    """Test database connection operations."""
    
    def test_check_database_connection_success(self, app):
        """Test successful database connection check."""
        with app.app_context():
            result = check_database_connection(app)
            assert result is True
    
    def test_check_database_connection_with_testing_app(self):
        """Test connection check with test app."""
        from flask import Flask
        test_app = Flask(__name__)
        test_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        test_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        db.init_app(test_app)
        
        result = check_database_connection(test_app)
        assert result is True


class TestPoolDiagnostics:
    """Test connection pool diagnostic utilities."""
    
    def test_get_pool_status(self, app):
        """Test getting pool status information."""
        with app.app_context():
            stats = PoolDiagnostics.get_pool_status(db.engine)
            assert isinstance(stats, dict)
            assert 'type' in stats
    
    def test_get_pool_status_with_static_pool(self):
        """Test pool diagnostics with StaticPool (testing)."""
        from sqlalchemy import create_engine, pool
        engine = create_engine(
            'sqlite:///:memory:',
            poolclass=pool.StaticPool
        )
        
        stats = PoolDiagnostics.get_pool_status(engine)
        assert stats['type'] == 'StaticPool'


class TestConfigurationEnvironmentVariables:
    """Test that configurations respect environment variables."""
    
    def test_development_respects_database_url_env(self):
        """Test development config uses DATABASE_URL if set."""
        original_url = os.getenv('DATABASE_URL')
        
        try:
            test_url = 'sqlite:///test.db'
            os.environ['DATABASE_URL'] = test_url
            
            config = DevelopmentDatabaseConfig()
            assert config.get_database_url() == test_url
        finally:
            if original_url:
                os.environ['DATABASE_URL'] = original_url
            else:
                os.environ.pop('DATABASE_URL', None)


@pytest.fixture
def app():
    """Create Flask app for testing."""
    from flask import Flask
    test_app = Flask(__name__)
    test_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    test_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(test_app)
    
    return test_app
