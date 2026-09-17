import os
import re

with open('data_pipeline/process_data.py', 'r') as f:
    code = f.read()

new_process_excel = """def process_excel(excel_path):
    # Read main FAT data
    df_main = pd.read_excel(excel_path, sheet_name='FAT Purwokerto')
    
    # Read utilization data and set index by 'FAT (import)' if it exists, otherwise 'FAT Code'
    try:
        df_util = pd.read_excel(excel_path, sheet_name='FAT Utilization')
        # Drop duplicates based on 'FAT (import)' which corresponds to FAT_Code in df_main
        if 'FAT (import)' in df_util.columns:
            df_util = df_util.drop_duplicates(subset=['FAT (import)'])
            merge_left = 'FAT_Code'
            merge_right = 'FAT (import)'
        else:
            df_util = df_util.drop_duplicates(subset=['FAT Code'])
            merge_left = 'FAT_Code'
            merge_right = 'FAT Code'
    except Exception as e:
        print(f"Error reading util: {e}")
        df_util = pd.DataFrame()
        merge_left = 'FAT_Code'
        merge_right = 'FAT Code'
    
    # Read Tikor Cluster data
    tikor_path = os.path.join(os.path.dirname(excel_path), 'Tikor Cluster Purwokerto.xlsx')
    try:
        df_tikor = pd.read_excel(tikor_path, header=1).drop_duplicates(subset=['Cluster ID'])
        tikor_bases = []
        for cid in df_tikor['Cluster ID']:
            parts = str(cid).split('.')
            if len(parts) >= 3:
                tikor_fdt = ".".join(parts[2:])
                tikor_bases.append({'Cluster ID': cid, 'Tikor FDT': tikor_fdt})
            else:
                tikor_bases.append({'Cluster ID': cid, 'Tikor FDT': str(cid)})
        df_tb = pd.DataFrame(tikor_bases)
    except Exception as e:
        print(f"Warning: Could not read Tikor Cluster data: {e}")
        df_tikor = pd.DataFrame(columns=['Cluster ID', 'Nama Cluster', 'Kecamatan', 'Kelurahan'])
        df_tb = pd.DataFrame(columns=['Cluster ID', 'Tikor FDT'])
        
    def match_fat(fat_code):
        if pd.isna(fat_code) or not str(fat_code): return None, None
        fat_code_str = str(fat_code)
        parts = fat_code_str.split('.')
        if len(parts) < 2: return None, None
        base = ".".join(parts[:-1])
        
        # 1. Exact match
        exact = df_tb[df_tb['Tikor FDT'] == base]
        if not exact.empty:
            return exact.iloc[0]['Cluster ID'], exact.iloc[0]['Tikor FDT']
            
        # 2. Ends with
        ends = df_tb[df_tb['Tikor FDT'].apply(lambda x: base.endswith(x))]
        if not ends.empty:
            return ends.iloc[0]['Cluster ID'], ends.iloc[0]['Tikor FDT']
            
        # 3. Starts with
        starts = df_tb[df_tb['Tikor FDT'].apply(lambda x: x.startswith(base + '.') or x == base)]
        if not starts.empty:
            return starts.iloc[0]['Cluster ID'], starts.iloc[0]['Tikor FDT']
            
        return None, None
    
    # Merge utilization into main dataframe
    if not df_util.empty:
        df = pd.merge(df_main, df_util, left_on=merge_left, right_on=merge_right, how='left')
    else:
        df = df_main.copy()
    
    features = []
    
    for index, row in df.iterrows():
        fat_code = str(row.get('FAT_Code', ''))
        if not fat_code or fat_code == 'nan':
            continue
            
        # Get coordinates
        lat = row.get('latitude')
        if pd.isna(lat) or lat == 0:
            lat = row.get('Latitude')
            
        lon = row.get('longitude')
        if pd.isna(lon) or lon == 0:
            lon = row.get('Longitude')
            
        if pd.isna(lat) or pd.isna(lon):
            continue
            
        try:
            lat = float(lat)
            lon = float(lon)
            if math.isnan(lat) or math.isnan(lon) or (lat == 0 and lon == 0):
                continue
        except ValueError:
            continue
            
        # Calculate utilization
        capacity = row.get('FAT Port Capacity')
        available = row.get('FAT Port Available')
        penetration = row.get('FAT Penetration')
        
        # Determine if data is missing
        if pd.isna(capacity):
            utilization = None
            capacity = None
            available = None
        else:
            if not pd.isna(penetration) and penetration > 0:
                utilization = penetration
            else:
                utilization = (capacity - available) / capacity * 100 if capacity > 0 else 0
                
        color = get_color_status(utilization)
        
        # Attempt to match Tikor via smart match
        extracted_cluster_id, extracted_fdt_code = match_fat(fat_code)
        
        if extracted_cluster_id:
            tikor_match = df_tikor[df_tikor['Cluster ID'] == extracted_cluster_id]
            if not tikor_match.empty:
                kecamatan = str(tikor_match.iloc[0]['Kecamatan'])
                kelurahan = str(tikor_match.iloc[0]['Kelurahan'])
                cluster_name = str(tikor_match.iloc[0]['Nama Cluster'])
            else:
                kecamatan = 'Area Lainnya'
                kelurahan = 'Area Umum'
                cluster_name = extracted_cluster_id
        else:
            kecamatan = 'Area Lainnya'
            kelurahan = 'Area Umum'
            cluster_name = 'Unknown Cluster'
            extracted_fdt_code = 'Unknown FDT'
            
        # Overwrite with utilization info if available (utilization sheet has FDT Code and Cluster Name)
        util_cluster = str(row.get('Cluster Name_y', row.get('Cluster Name')))
        util_fdt = str(row.get('FDT Code'))
        
        if util_cluster != 'nan' and util_cluster and util_cluster != 'None':
            cluster_name = util_cluster
        if util_fdt != 'nan' and util_fdt and util_fdt != 'None':
            extracted_fdt_code = util_fdt
            
        # Final cleanup
        if kecamatan == 'nan' or not kecamatan: kecamatan = 'Area Lainnya'
        if kelurahan == 'nan' or not kelurahan: kelurahan = 'Area Umum'
        if cluster_name == 'nan' or not cluster_name: cluster_name = 'Unknown Cluster'
        if extracted_fdt_code == 'nan' or not extracted_fdt_code: extracted_fdt_code = 'Unknown FDT'
        
        properties = {
            "fat_id": fat_code,
            "fdt_id": extracted_fdt_code,
            "cluster_id": extracted_cluster_id if extracted_cluster_id else "",
            "cluster_name": cluster_name,
            "raw_kecamatan": kecamatan,
            "raw_desa": kelurahan,
            "capacity": int(capacity) if capacity is not None else "N/A",
            "available": int(available) if available is not None else "N/A",
            "utilization": round(utilization, 2) if utilization is not None else "N/A",
            "color": color
        }
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": properties
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "features": features
    }"""

start = code.find('def process_excel(excel_path):')
end = code.find('def process_kml(kml_path):')
code = code[:start] + new_process_excel + '\n\n' + code[end:]

with open('data_pipeline/process_data.py', 'w') as f:
    f.write(code)
