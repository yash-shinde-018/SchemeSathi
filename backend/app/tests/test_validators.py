"""
Unit and Integration Tests for Scheme Data Validators

Tests cover:
- Required field validation
- Field value validation
- URL format validation
- Category validation and matching
- Record consistency checking
- Business rule validation
- Edge cases and error handling
"""

import pytest
from scheme_import_config import (
    SchemeValidator,
    ValidationResult,
    ValidationErrorType,
    URLValidator,
    CategoryValidator,
)


class TestURLValidator:
    """Tests for URLValidator utility class."""

    def test_valid_https_url(self):
        """Test validation of proper HTTPS URL."""
        url = "https://www.myscheme.gov.in/schemes/education"
        assert URLValidator.is_valid_url(url) is True

    def test_valid_http_url(self):
        """Test validation of HTTP URL."""
        url = "http://www.example.org/scheme"
        assert URLValidator.is_valid_url(url) is True

    def test_url_without_protocol(self):
        """Test rejection of URL without protocol."""
        url = "www.example.com/scheme"
        assert URLValidator.is_valid_url(url) is False

    def test_url_with_invalid_protocol(self):
        """Test rejection of URL with invalid protocol."""
        url = "ftp://example.com/scheme"
        assert URLValidator.is_valid_url(url) is False

    def test_localhost_url_invalid(self):
        """Test that localhost URLs are rejected."""
        assert URLValidator.is_valid_url("http://localhost:8000") is False
        assert URLValidator.is_valid_url("http://127.0.0.1") is False

    def test_empty_url_invalid(self):
        """Test that empty URLs are rejected."""
        assert URLValidator.is_valid_url("") is False
        assert URLValidator.is_valid_url(None) is False

    def test_url_with_spaces_invalid(self):
        """Test URL with spaces is invalid."""
        url = "https://example.com/scheme with spaces"
        assert URLValidator.is_valid_url(url) is False

    def test_url_without_domain_invalid(self):
        """Test URL without domain is invalid."""
        assert URLValidator.is_valid_url("https://") is False

    def test_https_usage_check(self):
        """Test HTTPS usage detection."""
        assert URLValidator.uses_https("https://example.com") is True
        assert URLValidator.uses_https("http://example.com") is False
        assert URLValidator.uses_https(None) is False

    def test_url_normalization(self):
        """Test URL normalization."""
        assert URLValidator.normalize_url("https://example.com") == "https://example.com"
        assert URLValidator.normalize_url("http://example.com") == "http://example.com"
        assert URLValidator.normalize_url(None) is None

    def test_url_with_path_and_query(self):
        """Test URL with path and query parameters."""
        url = "https://www.gov.in/scheme?id=123&category=education"
        assert URLValidator.is_valid_url(url) is True

    def test_url_with_special_characters_in_path(self):
        """Test URL with special characters in path."""
        url = "https://myscheme.gov.in/scheme-2024/education"
        assert URLValidator.is_valid_url(url) is True

    def test_url_with_port_number(self):
        """Test URL with port number."""
        url = "https://myscheme.gov.in:8443/scheme"
        assert URLValidator.is_valid_url(url) is True


class TestCategoryValidator:
    """Tests for CategoryValidator utility class."""

    def test_exact_category_match(self):
        """Test exact category name matching."""
        assert CategoryValidator.fuzzy_match_category("Education") == "Education"
        assert CategoryValidator.fuzzy_match_category("Healthcare") == "Healthcare"
        assert CategoryValidator.fuzzy_match_category("Agriculture") == "Agriculture"

    def test_case_insensitive_match(self):
        """Test case-insensitive category matching."""
        assert CategoryValidator.fuzzy_match_category("education") == "Education"
        assert CategoryValidator.fuzzy_match_category("HEALTHCARE") == "Healthcare"

    def test_keyword_matching_education(self):
        """Test keyword-based matching for education category."""
        assert CategoryValidator.fuzzy_match_category("student scholarship") == "Education"
        assert CategoryValidator.fuzzy_match_category("skill training") == "Education"

    def test_keyword_matching_healthcare(self):
        """Test keyword-based matching for healthcare category."""
        assert CategoryValidator.fuzzy_match_category("medical insurance") == "Healthcare"
        assert CategoryValidator.fuzzy_match_category("health treatment") == "Healthcare"

    def test_keyword_matching_agriculture(self):
        """Test keyword-based matching for agriculture category."""
        # Need at least 2 keywords to pass the 0.2 threshold with 7+ keywords
        assert CategoryValidator.fuzzy_match_category("farmer agricultural land scheme") == "Agriculture"
        assert CategoryValidator.fuzzy_match_category("agricultural irrigation crop") == "Agriculture"

    def test_keyword_matching_employment(self):
        """Test keyword-based matching for employment category."""
        assert CategoryValidator.fuzzy_match_category("job career employment program") == "Employment"

    def test_keyword_matching_women_welfare(self):
        """Test keyword-based matching for women & child welfare."""
        result = CategoryValidator.fuzzy_match_category("women maternity benefit")
        assert result == "Women & Child Welfare"

    def test_no_match_defaults_to_other(self):
        """Test that unmatched text defaults to Other."""
        assert CategoryValidator.fuzzy_match_category("xyz abc unknown") == "Other"

    def test_empty_string_defaults_to_other(self):
        """Test that empty string defaults to Other."""
        assert CategoryValidator.fuzzy_match_category("") == "Other"

    def test_none_defaults_to_other(self):
        """Test that None defaults to Other."""
        assert CategoryValidator.fuzzy_match_category(None) == "Other"

    def test_is_valid_category_true(self):
        """Test validation of standard categories."""
        assert CategoryValidator.is_valid_category("Education") is True
        assert CategoryValidator.is_valid_category("Healthcare") is True
        assert CategoryValidator.is_valid_category("Other") is True

    def test_is_valid_category_false(self):
        """Test validation fails for non-standard categories."""
        assert CategoryValidator.is_valid_category("InvalidCategory") is False
        assert CategoryValidator.is_valid_category("") is False
        assert CategoryValidator.is_valid_category(None) is False


class TestSchemeValidator:
    """Tests for main SchemeValidator class."""

    @pytest.fixture
    def validator(self):
        """Create validator instance with sample categories."""
        category_map = {
            'Education': 1,
            'Healthcare': 2,
            'Agriculture': 3,
            'Employment': 4,
            'Housing': 5,
            'Women & Child Welfare': 6,
            'Social Welfare': 7,
            'Entrepreneurship': 8,
            'Senior Citizen': 9,
            'Other': 10,
        }
        return SchemeValidator(category_id_map=category_map)

    @pytest.fixture
    def valid_scheme_record(self):
        """Create a valid scheme record for testing."""
        return {
            'name': 'Prime Minister Scholarship Scheme',
            'description': 'A comprehensive scholarship program for meritorious students.',
            'govt_level': 'CENTRAL',
            'ministry': 'Ministry of Education',
            'official_url': 'https://scholarships.gov.in/pm-scholarship',
            'category_id': 'Education',
            'application_mode': 'ONLINE',
        }

    # Required Fields Validation Tests

    def test_all_required_fields_present(self, validator, valid_scheme_record):
        """Test validation passes when all required fields are present."""
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is True
        assert len(result.missing_fields) == 0

    def test_missing_name_field(self, validator, valid_scheme_record):
        """Test validation fails when name is missing."""
        del valid_scheme_record['name']
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'name' in result.missing_fields

    def test_missing_description_field(self, validator, valid_scheme_record):
        """Test validation fails when description is missing."""
        del valid_scheme_record['description']
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'description' in result.missing_fields

    def test_missing_govt_level_field(self, validator, valid_scheme_record):
        """Test validation fails when govt_level is missing."""
        del valid_scheme_record['govt_level']
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'govt_level' in result.missing_fields

    def test_missing_official_url_field(self, validator, valid_scheme_record):
        """Test validation fails when official_url is missing."""
        del valid_scheme_record['official_url']
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'official_url' in result.missing_fields

    def test_missing_application_mode_field(self, validator, valid_scheme_record):
        """Test validation fails when application_mode is missing."""
        del valid_scheme_record['application_mode']
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'application_mode' in result.missing_fields

    def test_null_required_field(self, validator, valid_scheme_record):
        """Test validation fails when required field is null."""
        valid_scheme_record['name'] = None
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'name' in result.missing_fields

    def test_empty_string_required_field(self, validator, valid_scheme_record):
        """Test validation fails when required field is empty string."""
        valid_scheme_record['description'] = ''
        result = validator.validate_required_fields(valid_scheme_record)
        assert result.is_valid is False
        assert 'description' in result.missing_fields

    # Field Value Validation Tests

    def test_name_length_valid(self, validator):
        """Test name field length validation."""
        record = {'name': 'Valid Scheme Name'}
        result = validator.validate_field_values(record)
        assert result.is_valid is True

    def test_name_too_long(self, validator):
        """Test name exceeding maximum length."""
        record = {'name': 'a' * 256}
        result = validator.validate_field_values(record)
        assert result.is_valid is False
        assert 'name' in result.invalid_fields

    def test_name_empty_string(self, validator):
        """Test name cannot be empty."""
        record = {'name': ''}
        result = validator.validate_field_values(record)
        assert result.is_valid is False

    def test_name_whitespace_only(self, validator):
        """Test name cannot be whitespace only."""
        record = {'name': '   '}
        result = validator.validate_field_values(record)
        assert result.is_valid is False

    def test_description_valid(self, validator):
        """Test valid description."""
        record = {'description': 'This is a valid description.'}
        result = validator.validate_field_values(record)
        assert result.is_valid is True

    def test_govt_level_valid(self, validator):
        """Test valid government levels."""
        for level in ['CENTRAL', 'STATE', 'LOCAL']:
            record = {'govt_level': level}
            result = validator.validate_field_values(record)
            assert result.is_valid is True

    def test_govt_level_invalid(self, validator):
        """Test invalid government level."""
        record = {'govt_level': 'INVALID'}
        result = validator.validate_field_values(record)
        assert result.is_valid is False
        assert 'govt_level' in result.invalid_fields

    def test_application_mode_valid(self, validator):
        """Test valid application modes."""
        for mode in ['ONLINE', 'OFFLINE', 'BOTH']:
            record = {'application_mode': mode}
            result = validator.validate_field_values(record)
            assert result.is_valid is True

    def test_application_mode_invalid(self, validator):
        """Test invalid application mode."""
        record = {'application_mode': 'INVALID_MODE'}
        result = validator.validate_field_values(record)
        assert result.is_valid is False

    def test_ministry_valid_length(self, validator):
        """Test ministry field length validation."""
        record = {'ministry': 'Ministry of Education'}
        result = validator.validate_field_values(record)
        assert result.is_valid is True

    def test_ministry_too_long(self, validator):
        """Test ministry exceeding maximum length."""
        record = {'ministry': 'a' * 201}
        result = validator.validate_field_values(record)
        assert result.is_valid is False

    # URL Validation Tests

    def test_valid_official_url(self, validator):
        """Test URL validation with valid URL."""
        record = {'official_url': 'https://www.myscheme.gov.in/scheme'}
        result = validator.validate_url_format(record['official_url'])
        assert result.is_valid is True

    def test_invalid_official_url_no_protocol(self, validator):
        """Test URL validation fails without protocol."""
        record = {'official_url': 'www.example.com'}
        result = validator.validate_url_format(record['official_url'])
        assert result.is_valid is False
        assert len(result.errors) > 0

    def test_url_without_https_warning(self, validator):
        """Test URL without HTTPS generates warning."""
        record = {'official_url': 'http://www.example.com'}
        result = validator.validate_url_format(record['official_url'])
        assert len(result.warnings) > 0

    def test_empty_url(self, validator):
        """Test empty URL validation."""
        result = validator.validate_url_format('')
        assert result.is_valid is False

    def test_none_url(self, validator):
        """Test None URL validation."""
        result = validator.validate_url_format(None)
        assert result.is_valid is False

    def test_myscheme_url_validation(self, validator):
        """Test MyScheme URL validation."""
        url = 'https://myscheme.gov.in/schemes/123'
        result = validator.validate_url_format(url, 'myscheme_url')
        assert result.is_valid is True

    # Category Validation Tests

    def test_category_exists_by_id(self, validator):
        """Test category validation by ID."""
        is_valid, name, cat_id = validator.validate_category_exists(1)
        assert is_valid is True
        assert name == 'Education'
        assert cat_id == 1

    def test_category_exists_by_name(self, validator):
        """Test category validation by name."""
        is_valid, name, cat_id = validator.validate_category_exists('Healthcare')
        assert is_valid is True
        assert name == 'Healthcare'
        assert cat_id == 2

    def test_category_does_not_exist(self, validator):
        """Test category validation fails for non-existent category."""
        is_valid, name, cat_id = validator.validate_category_exists(999)
        assert is_valid is False

    def test_category_fuzzy_match(self, validator):
        """Test category validation with fuzzy match."""
        is_valid, name, cat_id = validator.validate_category_exists('student scholarship')
        assert is_valid is True
        assert name == 'Education'

    # Record Consistency Tests

    def test_state_with_central_level(self, validator):
        """Test consistency check: state with CENTRAL govt_level."""
        record = {
            'govt_level': 'CENTRAL',
            'state': 'Maharashtra'
        }
        result = validator.validate_record_consistency(record)
        assert result.is_valid is False
        assert any('state' in e.field for e in result.errors)

    def test_state_level_without_state(self, validator):
        """Test consistency warning: STATE level without state specified."""
        record = {
            'govt_level': 'STATE',
            'state': None
        }
        result = validator.validate_record_consistency(record)
        # Should have warning but not error
        assert any('state' in w.field for w in result.warnings)

    def test_central_level_with_state_is_inconsistent(self, validator):
        """Test central level scheme should not have state."""
        record = {
            'govt_level': 'CENTRAL',
            'state': 'Delhi'
        }
        result = validator.validate_record_consistency(record)
        assert not result.is_valid

    def test_valid_state_level_with_state(self, validator):
        """Test valid STATE level with state specified."""
        record = {
            'govt_level': 'STATE',
            'state': 'Karnataka'
        }
        result = validator.validate_record_consistency(record)
        # Check if warnings are about missing fields (valid scenario)
        assert all('state' not in w.field for w in result.warnings)

    # Full Validation Tests

    def test_full_validation_passes(self, validator, valid_scheme_record):
        """Test full validation passes for valid record."""
        result = validator.full_validation(valid_scheme_record)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_full_validation_missing_required_field(self, validator, valid_scheme_record):
        """Test full validation fails for missing required field."""
        del valid_scheme_record['name']
        result = validator.full_validation(valid_scheme_record)
        assert result.is_valid is False
        assert 'name' in result.missing_fields

    def test_full_validation_invalid_url(self, validator, valid_scheme_record):
        """Test full validation fails for invalid URL."""
        valid_scheme_record['official_url'] = 'invalid-url'
        result = validator.full_validation(valid_scheme_record)
        assert result.is_valid is False

    def test_full_validation_invalid_category(self, validator, valid_scheme_record):
        """Test full validation fails for invalid category."""
        valid_scheme_record['category_id'] = 999
        result = validator.full_validation(valid_scheme_record)
        assert result.is_valid is False

    def test_full_validation_multiple_errors(self, validator, valid_scheme_record):
        """Test full validation catches multiple errors."""
        valid_scheme_record['name'] = ''
        valid_scheme_record['official_url'] = 'not-a-url'
        valid_scheme_record['govt_level'] = 'INVALID'
        result = validator.full_validation(valid_scheme_record)
        assert result.is_valid is False
        assert len(result.errors) > 2

    def test_full_validation_with_optional_fields(self, validator, valid_scheme_record):
        """Test full validation with optional fields."""
        # For CENTRAL scheme, state should not be set
        # Let's use a STATE scheme instead to properly test optional fields
        valid_scheme_record['govt_level'] = 'STATE'
        valid_scheme_record['state'] = 'Maharashtra'
        valid_scheme_record['tags'] = ['education', 'scholarship']
        valid_scheme_record['myscheme_url'] = 'https://myscheme.gov.in/scheme/123'
        result = validator.full_validation(valid_scheme_record)
        assert result.is_valid is True

    def test_full_validation_duplicate_detection(self, validator, valid_scheme_record):
        """Test full validation detects duplicate schemes by slug."""
        existing_slugs = {'prime-minister-scholarship-scheme'}
        result = validator.full_validation(
            valid_scheme_record,
            check_duplicates=True,
            existing_slugs=existing_slugs
        )
        assert result.is_valid is False
        assert any('slug' in e.field for e in result.errors)

    # Edge Case Tests

    def test_special_characters_in_name(self, validator):
        """Test name with special characters."""
        record = {'name': "PM's Special & Educational Scheme (2024)"}
        result = validator.validate_field_values(record)
        assert result.is_valid is True

    def test_url_with_query_parameters(self, validator):
        """Test URL with query parameters."""
        url = 'https://myscheme.gov.in/scheme?id=123&category=education&state=MH'
        result = validator.validate_url_format(url)
        assert result.is_valid is True

    def test_state_name_not_in_standard_list(self, validator):
        """Test state name validation (warning for non-standard names)."""
        record = {'state': 'NonStandardState'}
        result = validator.validate_field_values(record)
        # Should have warning but not error
        assert any('state' in w.field for w in result.warnings)

    def test_very_long_description(self, validator):
        """Test handling of very long description."""
        record = {'description': 'A' * 10000}
        result = validator.validate_field_values(record)
        assert result.is_valid is True

    def test_unicode_characters_in_fields(self, validator):
        """Test Unicode characters in scheme name."""
        record = {'name': 'प्रधानमंत्री योजना 2024'}
        result = validator.validate_field_values(record)
        assert result.is_valid is True

    def test_validation_result_summary(self, validator, valid_scheme_record):
        """Test validation result summary generation."""
        result = validator.full_validation(valid_scheme_record)
        summary = validator.get_validation_summary(result)
        assert 'PASSED' in summary
        assert 'Errors: 0' in summary


class TestValidationResult:
    """Tests for ValidationResult dataclass."""

    def test_validation_result_initialization(self):
        """Test ValidationResult initialization."""
        result = ValidationResult(is_valid=True)
        assert result.is_valid is True
        assert len(result.errors) == 0
        assert len(result.warnings) == 0

    def test_add_error(self):
        """Test adding error to validation result."""
        result = ValidationResult(is_valid=True)
        result.add_error('field_name', 'Error message')
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert 'field_name' in result.invalid_fields

    def test_add_warning(self):
        """Test adding warning to validation result."""
        result = ValidationResult(is_valid=True)
        result.add_warning('field_name', 'Warning message')
        assert result.is_valid is True
        assert len(result.warnings) == 1

    def test_add_missing_field(self):
        """Test adding missing field to validation result."""
        result = ValidationResult(is_valid=True)
        result.add_missing_field('required_field')
        assert result.is_valid is False
        assert 'required_field' in result.missing_fields

    def test_validation_result_summary_passed(self):
        """Test summary for passed validation."""
        result = ValidationResult(is_valid=True)
        summary = result.get_summary()
        assert 'Validation passed' in summary

    def test_validation_result_summary_failed(self):
        """Test summary for failed validation."""
        result = ValidationResult(is_valid=False)
        result.add_error('field', 'Error message')
        result.add_missing_field('required')
        summary = result.get_summary()
        assert 'Validation failed' in summary
        assert 'required' in summary
