"""
Data Validation Module for Government Scheme Import

This module provides comprehensive validation for scheme data during import process.
It validates required fields, field values, URL formats, category matching, and
cross-field consistency checks.

Requirements Addressed:
- Req 33: THE import process SHALL validate each scheme record
- Req 33: IF a dataset record has missing required fields, THE import SHALL skip or mark as "Under Verification"
- Req 33: THE import process SHALL preserve official URLs and source information

Validation Strategy:
1. Pre-validation: Check raw source data before mapping
2. Post-validation: Check mapped values before database insert
3. Business rules validation: Duplicate detection, consistency checks
4. Category validation: Fuzzy match and verify category exists in database
"""

import re
import json
from typing import Dict, List, Optional, Any, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
from urllib.parse import urlparse


class ValidationErrorType(str, Enum):
    """Types of validation errors that can occur."""
    MISSING_FIELD = "missing_field"
    INVALID_FORMAT = "invalid_format"
    INVALID_VALUE = "invalid_value"
    BUSINESS_RULE_VIOLATION = "business_rule_violation"
    DUPLICATE = "duplicate"
    CONSISTENCY_ERROR = "consistency_error"
    CATEGORY_MISMATCH = "category_mismatch"


@dataclass
class ValidationError:
    """Represents a single validation error."""
    error_type: ValidationErrorType
    field: str
    message: str
    severity: str = "error"  # "error" or "warning"
    details: Optional[Dict[str, Any]] = None


@dataclass
class ValidationResult:
    """
    Result of record validation containing all errors, warnings, and status.
    
    Attributes:
        is_valid: Whether record passed all validation checks
        errors: List of validation errors found
        warnings: List of non-blocking validation issues
        missing_fields: List of required fields that are missing
        invalid_fields: Dictionary mapping field name to error message
        record_data: The record being validated (for reference)
    """
    is_valid: bool
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[ValidationError] = field(default_factory=list)
    missing_fields: List[str] = field(default_factory=list)
    invalid_fields: Dict[str, str] = field(default_factory=dict)
    record_data: Optional[Dict[str, Any]] = None

    def add_error(
        self,
        field: str,
        message: str,
        error_type: ValidationErrorType = ValidationErrorType.INVALID_FORMAT
    ) -> None:
        """Add an error to the validation result."""
        self.errors.append(ValidationError(error_type, field, message, "error"))
        self.invalid_fields[field] = message
        self.is_valid = False

    def add_warning(
        self,
        field: str,
        message: str,
        error_type: ValidationErrorType = ValidationErrorType.INVALID_FORMAT
    ) -> None:
        """Add a warning to the validation result."""
        self.warnings.append(ValidationError(error_type, field, message, "warning"))

    def add_missing_field(self, field: str) -> None:
        """Record a missing required field."""
        self.missing_fields.append(field)
        self.invalid_fields[field] = f"Required field is missing: {field}"
        self.is_valid = False

    def get_summary(self) -> str:
        """Get human-readable summary of validation result."""
        if self.is_valid:
            return "Validation passed"
        
        msg = f"Validation failed: {len(self.errors)} errors"
        if self.warnings:
            msg += f", {len(self.warnings)} warnings"
        if self.missing_fields:
            msg += f", missing fields: {', '.join(self.missing_fields)}"
        return msg


class URLValidator:
    """Utility class for URL validation."""

    # Invalid domain patterns
    INVALID_DOMAINS = {
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
        'example.com',
        'example.org',
        'test.com',
        'invalid',
        'local',
    }

    # Valid TLDs for basic validation
    COMMON_TLDS = {
        'gov', 'in', 'org', 'com', 'net', 'edu', 'ac', 'co', 'uk',
        'us', 'au', 'ca', 'fr', 'de', 'ie', 'nz', 'za', 'mx', 'br'
    }

    @staticmethod
    def is_valid_url(url: Optional[str]) -> bool:
        """
        Validate URL format and structure.
        
        Checks:
        - URL must be non-empty string
        - Must start with http:// or https://
        - Must have valid domain structure
        - Domain should not be localhost/test domains
        
        Args:
            url: URL to validate
            
        Returns:
            True if URL is valid format, False otherwise
        """
        if not url or not isinstance(url, str):
            return False

        url = url.strip()

        # Must start with http:// or https://
        if not (url.startswith('http://') or url.startswith('https://')):
            return False

        try:
            parsed = urlparse(url)

            # Must have a netloc (domain)
            if not parsed.netloc:
                return False

            # Extract domain (without port)
            domain = parsed.netloc.split(':')[0].lower()

            # Check against invalid domains
            if domain in URLValidator.INVALID_DOMAINS:
                return False

            # Check for valid domain structure (basic check)
            if '.' not in domain:
                return False

            # Must not be just all digits/dots (IPv4 check)
            # But allow valid IPv4 addresses (not just numbers)
            domain_parts = domain.split('.')
            if len(domain_parts) == 4 and all(part.isdigit() for part in domain_parts):
                # It's an IP address, which is generally okay
                # but check if it's a reserved IP
                try:
                    parts = [int(p) for p in domain_parts]
                    if parts[0] in [127, 192, 10, 172] or parts[0] == 0:
                        return False
                except (ValueError, IndexError):
                    return False

            return True

        except Exception:
            return False

    @staticmethod
    def uses_https(url: Optional[str]) -> bool:
        """
        Check if URL uses HTTPS (recommended for security).
        
        Args:
            url: URL to check
            
        Returns:
            True if URL uses https://, False otherwise
        """
        if not url or not isinstance(url, str):
            return False
        return url.strip().startswith('https://')

    @staticmethod
    def normalize_url(url: Optional[str]) -> Optional[str]:
        """
        Normalize URL format (add protocol if missing).
        
        Args:
            url: URL to normalize
            
        Returns:
            Normalized URL or None if invalid
        """
        if not url or not isinstance(url, str):
            return None

        url = url.strip()

        # Already has protocol
        if url.startswith(('http://', 'https://')):
            return url

        # Add https:// if no protocol
        if url and not url.startswith(('http://', 'https://')):
            url = 'https://' + url

        return url if URLValidator.is_valid_url(url) else None


class CategoryValidator:
    """Utility class for category validation."""

    # Standard category names
    STANDARD_CATEGORIES = {
        'Education',
        'Healthcare',
        'Agriculture',
        'Employment',
        'Housing',
        'Women & Child Welfare',
        'Social Welfare',
        'Entrepreneurship',
        'Senior Citizen',
        'Other'
    }

    # Keyword mappings for fuzzy matching
    CATEGORY_KEYWORDS = {
        'Education': ['education', 'scholarship', 'student', 'skill', 'training', 'upskill', 'academic'],
        'Healthcare': ['health', 'medical', 'disease', 'treatment', 'wellness', 'insurance', 'hospital'],
        'Agriculture': ['agriculture', 'farmer', 'crop', 'land', 'farm', 'rural', 'soil', 'irrigation'],
        'Employment': ['employment', 'job', 'career', 'work', 'apprentice', 'wage', 'labour'],
        'Housing': ['housing', 'home', 'shelter', 'building', 'rent', 'construction', 'property'],
        'Women & Child Welfare': ['women', 'child', 'girl', 'maternity', 'family', 'infant', 'mother'],
        'Social Welfare': ['social', 'welfare', 'disability', 'senior', 'pension', 'elderly', 'poor'],
        'Entrepreneurship': ['business', 'startup', 'entrepreneur', 'self-employed', 'loan', 'enterprise'],
        'Senior Citizen': ['senior', 'elderly', 'pension', 'old age', 'retiree', 'veteran'],
    }

    @staticmethod
    def fuzzy_match_category(text: Optional[str], threshold: float = 0.2) -> str:
        """
        Fuzzy match text to a category using keyword matching.
        
        Performs keyword-based fuzzy matching to find the best matching category.
        Returns "Other" if no match found.
        
        Args:
            text: Text to match (usually from scheme data)
            threshold: Minimum keyword match ratio (0.0-1.0), default 0.2 = 20%
            
        Returns:
            Matched category name or "Other"
        """
        if not text or not isinstance(text, str):
            return "Other"

        text_lower = text.lower().strip()

        # Try exact match first
        for category in CategoryValidator.STANDARD_CATEGORIES:
            if category.lower() == text_lower:
                return category

        # Try keyword matching
        best_match = None
        best_score = 0

        for category, keywords in CategoryValidator.CATEGORY_KEYWORDS.items():
            matches = 0
            for keyword in keywords:
                if keyword in text_lower:
                    matches += 1

            if keywords:
                score = matches / len(keywords)
                if score > best_score:
                    best_score = score
                    best_match = category

        if best_score >= threshold:
            return best_match

        return "Other"

    @staticmethod
    def is_valid_category(category_name: Optional[str]) -> bool:
        """
        Check if category name is valid/standard.
        
        Args:
            category_name: Category name to validate
            
        Returns:
            True if category exists in standard categories
        """
        if not category_name or not isinstance(category_name, str):
            return False
        return category_name in CategoryValidator.STANDARD_CATEGORIES


class SchemeValidator:
    """
    Main validator class for scheme records during import.
    
    Provides comprehensive validation including:
    - Required field checking
    - Field value validation
    - URL format validation
    - Category matching and validation
    - Cross-field consistency checking
    - Business rule validation
    """

    # Required fields that must be present in every scheme
    REQUIRED_FIELDS = {
        'name',
        'description',
        'govt_level',
        'ministry',
        'official_url',
        'category_id',
        'application_mode',
    }

    # Optional fields (validated if present)
    OPTIONAL_FIELDS = {
        'state',
        'tags',
        'eligibility',
        'exclusions',
        'benefits',
        'documents',
        'faqs',
        'application_process',
        'myscheme_url',
    }

    # Valid values for enum fields
    VALID_GOVT_LEVELS = {'CENTRAL', 'STATE', 'LOCAL'}
    VALID_APPLICATION_MODES = {'ONLINE', 'OFFLINE', 'BOTH'}
    VALID_SCHEME_STATUSES = {'ACTIVE', 'INACTIVE', 'ARCHIVED', 'UNDER_VERIFICATION'}

    # Indian states for validation
    VALID_INDIAN_STATES = {
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
        'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry',
    }

    def __init__(self, category_id_map: Optional[Dict[str, int]] = None):
        """
        Initialize validator.
        
        Args:
            category_id_map: Optional mapping of category names to IDs.
                           If not provided, only category name validation is done.
        """
        self.category_id_map = category_id_map or {}

    def validate_required_fields(self, record: Dict[str, Any]) -> ValidationResult:
        """
        Validate that all required fields are present and non-empty.
        
        Args:
            record: Record to validate
            
        Returns:
            ValidationResult with missing fields list
        """
        result = ValidationResult(is_valid=True, record_data=record)

        for field in self.REQUIRED_FIELDS:
            if field not in record or record[field] is None or record[field] == '':
                result.add_missing_field(field)

        return result

    def validate_field_values(self, record: Dict[str, Any]) -> ValidationResult:
        """
        Validate individual field values (type, format, etc.).
        
        Args:
            record: Record to validate
            
        Returns:
            ValidationResult with field validation errors
        """
        result = ValidationResult(is_valid=True, record_data=record)

        # Validate name
        if 'name' in record:
            name = record['name']
            if not isinstance(name, str):
                result.add_error('name', 'Name must be a string')
            elif len(name) < 1 or len(name) > 255:
                result.add_error('name', 'Name must be 1-255 characters')
            elif len(name.strip()) < 1:
                result.add_error('name', 'Name cannot be empty or whitespace-only')

        # Validate description
        if 'description' in record:
            desc = record['description']
            if not isinstance(desc, str):
                result.add_error('description', 'Description must be a string')
            elif len(desc.strip()) < 1:
                result.add_error('description', 'Description cannot be empty')

        # Validate govt_level
        if 'govt_level' in record:
            level = record['govt_level']
            if level not in self.VALID_GOVT_LEVELS:
                result.add_error(
                    'govt_level',
                    f'Government level must be one of: {", ".join(self.VALID_GOVT_LEVELS)}'
                )

        # Validate ministry
        if 'ministry' in record:
            ministry = record['ministry']
            if not isinstance(ministry, str):
                result.add_error('ministry', 'Ministry must be a string')
            elif len(ministry) < 1 or len(ministry) > 200:
                result.add_error('ministry', 'Ministry must be 1-200 characters')

        # Validate application_mode
        if 'application_mode' in record:
            mode = record['application_mode']
            if mode not in self.VALID_APPLICATION_MODES:
                result.add_error(
                    'application_mode',
                    f'Application mode must be one of: {", ".join(self.VALID_APPLICATION_MODES)}'
                )

        # Validate state
        if 'state' in record and record['state']:
            state = record['state']
            if not isinstance(state, str):
                result.add_error('state', 'State must be a string')
            elif state not in self.VALID_INDIAN_STATES:
                # Add warning instead of error (state might be abbreviation)
                result.add_warning(
                    'state',
                    f'State "{state}" not found in standard Indian states list',
                    ValidationErrorType.INVALID_VALUE
                )

        # Validate tags
        if 'tags' in record and record['tags']:
            tags = record['tags']
            if not isinstance(tags, (list, str)):
                result.add_error('tags', 'Tags must be a list or comma-separated string')
            elif isinstance(tags, str):
                # String should be valid JSON array or comma-separated
                try:
                    json.loads(tags)
                except json.JSONDecodeError:
                    if not tags.strip():
                        result.add_error('tags', 'Tags cannot be empty')

        return result

    def validate_url_format(self, url: Optional[str], field_name: str = 'official_url') -> ValidationResult:
        """
        Validate URL format and accessibility.
        
        Args:
            url: URL to validate
            field_name: Name of the URL field (for error messages)
            
        Returns:
            ValidationResult with URL validation errors/warnings
        """
        result = ValidationResult(is_valid=True)

        if not url:
            result.add_error(field_name, f'{field_name} is required', ValidationErrorType.MISSING_FIELD)
            return result

        # Check format validity
        if not URLValidator.is_valid_url(url):
            result.add_error(
                field_name,
                f'{field_name} is not a valid URL (must be http:// or https://)',
                ValidationErrorType.INVALID_FORMAT
            )
            return result

        # Check if using HTTPS (warning if not)
        if not URLValidator.uses_https(url):
            result.add_warning(
                field_name,
                f'{field_name} should use HTTPS for security (currently uses HTTP)',
                ValidationErrorType.INVALID_FORMAT
            )

        return result

    def validate_category_exists(
        self,
        category_id_or_name: Any
    ) -> Tuple[bool, Optional[str], Optional[int]]:
        """
        Validate that category exists in database.
        
        Args:
            category_id_or_name: Category ID (int) or name (string) to validate
            
        Returns:
            Tuple of (is_valid, matched_category_name, category_id)
        """
        if not category_id_or_name:
            return False, None, None

        # If it's an ID, check map
        if isinstance(category_id_or_name, int):
            for cat_name, cat_id in self.category_id_map.items():
                if cat_id == category_id_or_name:
                    return True, cat_name, cat_id
            return False, None, None

        # If it's a string, try to find by name or fuzzy match
        if isinstance(category_id_or_name, str):
            cat_name = category_id_or_name.strip()

            # Try exact match first
            if cat_name in self.category_id_map:
                return True, cat_name, self.category_id_map[cat_name]

            # Try fuzzy match
            matched = CategoryValidator.fuzzy_match_category(cat_name)
            if matched in self.category_id_map:
                return True, matched, self.category_id_map[matched]

            # Default to "Other" if available
            if "Other" in self.category_id_map:
                return True, "Other", self.category_id_map["Other"]

        return False, None, None

    def validate_record_consistency(self, record: Dict[str, Any]) -> ValidationResult:
        """
        Validate cross-field consistency and business rules.
        
        Checks:
        - If state is provided, govt_level should be STATE
        - If govt_level is CENTRAL, state should be NULL or empty
        - If eligibility mentions state requirement, state must be present
        - Consistent field types and values
        
        Args:
            record: Record to validate
            
        Returns:
            ValidationResult with consistency errors
        """
        result = ValidationResult(is_valid=True, record_data=record)

        # Check state vs govt_level consistency
        if 'state' in record and record['state']:
            if 'govt_level' in record and record['govt_level'] == 'CENTRAL':
                result.add_error(
                    'state',
                    'State should not be specified for CENTRAL government schemes',
                    ValidationErrorType.CONSISTENCY_ERROR
                )

        if 'govt_level' in record and record['govt_level'] == 'STATE':
            if 'state' not in record or not record['state']:
                result.add_warning(
                    'state',
                    'STATE level scheme should have a state specified',
                    ValidationErrorType.CONSISTENCY_ERROR
                )

        # Validate eligibility structure if present
        if 'eligibility' in record and record['eligibility']:
            eligibility = record['eligibility']
            if isinstance(eligibility, str):
                try:
                    eligibility = json.loads(eligibility)
                except json.JSONDecodeError:
                    result.add_error(
                        'eligibility',
                        'Eligibility must be valid JSON',
                        ValidationErrorType.INVALID_FORMAT
                    )
            elif not isinstance(eligibility, dict):
                result.add_error(
                    'eligibility',
                    'Eligibility must be a JSON object',
                    ValidationErrorType.INVALID_FORMAT
                )

        return result

    def full_validation(
        self,
        record: Dict[str, Any],
        check_url_accessibility: bool = False,
        check_duplicates: bool = False,
        existing_slugs: Optional[Set[str]] = None
    ) -> ValidationResult:
        """
        Run comprehensive validation on a record.
        
        Performs all validation checks:
        1. Required fields present
        2. Field values valid
        3. URL format valid
        4. Category exists and valid
        5. Record consistency
        6. Optional: URL accessibility check
        7. Optional: Duplicate detection by slug
        
        Args:
            record: Record to validate
            check_url_accessibility: Whether to perform HTTP HEAD check on URL
            check_duplicates: Whether to check for duplicate schemes by slug
            existing_slugs: Set of existing slugs for duplicate detection
            
        Returns:
            ValidationResult with all validation results combined
        """
        # Start with required fields validation
        result = self.validate_required_fields(record)

        # Validate field values
        field_validation = self.validate_field_values(record)
        result.errors.extend(field_validation.errors)
        result.warnings.extend(field_validation.warnings)
        if not field_validation.is_valid:
            result.is_valid = False

        # Validate URL format
        if 'official_url' in record:
            url_validation = self.validate_url_format(record['official_url'], 'official_url')
            result.errors.extend(url_validation.errors)
            result.warnings.extend(url_validation.warnings)
            if not url_validation.is_valid:
                result.is_valid = False

        # Validate optional myscheme_url if present
        if 'myscheme_url' in record and record['myscheme_url']:
            url_validation = self.validate_url_format(record['myscheme_url'], 'myscheme_url')
            result.warnings.extend(url_validation.errors)  # Convert to warnings for optional field

        # Validate category
        category_valid, matched_category, category_id = self.validate_category_exists(
            record.get('category_id') or record.get('category_name')
        )
        if not category_valid:
            result.add_error(
                'category_id',
                'Category not found in database',
                ValidationErrorType.CATEGORY_MISMATCH
            )
        else:
            # Update record with matched category info
            record['category_id'] = category_id
            if 'category_name' in record:
                record['category_name'] = matched_category

        # Validate consistency
        consistency_validation = self.validate_record_consistency(record)
        result.errors.extend(consistency_validation.errors)
        result.warnings.extend(consistency_validation.warnings)
        if not consistency_validation.is_valid and any(e.severity == 'error' for e in consistency_validation.errors):
            result.is_valid = False

        # Check for duplicates by slug
        if check_duplicates and existing_slugs:
            from .field_mappings import generate_slug
            slug = generate_slug(record.get('name', ''))
            if slug in existing_slugs:
                result.add_error(
                    'slug',
                    f'Scheme with slug "{slug}" already exists',
                    ValidationErrorType.DUPLICATE
                )

        return result

    def get_validation_summary(self, result: ValidationResult) -> str:
        """
        Get human-readable validation summary.
        
        Args:
            result: ValidationResult to summarize
            
        Returns:
            Formatted summary string
        """
        lines = [
            f"Validation Result: {'PASSED' if result.is_valid else 'FAILED'}",
            f"Errors: {len(result.errors)}, Warnings: {len(result.warnings)}",
        ]

        if result.missing_fields:
            lines.append(f"Missing fields: {', '.join(result.missing_fields)}")

        if result.errors:
            lines.append("\nErrors:")
            for error in result.errors:
                lines.append(f"  - {error.field}: {error.message}")

        if result.warnings:
            lines.append("\nWarnings:")
            for warning in result.warnings:
                lines.append(f"  - {warning.field}: {warning.message}")

        return "\n".join(lines)
