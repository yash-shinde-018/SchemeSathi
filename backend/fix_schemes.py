with open(r'e:\MyProject\SchemeSathi\backend\app\routes\schemes.py', 'r') as f:
    content = f.read()

# Fix the escaped quotes issue
content = content.replace('\\\"', '\"')

with open(r'e:\MyProject\SchemeSathi\backend\app\routes\schemes.py', 'w') as f:
    f.write(content)

print('Fixed schemes.py')
