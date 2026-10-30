import os
from dotenv import load_dotenv
import pandas as pd
import psycopg2

load_dotenv()

db_url = os.getenv('DATABASE_URL')
excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'

print("Reading Excel with detailed data...")
df = pd.read_excel(excel_file)

print(f"Found {len(df)} schemes\n")

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# First, delete all existing schemes
cursor.execute('DELETE FROM scheme')
conn.commit()
print("Cleared existing schemes")

# Get category
cursor.execute('SELECT id FROM scheme_category WHERE name=%s', ('financial',))
result = cursor.fetchone()
if result:
    cat_id = result[0]
else:
    cursor.execute('INSERT INTO scheme_category (name, description) VALUES (%s, %s) RETURNING id', ('financial', 'Financial Assistance'))
    cat_id = cursor.fetchone()[0]
    conn.commit()

print(f"Using category ID: {cat_id}\n")
print("Importing schemes with complete data...\n")

imported = 0

for idx, row in df.iterrows():
    try:
        # Get data from Excel columns
        name = str(row.get('Scheme Name', row.iloc[1])).strip() if len(row) > 1 else ''
        description = str(row.get('Scheme Name', '')).strip()
        benefits = str(row.get('Benefits (Dataset)', '')).strip()
        app_process = str(row.get('Application Process (Dataset)', '')).strip()
        eligibility = str(row.get('Eligibility (Dataset)', '')).strip()
        
        if len(name) < 2:
            continue
        
        # Insert scheme
        cursor.execute(
            '''INSERT INTO scheme (name, description, category_id, govt_level, is_active, benefits, application_process, eligibility_rules)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
            (
                name,
                description[:500],
                cat_id,
                'central',
                True,
                benefits[:1000] if benefits else description[:1000],
                app_process[:500] if app_process else description[:500],
                eligibility[:500] if eligibility else '{}'
            )
        )
        
        imported += 1
        
        if imported % 20 == 0:
            conn.commit()
            print(f'  {imported} schemes imported...')
    
    except Exception as e:
        print(f'  Error on row {idx}: {str(e)[:50]}')
        continue

conn.commit()

# Verify
cursor.execute('SELECT COUNT(*) FROM scheme')
total = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM scheme WHERE benefits IS NOT NULL AND benefits != %s', ('',))
benefits_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM scheme WHERE application_process IS NOT NULL AND application_process != %s', ('',))
app_count = cursor.fetchone()[0]

print(f'\nImport Complete!')
print(f'  Total schemes: {total}')
print(f'  With benefits: {benefits_count}')
print(f'  With application_process: {app_count}')

# Show sample
cursor.execute('''
    SELECT name, benefits, application_process
    FROM scheme
    WHERE benefits IS NOT NULL AND benefits != %s
    LIMIT 1
''', ('',))

row = cursor.fetchone()
if row:
    print(f'\nSample scheme:')
    print(f'  Name: {row[0]}')
    print(f'  Benefits: {row[1][:80]}...')
    print(f'  Application Process: {row[2][:80]}...')

cursor.close()
conn.close()
