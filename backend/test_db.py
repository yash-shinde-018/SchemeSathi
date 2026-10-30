import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv("DATABASE_URL")

try:
    from urllib.parse import urlparse
    result = urlparse(db_url)
    
    conn = psycopg2.connect(
        database=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port or 5432,
        sslmode="require"
    )
    
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    table_count = cur.fetchone()[0]
    
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
    tables = cur.fetchall()
    
    print("=" * 50)
    print("DATABASE CONNECTION SUCCESS")
    print("=" * 50)
    print(f"Database: {result.path[1:]}")
    print(f"Tables found: {table_count}")
    print("\nTables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Check for scheme table
    cur.execute("SELECT COUNT(*) FROM schemes;")
    scheme_count = cur.fetchone()[0]
    print(f"\nSchemes in database: {scheme_count}")
    
    # Check for users table
    cur.execute("SELECT COUNT(*) FROM users;")
    user_count = cur.fetchone()[0]
    print(f"Users in database: {user_count}")
    
    cur.close()
    conn.close()
    print("\n" + "=" * 50)
    print("Database is ready for Flask app!")
    print("=" * 50)
    
except Exception as e:
    print("=" * 50)
    print("DATABASE ERROR")
    print("=" * 50)
    print(f"Error: {str(e)}")
    print("=" * 50)
