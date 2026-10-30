"""
Flask CLI commands module for SchemeSathi.

This module provides command-line interface commands for database operations,
data management, and utility functions. Commands are registered with the Flask
app instance in app/__init__.py.

Available CLI commands:
- flask db-init: Initialize database (idempotent)
- flask db-reset: Reset database (dangerous, with --force flag)
- flask db-seed: Populate database with sample data
- flask health check: Check database health
- flask health status: Show detailed status
- flask health pool: Show connection pool info
"""

from app.cli.db import db_cli_group
from app.cli.health import health_cli


def register_cli_commands(app):
    """
    Register all CLI command groups with the Flask app.
    
    Args:
        app (Flask): Flask application instance
    """
    app.cli.add_command(db_cli_group, name='db')
    app.cli.add_command(health_cli, name='health')
    app.logger.info("CLI command groups registered")
