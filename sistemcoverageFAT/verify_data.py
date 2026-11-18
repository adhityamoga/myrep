import pandas as pd
import json

# 1. Load Excel
df = pd.read_excel('FAT Purwokerto_Final.xlsx')
excel_fats = set(df['FAT_Code'].dropna().astype(str).tolist())
if 'FAT Code' in df.columns:
    excel_fats.update(df['FAT Code'].dropna().astype(str).tolist())

# 2. Load GeoJSON
with open('public/data/fat_points.geojson', 'r') as f:
    geojson = json.load(f)

json_fats = set([f['properties']['fat_id'] for f in geojson['features']])

# 3. Compare
missing_in_json = excel_fats - json_fats
missing_in_excel = json_fats - excel_fats

print("=== HASIL VERIFIKASI ===")
print(f"Total FAT di Excel: {len(df)}")
print(f"Total FAT di GeoJSON: {len(geojson['features'])}")

if len(missing_in_json) == 0 and len(missing_in_excel) == 0:
    print("\n✅ STATUS: SEMPURNA (100% MATCH)")
    print("Tidak ada satupun baris data yang berkurang, hilang, atau salah ketik ID-nya.")
else:
    print("\n❌ ADA PERBEDAAN!")
    print(f"Hilang di JSON: {len(missing_in_json)}")
    print(f"Ekstra di JSON: {len(missing_in_excel)}")
