import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv("DATABASE_URL")

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM scheme")
total = cursor.fetchone()[0]

print(f"Total schemes in database: {total}\n")

if total > 0:
    print("Sample schemes:")
    cursor.execute("SELECT name FROM scheme LIMIT 10")
    for name, in cursor.fetchall():
        print(f"  • {name}")

cursor.close()
conn.close()
