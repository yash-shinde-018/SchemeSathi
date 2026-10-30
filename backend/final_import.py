import pandas as pd
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

excel_file = r"e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx"
db_url = os.getenv("DATABASE_URL")

print("\n" + "="*70)
print("IMPORTING 100 SCHEMES TO NEON DB")
print("="*70 + "\n")

df = pd.read_excel(excel_file)
print(f"Schemes to import: {len(df)}\n")

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

cursor.execute("SELECT id FROM scheme_category WHERE name = %s", ("financial",))
cat_id = cursor.fetchone()[0]

imported = 0
for idx, row in df.iterrows():
    name = str(row.iloc[0]).strip()
    if len(name) < 2:
        continue
    
    cursor.execute("SELECT id FROM scheme WHERE name = %s LIMIT 1", (name,))
    if cursor.fetchone():
        continue
    
    desc = str(row.iloc[1]).strip() if len(row) > 1 else name
    cursor.execute("INSERT INTO scheme (name, description, category_id, govt_level, is_active, eligibility_rules, benefits, application_process, documents_required) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (name, desc[:500], cat_id, "central", True, "{}", desc[:1000], "", "[]"))
    imported += 1
    if imported % 20 == 0:
        conn.commit()
        print(f"✓ {imported} schemes imported...")

conn.commit()
cursor.execute("SELECT COUNT(*) FROM scheme")
total = cursor.fetchone()[0]

print(f"\nImported: {imported} schemes")
print(f"Total in DB: {total} schemes\n")

cursor.close()
conn.close()
