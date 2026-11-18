let map;
let markers;
let fatData = [];
let fdtData = [];
let sidebarData = {};
let searchMarker;

// --- Global Logo Preload ---
const customLogo = new Image();
customLogo.src = "/image/rocket-logo.png";

// --- Canvas Icon Marker System (Ultra Fast Rendering) ---
L.IconMarker = L.CircleMarker.extend({
  _updatePath: function () {
    this._renderer._updateIcon(this);
  },
});
L.Canvas.include({
  _updateIcon: function (layer) {
    if (!this._drawing || layer._empty()) {
      return;
    }
    const p = layer._point;
    const ctx = this._ctx;
    const r = Math.max(Math.round(layer.options.radius), 1);

    // Draw Logo if loaded, otherwise fallback to circle + text icon
    if (customLogo.complete && customLogo.naturalWidth > 0) {
      // Dynamic scaling based on zoom level
      const currentZoom = this._map ? this._map.getZoom() : 12;
      let scale = 1;
      if (currentZoom >= 15) scale = 1.5;
      if (currentZoom >= 17) scale = 2.5;
      if (currentZoom >= 19) scale = 4.0;

      const imgSize = r * 2 * scale; // Base size + dynamic zoom scale
      ctx.drawImage(customLogo, p.x - imgSize / 2, p.y - imgSize / 2, imgSize, imgSize);
    } else {
      // Draw background colored circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2, true);
      ctx.fillStyle = layer.options.fillColor || "gray";
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      const iconChar = layer.options.iconText || "hub";
      ctx.font = `${Math.round(r * 1.2)}px "Material Icons"`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(iconChar, p.x, p.y);
    }
  },
});

// Color mapping for FAT status
const colors = {
  green: "#28a745",
  lightgreen: "#8ce196",
  yellow: "#ffc107",
  orange: "#fd7e14",
  red: "#dc3545",
  black: "#000000",
  gray: "#6c757d",
};

// Initialize Map
function initMap() {
  map = L.map("map", {
    zoomControl: false,
    preferCanvas: true, // Force canvas for maximum performance
  }).setView([-7.4241, 109.2302], 12); // Default to Purwokerto

  L.control.zoom({ position: "bottomleft" }).addTo(map);

  const baseMap = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    maxZoom: 20,
  });
  baseMap.addTo(map);

  // No Clustering! Just a raw layer group for speed.
  markers = L.layerGroup();
  markers.addTo(map);

  const overlayMaps = {
    "Titik Jaringan (FAT & FDT)": markers,
  };
  L.control.layers(null, overlayMaps, { position: "topright" }).addTo(map);

  loadData();
}

// Load GeoJSON Data
async function loadData() {
  try {
    const ts = new Date().getTime();
    const [fatRes, fdtRes] = await Promise.all([
      fetch(`/data/fat_points.geojson?v=${ts}`),
      fetch(`/data/fdt_points.geojson?v=${ts}`),
    ]);

    const fatGeoJSON = await fatRes.json();
    const fdtGeoJSON = await fdtRes.json();

    fatData = fatGeoJSON.features;
    fdtData = fdtGeoJSON.features;

    document.fonts.ready.then(() => {
      renderMapMarkers();
      buildSidebarData();
      renderSidebar();
    });
  } catch (error) {
    console.error("Error loading data:", error);
    document.getElementById("sidebar-accordion").innerHTML =
      '<div style="padding:20px; color:red;">Gagal memuat data jaringan. Pastikan data GeoJSON tersedia.</div>';
  }
}

// Custom Marker Icon generator
function createCustomIcon(colorName) {
  const colorHex = colors[colorName] || colors["gray"];

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${colorHex}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function renderMapMarkers() {
  markers.clearLayers();

  // 1. Render FAT Data using Canvas (Ultra Fast)
  L.geoJSON(fatData, {
    pointToLayer: function (feature, latlng) {
      const props = feature.properties;
      const colorName = props.color || "gray";
      const colorHex = colors[colorName] || colors["gray"];

      // Canvas Marker
      const marker = new L.IconMarker(latlng, {
        radius: 11, // Size of the marker
        fillColor: colorHex,
        iconText: "device_hub", // FAT Icon (jaringan)
        _colorName: colorName,
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

      marker.on("click", () => {
        highlightSidebarItem(props.cluster_name, props.fat_id);
      });

      return marker;
    },
  }).addTo(markers);

  // 2. Render FDT Data
  L.geoJSON(fdtData, {
    pointToLayer: function (feature, latlng) {
      const props = feature.properties;

      // FDT Marker (Slightly larger)
      const marker = new L.IconMarker(latlng, {
        radius: 13,
        fillColor: "#2563eb",
        iconText: "hub", // FDT Icon
      });

      let popupContent = `
                <div class="popup-custom">
                    <h3 style="color:#2563eb;">NODE FDT</h3>
                    <p style="font-weight:bold; font-size: 14px; margin-top:4px;">${props.fdt_id}</p>
                </div>
            `;
      marker.bindPopup(popupContent);

      return marker;
    },
  }).addTo(markers);
}

// Build Hierarchical Data for Sidebar (Kecamatan -> Kelurahan -> Cluster -> FDT -> FAT)
function buildSidebarData() {
  sidebarData = {
    totalFats: 0,
    totalFdts: 0,
    kecamatan: {},
  };

  // Process FAT Data
  fatData.forEach((feature) => {
    const props = feature.properties;
    let kec = props.raw_kecamatan || "Area Lainnya";
    let kel = props.raw_desa || "Area Umum";
    let cluster = props.cluster_name || "Unknown Cluster";
    let fdt = props.fdt_id || "Unknown FDT";

    // Capitalize properly
    kec = kec.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
    kel = kel.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());

    if (!sidebarData.kecamatan[kec]) {
      sidebarData.kecamatan[kec] = { count: 0, desa: {} };
    }
    if (!sidebarData.kecamatan[kec].desa[kel]) {
      sidebarData.kecamatan[kec].desa[kel] = { count: 0, cluster: {} };
    }
    if (!sidebarData.kecamatan[kec].desa[kel].cluster[cluster]) {
      sidebarData.kecamatan[kec].desa[kel].cluster[cluster] = { count: 0, fdt: {} };
    }
    if (!sidebarData.kecamatan[kec].desa[kel].cluster[cluster].fdt[fdt]) {
      sidebarData.kecamatan[kec].desa[kel].cluster[cluster].fdt[fdt] = { count: 0, fats: [] };
    }

    sidebarData.kecamatan[kec].desa[kel].cluster[cluster].fdt[fdt].fats.push(feature);
    sidebarData.kecamatan[kec].desa[kel].cluster[cluster].fdt[fdt].count++;
    sidebarData.kecamatan[kec].desa[kel].cluster[cluster].count++;
    sidebarData.kecamatan[kec].desa[kel].count++;
    sidebarData.kecamatan[kec].count++;
    sidebarData.totalFats++;
  });
}

// Render Sidebar Accordion (Tailwind / Stitch UI Style)
function renderSidebar(filterText = "") {
  const container = document.getElementById("sidebar-accordion");
  container.innerHTML = "";

  const lowerFilter = filterText.toLowerCase();
  let totalFatsRendered = 0;

  let html = `
    <div class="group">
        <div class="w-full px-3 py-2.5 bg-slate-50/80 flex items-center justify-between border-b border-slate-200">
            <div class="flex items-center gap-2">
                <span class="material-icons text-slate-500 text-[18px]">account_tree</span>
                <span class="text-xs font-bold text-slate-800 tracking-wide uppercase">KABUPATEN BANYUMAS</span>
            </div>
            <span class="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 shadow-sm">
                ${sidebarData.totalFats} FAT
            </span>
        </div>
        <div class="pl-1">
    `;

  Object.keys(sidebarData.kecamatan)
    .sort()
    .forEach((kecName) => {
      const kec = sidebarData.kecamatan[kecName];
      let kecHtml = "";
      let kecHasMatches = false;
      let kecExpanded = filterText ? "block" : "none";
      let kecIcon = filterText ? "expand_less" : "expand_more";

      Object.keys(kec.desa)
        .sort()
        .forEach((desaName) => {
          const desa = kec.desa[desaName];
          let desaHtml = "";
          let desaHasMatches = false;
          let desaExpanded = filterText ? "block" : "none";
          let desaIcon = filterText ? "expand_less" : "expand_more";

          Object.keys(desa.cluster)
            .sort()
            .forEach((clusterName) => {
              const cluster = desa.cluster[clusterName];
              let clusterHtml = "";
              let clusterHasMatches = false;
              let clusterExpanded = filterText ? "block" : "none";
              let clusterIcon = filterText ? "expand_less" : "expand_more";

              Object.keys(cluster.fdt)
                .sort()
                .forEach((fdtName) => {
                  const fdt = cluster.fdt[fdtName];

                  let filteredFats = fdt.fats.filter((f) => {
                    const p = f.properties;
                    return (
                      p.fat_id.toLowerCase().includes(lowerFilter) ||
                      p.fdt_id.toLowerCase().includes(lowerFilter) ||
                      p.cluster_name.toLowerCase().includes(lowerFilter)
                    );
                  });

                  if (filterText && filteredFats.length === 0) return;

                  kecHasMatches = true;
                  desaHasMatches = true;
                  clusterHasMatches = true;
                  totalFatsRendered += filteredFats.length;

                  let fatsToRender = filterText ? filteredFats : fdt.fats;
                  let fdtExpanded = filterText ? "block" : "none";
                  let fdtIcon = filterText ? "expand_less" : "expand_more";

                  let fatsHtml = fatsToRender
                    .map((f) => {
                      const props = f.properties;
                      const coords = f.geometry.coordinates;
                      const colorHex = colors[props.color] || colors["gray"];
                      let utilText = props.utilization === "N/A" ? "N/A" : props.utilization + "%";
                      let utilColor = "text-slate-500";
                      if (props.utilization !== "N/A") {
                        if (props.utilization > 70) utilColor = "text-rose-500 font-medium";
                        else if (props.utilization > 50) utilColor = "text-amber-500";
                      }

                      return `
                            <div id="fat-${props.fat_id.replace(/\s+|\./g, "-")}" class="fat-item px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer transition-colors group border-b border-slate-50" onclick="showSidebarDetail('${props.fat_id}')">
                                <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${colorHex}"></span>
                                <div class="flex flex-col">
                                    <span class="text-[11px] font-mono font-medium text-slate-800 group-hover:text-brand-800">${props.fat_id}</span>
                                    <span class="text-[10px] ${utilColor}">Utilisasi: ${utilText}</span>
                                </div>
                            </div>
                        `;
                    })
                    .join("");

                  clusterHtml += `
                        <div class="bg-white border-l border-slate-200 ml-2 mt-1">
                            <div class="px-2 py-1 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onclick="toggleAcc(this)">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-sm bg-blue-500"></span>
                                    <span class="text-[11px] font-mono font-semibold text-slate-700">${fdtName}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="text-[9px] text-slate-400">${fatsToRender.length}</span>
                                    <span class="material-icons text-slate-400 text-[14px] acc-icon">${fdtIcon}</span>
                                </div>
                            </div>
                            <div class="acc-content" style="display: ${fdtExpanded}">
                                ${fatsHtml}
                            </div>
                        </div>
                    `;
                });

              if (clusterHasMatches || (!filterText && desaName !== "Area Umum")) {
                desaHtml += `
                        <div class="bg-slate-50/50 border border-slate-200/60 rounded mt-1 mx-1">
                            <div class="px-2 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onclick="toggleAcc(this)">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-icons text-amber-500 text-[14px]">hub</span>
                                    <span class="text-[11px] font-semibold text-slate-700">${clusterName}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="text-[9px] text-slate-500">${cluster.count} FAT</span>
                                    <span class="material-icons text-slate-400 text-[14px] acc-icon">${clusterIcon}</span>
                                </div>
                            </div>
                            <div class="acc-content" style="display: ${clusterExpanded}">
                                ${clusterHtml}
                            </div>
                        </div>
                    `;
              }
            });

          if (desaHasMatches || (!filterText && kecName !== "Area Lainnya")) {
            kecHtml += `
                    <div class="pl-2 pr-1 py-1 space-y-1">
                        <div class="bg-white border-l border-slate-200 overflow-hidden">
                            <div class="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onclick="toggleAcc(this)">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-icons text-slate-400 text-[15px]">location_city</span>
                                    <span class="text-[11.5px] font-medium text-slate-800">${desaName}</span>
                                </div>
                                <div class="flex items-center gap-1.5 pointer-events-none">
                                    <span class="text-[10px] text-slate-500">${desa.count} FAT</span>
                                    <span class="material-icons text-slate-400 text-[15px] acc-icon">${desaIcon}</span>
                                </div>
                            </div>
                            <div class="pb-1 acc-content" style="display: ${desaExpanded}">
                                ${desaHtml}
                            </div>
                        </div>
                    </div>
                `;
          }
        });

      if (kecHasMatches || !filterText) {
        html += `
                <div class="border-l-2 border-slate-200 hover:border-brand-600 transition-colors my-1 ml-1" id="kec-${kecName.replace(/\s+/g, "-")}">
                    <div class="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onclick="toggleAcc(this)">
                        <div class="flex items-center gap-2">
                            <span class="material-icons text-brand-700 text-[16px]">share</span>
                            <span class="text-xs font-semibold text-brand-900">${kecName}</span>
                        </div>
                        <div class="flex items-center gap-2 pointer-events-none">
                            <span class="text-[10px] font-normal text-slate-500">${kec.count} FAT</span>
                            <span class="material-icons text-slate-400 text-[16px] acc-icon">${kecIcon}</span>
                        </div>
                    </div>
                    <div class="acc-content" style="display: ${kecExpanded}">
                        ${kecHtml}
                    </div>
                </div>
            `;
      }
    });

  html += `</div></div>`;

  if (totalFatsRendered === 0 && filterText) {
    container.innerHTML =
      '<div class="p-4 text-center text-xs text-slate-500">Tidak ada data yang cocok dengan pencarian</div>';
  } else {
    container.innerHTML = html;
  }
}

window.toggleAcc = function (el) {
  const content = el.nextElementSibling;
  const icon = el.querySelector(".acc-icon");
  if (content.style.display === "block") {
    content.style.display = "none";
    if (icon) icon.innerText = "expand_more";
  } else {
    content.style.display = "block";
    if (icon) icon.innerText = "expand_less";
  }
};

window.showSidebarDetail = function (fatId) {
  const detailPanel = document.getElementById("sidebar-detail");
  const contentContainer = document.getElementById("sidebar-detail-content");

  const feature = fatData.find((f) => f.properties.fat_id === fatId);
  if (!feature) return;

  const p = feature.properties;
  const coords = feature.geometry.coordinates;
  const colorHex = colors[p.color] || colors["gray"];

  let utilText = p.utilization === "N/A" ? "Data Tidak Tersedia" : p.utilization + "%";

  const detailHtml = `
        <div class="flex flex-col gap-4">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm" style="background-color: ${colorHex}20">
                    <span class="material-icons" style="color: ${colorHex}">router</span>
                </div>
                <div>
                    <h2 class="text-sm font-bold text-slate-900 font-mono">${p.fat_id}</h2>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="w-2 h-2 rounded-full" style="background-color: ${colorHex}"></span>
                        <span class="text-[11px] text-slate-600">Status: <span class="font-semibold">${utilText}</span></span>
                    </div>
                </div>
            </div>
            
            <div class="bg-slate-50 border border-slate-200 rounded-md p-3 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Kapasitas Port</span>
                    <span class="text-slate-800 font-medium">${p.capacity === "N/A" ? "-" : p.capacity + " Port"}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Port Kosong</span>
                    <span class="text-slate-800 font-medium">${p.available === "N/A" ? "-" : p.available + " Port"}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Induk FDT</span>
                    <span class="text-slate-800 font-mono">${p.fdt_id}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Cluster / Area</span>
                    <span class="text-slate-800">${p.cluster_name}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Lokasi Administratif</span>
                    <span class="text-slate-800">Kec. ${p.raw_kecamatan}, Kel. ${p.raw_desa}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Koordinat GPS</span>
                    <span class="text-slate-800 font-mono text-[10px]">${coords[1]}, ${coords[0]}</span>
                </div>
            </div>
            
            <div class="mt-2">
                <button onclick="window.panToMarker(${coords[1]}, ${coords[0]})" class="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5">
                    <span class="material-icons text-[16px]">my_location</span>
                    Pusatkan di Peta
                </button>
            </div>
        </div>
    `;

  contentContainer.innerHTML = detailHtml;
  detailPanel.classList.remove("translate-x-full");
  focusFat(coords[1], coords[0], p.fat_id, "fat");
};

document.addEventListener("DOMContentLoaded", () => {
  const btnBack = document.getElementById("btn-back-sidebar");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      document.getElementById("sidebar-detail").classList.add("translate-x-full");
    });
  }
});

let activeHighlight = null;

window.focusFat = function (lat, lon, id, type) {
  // highlight in UI
  document.querySelectorAll(".fat-item").forEach((el) => {
    el.classList.remove("bg-brand-50", "border-l-2", "border-brand-800");
  });
  const prefix = type === "fdt" ? "fdt" : "fat";
  const item = document.getElementById(`${prefix}-${id.replace(/\s+|\./g, "-")}`);
  if (item) {
    item.classList.add("bg-brand-50", "border-l-2", "border-brand-800");
  }

  // Visual map highlight
  if (activeHighlight) {
    map.removeLayer(activeHighlight);
  }
  const highlightIcon = L.divIcon({
    html: `<div class="w-12 h-12 bg-brand-500/30 border-2 border-brand-600 rounded-full animate-ping"></div>`,
    className: "pointer-events-none",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
  activeHighlight = L.marker([lat, lon], { icon: highlightIcon, interactive: false }).addTo(map);
};

window.panToMarker = function (lat, lon) {
  // Use setView with animate: false to completely eliminate cinematic lag
  map.setView([lat, lon], 19, { animate: false });
};

// Sidebar Interaction - Highlight from Map click
function highlightSidebarItem(clusterName, fatId) {
  showSidebarDetail(fatId);
}

// Sidebar Search Filter
document.getElementById("sidebar-search").addEventListener("input", (e) => {
  renderSidebar(e.target.value);
});

// ============================================
// Coverage Checker Logic
// ============================================

// Haversine formula to calculate distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const p1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

document.getElementById("btn-search-address").addEventListener("click", async () => {
  const query = document.getElementById("address-search").value;
  if (!query) return alert("Masukkan alamat terlebih dahulu");

  try {
    // Nominatim Geocoding API
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Purwokerto, Indonesia")}&limit=1`,
    );
    const data = await res.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      checkCoverage(lat, lon, query);
    } else {
      alert("Alamat tidak ditemukan. Coba masukkan lebih spesifik.");
    }
  } catch (e) {
    console.error("Geocoding error", e);
    alert("Terjadi kesalahan saat mencari alamat.");
  }
});

// GPS Button
document.getElementById("btn-gps").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        checkCoverage(position.coords.latitude, position.coords.longitude, "Lokasi Saya");
      },
      (error) => {
        alert("Gagal mendapatkan lokasi GPS: " + error.message);
      },
    );
  } else {
    alert("Browser Anda tidak mendukung geolokasi.");
  }
});

function checkCoverage(userLat, userLon, addressStr) {
  if (searchMarker) map.removeLayer(searchMarker);

  // Add user marker
  searchMarker = L.marker([userLat, userLon], {
    icon: L.divIcon({
      html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.6);"></div>`,
      className: "user-marker",
    }),
  }).addTo(map);

  map.flyTo([userLat, userLon], 16);

  // Find nearest FAT
  let nearestFat = null;
  let minDistance = Infinity;

  fatData.forEach((fat) => {
    const coords = fat.geometry.coordinates;
    const dist = getDistance(userLat, userLon, coords[1], coords[0]);
    if (dist < minDistance) {
      minDistance = dist;
      nearestFat = fat;
    }
  });

  const banner = document.getElementById("coverage-banner");
  banner.classList.remove("hidden", "banner-green", "banner-orange", "banner-red");

  // Logic: 150 meters radius
  if (minDistance <= 150) {
    const props = nearestFat.properties;
    if (props.color === "black" || props.utilization >= 100) {
      // Full
      banner.classList.add("banner-orange");
      banner.innerHTML = `⚠️ TERCOVER TAPI PORT PENUH<br><span style="font-size:0.8rem; font-weight:normal;">Jarak ke FAT ${props.fat_id}: ${Math.round(minDistance)} meter. Hubungi sales untuk antrian.</span>`;
    } else {
      // Available
      banner.classList.add("banner-green");
      banner.innerHTML = `✅ TERCOVER & SIAP PASANG<br><span style="font-size:0.8rem; font-weight:normal;">Jarak ke FAT terdekat (${props.fat_id}): ${Math.round(minDistance)} meter. Port Tersedia!</span>`;

      // Open sidebar and map to this FAT to show details
      highlightSidebarItem(props.cluster_name, props.fat_id);
    }
  } else {
    // Not covered
    banner.classList.add("banner-red");
    banner.innerHTML = `❌ BELUM TERCOVER<br><span style="font-size:0.8rem; font-weight:normal;">Jarak ke tiang terdekat: ${Math.round(minDistance)} meter (> 150m). Lokasi telah dicatat.</span>`;

    // Log to heatmap via API
    fetch("/api/heatmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: userLat, lon: userLon, address: addressStr }),
    }).catch((err) => console.error("Failed to log uncovered area", err));
  }
}

// Start app
window.onload = initMap;
