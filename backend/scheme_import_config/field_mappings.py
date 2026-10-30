"""
Field Mapping Configuration for Government Scheme Data Import

This module provides field mapping configurations for importing government scheme data
from various sources (CSV, JSON) into the Scheme model. It handles:

1. Multiple source formats (MyScheme CSV, Generic CSV, JSON API)
2. Field name variants from different government datasets
3. Data transformations and normalization
4. Field validation and missing data handling
5. Slug generation and category mapping

Requirements Addressed:
- Req 33: THE import process SHALL map dataset fields to the platform schema
- Req 33: THE import script SHALL preserve official URLs and source information
- Req 33: THE import process SHALL handle CSV/JSON format
"""

import re
import json
from typing import Dict, List, Optional, Any, Callable
from enum import Enum


class SourceFormat(str, Enum):
    """Supported source data formats."""
    MYSCHEME_CSV = "myscheme_csv"
    GENERIC_CSV = "generic_csv"
    JSON_API = "json_api"
    CUSTOM = "custom"


class FieldType(str, Enum):
    """Field data types for validation and transformation."""
    STRING = "string"
    TEXT = "text"
    JSON_ARRAY = "json_array"
    JSON_OBJECT = "json_object"
    ENUM = "enum"
    URL = "url"
    INTEGER = "integer"
    BOOLEAN = "boolean"


class FieldMapping:
    """
    Represents a single field mapping from source data to Scheme model field.
    
    Handles field name variants, type conversion, validation, and transformation.
    """
    
    def __init__(
        self,
        scheme_field: str,
        field_type: FieldType = FieldType.STRING,
        required: bool = False,
        variants: Optional[List[str]] = None,
        default_value: Any = None,
        transformer: Optional[Callable] = None,
        validator: Optional[Callable] = None,
        enum_values: Optional[List[str]] = None,
    ):
        """
        Initialize field mapping.
        
        Args:
            scheme_field: Target field name in Scheme model
            field_type: Data type of the field
            required: Whether field is mandatory for import
            variants: List of alternative source field names
            default_value: Default value if source field is missing
            transformer: Function to transform field value
            validator: Function to validate field value
            enum_values: Valid enum values (for enum fields)
        """
        self.scheme_field = scheme_field
        self.field_type = field_type
        self.required = required
        self.variants = variants or []
        self.default_value = default_value
        self.transformer = transformer
        self.validator = validator
        self.enum_values = enum_values or []
    
    def find_source_field(self, source_data: Dict[str, Any]) -> Optional[str]:
        """
        Find which variant of the field exists in source data.
        
        Args:
            source_data: Dictionary of source data
            
        Returns:
            Found source field name, or None if not found
        """
        for variant in self.variants:
            if variant in source_data and source_data[variant] is not None:
                return variant
        return None
    
    def transform_value(self, value: Any) -> Any:
        """
        Transform/normalize field value.
        
        Args:
            value: Raw value from source data
            
        Returns:
            Transformed value
        """
        if value is None:
            return self.default_value
        
        # Apply custom transformer if provided
        if self.transformer:
            value = self.transformer(value)
        
        # Type-specific transformations
        if self.field_type == FieldType.JSON_ARRAY:
            if isinstance(value, list):
                return value
            elif isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    return parsed if isinstance(parsed, list) else [value]
                except (json.JSONDecodeError, TypeError):
                    return [value] if value else []
            return []
        
        elif self.field_type == FieldType.JSON_OBJECT:
            if isinstance(value, dict):
                return value
            elif isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    return parsed if isinstance(parsed, dict) else {}
                except (json.JSONDecodeError, TypeError):
                    return {}
            return {}
        
        elif self.field_type == FieldType.ENUM:
            # Normalize enum values to uppercase
            normalized = value.upper() if isinstance(value, str) else str(value).upper()
            if self.enum_values and normalized not in self.enum_values:
                return self.default_value
            return normalized
        
        elif self.field_type == FieldType.BOOLEAN:
            if isinstance(value, bool):
                return value
            return str(value).lower() in ['true', '1', 'yes', 'on']
        
        elif self.field_type == FieldType.URL:
            # Ensure URL has protocol
            url = str(value).strip()
            if url and not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            return url
        
        elif self.field_type == FieldType.INTEGER:
            try:
                return int(value)
            except (ValueError, TypeError):
                return self.default_value
        
        return value
    
    def validate_value(self, value: Any) -> bool:
        """
        Validate field value.
        
        Args:
            value: Value to validate
            
        Returns:
            True if valid, False otherwise
        """
        if value is None:
            return not self.required
        
        if self.validator:
            return self.validator(value)
        
        # Type-specific validation
        if self.field_type == FieldType.URL:
            return isinstance(value, str) and (value.startswith('http://') or value.startswith('https://'))
        
        elif self.field_type == FieldType.ENUM:
            return self.enum_values and value in self.enum_values
        
        elif self.field_type == FieldType.JSON_ARRAY:
            return isinstance(value, list)
        
        elif self.field_type == FieldType.JSON_OBJECT:
            return isinstance(value, dict)
        
        return True


class FieldMappingConfig:
    """
    Base configuration class for field mappings from a source format.
    
    Provides:
    - Mapping from source fields to Scheme model fields
    - Field validation and transformation
    - Required field checking
    - Data normalization
    """
    
    def __init__(self, format_name: str, description: str):
        """
        Initialize mapping configuration.
        
        Args:
            format_name: Name of the source format
            description: Description of the format
        """
        self.format_name = format_name
        self.description = description
        self.mappings: Dict[str, FieldMapping] = {}
    
    def add_mapping(self, field_mapping: FieldMapping) -> None:
        """Add a field mapping."""
        self.mappings[field_mapping.scheme_field] = field_mapping
    
    def get_required_fields(self) -> List[str]:
        """Get list of required scheme fields."""
        return [
            field_name 
            for field_name, mapping in self.mappings.items() 
            if mapping.required
        ]
    
    def get_optional_fields(self) -> List[str]:
        """Get list of optional scheme fields."""
        return [
            field_name 
            for field_name, mapping in self.mappings.items() 
            if not mapping.required
        ]
    
    def map_record(self, source_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map a source record to Scheme model fields.
        
        Args:
            source_record: Source data record dictionary
            
        Returns:
            Mapped record with Scheme model fields
        """
        mapped_record = {}
        
        for scheme_field, mapping in self.mappings.items():
            source_field = mapping.find_source_field(source_record)
            
            if source_field:
                raw_value = source_record[source_field]
                transformed_value = mapping.transform_value(raw_value)
                
                # Validate transformed value
                if mapping.validate_value(transformed_value):
                    mapped_record[scheme_field] = transformed_value
                else:
                    # Invalid value, use default
                    mapped_record[scheme_field] = mapping.default_value
            else:
                # Field not found in source, use default
                mapped_record[scheme_field] = mapping.default_value
        
        return mapped_record
    
    def validate_record(self, source_record: Dict[str, Any]) -> tuple[bool, List[str]]:
        """
        Validate a source record has all required fields.
        
        Args:
            source_record: Source data record to validate
            
        Returns:
            Tuple of (is_valid, missing_fields_list)
        """
        missing_fields = []
        
        for scheme_field, mapping in self.mappings.items():
            if mapping.required:
                source_field = mapping.find_source_field(source_record)
                if not source_field:
                    missing_fields.append(scheme_field)
        
        return len(missing_fields) == 0, missing_fields


class MySchemeCSVConfig(FieldMappingConfig):
    """
    Field mapping configuration for MyScheme.gov.in CSV format.
    
    Standard government dataset with consistent field names and structure.
    """
    
    def __init__(self):
        super().__init__(
            format_name=SourceFormat.MYSCHEME_CSV.value,
            description="MyScheme.gov.in CSV export format with standard government scheme data"
        )
        self._initialize_mappings()
    
    def _initialize_mappings(self):
        """Initialize mappings for MyScheme CSV format."""
        
        # Required fields
        self.add_mapping(FieldMapping(
            scheme_field="name",
            field_type=FieldType.STRING,
            required=True,
            variants=["scheme_name", "Scheme Name", "scheme", "Scheme"],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="description",
            field_type=FieldType.TEXT,
            required=True,
            variants=["scheme_description", "Scheme Description", "description", "Description", "overview"],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="govt_level",
            field_type=FieldType.ENUM,
            required=True,
            variants=["government_level", "Government Level", "level", "Level", "govt_level"],
            enum_values=["CENTRAL", "STATE", "LOCAL"],
            default_value="CENTRAL",
            transformer=lambda x: str(x).upper().replace("UNION", "CENTRAL") if x else "CENTRAL",
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="ministry",
            field_type=FieldType.STRING,
            required=True,
            variants=["ministry", "Ministry", "department", "Department", "ministry_department"],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="official_url",
            field_type=FieldType.URL,
            required=True,
            variants=["official_url", "Official URL", "url", "URL", "scheme_url"],
        ))
        
        # Optional fields with transformations
        self.add_mapping(FieldMapping(
            scheme_field="state",
            field_type=FieldType.STRING,
            required=False,
            variants=["state", "State", "state_name", "State Name"],
            default_value=None,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="tags",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["tags", "Tags", "keywords", "Keywords"],
            default_value=[],
            transformer=lambda x: x.split(",") if isinstance(x, str) else x,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="eligibility",
            field_type=FieldType.JSON_OBJECT,
            required=False,
            variants=["eligibility", "Eligibility", "eligibility_criteria", "Eligibility Criteria"],
            default_value={},
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="exclusions",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["exclusions", "Exclusions", "exclusion_criteria"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="benefits",
            field_type=FieldType.JSON_OBJECT,
            required=False,
            variants=["benefits", "Benefits", "benefits_offered"],
            default_value={},
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="application_process",
            field_type=FieldType.TEXT,
            required=False,
            variants=["application_process", "Application Process", "how_to_apply"],
            default_value=None,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="documents",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["documents", "Documents", "required_documents", "Required Documents"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="faqs",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["faqs", "FAQs", "faq"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="application_mode",
            field_type=FieldType.ENUM,
            required=False,
            variants=["application_mode", "Application Mode", "mode", "Mode"],
            enum_values=["ONLINE", "OFFLINE", "BOTH"],
            default_value="BOTH",
            transformer=lambda x: str(x).upper() if x else "BOTH",
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="myscheme_url",
            field_type=FieldType.URL,
            required=False,
            variants=["myscheme_url", "MyScheme URL"],
            default_value=None,
        ))


class GenericCSVConfig(FieldMappingConfig):
    """
    Field mapping configuration for generic government CSV format.
    
    Handles CSVs from various government sources with flexible field names.
    More lenient field name matching for real-world government datasets.
    """
    
    def __init__(self):
        super().__init__(
            format_name=SourceFormat.GENERIC_CSV.value,
            description="Generic CSV format from various government datasets with flexible field names"
        )
        self._initialize_mappings()
    
    def _initialize_mappings(self):
        """Initialize mappings for generic CSV format."""
        
        # Required fields with broad field name variants
        self.add_mapping(FieldMapping(
            scheme_field="name",
            field_type=FieldType.STRING,
            required=True,
            variants=[
                "scheme_name", "Scheme Name", "scheme", "Scheme",
                "name", "Name", "scheme_title", "Scheme Title",
                "title", "Title"
            ],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="description",
            field_type=FieldType.TEXT,
            required=True,
            variants=[
                "description", "Description", "scheme_description", "Scheme Description",
                "overview", "Overview", "details", "Details", "objective", "Objective"
            ],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="govt_level",
            field_type=FieldType.ENUM,
            required=True,
            variants=[
                "government_level", "Government Level", "level", "Level",
                "govt_level", "Govt Level", "scheme_level", "Scheme Level",
                "administration_level"
            ],
            enum_values=["CENTRAL", "STATE", "LOCAL"],
            default_value="CENTRAL",
            transformer=lambda x: str(x).upper().replace("UNION", "CENTRAL").replace("CENTRAL GOVT", "CENTRAL").replace("STATE GOVT", "STATE") if x else "CENTRAL",
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="ministry",
            field_type=FieldType.STRING,
            required=True,
            variants=[
                "ministry", "Ministry", "department", "Department",
                "ministry_department", "Ministry Department", "govt_department",
                "administering_body", "admin_ministry"
            ],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="official_url",
            field_type=FieldType.URL,
            required=True,
            variants=[
                "official_url", "Official URL", "url", "URL",
                "scheme_url", "Scheme URL", "website", "Website",
                "official_website", "link", "Link"
            ],
        ))
        
        # Optional fields
        self.add_mapping(FieldMapping(
            scheme_field="state",
            field_type=FieldType.STRING,
            required=False,
            variants=[
                "state", "State", "state_name", "State Name",
                "applicable_state", "Applicable State"
            ],
            default_value=None,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="tags",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["tags", "Tags", "keywords", "Keywords", "categories"],
            default_value=[],
            transformer=lambda x: [tag.strip() for tag in x.split(",")] if isinstance(x, str) else x,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="eligibility",
            field_type=FieldType.JSON_OBJECT,
            required=False,
            variants=[
                "eligibility", "Eligibility", "eligibility_criteria",
                "Eligibility Criteria", "who_can_apply"
            ],
            default_value={},
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="exclusions",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=[
                "exclusions", "Exclusions", "exclusion_criteria",
                "who_cannot_apply"
            ],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="benefits",
            field_type=FieldType.JSON_OBJECT,
            required=False,
            variants=[
                "benefits", "Benefits", "benefits_offered",
                "what_is_offered", "assistance"
            ],
            default_value={},
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="application_process",
            field_type=FieldType.TEXT,
            required=False,
            variants=[
                "application_process", "Application Process",
                "how_to_apply", "How To Apply", "apply_method"
            ],
            default_value=None,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="documents",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=[
                "documents", "Documents", "required_documents",
                "Required Documents", "docs_required"
            ],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="faqs",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["faqs", "FAQs", "faq", "FAQ", "q_and_a"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="application_mode",
            field_type=FieldType.ENUM,
            required=False,
            variants=[
                "application_mode", "Application Mode", "mode", "Mode",
                "application_type", "online_offline"
            ],
            enum_values=["ONLINE", "OFFLINE", "BOTH"],
            default_value="BOTH",
            transformer=lambda x: str(x).upper() if x else "BOTH",
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="myscheme_url",
            field_type=FieldType.URL,
            required=False,
            variants=[
                "myscheme_url", "MyScheme URL", "portal_url",
                "myscheme_portal"
            ],
            default_value=None,
        ))


class JSONAPIConfig(FieldMappingConfig):
    """
    Field mapping configuration for JSON API format.
    
    Handles JSON responses from government APIs with nested structures.
    """
    
    def __init__(self):
        super().__init__(
            format_name=SourceFormat.JSON_API.value,
            description="JSON API format from government portals with structured data"
        )
        self._initialize_mappings()
    
    def _initialize_mappings(self):
        """Initialize mappings for JSON API format."""
        
        # Required fields
        self.add_mapping(FieldMapping(
            scheme_field="name",
            field_type=FieldType.STRING,
            required=True,
            variants=[
                "scheme_name", "schemeName", "name", "title",
                "data.name", "data.scheme_name"
            ],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="description",
            field_type=FieldType.TEXT,
            required=True,
            variants=[
                "description", "scheme_description", "overview",
                "data.description", "data.overview"
            ],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="govt_level",
            field_type=FieldType.ENUM,
            required=True,
            variants=[
                "government_level", "governmentLevel", "level",
                "data.level", "data.government_level"
            ],
            enum_values=["CENTRAL", "STATE", "LOCAL"],
            default_value="CENTRAL",
            transformer=lambda x: str(x).upper().replace("UNION", "CENTRAL") if x else "CENTRAL",
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="ministry",
            field_type=FieldType.STRING,
            required=True,
            variants=[
                "ministry", "department", "administering_ministry",
                "data.ministry"
            ],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="official_url",
            field_type=FieldType.URL,
            required=True,
            variants=[
                "official_url", "officialUrl", "url", "website",
                "data.url", "data.official_url"
            ],
        ))
        
        # Optional fields
        self.add_mapping(FieldMapping(
            scheme_field="state",
            field_type=FieldType.STRING,
            required=False,
            variants=["state", "state_name", "applicable_states"],
            default_value=None,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="tags",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["tags", "keywords", "categories"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="eligibility",
            field_type=FieldType.JSON_OBJECT,
            required=False,
            variants=["eligibility", "eligibility_criteria"],
            default_value={},
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="exclusions",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["exclusions", "exclusion_criteria"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="benefits",
            field_type=FieldType.JSON_OBJECT,
            required=False,
            variants=["benefits", "benefits_offered"],
            default_value={},
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="application_process",
            field_type=FieldType.TEXT,
            required=False,
            variants=["application_process", "how_to_apply"],
            default_value=None,
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="documents",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["documents", "required_documents"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="faqs",
            field_type=FieldType.JSON_ARRAY,
            required=False,
            variants=["faqs", "faq"],
            default_value=[],
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="application_mode",
            field_type=FieldType.ENUM,
            required=False,
            variants=["application_mode", "mode"],
            enum_values=["ONLINE", "OFFLINE", "BOTH"],
            default_value="BOTH",
            transformer=lambda x: str(x).upper() if x else "BOTH",
        ))
        
        self.add_mapping(FieldMapping(
            scheme_field="myscheme_url",
            field_type=FieldType.URL,
            required=False,
            variants=["myscheme_url", "myscheme_portal_url"],
            default_value=None,
        ))


# Slug Generation Helper
def generate_slug(text: str) -> str:
    """
    Generate URL-friendly slug from text.
    
    Converts text to lowercase, replaces spaces and special characters with hyphens,
    and removes leading/trailing hyphens.
    
    Args:
        text: Text to convert to slug
        
    Returns:
        URL-friendly slug
        
    Example:
        >>> generate_slug("Prime Minister Scheme")
        "prime-minister-scheme"
    """
    if not text:
        return ""
    
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    
    # Replace multiple consecutive hyphens with single hyphen
    slug = re.sub(r'-+', '-', slug)
    
    # Remove special characters except hyphens
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    # Ensure maximum length of 255 chars (database constraint)
    slug = slug[:255]
    
    return slug


# Category ID Lookup Helper
class CategoryMatcher:
    """
    Helper class for matching scheme categories to category IDs.
    
    Provides fuzzy matching for category names from government datasets
    against the platform's defined SchemeCategory list.
    """
    
    # Standard category mappings
    CATEGORY_KEYWORDS = {
        "education": ["education", "scholarship", "student", "skill", "training", "upskill"],
        "healthcare": ["health", "medical", "disease", "treatment", "wellness", "insurance"],
        "agriculture": ["agriculture", "farmer", "crop", "land", "farm", "rural", "soil"],
        "employment": ["employment", "job", "career", "work", "apprentice", "wage"],
        "housing": ["housing", "home", "shelter", "building", "rent", "construction"],
        "women_and_child_welfare": ["women", "child", "girl", "maternity", "family"],
        "social_welfare": ["social", "welfare", "disability", "senior", "pension", "elderly"],
        "entrepreneurship": ["business", "startup", "entrepreneur", "self-employed", "loan"],
        "senior_citizen": ["senior", "elderly", "pension", "old age"],
        "other": []
    }
    
    @staticmethod
    def match_category(text: str) -> str:
        """
        Match text to a category name.
        
        Performs fuzzy keyword matching against category keywords.
        
        Args:
            text: Text to match to category (usually from scheme data)
            
        Returns:
            Matched category name, or "Other" if no match found
        """
        if not text:
            return "Other"
        
        text_lower = text.lower()
        
        # Check each category's keywords
        for category, keywords in CategoryMatcher.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return category.replace("_", " ").title()
        
        return "Other"
    
    @staticmethod
    def get_all_categories() -> List[str]:
        """Get list of all available categories."""
        return list(CategoryMatcher.CATEGORY_KEYWORDS.keys())


# Mapping Configuration Registry
class MappingRegistry:
    """
    Registry for managing different field mapping configurations.
    
    Provides centralized access to available mapping configs and factory methods.
    """
    
    _configs = {
        SourceFormat.MYSCHEME_CSV.value: MySchemeCSVConfig(),
        SourceFormat.GENERIC_CSV.value: GenericCSVConfig(),
        SourceFormat.JSON_API.value: JSONAPIConfig(),
    }
    
    @classmethod
    def get_config(cls, format_name: str) -> Optional[FieldMappingConfig]:
        """
        Get mapping configuration for a source format.
        
        Args:
            format_name: Source format name (from SourceFormat enum)
            
        Returns:
            FieldMappingConfig instance, or None if not found
        """
        return cls._configs.get(format_name)
    
    @classmethod
    def register_config(cls, config: FieldMappingConfig) -> None:
        """
        Register a custom mapping configuration.
        
        Args:
            config: FieldMappingConfig instance to register
        """
        cls._configs[config.format_name] = config
    
    @classmethod
    def list_available_formats(cls) -> List[str]:
        """
        List all available source formats.
        
        Returns:
            List of source format names
        """
        return list(cls._configs.keys())
    
    @classmethod
    def create_custom_config(
        cls,
        format_name: str,
        description: str,
        mappings: Dict[str, tuple]
    ) -> FieldMappingConfig:
        """
        Create a custom field mapping configuration.
        
        Args:
            format_name: Name of the custom format
            description: Description of the format
            mappings: Dictionary of field mappings as tuples
                     (scheme_field, variants_list, required, default_value)
            
        Returns:
            Configured FieldMappingConfig instance
        """
        config = FieldMappingConfig(format_name, description)
        
        for scheme_field, (variants, required, default_value, field_type) in mappings.items():
            config.add_mapping(FieldMapping(
                scheme_field=scheme_field,
                field_type=field_type or FieldType.STRING,
                required=required,
                variants=variants,
                default_value=default_value,
            ))
        
        return config


# Convenience functions for quick access
def get_myscheme_config() -> FieldMappingConfig:
    """Get MyScheme CSV format configuration."""
    return MappingRegistry.get_config(SourceFormat.MYSCHEME_CSV.value)


def get_generic_csv_config() -> FieldMappingConfig:
    """Get Generic CSV format configuration."""
    return MappingRegistry.get_config(SourceFormat.GENERIC_CSV.value)


def get_json_api_config() -> FieldMappingConfig:
    """Get JSON API format configuration."""
    return MappingRegistry.get_config(SourceFormat.JSON_API.value)
