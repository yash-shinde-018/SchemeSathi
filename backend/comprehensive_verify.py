import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv
import json

load_dotenv()
db_url = os.getenv('DATABASE_URL')

# Read Excel
print("1. Reading Excel file...")
df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')
excel_schemes = set(df['Scheme Name'].str.strip().tolist())
print(f"   Excel schemes: {len(excel_schemes)}\n")

# Connect to DB
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Check database
print("2. Checking database schemes...")
cursor.execute('SELECT name FROM scheme')
db_schemes = set([row[0] for row in cursor.fetchall()])
print(f"   DB schemes: {len(db_schemes)}\n")

# Compare
print("3. Comparing data...")
missing_in_db = excel_schemes - db_schemes
extra_in_db = db_schemes - excel_schemes

print(f"   Schemes in Excel but NOT in DB: {len(missing_in_db)}")
if missing_in_db:
    for scheme in list(missing_in_db)[:3]:
        print(f"     • {scheme}")

print(f"   Schemes in DB but NOT in Excel: {len(extra_in_db)}")
if extra_in_db:
    for scheme in list(extra_in_db)[:3]:
        print(f"     • {scheme}")

print(f"\n   Total matched: {len(excel_schemes & db_schemes)}/100\n")

# Check data completeness
print("4. Checking data completeness...")
cursor.execute('''
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN name IS NOT NULL AND name != '' THEN 1 ELSE 0 END) as names,
        SUM(CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) as descriptions,
        SUM(CASE WHEN benefits IS NOT NULL AND benefits != '' THEN 1 ELSE 0 END) as benefits,
        SUM(CASE WHEN application_process IS NOT NULL AND application_process != '' THEN 1 ELSE 0 END) as processes,
        SUM(CASE WHEN documents_required IS NOT NULL AND documents_required != '' THEN 1 ELSE 0 END) as documents,
        SUM(CASE WHEN eligibility_rules IS NOT NULL AND eligibility_rules != '' THEN 1 ELSE 0 END) as eligibility
    FROM scheme
''')

row = cursor.fetchone()
print(f"   Total schemes: {row[0]}")
print(f"   Names filled: {row[1]}")
print(f"   Descriptions filled: {row[2]}")
print(f"   Benefits filled: {row[3]}")
print(f"   Application process filled: {row[4]}")
print(f"   Documents required filled: {row[5]}")
print(f"   Eligibility rules filled: {row[6]}\n")

# Check documents field
print("5. Checking documents_required field...")
cursor.execute('SELECT COUNT(*) FROM scheme WHERE documents_required IS NOT NULL AND documents_required != %s AND documents_required != %s', ('', '[]'))
docs_with_data = cursor.fetchone()[0]
print(f"   Schemes with documents: {docs_with_data}")

# Show sample with documents
cursor.execute('''
    SELECT name, documents_required 
    FROM scheme 
    WHERE documents_required IS NOT NULL AND documents_required != %s AND documents_required != %s
    LIMIT 1
''', ('', '[]'))

doc_sample = cursor.fetchone()
if doc_sample:
    print(f"\n   Sample scheme: {doc_sample[0]}")
    print(f"   Documents: {doc_sample[1][:100]}...")
else:
    print("\n   No documents data found")

print("\n" + "="*70)

# Summary
if len(excel_schemes & db_schemes) == 100:
    print("✓ SUCCESS! All 100 schemes from Excel are in database!")
else:
    matched = len(excel_schemes & db_schemes)
    print(f"⚠ WARNING: Only {matched}/100 schemes matched")

cursor.close()
conn.close()
