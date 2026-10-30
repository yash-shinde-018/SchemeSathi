import requests
import json

# Test the API
base_url = 'http://localhost:5000'

print('Testing SchemeSathi API Endpoints...')
print('')

# Test 1: Get all schemes
print('1. GET /api/schemes (first 3 schemes)')
try:
    response = requests.get(f'{base_url}/api/schemes?limit=3', timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f'   Status: OK ({response.status_code})')
        print(f'   Total schemes available: {len(data.get("schemes", []))}')
        if data.get('schemes'):
            scheme = data['schemes'][0]
            print(f'   Sample scheme fields:')
            print(f'     - name: {scheme.get("name")}')
            print(f'     - benefits: {str(scheme.get("benefits"))[:50]}...')
            print(f'     - documents: {str(scheme.get("documents_required"))[:50]}...')
    else:
        print(f'   Status: ERROR ({response.status_code})')
except Exception as e:
    print(f'   ERROR: Cannot connect to API. Is the Flask server running?')
    print(f'   Details: {str(e)}')
    print('')
    print('   To start the Flask server, run:')
    print('   cd e:\\MyProject\\SchemeSathi\\backend')
    print('   python app.py')

print('')
print('API Test Note: API will be available once Flask server starts.')
