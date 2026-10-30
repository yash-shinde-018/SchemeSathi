import openpyxl
import psycopg2
from psycopg2.extras import RealDictCursor

excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'

# Load Excel
wb = openpyxl.load_workbook(excel_file)
ws = wb.active
excel_data = {}

for row in ws.iter_rows(min_row=2, values_only=True):
    if row[1]:  # Scheme Name is in column 2 (index 1)
        name = str(row[1]).strip()
        docs = str(row[14]).strip() if row[14] else ''  # Documents is column 15 (index 14)
        excel_data[name] = {
            'id': row[0],
            'docs': docs
        }

print(f'Excel data loaded: {len(excel_data)} schemes')

# Database connection
conn = psycopg2.connect(
    host='ep-quiet-butterfly-b3sudrd1-pooler.c-4.ap-southeast-1.aws.neon.tech',
    database='neondb',
    user='neondb_owner',
    password='npg_fSVsc2Cy4uHN',
    sslmode='require',
    channel_binding='require'
)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Get all schemes from DB
cur.execute('SELECT name, documents_required FROM scheme')
db_schemes = {row['name']: row['documents_required'] for row in cur.fetchall()}

print(f'Database schemes: {len(db_schemes)}')

# Compare
matched = 0
for name in excel_data:
    if name in db_schemes:
        matched += 1
        db_doc = db_schemes[name]
        excel_doc = excel_data[name]['docs']
        if db_doc == excel_doc:
            pass  # Perfect match
        elif db_doc and not excel_doc:
            pass  # DB has data, Excel doesn't
        else:
            pass  # Mismatch - will show sample

print(f'Schema name matches in DB: {matched}/100')

# Show first 5 matching schemes
print(f'\nFirst 5 matching scheme names:')
count = 0
for name in excel_data:
    if name in db_schemes and count < 5:
        print(f'  ✓ {name}')
        count += 1

# Show first 3 mismatches (names in Excel but not in DB)
print(f'\nFirst 3 schemes in Excel but not in DB:')
not_in_db = set(excel_data.keys()) - set(db_schemes.keys())
for name in list(not_in_db)[:3]:
    print(f'  ✗ {name}')

if len(not_in_db) == 0:
    print('  All Excel schemes found in DB!')

conn.close()
