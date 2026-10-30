import psycopg2
from psycopg2.extras import RealDictCursor
import json

conn = psycopg2.connect(
    host='ep-quiet-butterfly-b3sudrd1-pooler.c-4.ap-southeast-1.aws.neon.tech',
    database='neondb',
    user='neondb_owner',
    password='npg_fSVsc2Cy4uHN',
    sslmode='require',
    channel_binding='require'
)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Get 3 sample schemes
cur.execute('SELECT id, name, benefits, application_process, documents_required, eligibility_rules FROM scheme LIMIT 3')
samples = cur.fetchall()

print('Sample Scheme Data from Database:')
print('=' * 80)
for i, scheme in enumerate(samples, 1):
    print(f'\\nScheme {i}: {scheme["name"]}')
    print(f'  Benefits: {str(scheme["benefits"])[:100]}...')
    print(f'  Application: {str(scheme["application_process"])[:100]}...')
    print(f'  Documents: {str(scheme["documents_required"])[:100]}...')
    print(f'  Eligibility: {str(scheme["eligibility_rules"])[:100]}...')

conn.close()
