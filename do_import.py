import pandas as pd
import psycopg2
from dotenv import load_dotenv
import os
import sys

load_dotenv()

excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'
db_url = os.getenv('DATABASE_URL')

print('\n' + '='*70)
print('📊 IMPORTING 100 GOVERNMENT SCHEMES TO NEON DB')
print('='*70 + '\n')

if not db_url:
    print('ERROR: DATABASE_URL not in .env')
    sys.exit(1)

print(f'Reading: {os.path.basename(excel_file)}')
df = pd.read_excel(excel_file)
print(f'✓ Found {len(df)} rows\n')

print('Connecting to Neon DB...')
conn = psycopg2.connect(db_url)
cursor = conn.cursor()
print('✓ Connected\n')

# Setup category
print('Checking categories...')
cursor.execute('SELECT id FROM scheme_category WHERE name = %s', ('financial',))
cat = cursor.fetchone()
if cat:
    cat_id = cat[0]
else:
    cursor.execute('INSERT INTO scheme_category (name, description) VALUES (%s, %s) RETURNING id', ('financial', 'Financial Schemes'))
    cat_id = cursor.fetchone()[0]
    conn.commit()

print(f'✓ Using category: {cat_id}\n')
print('Importing schemes...')
print('-'*70)

imported = 0
for idx, row in df.iterrows():
    name = str(row.iloc[0]).strip() if len(row) > 0 else ''
    desc = str(row.iloc[1]).strip() if len(row) > 1 else name
    
    if not name or len(name) < 2:
        continue
    
    cursor.execute('SELECT id FROM scheme WHERE name = %s', (name,))
    if cursor.fetchone():
        continue
    
    try:
        cursor.execute(
            'INSERT INTO scheme (name, description, category_id, govt_level, is_active, eligibility_rules, benefits, application_process, documents_required) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',
            (name, desc[:500], cat_id, 'central', True, '{}', desc[:1000], '', '[]')
        )
        imported += 1
        if imported % 10 == 0:
            conn.commit()
            print(f'  ✓ {imported} schemes...')
    except:
        pass

conn.commit()

cursor.execute('SELECT COUNT(*) FROM scheme')
total = cursor.fetchone()[0]

print('-'*70)
print(f'\n✅ IMPORT COMPLETE!\n')
print(f'  ✓ Imported: {imported} schemes')
print(f'  📊 Total in database: {total} schemes\n')

cursor.close()
conn.close()
