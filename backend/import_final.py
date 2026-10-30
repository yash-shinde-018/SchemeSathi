import os, sys
from dotenv import load_dotenv
import pandas as pd
import psycopg2

load_dotenv()
db_url = os.getenv("DATABASE_URL")

print("\nIMPORTING 100 SCHEMES TO NEON DB\n")
df = pd.read_excel(r"e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx")
print(f"Found {len(df)} schemes")

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

cursor.execute("SELECT id FROM scheme_category WHERE name=%s", ("financial",))
cat_id = cursor.fetchone()[0]

imported = 0
for idx, row in df.iterrows():
    name = str(row.iloc[0]).strip()
    if len(name) < 2:
        continue
    
    cursor.execute("SELECT 1 FROM scheme WHERE name=%s LIMIT 1", (name,))
    if cursor.fetchone():
        continue
    
    desc = str(row.iloc[1]).strip() if len(row) > 1 else name
    cursor.execute("INSERT INTO scheme (name,description,category_id,govt_level,is_active,eligibility_rules,benefits,application_process,documents_required) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)", (name, desc[:500], cat_id, "central", True, "{}", desc[:1000], "", "[]"))
    imported += 1
    if imported % 25 == 0:
        conn.commit()
        print(f"{imported}...", end=" ")

conn.commit()
cursor.execute("SELECT COUNT(*) FROM scheme")
total = cursor.fetchone()[0]

print(f"\nSuccess! Imported {imported} schemes")
print(f"Total in database: {total} schemes\n")
cursor.close()
conn.close()
