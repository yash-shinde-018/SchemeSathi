import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
db_url = os.getenv('DATABASE_URL')

conn = psycopg2.connect(db_url)
cursor = conn.cursor()

print("Creating tables in Neon DB...\n")

# Create scheme_category table
print("1. Creating scheme_category table...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS scheme_category (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("   ✓ Created")

# Create scheme table
print("2. Creating scheme table...")
cursor.execute("""
    CREATE TABLE IF NOT EXISTS scheme (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES scheme_category(id),
        govt_level VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        eligibility_rules TEXT DEFAULT '{}',
        benefits TEXT DEFAULT '',
        application_process TEXT DEFAULT '',
        documents_required TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("   ✓ Created")

conn.commit()
print("\nTables created successfully!")

cursor.close()
conn.close()
