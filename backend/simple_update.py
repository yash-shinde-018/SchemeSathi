import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Get first scheme
scheme_name = str(df.iloc[0]['Scheme Name']).strip()
benefits = str(df.iloc[0].get('Benefits (Dataset)', '')).strip()
app_process = str(df.iloc[0].get('Application Process (Dataset)', '')).strip()

print(f"Test update:")
print(f"  Scheme: {scheme_name}")
print(f"  Benefits length: {len(benefits)}")
print(f"  App Process length: {len(app_process)}")

# Check if exists
cursor.execute('SELECT id, benefits, application_process FROM scheme WHERE name = %s', (scheme_name,))
row = cursor.fetchone()

if row:
    print(f"\n  Current benefits: {str(row[1])[:50] if row[1] else 'NULL'}")
    print(f"  Current app_process: {str(row[2])[:50] if row[2] else 'NULL'}")
    
    # Update
    cursor.execute(
        'UPDATE scheme SET benefits = %s, application_process = %s WHERE name = %s',
        (benefits, app_process, scheme_name)
    )
    conn.commit()
    print("\n  Updated successfully!")
    
    # Verify
    cursor.execute('SELECT benefits, application_process FROM scheme WHERE name = %s', (scheme_name,))
    new_row = cursor.fetchone()
    print(f"\n  New benefits: {str(new_row[0])[:50]}")
    print(f"  New app_process: {str(new_row[1])[:50]}")

cursor.close()
conn.close()
