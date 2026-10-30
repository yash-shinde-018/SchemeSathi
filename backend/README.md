# SchemeSathi Backend

Flask-based RESTful API backend for the SchemeSathi authenticated application. This backend provides user authentication, scheme management, and API endpoints for the SchemeSathi platform.

## Project Structure

```
backend/
├── app/                    # Application package
│   ├── __init__.py        # App factory and configuration
│   ├── models.py          # Database models
│   └── routes/            # API route blueprints (auth, schemes, etc.)
├── models/                # Additional model utilities
├── routes/                # Blueprint definitions and route handlers
├── services/              # Business logic and service layer
├── utils/                 # Utility functions and helpers
├── tests/                 # Test suite
├── config.py              # Environment-specific configurations
├── requirements.txt       # Python dependencies
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore rules
├── venv/                 # Virtual environment (created after setup)
└── README.md             # This file
```

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

## Installation

### 1. Clone the Repository

```bash
cd SchemeSathi/backend
```

### 2. Create Virtual Environment

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

Choose the appropriate requirements file based on your use case:

**For Production:**
```bash
pip install -r requirements.txt
```

**For Development (includes testing & linting tools):**
```bash
pip install -r requirements-dev.txt
```

**For Testing Only:**
```bash
pip install -r requirements-test.txt
```

**Requirements Files Explained:**
- `requirements.txt` - Core production dependencies (Flask, SQLAlchemy, bcrypt, JWT, etc.)
- `requirements-dev.txt` - Development dependencies including pytest, pylint, black, ipython
- `requirements-test.txt` - Minimal testing dependencies (pytest, pytest-flask, factory-boy)

### 4. Setup Environment Variables

```bash
# Copy the example .env file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set:
# - FLASK_ENV=development
# - JWT_SECRET_KEY=your-secret-key
# - DATABASE_URL (if not using SQLite)
```

### 5. Initialize Database

```bash
# Create database tables
flask shell
>>> from app import db
>>> db.create_all()
>>> exit()
```

## Running the Application

### Development Server

```bash
# Make sure virtual environment is activated
python run.py
```

The server will start at `http://localhost:5000`

### With Environment Variable

```bash
# On Windows
set FLASK_ENV=development && python run.py

# On macOS/Linux
FLASK_ENV=development python run.py
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

## API Documentation

API endpoints are organized into blueprints:

- `/api/auth/` - Authentication endpoints (login, register, logout)
- `/api/users/` - User management endpoints
- `/api/schemes/` - Scheme endpoints (CRUD operations)

Detailed API documentation will be available at `/api/docs` (when Swagger integration is added).

## Configuration

The application supports multiple environments:

- **development**: Local development with SQLite, debug mode enabled
- **testing**: Testing environment with in-memory database
- **production**: Production environment with strict security settings

Set the environment using the `FLASK_ENV` variable in `.env`:

```
FLASK_ENV=development
```

## Database Migrations

Using Flask-Migrate for database schema management:

```bash
# Create a new migration
flask db migrate -m "Description of changes"

# Apply migrations to database
flask db upgrade

# Revert to previous migration
flask db downgrade
```

## Key Features

- ✅ User authentication with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ SQLAlchemy ORM for database operations
- ✅ Environment-based configuration
- ✅ Comprehensive error handling
- ✅ CORS support for frontend integration
- ✅ Database migrations with Flask-Migrate

## Development Guidelines

### Adding New Routes

1. Create a new blueprint in `app/routes/`
2. Register the blueprint in `app/__init__.py`
3. Write tests for the new routes
4. Document the endpoints

### Adding New Models

1. Define the model in `app/models.py`
2. Create a migration: `flask db migrate`
3. Apply the migration: `flask db upgrade`
4. Write tests for the model

### Code Style

- Follow PEP 8 style guidelines
- Use meaningful variable and function names
- Add docstrings to functions and classes
- Keep functions focused and single-purpose

## Dependencies

Key dependencies included in `requirements.txt`:

- **Flask** (2.3.3) - Web framework for building the REST API
- **Flask-SQLAlchemy** (3.0.5) - ORM integration with Flask
- **Flask-Migrate** (4.0.5) - Database migration management
- **Flask-CORS** (4.0.0) - Cross-Origin Resource Sharing support for frontend integration
- **Flask-JWT-Extended** (4.5.2) - JWT authentication and token management
- **SQLAlchemy** (2.0.21) - ORM and database abstraction layer
- **bcrypt** (4.0.1) - Secure password hashing with salt
- **python-dotenv** (1.0.0) - Environment variable management from .env files
- **requests** (2.31.0) - HTTP library for external API calls
- **Werkzeug** (2.3.7) - WSGI utilities and security helpers
- **click** (8.1.7) - Command-line interface creation
- **itsdangerous** (2.1.2) - Data signing and verification
- **Jinja2** (3.1.2) - Template engine
- **MarkupSafe** (2.1.3) - Safe string handling for templates

All versions are pinned for reproducibility and compatibility with Python 3.8+.

## Troubleshooting

### Module Not Found Errors

Make sure the virtual environment is activated:

```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### Database Errors

If you get database errors, try resetting the database:

```bash
# Remove the database file (SQLite)
rm instance/schemesathi_dev.db

# Recreate tables
flask shell
>>> from app import db
>>> db.create_all()
>>> exit()
```

### Port Already in Use

If port 5000 is already in use, change it in `.env`:

```
SERVER_PORT=5001
```

Then run:

```bash
python -c "from app import create_app; app = create_app(); app.run(port=5001)"
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and write tests
3. Run tests to ensure everything passes
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Create a Pull Request

## License

This project is part of the SchemeSathi platform.

## Support

For issues and questions, please refer to the main SchemeSathi project documentation.
