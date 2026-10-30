import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

# Read Excel
df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')
excel_count = len(df)

# Connect DB
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Count DB schemes
cursor.execute('SELECT COUNT(*) FROM scheme')
db_count = cursor.fetchone()[0]

print("DATA IMPORT VERIFICATION")
print("="*70)
print()
print(f"Excel file schemes: {excel_count}")
print(f"Database schemes: {db_count}")
print()

if excel_count == db_count:
    print("Status: All schemes imported!")
else:
    print(f"Status: {db_count}/{excel_count} schemes")

# Check all fields
print()
print("Field Population Status:")
print("-"*70)

cursor.execute('''
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN benefits IS NOT NULL AND benefits != '' THEN 1 ELSE 0 END) as benefits,
        SUM(CASE WHEN application_process IS NOT NULL AND application_process != '' THEN 1 ELSE 0 END) as process,
        SUM(CASE WHEN documents_required IS NOT NULL AND documents_required != '' THEN 1 ELSE 0 END) as documents,
        SUM(CASE WHEN eligibility_rules IS NOT NULL AND eligibility_rules != '' THEN 1 ELSE 0 END) as eligibility
    FROM scheme
''')

total, benefits, process, documents, eligibility = cursor.fetchone()

print(f"  Schemes with BENEFITS: {benefits}/{total}")
print(f"  Schemes with APPLICATION_PROCESS: {process}/{total}")
print(f"  Schemes with DOCUMENTS_REQUIRED: {documents}/{total}")
print(f"  Schemes with ELIGIBILITY_RULES: {eligibility}/{total}")

# Show documents data
print()
print("Sample with DOCUMENTS:")
print("-"*70)

cursor.execute('SELECT name, documents_required FROM scheme WHERE documents_required IS NOT NULL AND documents_required != %s LIMIT 1', ('',))
row = cursor.fetchone()

if row:
    print(f"Scheme: {row[0]}")
    print(f"Documents: {row[1][:100]}")
else:
    print("No documents found - need to import from Excel")

cursor.close()
conn.close()
