import openpyxl

excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'
wb = openpyxl.load_workbook(excel_file)
ws = wb.active

# Row 2 analysis
row2 = list(ws.iter_rows(min_row=2, max_row=2, values_only=True))[0]
print('Row 2 detailed:')
print(f'  Col 1 (Verification ID): {row2[0]}')
print(f'  Col 2 (Scheme Name): {row2[1]}')
print(f'  Col 13 (Eligibility): {row2[12][:100] if row2[12] else None}...')
print(f'  Col 14 (Benefits): {row2[13][:100] if row2[13] else None}...')
print(f'  Col 15 (Documents): {row2[14][:100] if row2[14] else None}...')
print(f'  Col 16 (Application Process): {row2[15][:100] if row2[15] else None}...')

# Count schemes with non-empty documents
count_with_docs = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    if row[14]:  # Column 15 (index 14) - Documents
        count_with_docs += 1

print(f'\nSchemes with documents_required in Excel: {count_with_docs}/100')
