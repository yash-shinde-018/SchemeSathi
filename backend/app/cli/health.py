"""
Flask CLI commands for database health checking and monitoring.

Provides command-line tools for checking database health and viewing
performance statistics during development and operations.

Available commands:
  - flask health check    - Check database health
  - flask health status   - Show detailed status
  - flask health pool     - Show connection pool info
"""

import click
from flask.cli import with_appcontext
from datetime import datetime
from tabulate import tabulate

from app.utils.db_health import (
    test_connection,
    test_query,
    test_transaction,
    get_connection_stats,
    health_check as comprehensive_health_check,
    database_info
)
from app.utils.db_monitoring import (
    get_query_statistics,
    get_slow_queries,
    get_monitoring_report
)


# ========== Health Check Commands ==========

@click.group(name='health')
def health_cli():
    """Database and application health checking commands."""
    pass


@health_cli.command(name='check')
@with_appcontext
def health_check_command():
    """
    Check database health status.
    
    Performs a comprehensive health check including:
    - Basic connectivity test
    - Query execution test
    - Transaction handling test
    - Connection pool status
    
    Usage:
        flask health check
    """
    click.echo("🔍 Performing database health check...\n")
    
    try:
        health_result = comprehensive_health_check()
        
        # Determine status color
        status_color = {
            'healthy': 'green',
            'degraded': 'yellow',
            'unhealthy': 'red'
        }.get(health_result['status'], 'white')
        
        status_emoji = {
            'healthy': '✓',
            'degraded': '⚠',
            'unhealthy': '✗'
        }.get(health_result['status'], '?')
        
        click.secho(
            f"\n{status_emoji} Overall Status: {health_result['status'].upper()}",
            fg=status_color,
            bold=True
        )
        
        click.echo(f"Timestamp: {health_result['timestamp']}")
        click.echo(f"Total Duration: {health_result['overall_duration_ms']}ms\n")
        
        # Display individual check results
        click.echo("=== Check Results ===\n")
        
        checks = health_result['checks']
        
        # Connectivity check
        conn_check = checks['connectivity']
        _display_check_result("Connectivity", conn_check)
        
        # Query execution check
        query_check = checks['query_execution']
        _display_check_result("Query Execution", query_check)
        if query_check['success']:
            click.echo(f"  → Tables: {query_check.get('table_count', 'N/A')}")
        
        # Transaction handling check
        trans_check = checks['transaction_handling']
        _display_check_result("Transaction Handling", trans_check)
        
        # Connection pool
        click.echo("\n=== Connection Pool ===\n")
        pool = checks['connection_pool']
        _display_pool_status(pool)
        
        click.echo()
        
    except Exception as e:
        click.secho(f"✗ Health check failed: {str(e)}", fg='red', bold=True)
        raise click.Abort()


@health_cli.command(name='status')
@with_appcontext
def status_command():
    """
    Show detailed database status and statistics.
    
    Displays:
    - Complete health check results
    - Database information
    - Connection pool details
    - Query statistics
    - Recently slow queries
    
    Usage:
        flask health status
    """
    click.echo("📊 Generating detailed health status...\n")
    
    try:
        # Get comprehensive health check
        health_result = comprehensive_health_check()
        
        # Display health status
        status_color = 'green' if health_result['status'] == 'healthy' else 'yellow'
        click.secho(
            f"Overall Status: {health_result['status'].upper()}",
            fg=status_color,
            bold=True
        )
        click.echo(f"Timestamp: {health_result['timestamp']}\n")
        
        # Display database info
        click.secho("=== Database Information ===\n", bold=True)
        db_info = database_info()
        
        if db_info.get('success'):
            click.echo(f"Database Type: {db_info.get('database_type', 'N/A')}")
            click.echo(f"Database URL: {db_info.get('database_url', 'N/A')}")
            click.echo(f"Total Tables: {db_info.get('table_count', 0)}")
            
            if db_info.get('tables'):
                click.echo("\nTables:")
                table_data = [
                    [t['name'], t['column_count']]
                    for t in db_info['tables']
                ]
                click.echo(tabulate(
                    table_data,
                    headers=['Table', 'Columns'],
                    tablefmt='simple'
                ))
        
        click.echo()
        
        # Display connection pool status
        click.secho("=== Connection Pool ===\n", bold=True)
        pool_stats = get_connection_stats()
        _display_pool_status(pool_stats)
        
        click.echo()
        
        # Display query statistics
        click.secho("=== Query Statistics ===\n", bold=True)
        query_stats = get_query_statistics()
        
        click.echo(f"Total Queries: {query_stats.get('total_queries', 0)}")
        click.echo(f"Slow Queries: {query_stats.get('slow_queries', 0)}")
        click.echo(f"Avg Duration: {query_stats.get('avg_duration_ms', 0):.2f}ms")
        click.echo(f"Max Duration: {query_stats.get('max_duration_ms', 0):.2f}ms")
        click.echo(f"Min Duration: {query_stats.get('min_duration_ms', 0):.2f}ms")
        
        click.echo()
        
        # Display slow queries if any
        slow_queries = get_slow_queries(limit=5)
        if slow_queries:
            click.secho("=== Recent Slow Queries ===\n", bold=True)
            
            for i, query in enumerate(slow_queries, 1):
                click.echo(f"{i}. {query['formatted_duration']} - {query['timestamp']}")
                click.echo(f"   {query['query'][:70]}...")
                click.echo()
        
        click.echo()
        
    except Exception as e:
        click.secho(f"✗ Status command failed: {str(e)}", fg='red', bold=True)
        raise click.Abort()


@health_cli.command(name='pool')
@with_appcontext
def pool_command():
    """
    Show connection pool information.
    
    Displays detailed connection pool statistics and status.
    
    Usage:
        flask health pool
    """
    click.echo("🔌 Connection Pool Status\n")
    
    try:
        pool_stats = get_connection_stats()
        _display_pool_status(pool_stats)
        
        click.echo()
        
    except Exception as e:
        click.secho(f"✗ Failed to get pool status: {str(e)}", fg='red', bold=True)
        raise click.Abort()


# ========== Individual Test Commands ==========

@health_cli.command(name='test-connection')
@with_appcontext
def test_connection_command():
    """
    Test basic database connectivity.
    
    Performs a simple SELECT 1 query to verify connectivity.
    
    Usage:
        flask health test-connection
    """
    click.echo("Testing basic database connectivity...\n")
    
    try:
        result = test_connection()
        
        if result['success']:
            click.secho(f"✓ Connection successful", fg='green', bold=True)
            click.echo(f"Duration: {result['duration_ms']}ms")
        else:
            click.secho(f"✗ Connection failed", fg='red', bold=True)
            click.echo(f"Error: {result['error']}")
        
        click.echo()
        
    except Exception as e:
        click.secho(f"✗ Test failed: {str(e)}", fg='red', bold=True)
        raise click.Abort()


@health_cli.command(name='test-query')
@with_appcontext
def test_query_command():
    """
    Test query execution.
    
    Executes a query to retrieve table information.
    
    Usage:
        flask health test-query
    """
    click.echo("Testing query execution...\n")
    
    try:
        result = test_query()
        
        if result['success']:
            click.secho(f"✓ Query successful", fg='green', bold=True)
            click.echo(f"Tables found: {result.get('table_count', 'N/A')}")
            click.echo(f"Duration: {result['duration_ms']}ms")
        else:
            click.secho(f"✗ Query failed", fg='red', bold=True)
            click.echo(f"Error: {result['error']}")
        
        click.echo()
        
    except Exception as e:
        click.secho(f"✗ Test failed: {str(e)}", fg='red', bold=True)
        raise click.Abort()


@health_cli.command(name='test-transaction')
@with_appcontext
def test_transaction_command():
    """
    Test transaction handling.
    
    Tests transaction creation, execution, and rollback.
    
    Usage:
        flask health test-transaction
    """
    click.echo("Testing transaction handling...\n")
    
    try:
        result = test_transaction()
        
        if result['success']:
            click.secho(f"✓ Transaction test successful", fg='green', bold=True)
            click.echo(f"Rollback tested: {result.get('rollback_tested', False)}")
            click.echo(f"Duration: {result['duration_ms']}ms")
        else:
            click.secho(f"✗ Transaction test failed", fg='red', bold=True)
            click.echo(f"Error: {result['error']}")
        
        click.echo()
        
    except Exception as e:
        click.secho(f"✗ Test failed: {str(e)}", fg='red', bold=True)
        raise click.Abort()


# ========== Helper Functions ==========

def _display_check_result(check_name: str, check_result: dict):
    """
    Display a formatted check result.
    
    Args:
        check_name (str): Name of the check
        check_result (dict): Check result dictionary
    """
    success = check_result.get('success', False)
    color = 'green' if success else 'red'
    emoji = '✓' if success else '✗'
    
    click.echo(f"{emoji} {check_name}: ", nl=False)
    click.secho(
        "PASS" if success else "FAIL",
        fg=color,
        bold=True
    )
    
    duration = check_result.get('duration_ms', 0)
    click.echo(f"  Duration: {duration}ms")
    
    if not success and check_result.get('error'):
        click.echo(f"  Error: {check_result['error']}")


def _display_pool_status(pool_stats: dict):
    """
    Display connection pool status in a formatted table.
    
    Args:
        pool_stats (dict): Pool statistics dictionary
    """
    pool_type = pool_stats.get('pool_type', 'Unknown')
    click.echo(f"Pool Type: {pool_type}\n")
    
    # Create table data
    table_data = []
    
    pool_size = pool_stats.get('pool_size')
    if pool_size is not None:
        table_data.append(['Pool Size', pool_size])
    
    checked_out = pool_stats.get('checked_out')
    if checked_out is not None:
        table_data.append(['Checked Out', checked_out])
    
    overflow = pool_stats.get('overflow')
    if overflow is not None:
        table_data.append(['Overflow', overflow])
    
    available = pool_stats.get('available')
    if available is not None:
        table_data.append(['Available', available])
    
    if table_data:
        click.echo(tabulate(table_data, tablefmt='simple'))
    else:
        click.echo("(Pool statistics not available for this pool type)")


def register_health_cli(app):
    """
    Register health CLI commands with Flask app.
    
    Args:
        app: Flask application instance
    """
    app.cli.add_command(health_cli)
