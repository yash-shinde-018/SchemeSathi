import openpyxl
import psycopg2
from psycopg2.extras import RealDictCursor

# Excel file path
excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'

# Load Excel
wb = openpyxl.load_workbook(excel_file)
ws = wb.active
excel_schemes = {}
excel_docs = {}

for row in ws.iter_rows(min_row=2, values_only=True):
    if row[0]:  # If Scheme Name exists
        name = str(row[0]).strip()
        docs = str(row[16]).strip() if row[16] else ''  # Documents (Dataset) is column 17 (index 16)
        excel_schemes[name] = True
        excel_docs[name] = docs

print(f'✓ Excel file loaded: {len(excel_schemes)} schemes')
print(f'  Sample Excel scheme: {list(excel_schemes.keys())[0]}')
if excel_docs[list(excel_schemes.keys())[0]]:
    sample_docs = excel_docs[list(excel_schemes.keys())[0]]
    print(f'  Sample documents in Excel: {sample_docs[:100]}...')
else:
    print('  Sample documents in Excel: (empty)')

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

# Check total schemes
cur.execute('SELECT COUNT(*) as cnt FROM scheme')
total = cur.fetchone()['cnt']
print(f'✓ Database schemes: {total}')

# Check documents_required field
cur.execute("SELECT COUNT(*) as cnt FROM scheme WHERE documents_required IS NOT NULL AND documents_required != ''")
with_docs = cur.fetchone()['cnt']
print(f'✓ Schemes with documents_required: {with_docs}/{total}')

# Get sample
cur.execute('SELECT name, documents_required FROM scheme LIMIT 3')
samples = cur.fetchall()
print(f'  Sample DB records:')
for s in samples:
    doc_preview = s['documents_required'][:60] if s['documents_required'] else '(empty)'
    print(f'    {s["name"]}: {doc_preview}...')

# Check name matching
cur.execute('SELECT name FROM scheme')
db_schemes = {row['name'] for row in cur.fetchall()}
excel_names = set(excel_schemes.keys())

matched = len(db_schemes & excel_names)
print(f'✓ Name matching: {matched}/100 Excel schemes found in DB')

missing_in_db = excel_names - db_schemes
if missing_in_db:
    print(f'  Missing in DB: {list(missing_in_db)[:3]}')

extra_in_db = db_schemes - excel_names
if extra_in_db:
    print(f'  Extra in DB: {list(extra_in_db)[:3]}')

conn.close()
