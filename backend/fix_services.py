import os
import glob

# Fix all .py files in services directory
for filepath in glob.glob(r'e:\MyProject\SchemeSathi\backend\app\services\*.py'):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix escaped quotes
    content = content.replace('\\\"', '\"')
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f'Fixed {os.path.basename(filepath)}')
