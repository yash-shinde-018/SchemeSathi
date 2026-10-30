"""
Database models for SchemeSathi application.

Comprehensive SQLAlchemy ORM models for the SchemeSathi backend including:
- User: Authentication and account management
- UserProfile: Extended user demographic and professional information
- SchemeCategory: Classification system for government schemes
- Scheme: Government scheme information and details
- SavedScheme: User bookmarks/favorites
- SchemeVerification: Verification audit trail for scheme information
- AdminLog: Audit log for administrative operations

All models include:
- Proper relationships and constraints
- Performance indexes on frequently queried fields
- Cascade deletes where appropriate
- Soft delete support (deleted_at field)
- Audit fields (created_at, updated_at, deleted_at)
- Comprehensive docstrings
- Serialization methods (to_dict) for API responses
- Data validation where applicable
"""

from datetime import datetime
from enum import Enum
import json
from app import db
from bcrypt import hashpw, gensalt, checkpw


# ============================================================================
# Enums for field restrictions
# ============================================================================

class UserRole(str, Enum):
    """User role enumeration."""
    USER = 'USER'
    ADMIN = 'ADMIN'
    SUPERADMIN = 'SUPERADMIN'


class AccountStatus(str, Enum):
    """User account status enumeration."""
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'
    SUSPENDED = 'SUSPENDED'


class Gender(str, Enum):
    """Gender enumeration."""
    MALE = 'MALE'
    FEMALE = 'FEMALE'
    OTHER = 'OTHER'
    PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'


class Education(str, Enum):
    """Education level enumeration."""
    HIGH_SCHOOL = 'HIGH_SCHOOL'
    BACHELOR = 'BACHELOR'
    MASTER = 'MASTER'
    DOCTORATE = 'DOCTORATE'
    VOCATIONAL = 'VOCATIONAL'
    OTHER = 'OTHER'


class SocialCategory(str, Enum):
    """Social category enumeration."""
    GENERAL = 'GENERAL'
    OBC = 'OBC'
    SC = 'SC'
    ST = 'ST'
    MINORITY = 'MINORITY'
    OTHER = 'OTHER'
    PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'


class DisabilityStatus(str, Enum):
    """Disability status enumeration."""
    NO = 'NO'
    YES_VISUAL = 'YES_VISUAL'
    YES_HEARING = 'YES_HEARING'
    YES_MOBILITY = 'YES_MOBILITY'
    YES_COGNITIVE = 'YES_COGNITIVE'
    YES_OTHER = 'YES_OTHER'
    PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'


class GovtLevel(str, Enum):
    """Government level enumeration."""
    CENTRAL = 'CENTRAL'
    STATE = 'STATE'
    LOCAL = 'LOCAL'


class SchemeStatus(str, Enum):
    """Scheme status enumeration."""
    ACTIVE = 'ACTIVE'
    INACTIVE = 'INACTIVE'
    ARCHIVED = 'ARCHIVED'


class AdminActionType(str, Enum):
    """Admin action type enumeration."""
    CREATE = 'CREATE'
    UPDATE = 'UPDATE'
    DELETE = 'DELETE'
    VERIFY = 'VERIFY'


# ============================================================================
# Model Classes
# ============================================================================

class User(db.Model):
    """
    User model for authentication and account management.
    
    Handles user credentials, authentication, and account status tracking.
    Includes one-to-one relationship with UserProfile and one-to-many with SavedScheme.
    
    Attributes:
        id: Primary key (Integer)
        email: Unique email address (String, UNIQUE, INDEX)
        password_hash: Bcrypt hashed password (String)
        first_name: User's first name (String)
        last_name: User's last name (String)
        phone: User's phone number (String)
        role: User role (ENUM: USER/ADMIN/SUPERADMIN)
        account_status: Account status (ENUM: ACTIVE/INACTIVE/SUSPENDED)
        last_login: Last login timestamp (DateTime)
        created_at: Account creation timestamp (DateTime, INDEX)
        updated_at: Last account update timestamp (DateTime)
        deleted_at: Soft delete timestamp (DateTime, nullable)
    """

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    role = db.Column(db.String(20), default=UserRole.USER.value, nullable=False)
    account_status = db.Column(db.String(20), default=AccountStatus.ACTIVE.value, nullable=False)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    # Relationships
    profile = db.relationship(
        'UserProfile',
        uselist=False,
        backref='user',
        cascade='all, delete-orphan',
        foreign_keys='UserProfile.user_id'
    )
    saved_schemes = db.relationship(
        'SavedScheme',
        backref='user',
        cascade='all, delete-orphan',
        foreign_keys='SavedScheme.user_id'
    )
    applications = db.relationship(
        'UserApplication',
        backref='user',
        cascade='all, delete-orphan',
        foreign_keys='UserApplication.user_id'
    )
    schemes_created = db.relationship(
        'Scheme',
        backref='creator',
        foreign_keys='Scheme.created_by',
        cascade='all, delete-orphan'
    )
    verifications = db.relationship(
        'SchemeVerification',
        backref='verified_by_user',
        foreign_keys='SchemeVerification.verified_by'
    )
    admin_logs = db.relationship(
        'AdminLog',
        backref='admin',
        foreign_keys='AdminLog.admin_id'
    )

    def __repr__(self):
        """String representation of User instance."""
        return f'<User {self.email}>'

    def set_password(self, password: str) -> None:
        """
        Hash and set the user password using bcrypt.

        Args:
            password (str): Plain text password to hash
            
        Raises:
            ValueError: If password is empty or None
        """
        if not password:
            raise ValueError('Password cannot be empty')
        self.password_hash = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')

    def check_password(self, password: str) -> bool:
        """
        Verify password against stored hash.

        Args:
            password (str): Plain text password to verify

        Returns:
            bool: True if password matches, False otherwise
        """
        if not password or not self.password_hash:
            return False
        return checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def is_active_user(self) -> bool:
        """Check if user account is active and not deleted."""
        return self.account_status == AccountStatus.ACTIVE.value and self.deleted_at is None

    @property
    def is_deleted(self) -> bool:
        """
        Check if the user is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this user by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery. Updates updated_at timestamp.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted user by clearing deleted_at.
        
        This makes a previously deleted record active again.
        Updates updated_at timestamp.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def to_dict(self, include_profile: bool = False) -> dict:
        """
        Convert user object to dictionary for serialization.

        Args:
            include_profile (bool): Include user profile data if available

        Returns:
            dict: User data dictionary
        """
        data = {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'role': self.role,
            'account_status': self.account_status,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_profile and self.profile:
            data['profile'] = self.profile.to_dict()
        
        return data


class UserProfile(db.Model):
    """
    Extended user profile model with demographic and professional information.
    
    One-to-one relationship with User. Stores additional information
    needed for scheme eligibility matching and user profiling.
    
    Attributes:
        id: Primary key (Integer, auto-increment)
        user_id: Foreign key to User (Integer, UNIQUE, FK, INDEX, one-to-one relationship)
        date_of_birth: User's date of birth (Date)
        gender: Gender (ENUM: MALE/FEMALE/OTHER/PREFER_NOT_TO_SAY)
        state: User's state (String, INDEX)
        district: User's district (String, INDEX)
        city: User's city (String)
        occupation: User's occupation (String, nullable)
        education: Highest education level (ENUM: HIGH_SCHOOL/BACHELOR/MASTER/DOCTORATE/VOCATIONAL/OTHER)
        income: Annual income in rupees (Decimal, nullable)
        social_category: Social category (ENUM: GENERAL/OBC/SC/ST/MINORITY/OTHER/PREFER_NOT_TO_SAY)
        disability_status: Disability status (ENUM: NO/YES_VISUAL/YES_HEARING/YES_MOBILITY/YES_COGNITIVE/YES_OTHER/PREFER_NOT_TO_SAY)
        profile_completion_percentage: Profile completion percentage (0-100) (Integer, default 0)
        created_at: Creation timestamp (DateTime, auto-now)
        updated_at: Last update timestamp (DateTime, auto-now-on-update)
        deleted_at: Soft delete timestamp (DateTime, nullable)
        
    Methods:
        validate_state_district_city: Validate state, district, city are non-empty if provided
        calculate_completion_percentage: Calculate profile completion percentage (0-100)
        to_dict: Convert to dictionary for API serialization
    """

    __tablename__ = 'user_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.String(20))
    state = db.Column(db.String(100), index=True)
    district = db.Column(db.String(100), index=True)
    city = db.Column(db.String(100))
    occupation = db.Column(db.String(100))
    education = db.Column(db.String(50))
    income = db.Column(db.Numeric(12, 2))
    social_category = db.Column(db.String(20))
    disability_status = db.Column(db.String(30))
    residence_type = db.Column(db.String(20))
    preferred_categories = db.Column(db.JSON, default=list)
    profile_picture = db.Column(db.Text, nullable=True)
    profile_completion_percentage = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    def __repr__(self) -> str:
        """String representation of UserProfile instance."""
        return f'<UserProfile user_id={self.user_id}>'

    @property
    def is_deleted(self) -> bool:
        """
        Check if the user profile is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    @property
    def education_level(self):
        return self.education

    @education_level.setter
    def education_level(self, value):
        self.education = value

    @property
    def annual_income(self):
        return self.income

    @annual_income.setter
    def annual_income(self, value):
        self.income = value

    def soft_delete(self) -> None:
        """
        Soft delete this user profile by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted user profile by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def validate_state_district_city(self) -> bool:
        """
        Validate that state, district, and city are non-empty if provided.
        
        Returns:
            bool: True if validation passes
            
        Raises:
            ValueError: If state, district, or city are provided but empty/whitespace
        """
        fields = {
            'state': self.state,
            'district': self.district,
            'city': self.city
        }
        
        for field_name, field_value in fields.items():
            if field_value is not None and not isinstance(field_value, str):
                raise ValueError(f'{field_name} must be a string')
            if isinstance(field_value, str) and not field_value.strip():
                raise ValueError(f'{field_name} cannot be empty if provided')
        
        return True

    def calculate_completion_percentage(self) -> int:
        """
        Calculate profile completion percentage based on filled fields.
        
        Considers all profile fields except id, created_at, updated_at, and deleted_at.
        
        Returns:
            int: Completion percentage (0-100)
        """
        # Fields that count towards completion
        profile_fields = [
            self.date_of_birth,
            self.gender,
            self.state,
            self.district,
            self.city,
            self.occupation,
            self.education,
            self.income,
            self.social_category,
            self.disability_status,
        ]
        
        filled = sum(1 for field in profile_fields if field is not None and field != '')
        total_fields = len(profile_fields)
        percentage = int((filled / total_fields) * 100) if total_fields > 0 else 0
        
        return percentage

    def to_dict(self) -> dict:
        """
        Convert user profile to dictionary for API serialization.
        
        Returns:
            dict: User profile data dictionary with all fields
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'state': self.state,
            'district': self.district,
            'city': self.city,
            'occupation': self.occupation,
            'education': self.education,
            'income': float(self.income) if self.income else None,
            'social_category': self.social_category,
            'disability_status': self.disability_status,
            'residence_type': getattr(self, 'residence_type', None),
            'preferred_categories': getattr(self, 'preferred_categories', []) or [],
            'profile_picture': getattr(self, 'profile_picture', None),
            'profile_completion_percentage': self.profile_completion_percentage,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class SchemeCategory(db.Model):
    """
    Scheme category model for classifying government schemes.
    
    Provides a taxonomy/hierarchy for organizing schemes by type.
    Used for navigation, filtering, and recommendation systems.
    
    Attributes:
        id: Primary key (Integer)
        name: Category name (String, UNIQUE, INDEX)
        description: Category description (Text)
        icon: Icon URL (String)
        color: Hex color code (String)
        created_at: Creation timestamp (DateTime)
        updated_at: Last update timestamp (DateTime)
        deleted_at: Soft delete timestamp (DateTime, nullable)
    """

    __tablename__ = 'scheme_categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(500), nullable=False)
    color = db.Column(db.String(7), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    # Relationships
    schemes = db.relationship(
        'Scheme',
        backref='category',
        cascade='all, delete-orphan',
        foreign_keys='Scheme.category_id'
    )

    def __repr__(self):
        """String representation of SchemeCategory instance."""
        return f'<SchemeCategory {self.name}>'

    @property
    def is_deleted(self) -> bool:
        """
        Check if the scheme category is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this scheme category by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted scheme category by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> dict:
        """
        Convert scheme category to dictionary for serialization.
        
        Returns:
            dict: Scheme category data dictionary
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Scheme(db.Model):
    """
    Government scheme model containing scheme details and information.
    
    Core entity representing government schemes with eligibility criteria,
    benefits, application process, and official information.
    
    Attributes:
        id: Primary key (Integer)
        name: Scheme name (String, INDEX)
        slug: URL-friendly scheme name (String, UNIQUE, INDEX)
        description: Full scheme description (Text)
        govt_level: Government level (ENUM: CENTRAL/STATE/LOCAL, INDEX)
        state: State (if applicable) (String, INDEX)
        ministry: Ministry responsible (String)
        category_id: Foreign key to SchemeCategory (Integer, FK, INDEX)
        tags: Search tags as JSON array (JSON)
        eligibility: Eligibility criteria as JSON object (JSON)
        exclusions: Exclusion criteria as JSON array (JSON)
        benefits: Benefits offered as JSON object (JSON)
        application_process: Application process description (Text)
        documents: Required documents as JSON array (JSON)
        faqs: Frequently asked questions as JSON array (JSON)
        application_mode: Application mode (ONLINE/OFFLINE/BOTH) (String)
        official_url: Official scheme URL (String)
        myscheme_url: MyScheme portal URL (String)
        status: Scheme status (ENUM: ACTIVE/INACTIVE/ARCHIVED)
        created_by: Foreign key to User (admin who created) (Integer, FK)
        last_verified_at: Last verification timestamp (DateTime)
        created_at: Creation timestamp (DateTime)
        updated_at: Last update timestamp (DateTime)
        deleted_at: Soft delete timestamp (DateTime, nullable)
    """

    __tablename__ = 'schemes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    govt_level = db.Column(db.String(20), nullable=False, index=True)
    state = db.Column(db.String(100), index=True)
    ministry = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('scheme_categories.id', ondelete='CASCADE'), nullable=False, index=True)
    tags = db.Column(db.JSON, default=list, nullable=False)
    eligibility = db.Column(db.JSON)
    exclusions = db.Column(db.JSON, default=list, nullable=False)
    benefits = db.Column(db.JSON)
    application_process = db.Column(db.Text)
    documents = db.Column(db.JSON, default=list, nullable=False)
    faqs = db.Column(db.JSON, default=list, nullable=False)
    application_mode = db.Column(db.String(50), nullable=False)
    official_url = db.Column(db.String(500), nullable=False)
    myscheme_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default=SchemeStatus.ACTIVE.value, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    last_verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    # Relationships
    saved_by_users = db.relationship(
        'SavedScheme',
        backref='scheme',
        cascade='all, delete-orphan',
        foreign_keys='SavedScheme.scheme_id'
    )
    verifications = db.relationship(
        'SchemeVerification',
        backref='scheme',
        cascade='all, delete-orphan',
        foreign_keys='SchemeVerification.scheme_id'
    )

    def __repr__(self):
        """String representation of Scheme instance."""
        return f'<Scheme {self.name}>'

    @property
    def is_deleted(self) -> bool:
        """
        Check if the scheme is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this scheme by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted scheme by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def get_tags_list(self) -> list:
        """
        Get tags as a list (handles both JSON and list formats).
        
        Returns:
            list: Tags list
        """
        if isinstance(self.tags, list):
            return self.tags
        elif isinstance(self.tags, str):
            return json.loads(self.tags)
        return []

    def get_eligibility(self) -> dict:
        """
        Get eligibility criteria as dict (handles both JSON and dict formats).
        
        Returns:
            dict: Eligibility criteria
        """
        if isinstance(self.eligibility, dict):
            return self.eligibility
        elif isinstance(self.eligibility, str):
            try:
                return json.loads(self.eligibility)
            except Exception:
                return {'criteria': self.eligibility}
        return {}

    def get_benefits(self) -> dict:
        """
        Get benefits as dict (handles both JSON and dict formats).
        
        Returns:
            dict: Benefits information
        """
        if isinstance(self.benefits, dict):
            return self.benefits
        elif isinstance(self.benefits, str):
            try:
                return json.loads(self.benefits)
            except Exception:
                return {'details': self.benefits}
        return {}

    def to_dict(self, include_verifications: bool = False) -> dict:
        """
        Convert scheme to dictionary for serialization.
        
        Args:
            include_verifications (bool): Include verification details
        
        Returns:
            dict: Scheme data dictionary
        """
        data = {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'govt_level': self.govt_level,
            'state': self.state,
            'ministry': self.ministry,
            'category': self.category.to_dict() if self.category else None,
            'tags': self.get_tags_list(),
            'eligibility': self.get_eligibility(),
            'exclusions': self.exclusions or [],
            'benefits': self.get_benefits(),
            'application_process': self.application_process,
            'documents': self.documents or [],
            'faqs': self.faqs or [],
            'application_mode': self.application_mode,
            'official_url': self.official_url,
            'myscheme_url': self.myscheme_url,
            'status': self.status,
            'last_verified_at': self.last_verified_at.isoformat() if self.last_verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_verifications and self.verifications:
            data['verifications'] = [v.to_dict() for v in self.verifications]
        
        return data


class SavedScheme(db.Model):
    """
    Saved scheme model for user bookmarks/favorites.
    
    Represents user's saved schemes with tracking of when they were saved.
    Enables personalization and recommendation features.
    Includes audit fields for soft delete support.
    
    Attributes:
        id: Primary key (Integer)
        user_id: Foreign key to User (Integer, FK, INDEX)
        scheme_id: Foreign key to Scheme (Integer, FK, INDEX)
        saved_at: Timestamp when scheme was saved (DateTime)
        created_at: Creation timestamp (DateTime)
        updated_at: Last update timestamp (DateTime)
        deleted_at: Soft delete timestamp (DateTime, nullable)
        
    Constraints:
        - Unique constraint on (user_id, scheme_id) to prevent duplicates
    """

    __tablename__ = 'saved_schemes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    scheme_id = db.Column(db.Integer, db.ForeignKey('schemes.id', ondelete='CASCADE'), nullable=False, index=True)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    # Unique constraint on (user_id, scheme_id)
    __table_args__ = (
        db.UniqueConstraint('user_id', 'scheme_id', name='uq_user_scheme'),
    )

    def __repr__(self):
        """String representation of SavedScheme instance."""
        return f'<SavedScheme user_id={self.user_id} scheme_id={self.scheme_id}>'

    @property
    def is_deleted(self) -> bool:
        """
        Check if the record is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this saved scheme by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted saved scheme by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> dict:
        """
        Convert saved scheme to dictionary for serialization.
        
        Returns:
            dict: Saved scheme data dictionary with all required fields
        """
        return {
            'id': self.id,
            'user_id': self.user_id,
            'scheme_id': self.scheme_id,
            'scheme': self.scheme.to_dict() if self.scheme else None,
            'saved_at': self.saved_at.isoformat() if self.saved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
        }


class UserApplication(db.Model):
    """
    User scheme application tracking model.
    Tracks user's intent to apply (YES/MAYBE), application status (PLANNING/CONSIDERING/APPLIED),
    and external portal application reference numbers.
    """
    __tablename__ = 'user_applications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    scheme_id = db.Column(db.Integer, db.ForeignKey('schemes.id', ondelete='CASCADE'), nullable=False, index=True)
    user_intent = db.Column(db.String(20), default='YES', nullable=False) # 'YES', 'MAYBE'
    status = db.Column(db.String(30), default='PLANNING', nullable=False) # 'PLANNING', 'CONSIDERING', 'APPLIED'
    application_number = db.Column(db.String(100), nullable=True)
    applied_date = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    # Relationship to scheme
    scheme = db.relationship('Scheme', backref=db.backref('user_applications', cascade='all, delete-orphan'))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'scheme_id', name='uq_user_scheme_application'),
    )

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'scheme_id': self.scheme_id,
            'scheme': self.scheme.to_dict() if self.scheme else None,
            'user_intent': self.user_intent,
            'status': self.status,
            'application_number': self.application_number,
            'applied_date': self.applied_date.isoformat() if self.applied_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class SchemeVerification(db.Model):
    """
    Scheme verification model for audit trail of scheme information verification.
    
    Tracks verification status of various scheme information components
    by admins to ensure data quality and accuracy.
    
    One-to-one relationship with Scheme to track verification audit trail.
    Many-to-one relationship with User (verified_by admin).
    
    Verification flags track completion of different verification checks:
    - official_source_verified: Verifies scheme is from official government source
    - eligibility_verified: Verifies eligibility criteria are accurate and complete
    - benefits_verified: Verifies benefits information is accurate and current
    - documents_verified: Verifies list of required documents is complete and accurate
    - application_process_verified: Verifies application process steps are correct
    - url_verified: Verifies official and MyScheme portal URLs are valid and current
    
    Attributes:
        id: Primary key (Integer)
        scheme_id: Foreign key to Scheme (Integer, FK, INDEX, UNIQUE) - one verification per scheme
        official_source_verified: Official source verified (Boolean, default False)
        eligibility_verified: Eligibility criteria verified (Boolean, default False)
        benefits_verified: Benefits information verified (Boolean, default False)
        documents_verified: Required documents verified (Boolean, default False)
        application_process_verified: Application process verified (Boolean, default False)
        url_verified: URLs verified (Boolean, default False)
        verification_notes: Admin notes about verification (Text, nullable)
        verified_by: Foreign key to User (admin) (Integer, FK, nullable)
        verified_at: Verification timestamp (DateTime)
        created_at: Creation timestamp (DateTime)
        updated_at: Last update timestamp (DateTime)
        deleted_at: Soft delete timestamp (DateTime, nullable)
    """

    __tablename__ = 'scheme_verifications'

    id = db.Column(db.Integer, primary_key=True)
    scheme_id = db.Column(db.Integer, db.ForeignKey('schemes.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    official_source_verified = db.Column(db.Boolean, default=False, nullable=False)
    eligibility_verified = db.Column(db.Boolean, default=False, nullable=False)
    benefits_verified = db.Column(db.Boolean, default=False, nullable=False)
    documents_verified = db.Column(db.Boolean, default=False, nullable=False)
    application_process_verified = db.Column(db.Boolean, default=False, nullable=False)
    url_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_notes = db.Column(db.Text)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    verified_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    def __repr__(self):
        """String representation of SchemeVerification instance."""
        return f'<SchemeVerification scheme_id={self.scheme_id}>'

    @property
    def is_deleted(self) -> bool:
        """
        Check if the scheme verification is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this scheme verification by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted scheme verification by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def is_fully_verified(self) -> bool:
        """
        Check if scheme is fully verified across all components.
        
        Returns:
            bool: True if all verification checks passed
        """
        return all([
            self.official_source_verified,
            self.eligibility_verified,
            self.benefits_verified,
            self.documents_verified,
            self.application_process_verified,
            self.url_verified,
        ])

    def get_verification_status(self) -> dict:
        """
        Get detailed verification status for all components.
        
        Returns:
            dict: Verification status for each component
        """
        return {
            'official_source': self.official_source_verified,
            'eligibility': self.eligibility_verified,
            'benefits': self.benefits_verified,
            'documents': self.documents_verified,
            'application_process': self.application_process_verified,
            'urls': self.url_verified,
        }

    def get_unverified_fields(self) -> list:
        """
        Get list of fields that have not been verified.
        
        Returns:
            list: List of field names that are not verified
        """
        unverified = []
        verification_fields = {
            'official_source': self.official_source_verified,
            'eligibility': self.eligibility_verified,
            'benefits': self.benefits_verified,
            'documents': self.documents_verified,
            'application_process': self.application_process_verified,
            'urls': self.url_verified,
        }
        
        for field_name, is_verified in verification_fields.items():
            if not is_verified:
                unverified.append(field_name)
        
        return unverified

    def to_dict(self) -> dict:
        """
        Convert scheme verification to dictionary for serialization.
        
        Returns:
            dict: Verification data dictionary with all fields
        """
        return {
            'id': self.id,
            'scheme_id': self.scheme_id,
            'verification_status': self.get_verification_status(),
            'unverified_fields': self.get_unverified_fields(),
            'fully_verified': self.is_fully_verified(),
            'verification_notes': self.verification_notes,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
        }


class AdminLog(db.Model):
    """
    Admin log model for comprehensive audit trail of administrative operations.
    
    Tracks all CRUD operations performed by admin users on schemes, categories,
    and user management for accountability and compliance purposes.
    
    This model maintains a complete audit trail of administrative actions,
    enabling system administrators to monitor changes, troubleshoot issues,
    and meet compliance/regulatory requirements for data governance.
    
    Attributes:
        id: Primary key (Integer)
        admin_id: Foreign key to User (admin who performed action) (Integer, FK, nullable)
        action: Action type (String 20): CREATE, UPDATE, DELETE, VERIFY, etc.
        entity_type: Type of entity affected (String 50): scheme, category, user, verification, etc.
        entity_id: ID of affected entity (Integer)
        details: JSON diff of changes (JSON, nullable)
            - For UPDATE: {field_name: {old_value, new_value}}
            - For CREATE: {field_name: value}
            - For DELETE: {field_name: value}
        ip_address: IP address of requesting admin (String 45, nullable)
        timestamp: When action was performed (DateTime, INDEX)
        created_at: Log record creation time (DateTime)
        updated_at: Last update timestamp (DateTime)
        deleted_at: Soft delete timestamp (DateTime, nullable)
    
    Indexes:
        - timestamp: For date-based queries and activity tracking
        - admin_id: For tracking admin activity across all operations
    """

    __tablename__ = 'admin_logs'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True,
        index=True  # Index for admin activity tracking
    )
    action = db.Column(db.String(20), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    timestamp = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True  # Index for date-based queries
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)

    def __repr__(self) -> str:
        """
        String representation of AdminLog instance.
        
        Returns:
            str: String representation in format '<AdminLog ACTION entity_type:entity_id>'
        """
        return f'<AdminLog {self.action} {self.entity_type}:{self.entity_id}>'

    @property
    def is_deleted(self) -> bool:
        """
        Check if the admin log entry is soft-deleted.
        
        Returns:
            bool: True if deleted_at is set, False otherwise
        """
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        """
        Soft delete this admin log entry by setting deleted_at timestamp.
        
        This marks the record as deleted without actually removing it from database,
        allowing for audit trails and recovery.
        """
        self.deleted_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def restore(self) -> None:
        """
        Restore a soft-deleted admin log entry by clearing deleted_at.
        
        This makes a previously deleted record active again.
        """
        self.deleted_at = None
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> dict:
        """
        Convert admin log to dictionary for API serialization.
        
        Includes all fields and properly formatted timestamps for JSON responses.
        
        Returns:
            dict: Admin log data dictionary with all fields and ISO formatted timestamps
        """
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
        }

    def get_diff_readable(self) -> str:
        """
        Format JSON diff in human-readable format.
        
        Converts the JSON details field into a human-readable string that describes
        what changed. Handles different action types (UPDATE, CREATE, DELETE) with
        appropriate formatting.
        
        For UPDATE actions, shows: "Field: old_value → new_value"
        For CREATE actions, shows: "Field: value"
        For DELETE actions, shows: "Field: value (deleted)"
        
        Returns:
            str: Human-readable representation of changes, or empty string if no details
            
        Examples:
            - UPDATE: "name: 'Old Scheme' → 'New Scheme', status: 'draft' → 'active'"
            - CREATE: "name: 'New Scheme', status: 'draft'"
            - DELETE: "name: 'Deleted Scheme' (deleted)"
        """
        if not self.details:
            return ""
        
        readable_parts = []
        
        for field, value in self.details.items():
            if self.action == AdminActionType.UPDATE.value:
                # For UPDATE actions, expect {old_value, new_value} format
                if isinstance(value, dict) and 'old_value' in value and 'new_value' in value:
                    old = value['old_value']
                    new = value['new_value']
                    readable_parts.append(f"{field}: '{old}' → '{new}'")
                else:
                    # Fallback for unexpected format
                    readable_parts.append(f"{field}: {value}")
            elif self.action == AdminActionType.CREATE.value:
                # For CREATE actions, show field and value
                readable_parts.append(f"{field}: '{value}'")
            elif self.action == AdminActionType.DELETE.value:
                # For DELETE actions, show field and value with (deleted) marker
                readable_parts.append(f"{field}: '{value}' (deleted)")
            else:
                # For other actions, show field and value
                readable_parts.append(f"{field}: {value}")
        
        return ", ".join(readable_parts)


class Notification(db.Model):
    """
    User notification and alert model.
    Stores welcome messages, new scheme alerts, query replies, and application updates.
    """
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    category = db.Column(db.String(50), nullable=False, default='SYSTEM')  # WELCOME, SCHEME, SUPPORT, APPLICATION, ALERT
    icon = db.Column(db.String(50), default='bell')
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    link_action = db.Column(db.String(255), nullable=True)
    link_text = db.Column(db.String(100), nullable=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = db.relationship('User', backref=db.backref('user_notifications', lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self) -> dict:
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'category': self.category,
            'icon': self.icon,
            'title': self.title,
            'description': self.description,
            'link_action': self.link_action or '/notifications',
            'link_text': self.link_text or 'View Details →',
            'is_read': self.is_read,
            'created_at': (self.created_at.isoformat() + 'Z') if self.created_at else None
        }


class CitizenQuery(db.Model):

    """
    Citizen query and grievance feedback model.
    Tracks questions, feedback, and doubts submitted by citizens, and official replies from admins.
    """
    __tablename__ = 'citizen_queries'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.String(32), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    citizen_name = db.Column(db.String(120), nullable=False)
    citizen_email = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(100), nullable=False, default='General Support')
    application_id = db.Column(db.String(120), nullable=True)  # Associated scheme name or reference
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='PENDING', nullable=False, index=True)  # PENDING, RESOLVED
    admin_reply = db.Column(db.Text, nullable=True)
    replied_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    replied_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('citizen_queries', lazy='dynamic'))
    replier = db.relationship('User', foreign_keys=[replied_by], backref=db.backref('replied_queries', lazy='dynamic'))

    def to_dict(self) -> dict:
        """Convert citizen query to dictionary."""
        replier_name = None
        if self.replier:
            first = getattr(self.replier, 'first_name', '') or ''
            last = getattr(self.replier, 'last_name', '') or ''
            replier_name = f"{first} {last}".strip() or self.replier.email

        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'citizen_name': self.citizen_name,
            'citizen_email': self.citizen_email,
            'category': self.category,
            'application_id': self.application_id,
            'subject': self.subject,
            'description': self.description,
            'status': self.status,
            'admin_reply': self.admin_reply,
            'replied_by': self.replied_by,
            'replied_by_name': replier_name or ('Support Officer' if self.admin_reply else None),
            'replied_at': (self.replied_at.isoformat() + 'Z') if self.replied_at else None,
            'created_at': (self.created_at.isoformat() + 'Z') if self.created_at else None,
            'updated_at': (self.updated_at.isoformat() + 'Z') if self.updated_at else None
        }


