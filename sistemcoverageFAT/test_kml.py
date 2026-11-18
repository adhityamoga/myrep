from fastkml import kml
with open('c:/laragon/www/sistemcoverageFAT/CL DONE RFS PURWOKERTO.kml', 'rt', encoding='utf-8') as f:
    doc = f.read()
k = kml.KML()
k.from_string(doc.encode('utf-8'))

count = 0
for feature in list(k.features):
    if hasattr(feature, 'features'):
        for folder in list(feature.features):
            if hasattr(folder, 'features'):
                for placemark in list(folder.features):
                    count += 1
print(f"Features: {count}")
