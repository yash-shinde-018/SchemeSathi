#!/usr/bin/env python3
import os
import sys

try:
    print("\n1. Loading environment...")
    from dotenv import load_dotenv
    load_dotenv()
    db_url = os.getenv('DATABASE_URL')
    print("   ✓ Config loaded")
    
    print("\n2. Installing pandas...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "pandas", "openpyxl", "psycopg2-binary"], check=False)
    print("   ✓ Packages ready")
    
    print("\n3. Connecting to database...")
    import psycopg2
    conn = psycopg2.connect(db_url, connect_timeout=5)
    print("   ✓ Database connected")
    
    print("\n4. Reading Excel file...")
    import pandas as pd
    df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')
    print(f"   ✓ Found {len(df)} rows")
    
    print("\n5. Setting up categories...")
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM scheme_category WHERE name='financial'")
    cat_id = cursor.fetchone()[0]
    print("   ✓ Category ready")
    
    print("\n6. Importing schemes...")
    imported = 0
    for idx, row in df.iterrows():
        name = str(row.iloc[0]).strip() if len(row) > 0 else ''
        if len(name) < 2:
            continue
        
        cursor.execute("SELECT 1 FROM scheme WHERE name=%s LIMIT 1", (name,))
        if cursor.fetchone():
            continue
        
        desc = str(row.iloc[1]).strip() if len(row) > 1 else name
        cursor.execute(
            "INSERT INTO scheme (name,description,category_id,govt_level,is_active,eligibility_rules,benefits,application_process,documents_required) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (name, desc[:500], cat_id, 'central', True, '{}', desc[:1000], '', '[]')
        )
        imported += 1
        if imported % 25 == 0:
            conn.commit()
            print(f"   • {imported} imported...")
    
    conn.commit()
    
    cursor.execute("SELECT COUNT(*) FROM scheme")
    total = cursor.fetchone()[0]
    
    print(f"\n✅ SUCCESS!\n   ✓ Imported {imported} new schemes")
    print(f"   ✓ Total in database: {total} schemes\n")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)
