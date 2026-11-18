import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replacement block for L.Canvas.include
new_canvas_include = """
// --- Global Logo Preload ---
const customLogo = new Image();
customLogo.src = '/image/rocket-logo.png';

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
        
        // Draw background colored circle (preserves utilization color indicator)
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2, true);
        ctx.fillStyle = layer.options.fillColor || 'gray';
        ctx.fill();
        
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        
        // Draw Logo if loaded, otherwise fallback to text icon
        if (customLogo.complete && customLogo.naturalWidth > 0) {
            // Keep the logo inside the circle, or slightly bleeding out.
            // A circle with radius r has a diameter of 2*r.
            // Logo size: 1.4 * r so it fits nicely inside.
            const imgSize = r * 1.5; 
            ctx.drawImage(customLogo, p.x - imgSize/2, p.y - imgSize/2, imgSize, imgSize);
        } else {
            const iconChar = layer.options.iconText || 'hub';
            ctx.font = `${Math.round(r * 1.2)}px "Material Icons"`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconChar, p.x, p.y);
        }
    }
});
"""

# We need to replace the existing L.Canvas.include and L.IconMarker block.
# Let's use regex to find and replace the block
# The original block starts with "L.IconMarker = L.CircleMarker.extend" and ends with "});\n// --------------------------------------------------------"
regex_pattern = r'// --- Canvas Icon Marker System \(Ultra Fast Rendering\) ---.*?// --------------------------------------------------------'

code = re.sub(regex_pattern, new_canvas_include, code, flags=re.DOTALL)

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated app.js with Logo")
