import pandas as pd

try:
    df = pd.read_excel('FAT Purwokerto_Final.xlsx')
except Exception as e:
    with open('data_profile.txt', 'w', encoding='utf-8') as f:
        f.write(f"Error loading file: {e}")
    exit(1)

info = []
info.append(f"Total Rows: {len(df)}")
info.append(f"Total Columns: {len(df.columns)}")
info.append("\n=== COLUMN SUMMARY ===")

for col in df.columns:
    nulls = df[col].isnull().sum()
    unique = df[col].nunique()
    sample = df[col].dropna().sample(min(3, len(df[col].dropna()))).tolist() if unique > 0 else []
    dtype = df[col].dtype
    info.append(f"Column: {col} | Type: {dtype} | Nulls: {nulls} | Unique: {unique} | Samples: {sample}")

info.append("\n=== FAT CODE FORMAT EXAMPLES ===")
if 'FAT_Code' in df.columns:
    info.append(str(df['FAT_Code'].sample(min(10, len(df))).tolist()))
elif 'FAT Code' in df.columns:
    info.append(str(df['FAT Code'].sample(min(10, len(df))).tolist()))

with open('data_profile.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(info))
