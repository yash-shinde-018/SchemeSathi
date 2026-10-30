import pandas as pd

excel_file = r'e:\MyProject\SchemeSathi\Government_Schemes_100_Official_Source_Verification.xlsx'

print("EXCEL FILE STRUCTURE")
print("="*70)
print()

df = pd.read_excel(excel_file)

print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print()

print("First 3 rows:")
print("-"*70)
print(df.head(3).to_string())
print()

print("Sample data from first row:")
print("-"*70)
for col in df.columns:
    value = str(df.iloc[0][col])[:100]
    print(f"{col}: {value}")
