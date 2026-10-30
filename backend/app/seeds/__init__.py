"""
Seeds module for SchemeSathi database initialization.

This module provides dedicated seeding functionality for populating database
with initial data. Organized into separate seeders for each entity type.

Available seeders:
- CategorySeeder: Manages scheme category seeding
"""

from app.seeds.categories import CategorySeeder

__all__ = ['CategorySeeder']
