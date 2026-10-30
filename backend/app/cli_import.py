"""
Flask CLI commands for SchemeSathi
"""
import click
from flask.cli import with_appcontext
from app.database import db
from app.models import Scheme, SchemeCategory

@click.command('import-schemes')
@click.option('--file', default=r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx', help='Excel file path')
@with_appcontext
def import_schemes_cli(file):
    """Import schemes from Excel file"""
    
    try:
        import pandas as pd
    except ImportError:
        click.echo("Installing pandas...")
        import subprocess
        import sys
        subprocess.run([sys.executable, "-m", "pip", "install", "pandas", "openpyxl", "-q"])
        import pandas as pd
    
    click.echo("\n🚀 Importing schemes from Excel...\n")
    
    # Read Excel
    click.echo(f"Reading: {file}")
    df = pd.read_excel(file)
    click.echo(f"✓ Found {len(df)} rows")
    
    # Ensure categories
    click.echo("Setting up categories...")
    for cat_name in ['agriculture', 'education', 'health', 'employment', 'housing', 'financial']:
        if not SchemeCategory.query.filter_by(name=cat_name).first():
            db.session.add(SchemeCategory(name=cat_name, description=f"{cat_name.title()} Schemes"))
    db.session.commit()
    click.echo("✓ Categories ready\n")
    
    # Import
    imported = 0
    for idx, row in df.iterrows():
        try:
            name = str(row.iloc[0]).strip() if len(row) > 0 else None
            if not name or len(name) < 2:
                continue
            
            if Scheme.query.filter_by(name=name).first():
                continue
            
            scheme = Scheme(
                name=name,
                description=str(row.iloc[1])[:500] if len(row) > 1 else name,
                category_id=SchemeCategory.query.filter_by(name='financial').first().id,
                govt_level='central',
                is_active=True,
                eligibility_rules={},
                benefits='',
                application_process='',
                documents_required=[]
            )
            db.session.add(scheme)
            imported += 1
            
            if imported % 10 == 0:
                click.echo(f"  ✓ {imported} schemes...", nl=False)
                click.echo("\r" + " "*30, nl=False)
                click.echo(f"  ✓ {imported} schemes...")
        except:
            pass
    
    db.session.commit()
    
    click.echo(f"\n✅ Import Complete!")
    click.echo(f"  ✓ Imported: {imported} schemes")
    click.echo(f"  📊 Total: {Scheme.query.count()} schemes\n")

def register_cli(app):
    """Register CLI commands"""
    app.cli.add_command(import_schemes_cli)
