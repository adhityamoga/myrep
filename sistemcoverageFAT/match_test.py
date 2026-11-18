import pandas as pd

df_main = pd.read_excel('FAT Purwokerto.xlsx', sheet_name='FAT Purwokerto')
df_tikor = pd.read_excel('Tikor Cluster Purwokerto.xlsx', header=1).drop_duplicates(subset=['Cluster ID'])

tikor_bases = []
for cid in df_tikor['Cluster ID']:
    parts = str(cid).split('.')
    if len(parts) >= 3:
        tikor_fdt = ".".join(parts[2:])
        tikor_bases.append({'Cluster ID': cid, 'Tikor FDT': tikor_fdt})
    else:
        tikor_bases.append({'Cluster ID': cid, 'Tikor FDT': str(cid)})
df_tb = pd.DataFrame(tikor_bases)

def match_fat(fat_code):
    fat_code = str(fat_code)
    parts = fat_code.split('.')
    if len(parts) < 2: return None, None
    base = ".".join(parts[:-1])
    
    # 1. Exact match
    exact = df_tb[df_tb['Tikor FDT'] == base]
    if not exact.empty:
        return exact.iloc[0]['Cluster ID'], exact.iloc[0]['Tikor FDT']
        
    # 2. FAT base ends with Tikor FDT (e.g., MR.BERKOH.002 ends with BERKOH.002)
    ends = df_tb[df_tb['Tikor FDT'].apply(lambda x: base.endswith(x))]
    if not ends.empty:
        return ends.iloc[0]['Cluster ID'], ends.iloc[0]['Tikor FDT']
        
    # 3. Tikor FDT starts with FAT base (e.g., ARCA-07.037 starts with ARCA-07)
    # Be careful not to match ARCA-07 to ARCA-07.038 if there are multiple!
    starts = df_tb[df_tb['Tikor FDT'].apply(lambda x: x.startswith(base + '.') or x == base)]
    if not starts.empty:
        return starts.iloc[0]['Cluster ID'], starts.iloc[0]['Tikor FDT']
        
    return None, None

matched = 0
for idx, row in df_main.iterrows():
    cid, fdt = match_fat(row['FAT_Code'])
    if cid: matched += 1

print(f"Matched {matched} out of {len(df_main)} FATs")
