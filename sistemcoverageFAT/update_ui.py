import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Custom Canvas Marker extension at the top
canvas_marker_extension = """
// --- Canvas Icon Marker System (Ultra Fast Rendering) ---
L.IconMarker = L.CircleMarker.extend({
    _updatePath: function () {
        this._renderer._updateIcon(this);
    }
});
L.Canvas.include({
    _updateIcon: function (layer) {
        if (!this._drawing || layer._empty()) { return; }
        const p = layer._point;
        const ctx = this._ctx;
        const r = Math.max(Math.round(layer.options.radius), 1);
        const iconChar = layer.options.iconText || 'hub';
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2, true);
        ctx.fillStyle = layer.options.fillColor || 'gray';
        ctx.fill();
        
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        // Draw icon text
        ctx.font = `${Math.round(r * 1.2)}px "Material Icons"`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconChar, p.x, p.y);
    }
});
// --------------------------------------------------------

"""
if 'L.IconMarker' not in code:
    code = code.replace("let searchMarker;", "let searchMarker;\n" + canvas_marker_extension)

# 2. Update initMap
initmap_replacement = """function initMap() {
    map = L.map('map', {
        zoomControl: false,
        preferCanvas: true // Force canvas for maximum performance
    }).setView([-7.4241, 109.2302], 12); // Default to Purwokerto

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const baseMap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
        maxZoom: 20
    });
    baseMap.addTo(map);

    // No Clustering! Just a raw layer group for speed.
    markers = L.layerGroup();
    markers.addTo(map);

    const overlayMaps = {
        "Titik Jaringan (FAT & FDT)": markers
    };
    L.control.layers(null, overlayMaps, { position: 'topright' }).addTo(map);

    loadData();
}"""
# Using regex to replace initMap block
code = re.sub(r'function initMap\(\).*?loadData\(\);\s*\}', initmap_replacement, code, flags=re.DOTALL)

# 3. Update renderMapMarkers
render_markers_replacement = """function renderMapMarkers() {
    markers.clearLayers();

    // 1. Render FAT Data using Canvas (Ultra Fast)
    L.geoJSON(fatData, {
        pointToLayer: function (feature, latlng) {
            const props = feature.properties;
            const colorName = props.color || 'gray';
            const colorHex = colors[colorName] || colors['gray'];

            // Canvas Marker
            const marker = new L.IconMarker(latlng, {
                radius: 11, // Size of the marker
                fillColor: colorHex,
                iconText: 'settings_input_component', // FAT Icon
                _colorName: colorName
            });
            
            const popupContent = `
                <div class="popup-custom">
                    <h3>FAT ID: ${props.fat_id}</h3>
                    <p><strong>Cluster:</strong> ${props.cluster_name}</p>
                    <p><strong>FDT ID:</strong> ${props.fdt_id}</p>
                    <p><strong>Utilisasi:</strong> ${props.utilization}%</p>
                    <p><strong>Kapasitas:</strong> ${props.capacity} Port (Sisa ${props.available})</p>
                    <button class="btn-popup" onclick="alert('Daftar pasang internet di FAT ${props.fat_id}')">Daftar Sekarang</button>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            marker.on('click', () => {
                highlightSidebarItem(props.cluster_name, props.fat_id);
            });
            
            return marker;
        }
    }).addTo(markers);

    // 2. Render FDT Data
    L.geoJSON(fdtData, {
        pointToLayer: function (feature, latlng) {
            const props = feature.properties;
            
            // FDT Marker (Slightly larger)
            const marker = new L.IconMarker(latlng, {
                radius: 13,
                fillColor: '#2563eb',
                iconText: 'hub' // FDT Icon
            });
            
            let popupContent = `
                <div class="popup-custom">
                    <h3 style="color:#2563eb;">NODE FDT</h3>
                    <p style="font-weight:bold; font-size: 14px; margin-top:4px;">${props.fdt_id}</p>
                </div>
            `;
            marker.bindPopup(popupContent);
            
            return marker;
        }
    }).addTo(markers);
}"""

# Actually, the original function is `function renderMapMarkers() { ... }`
# I'll just find and replace it
code = re.sub(r'function renderMapMarkers\(\).*?map\.addLayer\(markers\);\s*\}', render_markers_replacement, code, flags=re.DOTALL)

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated app.js")
