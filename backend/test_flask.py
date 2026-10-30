import os
from dotenv import load_dotenv

load_dotenv()

try:
    from app import create_app
    app = create_app("development")
    print("=" * 50)
    print("FLASK APP CREATED SUCCESSFULLY")
    print("=" * 50)
    print(f"App name: {app.name}")
    print(f"Debug mode: {app.debug}")
    print(f"Config: {app.config.get('ENV')}")
    print("\nRegistered blueprints:")
    for blueprint in app.blueprints:
        print(f"  - {blueprint}")
    print("\n" + "=" * 50)
    print("Flask app is ready to run!")
    print("=" * 50)
except Exception as e:
    print("=" * 50)
    print("FLASK APP ERROR")
    print("=" * 50)
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
    print("=" * 50)
