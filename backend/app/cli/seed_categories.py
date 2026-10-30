"""
Category seeding CLI commands for SchemeSathi.

This module provides Flask CLI commands for managing scheme categories:
- flask db seed-categories: Seed all 10 standard categories
- flask db seed-categories --clear: Clear all categories first
- flask db seed-categories --list: List all categories to be seeded
- flask db seed-categories CATEGORY_NAME: Seed a specific category

All commands are registered under the 'db' command group.

Example usage:
    flask db seed-categories              # Seed all 10 categories
    flask db seed-categories --list       # Show categories to be seeded
    flask db seed-categories --clear      # Clear existing, then seed
    flask db seed-categories Education   # Seed Education category only
"""

import click
from flask import current_app
from flask.cli import with_appcontext
from app.seeds.categories import CategorySeeder, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS


@click.command('seed-categories')
@click.argument('category_name', required=False)
@click.option('--clear', is_flag=True, help='Clear all categories before seeding')
@click.option('--list', 'list_categories', is_flag=True, help='List all categories to be seeded')
@click.option('--skip-existing', is_flag=True, default=True, help='Skip if category already exists (default: True)')
@with_appcontext
def seed_categories_command(category_name, clear, list_categories, skip_existing):
    """
    Seed scheme categories into the database.
    
    Can seed all 10 standard categories, a specific category by name,
    or list all available categories.
    
    Examples:
        $ flask db seed-categories              # Seed all categories
        $ flask db seed-categories --list       # Show available categories
        $ flask db seed-categories --clear      # Clear and reseed
        $ flask db seed-categories Education   # Seed specific category
    """
    try:
        seeder = CategorySeeder()
        
        # Show list of categories
        if list_categories:
            _show_category_list()
            return
        
        # Clear all categories if requested
        if clear:
            click.echo("\n🗑️  Clearing existing categories...\n")
            try:
                result = seeder.clear_all(confirm=True)
                click.echo(f"✓ {result['message']}\n")
            except Exception as e:
                click.echo(f"✗ Error clearing categories: {str(e)}\n", err=True)
                return
        
        # Seed specific category
        if category_name:
            click.echo(f"\n🌱 Seeding category: {category_name}\n")
            try:
                category = seeder.seed_by_name(category_name)
                if category:
                    click.echo(f"✓ Successfully seeded '{category_name}' category")
                    click.echo(f"  ID: {category.id}")
                    click.echo(f"  Name: {category.name}")
                    click.echo(f"  Icon: {category.icon}")
                    click.echo(f"  Color: {category.color}\n")
                else:
                    click.echo(f"✗ Failed to seed '{category_name}' category\n", err=True)
            except ValueError as e:
                click.echo(f"✗ {str(e)}\n", err=True)
            except Exception as e:
                click.echo(f"✗ Error seeding category: {str(e)}\n", err=True)
            return
        
        # Seed all categories (default)
        click.echo("\n🌱 Seeding all categories...\n")
        result = seeder.seed_all(skip_duplicates=skip_existing)
        
        # Display results
        _show_seed_results(result)
        
    except Exception as e:
        click.echo(f"✗ Error seeding categories: {str(e)}", err=True)
        current_app.logger.error(f"Seed categories failed: {str(e)}", exc_info=True)
        raise click.Abort()


def _show_category_list():
    """Display list of available categories."""
    click.echo("\n📋 Available Categories to Seed:\n")
    
    for i, cat in enumerate(CATEGORIES, 1):
        icon = CATEGORY_ICONS.get(cat['name'], '📋')
        color = CATEGORY_COLORS.get(cat['name'], '#64748B')
        click.echo(f"{i:2}. {icon} {cat['name']:.<35} {color}")
        click.echo(f"    {cat['description']}\n")
    
    click.echo(f"Total: {len(CATEGORIES)} categories\n")


def _show_seed_results(result: dict):
    """Display seeding results in formatted table."""
    click.echo("=" * 60)
    click.echo("  Category Seeding Results")
    click.echo("=" * 60)
    click.echo(f"  Created:  {result['created']:.<45} {result['created']}")
    click.echo(f"  Skipped:  {result['skipped']:.<45} {result['skipped']}")
    click.echo(f"  Failed:   {result['failed']:.<45} {result['failed']}")
    click.echo("=" * 60)
    
    if result['categories']:
        click.echo(f"\n✓ Categories created:")
        for cat_name in result['categories']:
            icon = CATEGORY_ICONS.get(cat_name, '📋')
            click.echo(f"  {icon} {cat_name}")
    
    if result['errors']:
        click.echo(f"\n✗ Errors encountered:")
        for error in result['errors']:
            click.echo(f"  • {error}")
    
    click.echo()
