"""
Pytest configuration and fixtures for SchemeSathi tests.

Provides:
- app fixture: Flask app instance for testing
- db fixture: Database connection for tests
- Client fixtures for HTTP testing
- CLI runner for CLI command testing
- Database reset fixtures for test isolation
- Transactional reset context manager
"""

import pytest
import os
from app import create_app
from app.database import db
from app.utils.db_reset import (
    reset_database,
    clear_all_data,
    reset_sequences,
    DatabaseReset,
    TransactionalReset
)


@pytest.fixture(scope='session')
def app():
    """
    Create application for testing.
    
    Scope: session
    - Single app instance for all tests
    - Efficient resource usage
    - Creates database tables once per test session
    """
    # Create app with test configuration
    app = create_app('testing')
    
    # Create application context
    with app.app_context():
        # Create all tables from models
        db.create_all()
        yield app
        # Clean up after all tests
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """
    Create test client for HTTP requests.
    
    Scope: function (new client for each test)
    
    Usage:
        def test_login(client):
            response = client.post('/api/auth/login', json={...})
            assert response.status_code == 200
    """
    return app.test_client()


@pytest.fixture
def runner(app):
    """
    Create CLI runner for command testing.
    
    Scope: function (new runner for each test)
    
    Usage:
        def test_db_reset_cli(runner):
            result = runner.invoke(app.cli, ['db', 'reset', '--force'])
            assert result.exit_code == 0
    """
    return app.test_cli_runner()


@pytest.fixture
def db_session(app):
    """
    Create database session for tests.
    
    Scope: function
    - Starts transaction before test
    - Rolls back after test (no side effects)
    - Useful for testing database operations
    
    Usage:
        def test_user_creation(db_session):
            user = User(email='test@example.com')
            db_session.add(user)
            db_session.commit()
            assert User.query.count() == 1
    """
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        session = db.session_factory(bind=connection)
        
        yield session
        
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(autouse=True)
def reset_db(app):
    """
    Automatically reset database before each test.
    
    Scope: function (runs before each test)
    - Clears all data while preserving schema
    - Resets auto-increment sequences
    - Ensures clean state for each test
    - Runs automatically for all tests (autouse=True)
    
    This fixture provides test isolation by:
    1. Deleting all rows from all tables
    2. Resetting auto-increment sequences to 1
    3. Ensuring predictable test conditions
    
    Note: Tests can opt-out by using db_session fixture instead
    """
    with app.app_context():
        # Clear all data (faster than drop/create)
        clear_all_data()
        
        # Reset sequences for predictable IDs
        try:
            reset_sequences()
        except Exception:
            # Sequence reset may not work on all databases, so it's optional
            pass
        
        yield
        
        # Clean up session after test
        db.session.remove()


@pytest.fixture
def reset_db_fixture(app):
    """
    Fixture for explicitly resetting database in a test.
    
    Scope: function
    - Manually triggered within a test
    - Useful for tests that need multiple database resets
    - Alternative to autouse reset_db fixture
    
    Usage:
        def test_multiple_operations(reset_db_fixture):
            # First operation
            user = User(email='test1@example.com')
            db.session.add(user)
            db.session.commit()
            assert User.query.count() == 1
            
            # Reset database
            reset_db_fixture()
            assert User.query.count() == 0
            
            # Second operation with clean database
            user2 = User(email='test2@example.com')
            db.session.add(user2)
            db.session.commit()
            assert User.query.count() == 1
    """
    def _reset():
        with app.app_context():
            clear_all_data()
            try:
                reset_sequences()
            except Exception:
                pass
            db.session.remove()
    
    return _reset


@pytest.fixture
def clean_db_fixture(app):
    """
    Fixture for cleaning database after a test.
    
    Scope: function
    - Clears data after test execution
    - Useful for cleanup after specific tests
    - Runs at end of test (opposite of reset_db)
    
    Usage:
        def test_data_persistence(clean_db_fixture):
            # Test runs with database state from previous test
            user = User(email='test@example.com')
            db.session.add(user)
            db.session.commit()
            assert User.query.count() == 1
            
            # clean_db_fixture automatically cleans up after test
    """
    yield
    
    # Clean up after test
    with app.app_context():
        clear_all_data()
        db.session.remove()


@pytest.fixture
def database_reset_context(app):
    """
    Fixture providing DatabaseReset context manager for tests.
    
    Scope: function
    - Returns the DatabaseReset context manager
    - Allows tests to use transactional resets within test code
    - Useful for testing database operations with isolation
    
    Usage:
        def test_with_context(database_reset_context):
            with database_reset_context:
                user = User(email='test@example.com')
                db.session.add(user)
                db.session.commit()
                assert User.query.count() == 1
            
            # After context, database is cleaned
            assert User.query.count() == 0
    """
    return DatabaseReset


@pytest.fixture
def transactional_reset_context(app):
    """
    Fixture providing TransactionalReset context manager for tests.
    
    Scope: function
    - Returns the TransactionalReset context manager
    - Uses database transactions for isolation (faster than deletes)
    - Useful for tests that need transaction-based cleanup
    
    Usage:
        def test_with_transaction(transactional_reset_context):
            with transactional_reset_context:
                user = User(email='test@example.com')
                db.session.add(user)
                db.session.commit()
                assert User.query.count() == 1
            
            # After context, transaction is rolled back
            assert User.query.count() == 0
    """
    return TransactionalReset
