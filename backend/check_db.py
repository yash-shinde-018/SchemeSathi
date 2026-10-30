import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

print("DATABASE CONNECTION CHECK")
print("="*70 + "\n")

db_url = os.getenv("DATABASE_URL")

if not db_url:
    print("ERROR: DATABASE_URL not found in .env")
    exit(1)

print("Connecting to Neon DB...")
try:
    conn = psycopg2.connect(db_url, connect_timeout=5)
    cursor = conn.cursor()
    print("Connected successfully!\n")
    
    # Check tables
    print("Checking tables...")
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = "public" 
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    print(f"Tables found: {len(tables)}\n")
    for table, in tables:
        print(f"  • {table}")
    
    print("\n" + "="*70 + "\n")
    
    # Check scheme data
    print("Checking SCHEME table...")
    cursor.execute("SELECT COUNT(*) FROM scheme")
    count = cursor.fetchone()[0]
    print(f"Total schemes: {count}\n")
    
    if count > 0:
        print("SUCCESS! Schemes found in database:\n")
        cursor.execute("SELECT id, name, category_id, govt_level FROM scheme LIMIT 10")
        for row in cursor.fetchall():
            print(f"  ID: {row[0]} | Name: {row[1][:50]} | Category: {row[2]} | Level: {row[3]}")
        
        if count > 10:
            print(f"\n  ... and {count - 10} more schemes")
    else:
        print("WARNING: No schemes found in database!")
        print("\nThe import may not have completed successfully.")
        print("Attempting to re-import now...\n")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"ERROR: {str(e)}\n")
    import traceback
    traceback.print_exc()

