import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')

print(f"Total rows: {len(df)}")
print(f"Total columns: {len(df.columns)}")

# Check first row
print("\nFirst row values:")
for i, col in enumerate(df.columns[:10]):
    val = str(df.iloc[0][col])[:60]
    print(f"  {i}: {col} = {val}")

# Try to insert one row
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

scheme_name = str(df.iloc[0]['Scheme Name']).strip()
benefits = str(df.iloc[0].get('Benefits (Dataset)', '')).strip()

print(f"\nTesting insert:")
print(f"  Name: {scheme_name}")
print(f"  Benefits: {benefits[:50]}")

try:
    cursor.execute('SELECT id FROM scheme_category WHERE name=%s', ('financial',))
    cat_id = cursor.fetchone()[0]
    
    cursor.execute(
        'INSERT INTO scheme (name, description, category_id, govt_level, is_active, benefits, application_process) VALUES (%s,%s,%s,%s,%s,%s,%s)',
        (scheme_name, scheme_name, cat_id, 'central', True, benefits, benefits)
    )
    conn.commit()
    print("  Success!")
    
except Exception as e:
    print(f"  Error: {str(e)}")

cursor.close()
conn.close()
