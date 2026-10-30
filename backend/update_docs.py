import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

# Read Excel
df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Updating documents_required field...\n")

updated = 0

for idx, row in df.iterrows():
    try:
        scheme_name = str(row['Scheme Name']).strip()
        documents = str(row.get('Documents (Dataset)', '')).strip()
        
        if documents and len(documents) > 0:
            cursor.execute(
                'UPDATE scheme SET documents_required = %s WHERE name = %s',
                (documents, scheme_name)
            )
            updated += 1
            
            if updated % 25 == 0:
                conn.commit()
                print(f'  {updated} updated...')
    except:
        pass

conn.commit()

# Verify
cursor.execute('SELECT COUNT(*) FROM scheme WHERE documents_required IS NOT NULL AND documents_required != %s', ('',))
docs_count = cursor.fetchone()[0]

print(f'\nUpdate complete!')
print(f'  Schemes with documents: {docs_count}/100')

# Show samples
print(f'\nSample schemes with documents:')
cursor.execute('''
    SELECT name, documents_required 
    FROM scheme 
    WHERE documents_required IS NOT NULL AND documents_required != %s
    LIMIT 3
''', ('',))

for i, (name, docs) in enumerate(cursor.fetchall(), 1):
    print(f'\n  {i}. {name}')
    print(f'     Documents: {docs[:100]}...')

cursor.close()
conn.close()
