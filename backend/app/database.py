"""
Database configuration module for SchemeSathi Flask application.

This module centralizes SQLAlchemy configuration, connection pooling settings,
and database initialization logic. It provides a clean separation of database
concerns from the application factory.

Features:
- Environment-specific connection pooling (development, testing, production)
- Connection string builders for SQLite, MySQL, and PostgreSQL
- Session factory with optimized settings
- Database initialization and health check utilities
- Connection pool monitoring and diagnostics

Connection Pooling Strategy:
- Development: Smaller pool (5-10) for local development
- Testing: No pooling (in-memory SQLite)
- Production: Larger pool (20-40) for handling production load

The pool_pre_ping feature verifies connections before use, preventing
"lost connection" errors which commonly occur with MySQL in production.
"""

import os
from typing import Optional, Dict, Any
from urllib.parse import quote_plus
from sqlalchemy import create_engine, event, pool, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, scoped_session
from flask_sqlalchemy import SQLAlchemy


# Initialize SQLAlchemy instance (deferred initialization)
db = SQLAlchemy()


# ========== Database Configuration Classes ==========

class DatabaseConfig:
    """
    Base database configuration with environment-agnostic settings.
    
    This class provides common configuration that applies across all environments.
    Subclasses override specific settings for their target environment.
    """
    
    # ========== Connection Pool Settings (Base) ==========
    POOL_SIZE: int = 10              # Number of persistent connections to maintain
    MAX_OVERFLOW: int = 20           # Additional connections created on demand
    POOL_RECYCLE: int = 3600         # Recycle connection after 1 hour (seconds)
    POOL_PRE_PING: bool = True       # Verify connections before use (prevents lost connection errors)
    ECHO_POOL: bool = False          # Log pool operations (connect, disconnect, overflow)
    
    # ========== SQLAlchemy Core Settings ==========
    TRACK_MODIFICATIONS: bool = False    # Don't track model modifications (performance)
    ECHO: bool = False                   # Don't echo SQL queries
    RECORD_QUERIES: bool = True          # Track query statistics for analysis
    FUTURE: bool = True                  # Use SQLAlchemy 2.0 API
    
    # ========== Connection String ==========
    DATABASE_URL: Optional[str] = None
    
    # ========== Session Settings ==========
    SESSION_EXPIRE_ON_COMMIT: bool = True  # Expire objects after commit


class DevelopmentDatabaseConfig(DatabaseConfig):
    """
    Development environment database configuration.
    
    Settings:
    - SQLite for simple local development
    - Smaller connection pool (5 connections)
    - Limited overflow (5 additional)
    - SQL query echo enabled for debugging
    - Pool diagnostics enabled
    """
    
    POOL_SIZE = 5              # Smaller pool for dev
    MAX_OVERFLOW = 5           # Limited overflow
    ECHO = True                # Show SQL queries for debugging
    ECHO_POOL = False          # Can enable for connection pool debugging
    TRACK_MODIFICATIONS = True # Helpful for debugging in development
    
    @classmethod
    def get_database_url(cls) -> str:
        """
        Get SQLite database URL for development.
        
        Returns:
            str: SQLite connection string pointing to backend/instance/schemesathi_dev.db
        """
        return os.getenv('DATABASE_URL', 'sqlite:///schemesathi_dev.db')


class TestingDatabaseConfig(DatabaseConfig):
    """
    Testing environment database configuration.
    
    Settings:
    - In-memory SQLite for fast, isolated tests
    - No connection pooling (not applicable to in-memory SQLite)
    - ECHO disabled for cleaner test output
    - RECORD_QUERIES disabled (not needed in tests)
    
    Note: Each test gets a fresh, isolated in-memory database
    """
    
    POOL_SIZE = 1              # Not used with in-memory SQLite
    MAX_OVERFLOW = 0           # Not used
    ECHO = False               # Reduce test output noise
    RECORD_QUERIES = False     # Not needed in tests
    
    @classmethod
    def get_database_url(cls) -> str:
        """
        Get in-memory SQLite database URL for testing.
        
        Returns:
            str: In-memory SQLite connection string (sqlite:///:memory:)
        """
        return 'sqlite:///:memory:'


class ProductionDatabaseConfig(DatabaseConfig):
    """
    Production environment database configuration.
    
    Settings:
    - MySQL or PostgreSQL (configured via DATABASE_URL)
    - Large connection pool (20-40) for handling production load
    - Aggressive connection recycling (1 hour)
    - Connection health checks enabled (pre_ping)
    - Query echo disabled for performance
    - Pool monitoring disabled (reduces overhead)
    
    IMPORTANT: DATABASE_URL must be set via environment variable
    Example values:
    - PostgreSQL: postgresql://user:pass@host:5432/schemesathi
    - MySQL: mysql+pymysql://user:pass@host:3306/schemesathi
    """
    
    POOL_SIZE = 20             # Larger pool for production
    MAX_OVERFLOW = 40          # Significant overflow for peak traffic
    ECHO = False               # Don't log queries (performance)
    ECHO_POOL = False          # Don't log pool operations (performance)
    RECORD_QUERIES = False     # Don't track queries (performance)
    TRACK_MODIFICATIONS = False
    
    @classmethod
    def get_database_url(cls) -> str:
        """
        Get database URL from environment variable.
        
        Returns:
            str: Database connection string from DATABASE_URL env var
            
        Raises:
            ValueError: If DATABASE_URL is not set
        """
        url = os.getenv('DATABASE_URL')
        if not url:
            raise ValueError(
                'DATABASE_URL environment variable not set. '
                'Please configure your production database connection string.'
            )
        return url


# ========== Configuration Selection ==========

def get_database_config(env: str = None) -> DatabaseConfig:
    """
    Get appropriate database configuration for the environment.
    
    Args:
        env (str, optional): Environment name ('development', 'testing', 'production').
                            If not provided, uses FLASK_ENV environment variable.
                            Defaults to 'development'.
    
    Returns:
        DatabaseConfig: Configuration instance for the specified environment
        
    Raises:
        ValueError: If environment name is invalid
    """
    if env is None:
        env = os.getenv('FLASK_ENV', 'development')
    
    config_map = {
        'development': DevelopmentDatabaseConfig,
        'testing': TestingDatabaseConfig,
        'production': ProductionDatabaseConfig,
    }
    
    if env not in config_map:
        raise ValueError(
            f'Invalid environment: {env}. '
            f'Must be one of: {", ".join(config_map.keys())}'
        )
    
    return config_map[env]()


# ========== Connection String Builders ==========

def build_sqlite_url(db_path: str) -> str:
    """
    Build SQLite connection string.
    
    Args:
        db_path (str): Path to SQLite database file (e.g., 'schemesathi_dev.db')
    
    Returns:
        str: SQLite connection URL
        
    Example:
        >>> build_sqlite_url('schemesathi_dev.db')
        'sqlite:///schemesathi_dev.db'
    """
    return f'sqlite:///{db_path}'


def build_mysql_url(
    user: str,
    password: str,
    host: str,
    port: int,
    database: str,
    driver: str = 'pymysql'
) -> str:
    """
    Build MySQL connection string.
    
    Args:
        user (str): MySQL username
        password (str): MySQL password (will be URL-encoded)
        host (str): MySQL server hostname
        port (int): MySQL server port (default 3306)
        database (str): Database name
        driver (str): MySQL driver (pymysql or mysqlconnector)
    
    Returns:
        str: MySQL connection URL
        
    Example:
        >>> build_mysql_url('root', 'secret', 'localhost', 3306, 'schemesathi')
        'mysql+pymysql://root:secret@localhost:3306/schemesathi'
    """
    # URL-encode password to handle special characters
    encoded_password = quote_plus(password)
    return f'mysql+{driver}://{user}:{encoded_password}@{host}:{port}/{database}'


def build_postgresql_url(
    user: str,
    password: str,
    host: str,
    port: int,
    database: str
) -> str:
    """
    Build PostgreSQL connection string.
    
    Args:
        user (str): PostgreSQL username
        password (str): PostgreSQL password (will be URL-encoded)
        host (str): PostgreSQL server hostname
        port (int): PostgreSQL server port (default 5432)
        database (str): Database name
    
    Returns:
        str: PostgreSQL connection URL
        
    Example:
        >>> build_postgresql_url('postgres', 'secret', 'localhost', 5432, 'schemesathi')
        'postgresql://postgres:secret@localhost:5432/schemesathi'
    """
    # URL-encode password to handle special characters
    encoded_password = quote_plus(password)
    return f'postgresql://{user}:{encoded_password}@{host}:{port}/{database}'


# ========== Connection Pool Diagnostics ==========

class PoolDiagnostics:
    """
    Utilities for monitoring and diagnosing SQLAlchemy connection pool behavior.
    Useful for identifying connection pool issues and performance bottlenecks.
    """
    
    @staticmethod
    def get_pool_status(engine: Engine) -> Dict[str, Any]:
        """
        Get current connection pool status.
        
        Args:
            engine (Engine): SQLAlchemy engine instance
        
        Returns:
            Dict: Pool statistics including size, overflow, checked in/out connections
        
        Example:
            >>> from flask import current_app
            >>> from app.database import PoolDiagnostics
            >>> stats = PoolDiagnostics.get_pool_status(current_app.db.engine)
            >>> print(f"Pool size: {stats['pool_size']}, Overflow: {stats['overflow']}")
        """
        pool_obj = engine.pool
        
        if isinstance(pool_obj, pool.NullPool):
            return {'type': 'NullPool', 'pool_size': 0, 'checkedout': 0}
        
        if isinstance(pool_obj, pool.StaticPool):
            return {'type': 'StaticPool', 'pool_size': 'unlimited'}
        
        if hasattr(pool_obj, 'size'):
            return {
                'type': type(pool_obj).__name__,
                'pool_size': pool_obj.size() if callable(pool_obj.size) else pool_obj.size,
                'checked_out': pool_obj.checkedout() if callable(pool_obj.checkedout) else 0,
                'overflow': pool_obj.overflow() if callable(pool_obj.overflow) else 0,
            }
        
        return {'type': 'Unknown', 'status': 'Unable to determine pool status'}
    
    @staticmethod
    def log_pool_status(engine: Engine, logger=None) -> None:
        """
        Log current pool status (useful for debugging).
        
        Args:
            engine (Engine): SQLAlchemy engine instance
            logger: Python logger instance (optional)
        """
        stats = PoolDiagnostics.get_pool_status(engine)
        message = f"Connection Pool Status: {stats}"
        
        if logger:
            logger.info(message)
        else:
            print(message)


# ========== Connection Event Handlers ==========

def configure_pool_events(engine: Engine, logger=None) -> None:
    """
    Configure event handlers for connection pool monitoring.
    
    These handlers log connection pool events for debugging and monitoring.
    Only recommended for development environments due to performance overhead.
    
    Args:
        engine (Engine): SQLAlchemy engine instance
        logger: Python logger instance (optional)
    """
    
    @event.listens_for(engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        """Log when a connection is established."""
        if logger:
            logger.debug("Database connection established")
    
    @event.listens_for(engine, "checkin")
    def receive_checkin(dbapi_conn, connection_record):
        """Log when a connection is returned to the pool."""
        if logger:
            logger.debug("Connection returned to pool")
    
    @event.listens_for(engine, "checkout")
    def receive_checkout(dbapi_conn, connection_record, connection_proxy):
        """Log when a connection is checked out from the pool."""
        if logger:
            logger.debug("Connection checked out from pool")


# ========== Database Initialization ==========

def init_database(app, config: DatabaseConfig = None) -> None:
    """
    Initialize SQLAlchemy with the Flask application and configuration.
    
    This function:
    1. Loads or builds database connection URL
    2. Applies SQLAlchemy configuration to Flask app
    3. Initializes SQLAlchemy extension with the app
    4. Configures connection pool event handlers (dev only)
    
    Args:
        app (Flask): Flask application instance
        config (DatabaseConfig, optional): Database configuration instance.
                                          If not provided, auto-selects based on FLASK_ENV.
    
    Example:
        >>> from flask import Flask
        >>> from app.database import init_database, get_database_config
        >>> 
        >>> app = Flask(__name__)
        >>> config = get_database_config('production')
        >>> init_database(app, config)
    """
    if config is None:
        config = get_database_config()
    
    # Build or get database URL
    database_url = config.get_database_url()
    
    # Apply configuration to Flask app
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = config.TRACK_MODIFICATIONS
    app.config['SQLALCHEMY_ECHO'] = config.ECHO
    app.config['SQLALCHEMY_RECORD_QUERIES'] = config.RECORD_QUERIES
    
    # Build SQLAlchemy engine options
    engine_options = {
        'pool_size': config.POOL_SIZE,
        'max_overflow': config.MAX_OVERFLOW,
        'pool_recycle': config.POOL_RECYCLE,
        'pool_pre_ping': config.POOL_PRE_PING,
        'echo_pool': config.ECHO_POOL,
    }
    
    # Handle in-memory SQLite (no pooling)
    if 'sqlite:///:memory:' in database_url:
        engine_options = {
            'connect_args': {'check_same_thread': False},
            'poolclass': pool.StaticPool,
        }
    # Handle file-based SQLite (basic pooling)
    elif database_url.startswith('sqlite:'):
        # SQLite with file doesn't support overflow or pre-ping effectively
        engine_options = {
            'pool_size': max(1, config.POOL_SIZE // 2),
            'pool_recycle': config.POOL_RECYCLE,
        }
    
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options
    
    # Initialize SQLAlchemy extension
    db.init_app(app)
    
    # Log configuration
    env = os.getenv('FLASK_ENV', 'unknown')
    app.logger.info(
        f"Database initialized for {env} environment: "
        f"{database_url.replace(database_url.split(':')[1:][0] if ':' in database_url else '', '***')} "
        f"(Pool: {config.POOL_SIZE}, Overflow: {config.MAX_OVERFLOW})"
    )


def check_database_connection(app) -> bool:
    """
    Check if database connection is healthy.
    
    Performs a simple query to verify the database is accessible.
    Useful for health checks in production.
    
    Args:
        app (Flask): Flask application instance
    
    Returns:
        bool: True if database is accessible, False otherwise
    
    Example:
        >>> from flask import current_app
        >>> from app.database import check_database_connection
        >>> 
        >>> if check_database_connection(current_app):
        ...     print("Database is healthy")
        ... else:
        ...     print("Database connection failed")
    """
    try:
        with app.app_context():
            db.session.execute(text('SELECT 1'))
            db.session.commit()
        return True
    except Exception as e:
        app.logger.error(f"Database connection check failed: {str(e)}")
        return False


# ========== Session Factory Configuration ==========

def create_session_factory(engine: Engine) -> scoped_session:
    """
    Create a scoped session factory for thread-safe database access.
    
    Note: Flask-SQLAlchemy (db.session) already provides this functionality,
    so this is provided for reference in non-Flask contexts.
    
    Args:
        engine (Engine): SQLAlchemy engine instance
    
    Returns:
        scoped_session: Thread-safe session factory
    
    Example:
        >>> engine = create_engine('sqlite:///app.db')
        >>> Session = create_session_factory(engine)
        >>> session = Session()
    """
    session_factory = sessionmaker(bind=engine, expire_on_commit=True)
    return scoped_session(session_factory)
