#!/usr/bin/env python3
"""
Import 100 government schemes from Excel to Neon PostgreSQL
"""

import os
import sys

# Ensure pandas is installed
try:
    import pandas as pd
except ImportError:
    print("Installing pandas...")
    os.system(f"{sys.executable} -m pip install pandas openpyxl -q")
    import pandas as pd

from app import create_app
from app.database import db
from app.models import Scheme, SchemeCategory
from datetime import datetime

def import_schemes():
    """Import schemes from Excel file"""
    
    excel_file = r"e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx"
    
    print("\n" + "="*60)
    print("🚀 SCHEME DATA IMPORTER")
    print("="*60 + "\n")
    
    if not os.path.exists(excel_file):
        print(f"❌ File not found: {excel_file}")
        return False
    
    print(f"📊 Reading: {os.path.basename(excel_file)}")
    
    try:
        # Read Excel
        df = pd.read_excel(excel_file)
        print(f"✓ Found {len(df)} rows\n")
        
        # Initialize Flask app
        app = create_app('development')
        
        with app.app_context():
            # Ensure categories exist
            print("Setting up categories...")
            category_names = ['agriculture', 'education', 'health', 'employment', 'housing', 'financial']
            categories = {}
            
            for cat_name in category_names:
                cat = SchemeCategory.query.filter_by(name=cat_name).first()
                if not cat:
                    cat = SchemeCategory(name=cat_name, description=f"{cat_name.title()} Schemes")
                    db.session.add(cat)
                categories[cat_name] = cat
            
            db.session.commit()
            print("✓ Categories ready\n")
            
            # Import schemes
            print("Importing schemes...")
            print("-" * 60)
            
            imported = 0
            skipped = 0
            
            for idx, row in df.iterrows():
                try:
                    # Get column names (flexible)
                    columns = {col.lower().strip(): col for col in df.columns}
                    
                    name = str(row.get(columns.get('name') or columns.get('scheme name') or df.columns[0], '')).strip()
                    description = str(row.get(columns.get('description') or columns.get('details') or df.columns[1], '')).strip()
                    category = str(row.get(columns.get('category') or columns.get('type') or df.columns[2], 'financial')).strip().lower()
                    govt_level = str(row.get(columns.get('govt_level') or columns.get('level') or df.columns[3], 'central')).strip().lower()
                    
                    # Validate
                    if not name or len(name) < 3:
                        skipped += 1
                        continue
                    
                    # Check if exists
                    if Scheme.query.filter_by(name=name).first():
                        skipped += 1
                        continue
                    
                    # Map category
                    if category not in categories:
                        category = 'financial'
                    
                    # Map level
                    if govt_level not in ['central', 'state', 'local']:
                        govt_level = 'central'
                    
                    # Create scheme
                    scheme = Scheme(
                        name=name,
                        description=description[:500],
                        category_id=categories[category].id,
                        govt_level=govt_level,
                        is_active=True,
                        benefits=description[:1000],
                        eligibility_rules={},
                        application_process='',
                        documents_required=[]
                    )
                    
                    db.session.add(scheme)
                    imported += 1
                    
                    if imported % 10 == 0:
                        print(f"  ✓ {imported} schemes imported...")
                    
                except Exception as e:
                    skipped += 1
                    continue
            
            db.session.commit()
            
            print("-" * 60)
            print(f"\n✅ IMPORT COMPLETE!\n")
            print(f"  ✓ Imported: {imported} schemes")
            print(f"  ⚠ Skipped: {skipped} rows")
            print(f"  📊 Total in database: {Scheme.query.count()} schemes\n")
            
            return True
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}\n")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = import_schemes()
    sys.exit(0 if success else 1)
