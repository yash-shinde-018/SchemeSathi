"""
Entry point for the SchemeSathi Flask application.
Run this file to start the development server.
"""

import os
from dotenv import load_dotenv
from app import create_app, db

# Load environment variables from .env file
load_dotenv()

# Create Flask application
config_name = os.getenv('FLASK_ENV', 'development')
app = create_app(config_name)


@app.shell_context_processor
def make_shell_context():
    """
    Add imports to Flask shell context.
    This allows easier access to app and db objects in flask shell.
    """
    return {
        'app': app,
        'db': db,
    }


if __name__ == '__main__':
    # Get configuration from environment
    host = os.getenv('SERVER_HOST', '127.0.0.1')
    port = int(os.getenv('SERVER_PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'

    # Run the application
    app.run(
        host=host,
        port=port,
        debug=debug
    )

