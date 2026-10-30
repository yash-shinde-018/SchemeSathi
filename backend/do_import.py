import os
from dotenv import load_dotenv
import pandas as pd
import psycopg2

load_dotenv()

db_url = os.getenv("DATABASE_URL")
excel_file = r"e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx"

print("IMPORTING 100 SCHEMES\n")

# Read Excel
df = pd.read_excel(excel_file)
print(f"Found {len(df)} schemes in Excel\n")

# Connect
conn = psycopg2.connect(db_url)
cursor = conn.cursor()

# Get or create category
cursor.execute("SELECT id FROM scheme_category WHERE name=%s", ("financial",))
result = cursor.fetchone()

if result:
    cat_id = result[0]
    print(f"Using existing category ID: {cat_id}")
else:
    cursor.execute("INSERT INTO scheme_category (name, description) VALUES (%s, %s) RETURNING id", ("financial", "Financial Assistance"))
    cat_id = cursor.fetchone()[0]
    conn.commit()
    print(f"Created new category ID: {cat_id}")

print(f"\nImporting schemes...")
imported = 0

for idx, row in df.iterrows():
    name = str(row.iloc[0]).strip()
    
    if len(name) < 2:
        continue
    
    # Check if exists
    cursor.execute("SELECT id FROM scheme WHERE name=%s", (name,))
    if cursor.fetchone():
        continue
    
    desc = str(row.iloc[1]).strip() if len(row) > 1 else name
    
    cursor.execute(
        "INSERT INTO scheme (name, description, category_id, govt_level, is_active, eligibility_rules, benefits, application_process, documents_required) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (name, desc[:500], cat_id, "central", True, "{}", desc[:1000], "", "[]")
    )
    
    imported += 1
    
    if imported % 25 == 0:
        conn.commit()
        print(f"  ✓ {imported} schemes imported...")

conn.commit()

# Verify
cursor.execute("SELECT COUNT(*) FROM scheme")
total = cursor.fetchone()[0]

print(f"\nSuccess!")
print(f"  ✓ Imported {imported} schemes")
print(f"  ✓ Total in database: {total} schemes")

cursor.close()
conn.close()

