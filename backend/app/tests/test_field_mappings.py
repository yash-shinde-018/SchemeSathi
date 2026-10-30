"""
Unit tests for field mapping configuration and utilities.

Tests:
- FieldMapping class: transformations and validations
- FieldMappingConfig: record mapping and validation
- Source format configurations (MyScheme, Generic CSV, JSON API)
- Helper functions: slug generation, category matching
- Edge cases and error handling
"""

import pytest
import json
from scheme_import_config import (
    FieldMapping,
    FieldType,
    FieldMappingConfig,
    MySchemeCSVConfig,
    GenericCSVConfig,
    JSONAPIConfig,
    MappingRegistry,
    CategoryMatcher,
    generate_slug,
    SourceFormat,
)


class TestFieldMapping:
    """Test FieldMapping class."""
    
    def test_find_source_field_first_variant(self):
        """Test finding first available source field."""
        mapping = FieldMapping(
            scheme_field="name",
            variants=["scheme_name", "Name", "title"]
        )
        
        source_data = {"scheme_name": "Test Scheme", "Name": "Other"}
        assert mapping.find_source_field(source_data) == "scheme_name"
    
    def test_find_source_field_second_variant(self):
        """Test finding second variant when first is missing."""
        mapping = FieldMapping(
            scheme_field="name",
            variants=["scheme_name", "Name", "title"]
        )
        
        source_data = {"Name": "Test Scheme"}
        assert mapping.find_source_field(source_data) == "Name"
    
    def test_find_source_field_not_found(self):
        """Test when source field is not found."""
        mapping = FieldMapping(
            scheme_field="name",
            variants=["scheme_name", "Name", "title"]
        )
        
        source_data = {"other_field": "value"}
        assert mapping.find_source_field(source_data) is None
    
    def test_transform_value_string(self):
        """Test string field transformation."""
        mapping = FieldMapping(
            scheme_field="name",
            field_type=FieldType.STRING,
            default_value="Unknown"
        )
        
        assert mapping.transform_value("Test Name") == "Test Name"
        assert mapping.transform_value(None) == "Unknown"
    
    def test_transform_value_enum(self):
        """Test enum field transformation and normalization."""
        mapping = FieldMapping(
            scheme_field="govt_level",
            field_type=FieldType.ENUM,
            enum_values=["CENTRAL", "STATE", "LOCAL"],
            default_value="CENTRAL",
            transformer=lambda x: str(x).upper().replace("UNION", "CENTRAL")
        )
        
        assert mapping.transform_value("CENTRAL") == "CENTRAL"
        assert mapping.transform_value("central") == "CENTRAL"
        assert mapping.transform_value("UNION") == "CENTRAL"
        assert mapping.transform_value("invalid") == "CENTRAL"  # Default
    
    def test_transform_value_url(self):
        """Test URL field transformation and normalization."""
        mapping = FieldMapping(
            scheme_field="official_url",
            field_type=FieldType.URL
        )
        
        assert mapping.transform_value("https://example.com") == "https://example.com"
        assert mapping.transform_value("http://example.com") == "http://example.com"
        assert mapping.transform_value("example.com") == "https://example.com"
        assert mapping.transform_value("example.gov.in") == "https://example.gov.in"
    
    def test_transform_value_json_array(self):
        """Test JSON array field transformation."""
        mapping = FieldMapping(
            scheme_field="tags",
            field_type=FieldType.JSON_ARRAY,
            default_value=[]
        )
        
        # List input
        assert mapping.transform_value(["a", "b"]) == ["a", "b"]
        
        # JSON string input
        assert mapping.transform_value('["a", "b"]') == ["a", "b"]
        
        # Comma-separated string
        assert mapping.transform_value("a, b, c") == ["a, b, c"]
        
        # None input
        assert mapping.transform_value(None) == []
    
    def test_transform_value_json_array_with_transformer(self):
        """Test JSON array with custom transformer."""
        mapping = FieldMapping(
            scheme_field="tags",
            field_type=FieldType.JSON_ARRAY,
            default_value=[],
            transformer=lambda x: x.split(",") if isinstance(x, str) else x
        )
        
        # Comma-separated string
        result = mapping.transform_value("education, healthcare, women")
        assert result == ["education", " healthcare", " women"]
    
    def test_transform_value_json_object(self):
        """Test JSON object field transformation."""
        mapping = FieldMapping(
            scheme_field="eligibility",
            field_type=FieldType.JSON_OBJECT,
            default_value={}
        )
        
        # Dict input
        data = {"age_min": 18, "age_max": 65}
        assert mapping.transform_value(data) == data
        
        # JSON string input
        assert mapping.transform_value('{"age_min": 18}') == {"age_min": 18}
        
        # None input
        assert mapping.transform_value(None) == {}
    
    def test_validate_value_required_field(self):
        """Test validation of required field."""
        mapping = FieldMapping(
            scheme_field="name",
            required=True
        )
        
        assert mapping.validate_value("Some Name") is True
        assert mapping.validate_value(None) is False
    
    def test_validate_value_optional_field(self):
        """Test validation of optional field."""
        mapping = FieldMapping(
            scheme_field="state",
            required=False
        )
        
        assert mapping.validate_value("Maharashtra") is True
        assert mapping.validate_value(None) is True
    
    def test_validate_value_url(self):
        """Test URL validation."""
        mapping = FieldMapping(
            scheme_field="official_url",
            field_type=FieldType.URL
        )
        
        assert mapping.validate_value("https://example.com") is True
        assert mapping.validate_value("http://example.com") is True
        assert mapping.validate_value("invalid-url") is False
    
    def test_validate_value_enum(self):
        """Test enum value validation."""
        mapping = FieldMapping(
            scheme_field="govt_level",
            field_type=FieldType.ENUM,
            enum_values=["CENTRAL", "STATE", "LOCAL"]
        )
        
        assert mapping.validate_value("CENTRAL") is True
        assert mapping.validate_value("STATE") is True
        assert mapping.validate_value("INVALID") is False


class TestMySchemeCSVConfig:
    """Test MyScheme CSV format configuration."""
    
    @pytest.fixture
    def config(self):
        """Create config instance."""
        return MySchemeCSVConfig()
    
    def test_config_name(self, config):
        """Test config format name."""
        assert config.format_name == SourceFormat.MYSCHEME_CSV.value
    
    def test_required_fields(self, config):
        """Test required fields list."""
        required = config.get_required_fields()
        assert "name" in required
        assert "description" in required
        assert "govt_level" in required
        assert "ministry" in required
        assert "official_url" in required
    
    def test_map_record_valid(self, config):
        """Test mapping a valid record."""
        record = {
            "scheme_name": "Test Scheme",
            "scheme_description": "Test description",
            "government_level": "CENTRAL",
            "ministry": "Test Ministry",
            "official_url": "https://example.com",
        }
        
        mapped = config.map_record(record)
        
        assert mapped["name"] == "Test Scheme"
        assert mapped["description"] == "Test description"
        assert mapped["govt_level"] == "CENTRAL"
        assert mapped["ministry"] == "Test Ministry"
        assert mapped["official_url"] == "https://example.com"
    
    def test_map_record_with_optional_fields(self, config):
        """Test mapping record with optional fields."""
        record = {
            "scheme_name": "Test Scheme",
            "scheme_description": "Test description",
            "government_level": "CENTRAL",
            "ministry": "Test Ministry",
            "official_url": "https://example.com",
            "tags": "education,healthcare,women",
            "state": "Maharashtra",
        }
        
        mapped = config.map_record(record)
        
        assert mapped["state"] == "Maharashtra"
        assert mapped["tags"] == ["education", "healthcare", "women"]
    
    def test_validate_record_valid(self, config):
        """Test validating a valid record."""
        record = {
            "scheme_name": "Test Scheme",
            "scheme_description": "Test description",
            "government_level": "CENTRAL",
            "ministry": "Test Ministry",
            "official_url": "https://example.com",
        }
        
        is_valid, missing = config.validate_record(record)
        assert is_valid is True
        assert missing == []
    
    def test_validate_record_missing_fields(self, config):
        """Test validating record with missing required fields."""
        record = {
            "scheme_name": "Test Scheme",
            "scheme_description": "Test description",
            # Missing government_level, ministry, official_url
        }
        
        is_valid, missing = config.validate_record(record)
        assert is_valid is False
        assert "govt_level" in missing
        assert "ministry" in missing
        assert "official_url" in missing


class TestGenericCSVConfig:
    """Test Generic CSV format configuration."""
    
    @pytest.fixture
    def config(self):
        """Create config instance."""
        return GenericCSVConfig()
    
    def test_flexible_field_names_variant1(self, config):
        """Test flexible field name matching - variant 1."""
        record = {
            "scheme_title": "Test Scheme",
            "overview": "Test overview",
            "level": "Central Government",
            "department": "Test Dept",
            "website": "example.gov.in",
        }
        
        mapped = config.map_record(record)
        
        assert mapped["name"] == "Test Scheme"
        assert mapped["description"] == "Test overview"
        assert mapped["govt_level"] == "CENTRAL"
        assert mapped["ministry"] == "Test Dept"
        assert mapped["official_url"] == "https://example.gov.in"
    
    def test_flexible_field_names_variant2(self, config):
        """Test flexible field name matching - variant 2."""
        record = {
            "Scheme Name": "Test Scheme",
            "Description": "Test description",
            "Government Level": "STATE",
            "Ministry": "Test Ministry",
            "Official URL": "https://example.com",
        }
        
        mapped = config.map_record(record)
        
        assert mapped["name"] == "Test Scheme"
        assert mapped["description"] == "Test description"
        assert mapped["govt_level"] == "STATE"
        assert mapped["ministry"] == "Test Ministry"
    
    def test_normalize_government_level(self, config):
        """Test normalization of government level."""
        # UNION → CENTRAL
        record1 = {
            "name": "Scheme",
            "Description": "Description",
            "level": "UNION",
            "department": "Dept",
            "website": "example.com",
        }
        
        mapped1 = config.map_record(record1)
        assert mapped1["govt_level"] == "CENTRAL"
        
        # STATE GOVT → STATE
        record2 = {
            "name": "Scheme",
            "Description": "Description",
            "level": "STATE GOVT",
            "department": "Dept",
            "website": "example.com",
        }
        
        mapped2 = config.map_record(record2)
        assert mapped2["govt_level"] == "STATE"


class TestJSONAPIConfig:
    """Test JSON API format configuration."""
    
    @pytest.fixture
    def config(self):
        """Create config instance."""
        return JSONAPIConfig()
    
    def test_map_json_api_record(self, config):
        """Test mapping JSON API format record."""
        record = {
            "scheme_name": "Test Scheme",
            "description": "Test description",
            "governmentLevel": "CENTRAL",
            "ministry": "Test Ministry",
            "officialUrl": "https://example.com",
            "tags": ["education", "health"],
            "eligibility": {"age_min": 18}
        }
        
        mapped = config.map_record(record)
        
        assert mapped["name"] == "Test Scheme"
        assert mapped["description"] == "Test description"
        assert mapped["govt_level"] == "CENTRAL"
        assert mapped["tags"] == ["education", "health"]
        assert mapped["eligibility"] == {"age_min": 18}


class TestSlugGeneration:
    """Test slug generation utility."""
    
    def test_simple_text(self):
        """Test slug generation for simple text."""
        assert generate_slug("Prime Minister Scheme") == "prime-minister-scheme"
    
    def test_special_characters(self):
        """Test slug generation removes special characters."""
        assert generate_slug("PM-MUDRA (2023)") == "pm-mudra-2023"
    
    def test_spaces_and_hyphens(self):
        """Test slug handles spaces and special characters like @."""
        assert generate_slug("Healthcare @ Wellness") == "healthcare-wellness"
    
    def test_multiple_spaces(self):
        """Test slug handles multiple consecutive spaces."""
        assert generate_slug("  Multiple   Spaces  ") == "multiple-spaces"
    
    def test_multiple_hyphens(self):
        """Test slug converts multiple hyphens to single."""
        assert generate_slug("Test---Scheme") == "test-scheme"
    
    def test_uppercase(self):
        """Test slug converts uppercase to lowercase."""
        assert generate_slug("UPPERCASE SCHEME") == "uppercase-scheme"
    
    def test_numbers(self):
        """Test slug preserves numbers."""
        assert generate_slug("Scheme 123 Test 456") == "scheme-123-test-456"
    
    def test_empty_string(self):
        """Test slug generation for empty string."""
        assert generate_slug("") == ""
    
    def test_only_special_characters(self):
        """Test slug generation for only special characters."""
        assert generate_slug("@#$%^&*()") == ""
    
    def test_max_length(self):
        """Test slug is truncated to max length."""
        long_text = "a" * 300
        slug = generate_slug(long_text)
        assert len(slug) <= 255


class TestCategoryMatcher:
    """Test category matching utility."""
    
    def test_education_matching(self):
        """Test education category matching."""
        text = "Skill Development Scholarship for Students"
        assert CategoryMatcher.match_category(text) == "Education"
    
    def test_healthcare_matching(self):
        """Test healthcare category matching."""
        text = "National Health Insurance Scheme for Senior Citizens"
        assert CategoryMatcher.match_category(text) == "Healthcare"
    
    def test_agriculture_matching(self):
        """Test agriculture category matching."""
        text = "Farmer Support and Agricultural Modernization Program"
        assert CategoryMatcher.match_category(text) == "Agriculture"
    
    def test_employment_matching(self):
        """Test employment category matching."""
        text = "Employment and Wage Support for Workers"
        assert CategoryMatcher.match_category(text) == "Employment"
    
    def test_entrepreneurship_matching(self):
        """Test entrepreneurship category matching."""
        text = "Startup Business Loan and Mentoring Program"
        assert CategoryMatcher.match_category(text) == "Entrepreneurship"
    
    def test_housing_matching(self):
        """Test housing category matching."""
        text = "Affordable Housing Construction Support Scheme"
        assert CategoryMatcher.match_category(text) == "Housing"
    
    def test_women_matching(self):
        """Test women and child welfare matching."""
        text = "Women Entrepreneur and Girl Child Education Support"
        assert CategoryMatcher.match_category(text) == "Women And Child Welfare"
    
    def test_default_other(self):
        """Test default to Other category."""
        text = "Random Scheme XYZ"
        assert CategoryMatcher.match_category(text) == "Other"
    
    def test_empty_string(self):
        """Test category matching for empty string."""
        assert CategoryMatcher.match_category("") == "Other"
    
    def test_none_value(self):
        """Test category matching for None."""
        assert CategoryMatcher.match_category(None) == "Other"


class TestMappingRegistry:
    """Test mapping registry."""
    
    def test_get_myscheme_config(self):
        """Test getting MyScheme config."""
        config = MappingRegistry.get_config(SourceFormat.MYSCHEME_CSV.value)
        assert config is not None
        assert config.format_name == SourceFormat.MYSCHEME_CSV.value
    
    def test_get_generic_csv_config(self):
        """Test getting Generic CSV config."""
        config = MappingRegistry.get_config(SourceFormat.GENERIC_CSV.value)
        assert config is not None
        assert config.format_name == SourceFormat.GENERIC_CSV.value
    
    def test_get_json_api_config(self):
        """Test getting JSON API config."""
        config = MappingRegistry.get_config(SourceFormat.JSON_API.value)
        assert config is not None
        assert config.format_name == SourceFormat.JSON_API.value
    
    def test_list_available_formats(self):
        """Test listing available formats."""
        formats = MappingRegistry.list_available_formats()
        assert SourceFormat.MYSCHEME_CSV.value in formats
        assert SourceFormat.GENERIC_CSV.value in formats
        assert SourceFormat.JSON_API.value in formats
    
    def test_register_custom_config(self):
        """Test registering custom config."""
        custom_config = FieldMappingConfig("test_format", "Test format")
        MappingRegistry.register_config(custom_config)
        
        retrieved = MappingRegistry.get_config("test_format")
        assert retrieved is not None
        assert retrieved.format_name == "test_format"


class TestIntegrationScenarios:
    """Integration tests for common import scenarios."""
    
    def test_full_import_workflow_myscheme(self):
        """Test complete import workflow with MyScheme format."""
        config = MySchemeCSVConfig()
        
        # Sample record
        record = {
            "scheme_name": "PM-MUDRA",
            "scheme_description": "Collateral-free bank loans",
            "government_level": "CENTRAL",
            "ministry": "Ministry of MSME",
            "official_url": "https://mudra.org.in",
            "state": "",
            "tags": "business,startup,loan",
            "application_mode": "ONLINE",
        }
        
        # Validate
        is_valid, missing = config.validate_record(record)
        assert is_valid is True
        
        # Map
        mapped = config.map_record(record)
        
        # Generate slug
        slug = generate_slug(mapped["name"])
        assert slug == "pm-mudra"
        
        # Match category
        category = CategoryMatcher.match_category(
            f"{mapped['name']} {mapped['description']}"
        )
        assert category == "Entrepreneurship"
    
    def test_handle_missing_fields(self):
        """Test handling of missing required fields."""
        config = MySchemeCSVConfig()
        
        record = {
            "scheme_name": "Incomplete Scheme",
            "scheme_description": "Missing required fields",
            # Missing: government_level, ministry, official_url
        }
        
        is_valid, missing = config.validate_record(record)
        assert is_valid is False
        assert len(missing) > 0
    
    def test_handle_invalid_values(self):
        """Test handling of invalid field values."""
        config = MySchemeCSVConfig()
        
        record = {
            "scheme_name": "Test",
            "scheme_description": "Test",
            "government_level": "INVALID",
            "ministry": "Test",
            "official_url": "not-a-url",
        }
        
        mapped = config.map_record(record)
        
        # Invalid enum should be replaced with default
        assert mapped["govt_level"] == "CENTRAL"
        
        # Invalid URL should be transformed
        assert mapped["official_url"] == "https://not-a-url"
