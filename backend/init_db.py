import os
from dotenv import load_dotenv
from app import create_app
from app.database import db

load_dotenv()

print("Initializing Neon Database...")
print("="*70 + "\n")

app = create_app("development")

with app.app_context():
    print("Creating all tables...")
    db.create_all()
    print("Tables created!\n")
    
    # List tables
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    print(f"Tables in database ({len(tables)}):")
    for table in sorted(tables):
        print(f"  • {table}")
    
    print("\nDatabase initialized successfully!")
    print("Now you can import scheme data.")

