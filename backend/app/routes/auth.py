"""
Authentication routes for SchemeSathi.

Handles user registration, login, logout, and password reset operations.
All endpoints return JSON responses with proper HTTP status codes.
"""

from flask import Blueprint, request, jsonify, session, current_app
from app import db
from app.models import User, UserProfile, Notification
from app.services.auth_service import AuthService, login_limiter, register_limiter, password_reset_limiter
from datetime import datetime
from sqlalchemy.exc import IntegrityError


auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user account.
    
    Request body:
    {
        "email": "user@example.com",
        "password": "SecurePass123!",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+91XXXXXXXXXX"
    }
    
    Returns:
    - 201: User registered successfully
    - 400: Invalid input or password too weak
    - 409: Email already registered
    - 429: Rate limited (too many requests)
    """
    try:
        # Check platform system settings
        from app.services.system_settings_service import SystemSettingsService
        public_settings = SystemSettingsService.get_public_settings()
        if not public_settings.get('allow_citizen_registration', True):
            return jsonify({
                'success': False,
                'message': 'Citizen self-registration is temporarily paused by platform administrators. Please check back shortly.',
                'error': 'REGISTRATION_PAUSED'
            }), 403

        # Rate limiting check
        email = request.json.get('email', '').lower()
        if register_limiter.is_rate_limited(email):
            return jsonify({
                'success': False,
                'message': 'Too many registration attempts. Please try again later.',
                'error': 'RATE_LIMIT_EXCEEDED'
            }), 429
        
        register_limiter.record_attempt(email)
        
        # Validate input
        data = request.get_json()
        
        required_fields = ['email', 'password', 'first_name', 'last_name', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}',
                    'error': 'MISSING_FIELD'
                }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        phone = data['phone'].strip()
        
        # Validate email format
        is_valid, message = AuthService.validate_email(email)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'INVALID_EMAIL'
            }), 400
        
        # Validate password strength
        is_strong, message = AuthService.validate_password_strength(password)
        if not is_strong:
            return jsonify({
                'success': False,
                'message': message,
                'error': 'WEAK_PASSWORD'
            }), 400
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Email already registered',
                'error': 'EMAIL_EXISTS'
            }), 409
        
        # Hash password
        password_hash = AuthService.hash_password(password)
        
        # Create user
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            account_status='ACTIVE'
        )
        
        # Create user profile
        profile = UserProfile(user=user)
        
        db.session.add(user)
        db.session.add(profile)
        db.session.flush()

        # Create single official Welcome notification for newly registered user
        welcome_notif = Notification(
            user_id=user.id,
            category='WELCOME',
            icon='hands-clapping',
            title=f'Welcome to SchemeSathi, {user.first_name}! 🎉',
            description='Welcome to SchemeSathi! Start exploring government schemes tailored for you. Complete your profile for 100% accurate recommendations.',
            link_action='/profile',
            link_text='Complete Profile →',
            is_read=False,
            created_at=datetime.utcnow()
        )
        db.session.add(welcome_notif)
        db.session.commit()
        
        # Clear rate limit on successful registration
        register_limiter.reset_attempts(email)
        
        current_app.logger.info(f"User registered: {email}")
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user.id,
            'email': user.email
        }), 201
    
    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Email already registered',
            'error': 'EMAIL_EXISTS'
        }), 409
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Registration failed',
            'error': 'INTERNAL_ERROR'
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user and create session.
    
    Request body:
    {
        "email": "user@example.com",
        "password": "SecurePass123!"
    }
    
    Returns:
    - 200: Login successful, session created
    - 400: Missing credentials
    - 401: Invalid credentials
    - 429: Rate limited (too many failed attempts)
    """
    try:
        # Rate limiting check
        email = request.json.get('email', '').lower()
        if login_limiter.is_rate_limited(email):
            return jsonify({
                'success': False,
                'message': 'Too many login attempts. Please try again later.',
                'error': 'RATE_LIMIT_EXCEEDED'
            }), 429
        
        # Validate input
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required',
                'error': 'MISSING_CREDENTIALS'
            }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user or not AuthService.verify_password(password, user.password_hash):
            login_limiter.record_attempt(email)
            return jsonify({
                'success': False,
                'message': 'Invalid email or password',
                'error': 'INVALID_CREDENTIALS'
            }), 401
        
        # Check account status
        if user.account_status != 'ACTIVE':
            return jsonify({
                'success': False,
                'message': 'Account is not active',
                'error': 'ACCOUNT_INACTIVE'
            }), 403
        
        # Create session
        session['user_id'] = user.id
        session['email'] = user.email
        session['role'] = user.role
        session.permanent = True
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Clear rate limit
        login_limiter.reset_attempts(email)
        
        current_app.logger.info(f"User logged in: {email}")
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'role': user.role,
            'account_status': user.account_status
        }
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user_data,
            'user_id': user.id,
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Login failed',
            'error': 'INTERNAL_ERROR'
        }), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Logout user and destroy session.
    
    Returns:
    - 200: Logout successful
    """
    try:
        email = session.get('email', 'unknown')
        session.clear()
        current_app.logger.info(f"User logged out: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Logout failed',
            'error': 'INTERNAL_ERROR'
        }), 500


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """
    Get current authenticated user info.
    
    Returns:
    - 200: User data
    - 401: Not authenticated
    """
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Not authenticated',
                'error': 'UNAUTHORIZED'
            }), 401
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found',
                'error': 'NOT_FOUND'
            }), 404
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'role': user.role,
                'account_status': user.account_status
            }
        }), 200
    
    except Exception as e:
        current_app.logger.error(f"Get current user error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user info',
            'error': 'INTERNAL_ERROR'
        }), 500


@auth_bp.route('/system-settings', methods=['GET'])
def get_public_system_settings():
    """Get public system configuration (announcement, language, maintenance, registration)."""
    try:
        from app.services.system_settings_service import SystemSettingsService
        return jsonify({
            'success': True,
            'settings': SystemSettingsService.get_public_settings()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
