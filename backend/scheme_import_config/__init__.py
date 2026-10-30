"""
Configuration module for SchemeSathi scheme data import.

Provides:
- Field mapping configurations for data import
- Source format definitions
- Mapping registry and utilities
- Data validation for import records
"""

from .field_mappings import (
    SourceFormat,
    FieldType,
    FieldMapping,
    FieldMappingConfig,
    MySchemeCSVConfig,
    GenericCSVConfig,
    JSONAPIConfig,
    MappingRegistry,
    CategoryMatcher,
    generate_slug,
    get_myscheme_config,
    get_generic_csv_config,
    get_json_api_config,
)

from .validators import (
    ValidationResult,
    ValidationError,
    ValidationErrorType,
    SchemeValidator,
    URLValidator,
    CategoryValidator,
)

__all__ = [
    # Field Mapping
    "SourceFormat",
    "FieldType",
    "FieldMapping",
    "FieldMappingConfig",
    "MySchemeCSVConfig",
    "GenericCSVConfig",
    "JSONAPIConfig",
    "MappingRegistry",
    "CategoryMatcher",
    "generate_slug",
    "get_myscheme_config",
    "get_generic_csv_config",
    "get_json_api_config",
    # Validators
    "ValidationResult",
    "ValidationError",
    "ValidationErrorType",
    "SchemeValidator",
    "URLValidator",
    "CategoryValidator",
]
