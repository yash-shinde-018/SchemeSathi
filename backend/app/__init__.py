"""
Flask application factory module for SchemeSathi.

This module implements the Flask application factory pattern, enabling:
- Multiple application instances for different environments (dev, test, prod)
- Lazy initialization of extensions (SQLAlchemy, Flask-Migrate)
- Centralized configuration management
- Clean blueprint and error handler registration
- Support for Flask shell context

The factory pattern is essential for:
1. Testing: Create separate app instances with test configuration
2. Scalability: Run multiple instances with different configs
3. Modularity: Load extensions only when needed
"""

import logging
from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_cors import CORS

# Import database module (handles SQLAlchemy configuration and initialization)
from app.database import db, init_database

# Initialize migration extension (deferred initialization with app)
migrate = Migrate()


def create_app(config_name: str = 'development') -> Flask:
    """
    Application factory function that creates and configures a Flask app instance.

    Implements the Flask application factory pattern, allowing multiple independent
    app instances to be created with different configurations. Extensions are
    initialized in deferred mode and bound to the app instance here.

    Args:
        config_name (str, optional): Configuration environment name.
            Must be one of: 'development', 'testing', 'production'.
            Defaults to 'development'.

    Returns:
        Flask: Fully configured Flask application instance ready for use.

    Raises:
        ValueError: If config_name is not recognized.

    Example:
        >>> # Create development app
        >>> app = create_app('development')
        >>> app.run(debug=True)

        >>> # Create test app with in-memory database
        >>> test_app = create_app('testing')
        >>> test_app.config['TESTING']  # True

        >>> # Create production app
        >>> prod_app = create_app('production')
    """
    from config import config_by_name

    # Validate config name
    if config_name not in config_by_name:
        raise ValueError(
            f"Unknown config name: {config_name}. "
            f"Valid options: {', '.join(config_by_name.keys())}"
        )

    # Create Flask app instance
    app = Flask(__name__)

    # Load configuration from config.py
    config = config_by_name[config_name]
    app.config.from_object(config)
    
    # Configure CORS to allow requests from frontend
    CORS(app, 
         origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5000', 'http://127.0.0.1:5000'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

    # Initialize extensions with app instance
    _initialize_extensions(app)

    # Register blueprints (modular route handlers)
    _register_blueprints(app)

    # Register error handlers (global error handling)
    _register_error_handlers(app)

    # Register CLI commands
    _register_cli_commands(app)

    # Create application context for database operations
    with app.app_context():
        _initialize_database(app)

    return app


def _initialize_extensions(app: Flask) -> None:
    """
    Initialize Flask extensions with the application instance.

    Extensions are initialized in deferred mode (created without app context)
    and then bound to the app here. This allows extensions to be created
    once and reused across multiple app instances.

    Args:
        app (Flask): Flask application instance

    This includes:
    - SQLAlchemy (ORM and database operations) via app.database module
    - Flask-Migrate (database schema versioning and migrations)
    """
    # Initialize database configuration and connection pooling via database.py
    init_database(app)
    
    migrate.init_app(app, db)

    app.logger.info(f"Extensions initialized for {app.config.get('ENV', 'unknown')} environment")


def _initialize_database(app: Flask) -> None:
    """
    Initialize database tables and seed data if needed.

    This function should be called within an app context.
    Creates all tables if they don't exist and imports models.

    Args:
        app (Flask): Flask application instance (must be in app context)
    """
    # Import all models to register with SQLAlchemy
    # This must be done after db.init_app() is called
    from app.models import User, Notification, CitizenQuery  # noqa: F401

    # Create all tables from registered models
    db.create_all()
    app.logger.info("Database tables created/verified")


def _register_blueprints(app: Flask) -> None:
    """
    Register Flask blueprints with the application.

    Blueprints enable modular organization of routes. Each blueprint handles
    a logical group of related endpoints (e.g., auth, schemes, users, admin).

    Blueprints to register (as they are created):
    - auth_bp: /api/auth/* (register, login, logout, password reset)
    - schemes_bp: /api/schemes/* (list, search, filter, details)
    - users_bp: /api/users/* (profile, settings)
    - admin_bp: /api/admin/* (scheme management, user management)
    - health_bp: /api/health/* (health checks and diagnostics)
    - notifications_bp: /api/notifications/* (user alerts, broadcasts, query replies)

    Args:
        app (Flask): Flask application instance
    """
    # Register health check endpoints
    from app.routes.health import health_bp
    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Register auth blueprint
    try:
        from app.routes.auth import auth_bp
        app.register_blueprint(auth_bp, url_prefix="/api/auth")
    except ImportError as e:
        app.logger.warning("Auth blueprint not found: {}".format(e))
    
    # Register schemes blueprint
    try:
        from app.routes.schemes import schemes_bp
        app.register_blueprint(schemes_bp, url_prefix="/api/schemes")
    except ImportError as e:
        app.logger.warning("Schemes blueprint not found: {}".format(e))
    
    # Register admin blueprint
    try:
        from app.routes.admin import admin_bp
        app.register_blueprint(admin_bp, url_prefix="/api/admin")
    except ImportError as e:
        app.logger.warning("Admin blueprint not found: {}".format(e))

    # Register users blueprint
    try:
        from app.routes.users import users_bp
        app.register_blueprint(users_bp, url_prefix="/api/users")
    except ImportError as e:
        app.logger.warning("Users blueprint not found: {}".format(e))

    # Register notifications blueprint
    try:
        from app.routes.notifications import notifications_bp
        app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    except ImportError as e:
        app.logger.warning("Notifications blueprint not found: {}".format(e))

    app.logger.info("Blueprints registered")


def _register_error_handlers(app: Flask) -> None:
    """
    Register global error handlers for the application.

    Error handlers provide consistent error responses across the API.
    Each handler returns a JSON response with success=false and error details.

    HTTP Status Codes:
    - 400: Bad Request (invalid input, validation errors)
    - 401: Unauthorized (missing or invalid authentication)
    - 403: Forbidden (authenticated but insufficient permissions)
    - 404: Not Found (resource doesn't exist)
    - 409: Conflict (duplicate resource, constraint violation)
    - 422: Unprocessable Entity (semantic validation errors)
    - 500: Internal Server Error (unexpected server error)

    Args:
        app (Flask): Flask application instance
    """

    @app.errorhandler(400)
    def bad_request_error(error) -> tuple:
        """Handle 400 Bad Request errors (invalid input, validation failures)."""
        app.logger.warning(f"Bad Request: {str(error)}")
        return jsonify({
            'success': False,
            'message': 'Bad request - invalid input or parameters',
            'error': 'BAD_REQUEST'
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error) -> tuple:
        """Handle 401 Unauthorized errors (missing or invalid authentication)."""
        app.logger.warning(f"Unauthorized access attempt: {str(error)}")
        return jsonify({
            'success': False,
            'message': 'Unauthorized - authentication required',
            'error': 'UNAUTHORIZED'
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error) -> tuple:
        """Handle 403 Forbidden errors (insufficient permissions)."""
        app.logger.warning(f"Forbidden access attempt: {str(error)}")
        return jsonify({
            'success': False,
            'message': 'Forbidden - insufficient permissions',
            'error': 'FORBIDDEN'
        }), 403

    @app.errorhandler(404)
    def not_found_error(error) -> tuple:
        """Handle 404 Not Found errors (resource doesn't exist)."""
        return jsonify({
            'success': False,
            'message': 'Resource not found',
            'error': 'NOT_FOUND'
        }), 404

    @app.errorhandler(409)
    def conflict_error(error) -> tuple:
        """Handle 409 Conflict errors (duplicate resource, constraint violations)."""
        app.logger.warning(f"Conflict: {str(error)}")
        return jsonify({
            'success': False,
            'message': 'Conflict - resource already exists or constraint violated',
            'error': 'CONFLICT'
        }), 409

    @app.errorhandler(422)
    def unprocessable_entity_error(error) -> tuple:
        """Handle 422 Unprocessable Entity errors (semantic validation failures)."""
        app.logger.warning(f"Unprocessable Entity: {str(error)}")
        return jsonify({
            'success': False,
            'message': 'Unprocessable entity - semantic validation failed',
            'error': 'UNPROCESSABLE_ENTITY'
        }), 422

    @app.errorhandler(500)
    def internal_error(error) -> tuple:
        """Handle 500 Internal Server Error (unexpected server errors)."""
        app.logger.error(f"Internal Server Error: {str(error)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': 'Internal server error - please try again later',
            'error': 'INTERNAL_ERROR'
        }), 500

    app.logger.info("Error handlers registered")


def _register_cli_commands(app: Flask) -> None:
    """
    Register Flask CLI commands for database and utility operations.

    CLI commands provide convenient command-line tools for development
    and operations tasks.

    Available commands (to be implemented):
    - flask db-init: Initialize database (create all tables)
    - flask db-seed: Seed database with initial categories and schemes
    - flask db-reset: Reset database (drop all tables and recreate)
    - flask import-schemes: Import schemes from CSV/JSON file
    - flask shell: Interactive Python shell with app context

    Args:
        app (Flask): Flask application instance
    """
    # Register database CLI commands
    from app.cli import register_cli_commands
    register_cli_commands(app)

    app.logger.info("CLI commands registered")




