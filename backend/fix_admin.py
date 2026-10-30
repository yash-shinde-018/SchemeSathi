import glob

# Fix all newly created files
for filepath in [r'e:\MyProject\SchemeSathi\backend\app\services\admin_service.py', r'e:\MyProject\SchemeSathi\backend\app\routes\admin.py']:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix escaped quotes
    content = content.replace('\\\"', '\"')
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print('Fixed ' + filepath.split('\\\\')[-1])
