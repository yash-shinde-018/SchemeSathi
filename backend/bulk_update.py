import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Updating all schemes...\n")

updated = 0

for idx, row in df.iterrows():
    try:
        scheme_name = str(row['Scheme Name']).strip()
        benefits = str(row.get('Benefits (Dataset)', '')).strip()
        app_process = str(row.get('Application Process (Dataset)', '')).strip()
        eligibility = str(row.get('Eligibility (Dataset)', '')).strip()
        
        cursor.execute(
            'UPDATE scheme SET benefits = %s, application_process = %s, eligibility_rules = %s WHERE name = %s',
            (benefits, app_process, eligibility, scheme_name)
        )
        
        updated += 1
        if updated % 25 == 0:
            conn.commit()
            print(f'  {updated} updated...')
    except:
        pass

conn.commit()

# Final verification
cursor.execute('SELECT COUNT(*) FROM scheme WHERE benefits IS NOT NULL AND benefits != %s', ('',))
benefits_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM scheme WHERE application_process IS NOT NULL AND application_process != %s', ('',))
app_count = cursor.fetchone()[0]

print(f'\nComplete!')
print(f'  ✓ Schemes with benefits: {benefits_count}/100')
print(f'  ✓ Schemes with application_process: {app_count}/100')

# Show samples
print(f'\nSample schemes:')
cursor.execute('SELECT name, benefits, application_process FROM scheme WHERE benefits IS NOT NULL LIMIT 3')
for i, (name, ben, app) in enumerate(cursor.fetchall(), 1):
    print(f'\n  {i}. {name}')
    print(f'     Benefits: {ben[:80]}...')
    print(f'     App Process: {app[:80]}...')

cursor.close()
conn.close()
