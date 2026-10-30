"""
Import scheme data from Excel file to Neon PostgreSQL database
Usage: python import_schemes.py schemes.xlsx
"""

import sys
import pandas as pd
from app import create_app
from app.database import db
from app.models import Scheme, SchemeCategory

def import_schemes_from_excel(excel_file):
    """Import schemes from Excel file to database"""
    
    print(f"\n📊 Reading Excel file: {excel_file}")
    
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        print(f"✓ Found {len(df)} rows")
        print(f"✓ Columns: {', '.join(df.columns.tolist())}")
        print("")
        
        # Initialize Flask app and database
        app = create_app('development')
        
        with app.app_context():
            # Get or create categories
            print("Setting up scheme categories...")
            categories = {
                'agriculture': SchemeCategory.query.filter_by(name='agriculture').first() or 
                              SchemeCategory(name='agriculture', description='Agricultural Schemes'),
                'education': SchemeCategory.query.filter_by(name='education').first() or 
                            SchemeCategory(name='education', description='Education Schemes'),
                'health': SchemeCategory.query.filter_by(name='health').first() or 
                         SchemeCategory(name='health', description='Health Schemes'),
                'employment': SchemeCategory.query.filter_by(name='employment').first() or 
                             SchemeCategory(name='employment', description='Employment Schemes'),
                'housing': SchemeCategory.query.filter_by(name='housing').first() or 
                          SchemeCategory(name='housing', description='Housing Schemes'),
                'financial': SchemeCategory.query.filter_by(name='financial').first() or 
                            SchemeCategory(name='financial', description='Financial Assistance'),
            }
            
            # Add new categories to session
            for cat in categories.values():
                if cat.id is None:
                    db.session.add(cat)
            db.session.commit()
            print("✓ Categories ready\n")
            
            # Import schemes
            print("Importing schemes from Excel...")
            imported_count = 0
            skipped_count = 0
            
            for idx, row in df.iterrows():
                try:
                    # Extract data from Excel row
                    name = str(row.get('name', row.get('Scheme Name', ''))).strip()
                    description = str(row.get('description', row.get('Description', ''))).strip()
                    category_name = str(row.get('category', row.get('Category', 'financial'))).strip().lower()
                    govt_level = str(row.get('govt_level', row.get('Government Level', 'central'))).strip().lower()
                    benefits = str(row.get('benefits', row.get('Benefits', ''))).strip()
                    eligibility = str(row.get('eligibility', row.get('Eligibility', ''))).strip()
                    
                    # Validate required fields
                    if not name or len(name) < 3:
                        print(f"  ⚠ Row {idx+2}: Skipped (invalid name)")
                        skipped_count += 1
                        continue
                    
                    # Check if scheme already exists
                    existing = Scheme.query.filter_by(name=name).first()
                    if existing:
                        print(f"  ℹ Row {idx+2}: Already exists ({name})")
                        skipped_count += 1
                        continue
                    
                    # Get category
                    category = categories.get(category_name, categories['financial'])
                    
                    # Create scheme
                    scheme = Scheme(
                        name=name,
                        description=description[:500] if description else '',
                        category_id=category.id,
                        govt_level=govt_level if govt_level in ['central', 'state', 'local'] else 'central',
                        is_active=True,
                        benefits=benefits[:1000] if benefits else '',
                        eligibility_rules={},
                        application_process=eligibility[:1000] if eligibility else ''
                    )
                    
                    db.session.add(scheme)
                    imported_count += 1
                    
                    if imported_count % 10 == 0:
                        print(f"  ✓ Imported {imported_count} schemes...")
                    
                except Exception as e:
                    print(f"  ✗ Row {idx+2}: Error - {str(e)[:50]}")
                    skipped_count += 1
                    continue
            
            # Commit all schemes
            db.session.commit()
            
            print(f"\n✅ Import Complete!")
            print(f"  ✓ Imported: {imported_count} schemes")
            print(f"  ⚠ Skipped: {skipped_count} rows")
            print(f"  📊 Total in database: {Scheme.query.count()} schemes")
            
    except FileNotFoundError:
        print(f"❌ File not found: {excel_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("\n📊 Scheme Data Importer")
        print("Usage: python import_schemes.py <excel_file>")
        print("\nExample: python import_schemes.py schemes.xlsx")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    import_schemes_from_excel(excel_file)
