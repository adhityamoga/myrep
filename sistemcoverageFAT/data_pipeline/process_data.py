import os
import pandas as pd
import json
import math
from fastkml import kml

def get_color_status(utilization):
    if utilization is None or utilization == "N/A":
        return 'gray'  # N/A or Missing Data
    if utilization > 70:
        return 'red'
    elif utilization > 50:
        return 'yellow'
    else:
        return 'green'

def process_excel(excel_path):
    # 1. Read the Final unified data
    print(f"Reading unified data from: {excel_path}")
    df = pd.read_excel(excel_path)
    
    features = []
    processed_count = 0
    error_count = 0
    
    for index, row in df.iterrows():
        # Get FAT Code
        fat_code = str(row.get('FAT_Code', row.get('FAT Code', '')))
        if not fat_code or fat_code == 'nan' or fat_code == 'None':
            continue
            
        # Get coordinates safely
        lat = row.get('latitude')
        if pd.isna(lat) or lat == 0:
            lat = row.get('Latitude')
            
        lon = row.get('longitude')
        if pd.isna(lon) or lon == 0:
            lon = row.get('Longitude')
            
        if pd.isna(lat) or pd.isna(lon):
            error_count += 1
            continue
            
        try:
            lat = float(lat)
            lon = float(lon)
            if math.isnan(lat) or math.isnan(lon) or (lat == 0 and lon == 0):
                error_count += 1
                continue
        except ValueError:
            error_count += 1
            continue
            
        # Hierarchy & Administrative mapping (Directly from Final File)
        kecamatan = str(row.get('Kecamatan', 'Area Lainnya'))
        kelurahan = str(row.get('Kelurahan', 'Area Umum'))
        cluster_id = str(row.get('Cluster ID', 'Unknown Cluster ID'))
        cluster_name = str(row.get('Nama Cluster', 'Unknown Cluster'))
        
        # Cleanup string representations of NaNs
        if kecamatan.lower() == 'nan': kecamatan = 'Area Lainnya'
        if kelurahan.lower() == 'nan': kelurahan = 'Area Umum'
        if cluster_id.lower() == 'nan': cluster_id = 'Unknown Cluster ID'
        if cluster_name.lower() == 'nan': cluster_name = 'Unknown Cluster'
        
        # FDT Extraction (Fallback logic)
        fdt_code = str(row.get('FDT Code'))
        if fdt_code.lower() == 'nan' or not fdt_code or fdt_code == 'None':
            # Extract FDT from FAT_Code (Remove the last dot segment)
            parts = fat_code.split('.')
            if len(parts) >= 2:
                fdt_code = ".".join(parts[:-1])
            else:
                fdt_code = fat_code # Fallback to FAT code if no dots
        
        # Utilization Data
        capacity = row.get('FAT Port Capacity')
        available = row.get('FAT Port Available')
        penetration = row.get('FAT Penetration')
        
        # Determine if utilization data is missing
        if pd.isna(capacity):
            utilization = "N/A"
            capacity = "N/A"
            available = "N/A"
        else:
            capacity = int(capacity)
            available = int(available) if not pd.isna(available) else 0
            if not pd.isna(penetration) and penetration > 0:
                # Convert to percentage
                utilization = round(penetration * 100, 2)
            else:
                utilization = round((capacity - available) / capacity * 100, 2) if capacity > 0 else 0.0
                
        color = get_color_status(utilization)
        
        # Final Properties payload
        properties = {
            "fat_id": fat_code,
            "fdt_id": fdt_code,
            "cluster_id": cluster_id,
            "cluster_name": cluster_name,
            "raw_kecamatan": kecamatan,
            "raw_desa": kelurahan,
            "capacity": capacity,
            "available": available,
            "utilization": utilization,
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
        processed_count += 1
        
    print(f"Excel Processing Summary: {processed_count} rows processed successfully. {error_count} skipped due to invalid coordinates.")
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

def process_kml(kml_path):
    import xml.etree.ElementTree as ET
    features = []
    try:
        tree = ET.parse(kml_path)
        root = tree.getroot()
        
        # KML usually has a namespace, we can just strip it for simple searching
        for elem in root.iter():
            if '}' in elem.tag:
                elem.tag = elem.tag.split('}', 1)[1]  # strip all namespaces
                
        for placemark in root.findall('.//Placemark'):
            name = placemark.find('name')
            coords = placemark.find('.//coordinates')
            if name is not None and coords is not None:
                name_text = name.text.strip()
                coord_text = coords.text.strip()
                if coord_text:
                    parts = coord_text.split(',')
                    if len(parts) >= 2:
                        lon = float(parts[0])
                        lat = float(parts[1])
                        features.append({
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [lon, lat]
                            },
                            "properties": {
                                "fdt_id": name_text,
                                "type": "FDT"
                            }
                        })
    except Exception as e:
        print(f"Error parsing KML: {e}")
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    excel_path = os.path.join(base_dir, 'FAT Purwokerto_Final.xlsx')
    kml_path = os.path.join(base_dir, 'CL DONE RFS PURWOKERTO.kml')
    output_dir = os.path.join(base_dir, 'public', 'data')
    
    os.makedirs(output_dir, exist_ok=True)
    
    print("Processing Excel...")
    try:
        fat_geojson = process_excel(excel_path)
        with open(os.path.join(output_dir, 'fat_points.geojson'), 'w') as f:
            json.dump(fat_geojson, f)
        print(f"Exported {len(fat_geojson['features'])} FAT points.")
    except Exception as e:
        print(f"Error processing Excel: {e}")
        
    print("Processing KML...")
    try:
        fdt_geojson = process_kml(kml_path)
        with open(os.path.join(output_dir, 'fdt_points.geojson'), 'w') as f:
            json.dump(fdt_geojson, f)
        print(f"Exported {len(fdt_geojson['features'])} FDT points.")
    except Exception as e:
        print(f"Error processing KML: {e}")
    
    print("Data processing complete!")
