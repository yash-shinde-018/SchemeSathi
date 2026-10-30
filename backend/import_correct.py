import os
from dotenv import load_dotenv
import pandas as pd
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')
excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'

df = pd.read_excel(excel_file)

print(f"Found {len(df)} schemes")
print(f"Columns: {list(df.columns)[:5]}...\n")

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Clear existing
cursor.execute('DELETE FROM scheme')
conn.commit()

# Get category
cursor.execute('SELECT id FROM scheme_category WHERE name=%s', ('financial',))
cat_id = cursor.fetchone()[0]

print("Importing schemes...\n")

imported = 0

for idx, row in df.iterrows():
    try:
        # Column names from Excel
        scheme_name = str(row['Scheme Name']).strip()
        benefits = str(row.get('Benefits (Dataset)', '')).strip()
        app_process = str(row.get('Application Process (Dataset)', '')).strip()
        eligibility = str(row.get('Eligibility (Dataset)', '')).strip()
        
        if len(scheme_name) < 2:
            continue
        
        cursor.execute(
            '''INSERT INTO scheme (name, description, category_id, govt_level, is_active, benefits, application_process, eligibility_rules)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
            (scheme_name, scheme_name[:500], cat_id, 'central', True, benefits, app_process, eligibility)
        )
        
        imported += 1
        if imported % 20 == 0:
            conn.commit()
            print(f'  {imported}...')
    
    except Exception as e:
        continue

conn.commit()

cursor.execute('SELECT COUNT(*) FROM scheme WHERE benefits IS NOT NULL AND benefits != %s', ('',))
benefits_count = cursor.fetchone()[0]

print(f'\nSuccess!')
print(f'  Imported: {imported}')
print(f'  With benefits data: {benefits_count}')

cursor.close()
conn.close()
