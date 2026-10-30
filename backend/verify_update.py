import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv('DATABASE_URL')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print('SCHEME DATA VERIFICATION')
print('='*70)
print()

# Check benefits
cursor.execute('SELECT COUNT(*) FROM scheme WHERE benefits IS NOT NULL AND benefits != %s', ('',))
benefits_count = cursor.fetchone()[0]
print(f'Schemes with benefits: {benefits_count}/100')

# Check application_process
cursor.execute('SELECT COUNT(*) FROM scheme WHERE application_process IS NOT NULL AND application_process != %s', ('',))
app_count = cursor.fetchone()[0]
print(f'Schemes with application_process: {app_count}/100')

print()
print('Sample scheme data:')
print('-'*70)

cursor.execute('''
    SELECT name, benefits, application_process 
    FROM scheme 
    WHERE benefits IS NOT NULL AND application_process IS NOT NULL
    LIMIT 1
''')

row = cursor.fetchone()
if row:
    print(f'Name: {row[0]}')
    print(f'Benefits: {row[1][:80]}...')
    print(f'Application Process: {row[2][:80]}...')
    print()
    print('Status: Data successfully populated!')
else:
    print('No data found')

cursor.close()
conn.close()
