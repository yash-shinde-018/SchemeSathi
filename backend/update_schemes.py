import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

df = pd.read_excel(r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Updating schemes with complete data...\n")

updated = 0

for idx, row in df.iterrows():
    try:
        scheme_name = str(row['Scheme Name']).strip()
        benefits = str(row.get('Benefits (Dataset)', '')).strip()
        app_process = str(row.get('Application Process (Dataset)', '')).strip()
        eligibility = str(row.get('Eligibility (Dataset)', '')).strip()
        
        cursor.execute(
            '''UPDATE scheme 
               SET benefits = %s,
                   application_process = %s,
                   eligibility_rules = %s
               WHERE name = %s''',
            (benefits, app_process, eligibility, scheme_name)
        )
        
        updated += 1
        if updated % 20 == 0:
            conn.commit()
            print(f'  Updated {updated}...')
    
    except Exception as e:
        print(f'  Error on {scheme_name}: {str(e)[:30]}')
        continue

conn.commit()

# Verify
cursor.execute('SELECT COUNT(*) FROM scheme WHERE benefits != %s AND benefits IS NOT NULL', ('',))
benefits_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM scheme WHERE application_process != %s AND application_process IS NOT NULL', ('',))
app_count = cursor.fetchone()[0]

print(f"\nUpdate Complete!")
print(f"  Schemes with benefits: {benefits_count}/100")
print(f"  Schemes with application_process: {app_count}/100")

# Show sample
cursor.execute('''
    SELECT name, benefits, application_process
    FROM scheme
    WHERE benefits != %s
    LIMIT 1
''', ('',))

row = cursor.fetchone()
if row:
    print(f"\nSample:")
    print(f"  Name: {row[0]}")
    print(f"  Benefits: {row[1][:80]}...")
    print(f"  Application Process: {row[2][:80]}...")

cursor.close()
conn.close()
