"""
Application configuration module for SchemeSathi Flask app.

This module defines configuration classes for different environments (development, testing, production).
Each configuration class inherits from the base Config class and overrides settings as needed.

Configuration can be selected by setting the FLASK_ENV environment variable:
- 'development': Local development with relaxed security, SQLite, debug mode enabled
- 'testing': Unit/integration testing with in-memory database, CSRF disabled
- 'production': Production deployment with strict security, MySQL/PostgreSQL, optimized settings

Environment variables (see .env.example for details):
- FLASK_ENV: 'development', 'testing', or 'production'
- DATABASE_URL: SQLAlchemy database connection string
- SECRET_KEY: Flask secret key for session signing (at least 32 chars recommended)
- JWT_SECRET_KEY: Secret key for JWT token signing (at least 32 chars recommended)
- LOG_LEVEL: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
"""

import os
from datetime import timedelta


class Config:
    """
    Base configuration class with common settings for all environments.
    
    Contains security defaults, session management, database, authentication,
    and application settings. Subclasses override specific settings for their environment.
    
    SECURITY NOTES:
    - Session cookies are HTTP-only to prevent JavaScript access
    - SameSite attribute prevents CSRF attacks by restricting cookie sending across sites
    - Password reset tokens expire after 24 hours
    - JWT tokens expire based on environment settings
    """

    # =========== Flask Core Configuration ===========
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = False
    TESTING = False

    # =========== Secret Key Configuration ===========
    # Used for session signing, CSRF tokens, and general security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

    # =========== Database Configuration (SQLAlchemy) ===========
    # Track model modifications: Set to False for performance, True for debugging
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Echo SQL queries to logs (useful for debugging, disable in production)
    SQLALCHEMY_ECHO = False
    
    # Record slow queries (for performance monitoring)
    SQLALCHEMY_RECORD_QUERIES = True
    
    # Connection pooling settings for database efficiency
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,              # Number of persistent connections
        'pool_recycle': 3600,         # Recycle connections after 1 hour
        'pool_pre_ping': True,        # Test connections before using (prevents "lost connection" errors)
        'echo_pool': False,           # Set to True to log connection pool events
    }

    # =========== Session Configuration ===========
    # Session timeout: 30 minutes of inactivity (in seconds)
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    
    # Session cookie configuration for security
    SESSION_COOKIE_SECURE = True        # Only transmit cookie over HTTPS
    SESSION_COOKIE_HTTPONLY = True      # Prevent JavaScript access (protects against XSS)
    SESSION_COOKIE_SAMESITE = 'Lax'     # CSRF protection: 'Lax' or 'Strict'
    SESSION_COOKIE_NAME = 'schemesathi_session'
    SESSION_REFRESH_EACH_REQUEST = True # Refresh cookie on each request to extend timeout

    # =========== JWT Configuration ===========
    # Note: Using session-based auth (server-side sessions), not JWT in this phase
    # Included for reference and potential future use
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)   # Access token validity
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)  # Refresh token validity
    JWT_ALGORITHM = 'HS256'

    # =========== Password Reset Configuration ===========
    PASSWORD_RESET_TOKEN_EXPIRES = timedelta(hours=24)  # Password reset link validity

    # =========== CSRF Configuration ===========
    # Cross-Site Request Forgery protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None  # CSRF token has no time limit (disabled)

    # =========== Security Headers Configuration ===========
    # These headers are typically set by middleware
    SECURITY_HEADERS = {
        'X-Frame-Options': 'SAMEORIGIN',           # Prevent clickjacking
        'X-Content-Type-Options': 'nosniff',       # Prevent MIME type sniffing
        'X-XSS-Protection': '1; mode=block',       # Enable XSS filter in older browsers
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',  # HSTS (1 year)
    }

    # =========== CORS Configuration ===========
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
    CORS_ALLOW_HEADERS = ['Content-Type', 'Authorization', 'X-CSRF-Token']
    CORS_EXPOSE_HEADERS = ['Content-Range', 'X-Total-Count']
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']

    # =========== Logging Configuration ===========
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = 'logs/schemesathi.log'
    LOG_MAX_BYTES = 10485760  # 10 MB
    LOG_BACKUP_COUNT = 5

    # =========== Application Settings ===========
    JSON_SORT_KEYS = False
    
    # Pagination defaults
    DEFAULT_PAGE = 1
    DEFAULT_LIMIT = 12
    MAX_LIMIT = 100
    
    # Search and filtering
    SEARCH_QUERY_MIN_LENGTH = 2
    SEARCH_QUERY_MAX_LENGTH = 100
    
    # File upload settings (if applicable)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads/')

    # =========== API Configuration ===========
    API_TITLE = 'SchemeSathi API'
    API_VERSION = '1.0.0'
    API_BASE_URL = '/api'
    
    # Rate limiting (e.g., 5 failed login attempts in 15 minutes)
    LOGIN_RATE_LIMIT = 5
    LOGIN_RATE_LIMIT_WINDOW = 900  # 15 minutes in seconds


class DevelopmentConfig(Config):
    """
    Development environment configuration.
    
    Features:
    - Debug mode enabled for detailed error messages and auto-reload
    - SQLite database for easy local development
    - Relaxed security settings (for convenience)
    - SQL query logging for debugging
    - CORS permissive (allow all origins on localhost)
    """

    DEBUG = True
    TESTING = False

    # =========== Database Configuration ===========
    # SQLite for local development (file-based database)
    # File location: backend/schemesathi_dev.db
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///schemesathi_dev.db'
    )

    # Enable SQL echo for debugging
    SQLALCHEMY_ECHO = True

    # =========== Security Configuration ===========
    # Relaxed security for development convenience
    SESSION_COOKIE_SECURE = False        # Allow HTTP (not HTTPS)
    
    # CSRF protection still enabled, but with relaxed settings
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = None

    # =========== Logging ===========
    LOG_LEVEL = 'DEBUG'

    # =========== JWT Configuration ===========
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')


class TestingConfig(Config):
    """
    Testing environment configuration.
    
    Features:
    - In-memory SQLite database for fast, isolated tests
    - Debug mode enabled for debugging test failures
    - CSRF protection disabled (simplifies form testing)
    - Relaxed security settings suitable for unit/integration tests
    - No database file I/O (everything in RAM)
    """

    TESTING = True
    DEBUG = True

    # =========== Database Configuration ===========
    # In-memory SQLite database for fast tests without file I/O
    # Each test run gets a fresh, isolated database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

    # Disable modifications tracking in testing
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # SQLite in-memory doesn't support connection pooling
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False},
        'poolclass': 'StaticPool',
    }

    # =========== Security Configuration ===========
    # CSRF protection disabled for easier form testing
    WTF_CSRF_ENABLED = False

    # Relaxed security for testing
    SESSION_COOKIE_SECURE = False

    # =========== JWT Configuration ===========
    # Use test-specific secret key
    JWT_SECRET_KEY = 'test-secret-key-should-not-be-used-in-production'

    # Shorter token lifetimes for testing
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)

    # =========== Logging ===========
    LOG_LEVEL = 'DEBUG'

    # =========== Session Configuration ===========
    # Shorter session lifetime for testing
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=5)


class ProductionConfig(Config):
    """
    Production environment configuration.
    
    Features:
    - Strict security: HTTPS-only cookies, Strict SameSite
    - MySQL or PostgreSQL database (must be configured via DATABASE_URL)
    - Debug mode disabled
    - Mandatory environment variable validation
    - Connection pooling optimized for production load
    - CSRF protection enabled
    
    REQUIREMENTS:
    - Set FLASK_ENV=production before deploying
    - Set DATABASE_URL to your MySQL/PostgreSQL connection string
    - Set SECRET_KEY to a secure, random value (at least 32 characters)
    - Set JWT_SECRET_KEY to a secure, random value (at least 32 characters)
    - Ensure HTTPS is configured at the reverse proxy (nginx, Apache)
    
    EXAMPLE DATABASE_URL values:
    - PostgreSQL: postgresql://user:password@localhost:5432/schemesathi
    - MySQL: mysql+pymysql://user:password@localhost:3306/schemesathi
    """

    DEBUG = False
    TESTING = False

    # =========== Database Configuration ===========
    # Must be set via DATABASE_URL environment variable
    # No default provided - will raise error if not set
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        """Get database URI from environment, raise error if not set."""
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            raise ValueError(
                'DATABASE_URL environment variable is not set. '
                'Please configure your database connection string in the environment.'
            )
        return db_url

    # Connection pooling optimized for production
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,              # Larger connection pool for production
        'pool_recycle': 3600,         # Recycle connections after 1 hour
        'pool_pre_ping': True,        # Check connection health before use
        'echo_pool': False,           # Don't log pool events in production
        'max_overflow': 40,           # Allow up to 40 overflow connections
    }

    # Disable query recording in production for performance
    SQLALCHEMY_RECORD_QUERIES = False

    # =========== Security Configuration ===========
    # Strict security settings for production
    SESSION_COOKIE_SECURE = True        # HTTPS only
    SESSION_COOKIE_HTTPONLY = True      # No JavaScript access
    SESSION_COOKIE_SAMESITE = 'Strict'  # Strict CSRF protection

    # CSRF protection enabled
    WTF_CSRF_ENABLED = True

    # =========== Secret Keys Configuration ===========
    # Must be set via environment variables - no defaults
    @property
    def JWT_SECRET_KEY(self):
        """Get JWT secret from environment, raise error if not set."""
        key = os.getenv('JWT_SECRET_KEY')
        if not key:
            raise ValueError(
                'JWT_SECRET_KEY environment variable is not set. '
                'Please set a secure, random secret key (at least 32 characters).'
            )
        return key

    @property
    def SECRET_KEY(self):
        """Get Flask secret from environment, raise error if not set."""
        key = os.getenv('SECRET_KEY')
        if not key:
            raise ValueError(
                'SECRET_KEY environment variable is not set. '
                'Please set a secure, random secret key (at least 32 characters).'
            )
        return key

    # =========== Session Configuration ===========
    # Shorter session timeout for security
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    SESSION_REFRESH_EACH_REQUEST = True

    # =========== Logging ===========
    LOG_LEVEL = 'WARNING'
    # Log to file in production
    LOG_FILE = '/var/log/schemesathi/schemesathi.log'

    # =========== CORS Configuration ===========
    # Restrict CORS origins in production (set via environment variable)
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'https://schemesathi.example.com')


# =========== Configuration Dictionary ===========
# Maps configuration names to their classes for easy access
# Usage: Config.from_object(config_by_name['production'])
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}

def get_config(config_name=None):
    """
    Get configuration object by name.
    
    Args:
        config_name (str, optional): Configuration name ('development', 'testing', 'production').
                                    If not provided, uses FLASK_ENV environment variable.
                                    Defaults to 'development' if FLASK_ENV is not set.
    
    Returns:
        Config: Configuration class for the specified environment.
    
    Raises:
        ValueError: If configuration name is invalid.
    
    Example:
        config = get_config('production')
        app.config.from_object(config)
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    if config_name not in config_by_name:
        raise ValueError(
            f'Invalid configuration name: {config_name}. '
            f'Valid options: {", ".join(config_by_name.keys())}'
        )
    
    return config_by_name[config_name]
