import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv('DATABASE_URL')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM scheme")
scheme_count = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM scheme_category")
cat_count = cursor.fetchone()[0]

print(f'Scheme table: {scheme_count} schemes')
print(f'Category table: {cat_count} categories')
print()

if scheme_count > 0:
    print('SUCCESS! Schemes found in Neon DB!')
    print()
    print('Sample schemes:')
    cursor.execute('SELECT name FROM scheme LIMIT 5')
    for name, in cursor.fetchall():
        print(f'  - {name}')
else:
    print('WARNING: No schemes imported')

cursor.close()
conn.close()
