"""
Simple Excel Scheme Importer for Neon DB
Reads 100 government schemes from Excel and imports to database
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    print("\n" + "="*70)
    print("📊 SCHEME DATA IMPORTER - Neon PostgreSQL")
    print("="*70 + "\n")
    
    # Import dependencies
    try:
        import pandas as pd
        print("✓ pandas available")
    except ImportError:
        print("Installing pandas...")
        os.system(f"{sys.executable} -m pip install pandas openpyxl -q")
        import pandas as pd
        print("✓ pandas installed\n")
    
    # Load Excel file
    excel_file = r"e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx"
    
    print(f"Reading Excel file: {os.path.basename(excel_file)}")
    df = pd.read_excel(excel_file)
    print(f"✓ Found {len(df)} rows")
    print(f"✓ Columns: {list(df.columns)}\n")
    
    # Initialize Flask app
    print("Connecting to database...")
    from app import create_app
    from app.database import db
    from app.models import Scheme, SchemeCategory
    
    app = create_app('development')
    
    with app.app_context():
        print("✓ Database connection established\n")
        
        # Ensure categories exist
        print("Setting up scheme categories...")
        categories = {
            'agriculture': SchemeCategory.query.filter_by(name='agriculture').first(),
            'education': SchemeCategory.query.filter_by(name='education').first(),
            'health': SchemeCategory.query.filter_by(name='health').first(),
            'employment': SchemeCategory.query.filter_by(name='employment').first(),
            'housing': SchemeCategory.query.filter_by(name='housing').first(),
            'financial': SchemeCategory.query.filter_by(name='financial').first(),
        }
        
        # Create missing categories
        for cat_name, cat_obj in categories.items():
            if cat_obj is None:
                cat = SchemeCategory(name=cat_name, description=f"{cat_name.title()} Schemes")
                db.session.add(cat)
                categories[cat_name] = cat
        
        db.session.commit()
        print("✓ Categories ready\n")
        
        # Import schemes
        print("Importing schemes from Excel...")
        print("-" * 70)
        
        imported_count = 0
        skipped_count = 0
        error_count = 0
        
        # Get column mapping (flexible for different Excel formats)
        cols = {col.lower(): col for col in df.columns}
        
        for idx, row in df.iterrows():
            try:
                # Extract data from row (flexible column names)
                name = str(row.get(cols.get('name', df.columns[0]), '')).strip()
                description = str(row.get(cols.get('description', df.columns[1] if len(df.columns) > 1 else ''), '')).strip()
                category_str = str(row.get(cols.get('category', 'financial'), 'financial')).strip().lower()
                govt_level_str = str(row.get(cols.get('govt_level', 'central'), 'central')).strip().lower()
                
                # Skip if invalid
                if not name or len(name) < 2:
                    skipped_count += 1
                    continue
                
                # Check if already exists
                if Scheme.query.filter_by(name=name).first():
                    skipped_count += 1
                    continue
                
                # Validate category
                if category_str not in categories:
                    category_str = 'financial'
                
                # Validate govt_level
                if govt_level_str not in ['central', 'state', 'local']:
                    govt_level_str = 'central'
                
                # Create scheme
                scheme = Scheme(
                    name=name,
                    description=description[:500] if description else name,
                    category_id=categories[category_str].id,
                    govt_level=govt_level_str,
                    is_active=True,
                    eligibility_rules={},
                    benefits=description[:1000] if description else '',
                    application_process='',
                    documents_required=[]
                )
                
                db.session.add(scheme)
                imported_count += 1
                
                if imported_count % 10 == 0:
                    print(f"  ✓ {imported_count} schemes imported...")
                
            except Exception as e:
                error_count += 1
                print(f"  ✗ Row {idx+2}: Error - {str(e)[:50]}")
                continue
        
        # Commit all
        db.session.commit()
        
        print("-" * 70)
        print(f"\n✅ IMPORT COMPLETE!\n")
        print(f"  ✓ Successfully imported: {imported_count} schemes")
        print(f"  ⚠ Skipped (duplicates/invalid): {skipped_count} rows")
        print(f"  ✗ Errors: {error_count} rows")
        print(f"  📊 Total schemes in database: {Scheme.query.count()}\n")
        
        # Show sample
        print("Sample of imported schemes:")
        print("-" * 70)
        samples = Scheme.query.order_by(Scheme.id.desc()).limit(5).all()
        for scheme in samples:
            print(f"  • {scheme.name}")
            print(f"    Category: {scheme.category.name if scheme.category else 'N/A'}")
            print(f"    Level: {scheme.govt_level}\n")

if __name__ == '__main__':
    try:
        main()
        print("✅ All done!\n")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
