import openpyxl

excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'
wb = openpyxl.load_workbook(excel_file)
ws = wb.active

print('Column Headers:')
headers = []
for col, cell in enumerate(ws[1], 1):
    headers.append(cell.value)
    print(f'  {col}: {cell.value}')

print('\nFirst 5 rows (data):')
for row_idx, row in enumerate(ws.iter_rows(min_row=2, max_row=6, values_only=True), 2):
    print(f'  Row {row_idx}: {row[0]} | {row[1]} | ... | {row[16]}')
