"""
Authentication service for SchemeSathi.

Handles password hashing, verification, session management, and user authentication.
Uses bcrypt for password hashing with salt factor 12 for security.
"""

from bcrypt import hashpw, gensalt, checkpw
from datetime import datetime, timedelta
import secrets
import re
from typing import Optional, Dict, Tuple


class AuthService:
    """Service for handling authentication operations."""
    
    SALT_ROUNDS = 12
    MIN_PASSWORD_LENGTH = 8
    SESSION_TIMEOUT_MINUTES = 1440  # 24 hours
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash password using bcrypt with salt factor 12.
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password string
        """
        if not password or len(password) < AuthService.MIN_PASSWORD_LENGTH:
            raise ValueError(f"Password must be at least {AuthService.MIN_PASSWORD_LENGTH} characters")
        
        salt = gensalt(rounds=AuthService.SALT_ROUNDS)
        hashed = hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """
        Verify password against hash using bcrypt.
        
        Args:
            password: Plain text password to verify
            password_hash: Stored password hash
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            return checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception:
            return False
    
    @staticmethod
    def validate_password_strength(password: str) -> Tuple[bool, str]:
        """
        Validate password strength requirements.
        
        Requirements:
        - At least 8 characters
        
        Args:
            password: Password to validate
            
        Returns:
            Tuple of (is_valid, message)
        """
        if len(password) < AuthService.MIN_PASSWORD_LENGTH:
            return False, f"Password must be at least {AuthService.MIN_PASSWORD_LENGTH} characters"
        
        return True, "Password is valid"
    
    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """
        Validate email format.
        
        Args:
            email: Email address to validate
            
        Returns:
            Tuple of (is_valid, message)
        """
        if not email or len(email) < 3:
            return False, "Email is required"
        
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return False, "Invalid email format"
        
        return True, "Email is valid"


class RateLimiter:
    """Simple in-memory rate limiter for authentication attempts."""
    
    def __init__(self, max_attempts: int = 5, window_minutes: int = 15):
        self.max_attempts = max_attempts
        self.window_minutes = window_minutes
        self.attempts: Dict[str, list] = {}
    
    def is_rate_limited(self, identifier: str) -> bool:
        """Check if identifier is rate limited."""
        if identifier not in self.attempts:
            return False
        
        cutoff = datetime.utcnow() - timedelta(minutes=self.window_minutes)
        recent_attempts = [t for t in self.attempts[identifier] if t > cutoff]
        self.attempts[identifier] = recent_attempts
        
        return len(recent_attempts) >= self.max_attempts
    
    def record_attempt(self, identifier: str):
        """Record an authentication attempt."""
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        self.attempts[identifier].append(datetime.utcnow())
    
    def reset_attempts(self, identifier: str):
        """Reset attempts for identifier."""
        if identifier in self.attempts:
            del self.attempts[identifier]


# Create rate limiter instances
login_limiter = RateLimiter(max_attempts=5, window_minutes=15)
register_limiter = RateLimiter(max_attempts=3, window_minutes=60)
password_reset_limiter = RateLimiter(max_attempts=3, window_minutes=60)
