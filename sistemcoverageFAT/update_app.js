const fs = require("fs");
let content = fs.readFileSync("public/js/app.js", "utf8");

const startIdx = content.indexOf("function renderSidebar(filterText");
const endIdx = content.indexOf("// ============================================", startIdx);

const newRenderSidebar = `function renderSidebar(filterText = '') {
    const container = document.getElementById('sidebar-accordion');
    container.innerHTML = '';
    
    const lowerFilter = filterText.toLowerCase();
    let totalFatsRendered = 0;
    
    let html = \`
    <div class="group">
        <div class="w-full px-3 py-2.5 bg-slate-50/80 flex items-center justify-between border-b border-slate-200">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-slate-500 text-[18px]">domain</span>
                <span class="text-xs font-bold text-slate-800 tracking-wide uppercase">KABUPATEN BANYUMAS</span>
            </div>
            <span class="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 shadow-sm">
                \${sidebarData.totalFats} FAT
            </span>
        </div>
        <div class="pl-1">
    \`;
    
    Object.keys(sidebarData.kecamatan).sort().forEach(kecName => {
        const kec = sidebarData.kecamatan[kecName];
        let kecHtml = '';
        let kecHasMatches = false;
        let kecExpanded = filterText ? 'block' : 'none';
        let kecIcon = filterText ? 'expand_less' : 'expand_more';
        
        Object.keys(kec.desa).sort().forEach(desaName => {
            const desa = kec.desa[desaName];
            let desaHtml = '';
            let desaHasMatches = false;
            let desaExpanded = filterText ? 'block' : 'none';
            let desaIcon = filterText ? 'expand_less' : 'expand_more';
            
            Object.keys(desa.cluster).sort().forEach(clusterName => {
                const cluster = desa.cluster[clusterName];
                let clusterHtml = '';
                let clusterHasMatches = false;
                let clusterExpanded = filterText ? 'block' : 'none';
                let clusterIcon = filterText ? 'expand_less' : 'expand_more';
                
                Object.keys(cluster.fdt).sort().forEach(fdtName => {
                    const fdt = cluster.fdt[fdtName];
                    
                    let filteredFats = fdt.fats.filter(f => {
                        const p = f.properties;
                        return p.fat_id.toLowerCase().includes(lowerFilter) || 
                               p.fdt_id.toLowerCase().includes(lowerFilter) ||
                               p.cluster_name.toLowerCase().includes(lowerFilter);
                    });
                    
                    if (filterText && filteredFats.length === 0) return;
                    
                    kecHasMatches = true;
                    desaHasMatches = true;
                    clusterHasMatches = true;
                    totalFatsRendered += filteredFats.length;
                    
                    let fatsToRender = filterText ? filteredFats : fdt.fats;
                    let fdtExpanded = filterText ? 'block' : 'none';
                    let fdtIcon = filterText ? 'expand_less' : 'expand_more';
                    
                    let fatsHtml = fatsToRender.map(f => {
                        const props = f.properties;
                        const coords = f.geometry.coordinates;
                        const colorHex = colors[props.color] || colors['gray'];
                        let utilText = props.utilization === 'N/A' ? 'N/A' : props.utilization + '%';
                        let utilColor = 'text-slate-500';
                        if (props.utilization !== 'N/A') {
                            if(props.utilization > 70) utilColor = 'text-rose-500 font-medium';
                            else if(props.utilization > 50) utilColor = 'text-amber-500';
                        }
                        
                        return \`
                            <div id="fat-\${props.fat_id.replace(/\\s+|\\./g, '-')}" class="fat-item px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer transition-colors group border-b border-slate-50" onclick="showSidebarDetail('\${props.fat_id}')">
                                <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: \${colorHex}"></span>
                                <div class="flex flex-col">
                                    <span class="text-[11px] font-mono font-medium text-slate-800 group-hover:text-brand-800">\${props.fat_id}</span>
                                    <span class="text-[10px] \${utilColor}">Utilisasi: \${utilText}</span>
                                </div>
                            </div>
                        \`;
                    }).join('');
                    
                    clusterHtml += \`
                        <div class="bg-white border-l border-slate-200 ml-2 mt-1">
                            <div class="px-2 py-1 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onclick="toggleAcc(this)">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-sm bg-blue-500"></span>
                                    <span class="text-[11px] font-mono font-semibold text-slate-700">\${fdtName}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="text-[9px] text-slate-400">\${fatsToRender.length}</span>
                                    <span class="material-symbols-outlined text-slate-400 text-[14px] acc-icon">\${fdtIcon}</span>
                                </div>
                            </div>
                            <div class="acc-content" style="display: \${fdtExpanded}">
                                \${fatsHtml}
                            </div>
                        </div>
                    \`;
                });
                
                if (clusterHasMatches || (!filterText && desaName !== 'Area Umum')) {
                    desaHtml += \`
                        <div class="bg-slate-50/50 border border-slate-200/60 rounded mt-1 mx-1">
                            <div class="px-2 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onclick="toggleAcc(this)">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-amber-500 text-[14px]">hub</span>
                                    <span class="text-[11px] font-semibold text-slate-700">\${clusterName}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <span class="text-[9px] text-slate-500">\${cluster.count} FAT</span>
                                    <span class="material-symbols-outlined text-slate-400 text-[14px] acc-icon">\${clusterIcon}</span>
                                </div>
                            </div>
                            <div class="acc-content" style="display: \${clusterExpanded}">
                                \${clusterHtml}
                            </div>
                        </div>
                    \`;
                }
            });
            
            if (desaHasMatches || (!filterText && kecName !== 'Area Lainnya')) {
                kecHtml += \`
                    <div class="pl-2 pr-1 py-1 space-y-1">
                        <div class="bg-white border-l border-slate-200 overflow-hidden">
                            <div class="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onclick="toggleAcc(this)">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-slate-400 text-[15px]">location_city</span>
                                    <span class="text-[11.5px] font-medium text-slate-800">\${desaName}</span>
                                </div>
                                <div class="flex items-center gap-1.5 pointer-events-none">
                                    <span class="text-[10px] text-slate-500">\${desa.count} FAT</span>
                                    <span class="material-symbols-outlined text-slate-400 text-[15px] acc-icon">\${desaIcon}</span>
                                </div>
                            </div>
                            <div class="pb-1 acc-content" style="display: \${desaExpanded}">
                                \${desaHtml}
                            </div>
                        </div>
                    </div>
                \`;
            }
        });
        
        if (kecHasMatches || !filterText) {
            html += \`
                <div class="border-l-2 border-slate-200 hover:border-brand-600 transition-colors my-1 ml-1" id="kec-\${kecName.replace(/\\s+/g, '-')}">
                    <div class="px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors" onclick="toggleAcc(this)">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-brand-700 text-[16px]">folder_open</span>
                            <span class="text-xs font-semibold text-brand-900">\${kecName}</span>
                        </div>
                        <div class="flex items-center gap-2 pointer-events-none">
                            <span class="text-[10px] font-normal text-slate-500">\${kec.count} FAT</span>
                            <span class="material-symbols-outlined text-slate-400 text-[16px] acc-icon">\${kecIcon}</span>
                        </div>
                    </div>
                    <div class="acc-content" style="display: \${kecExpanded}">
                        \${kecHtml}
                    </div>
                </div>
            \`;
        }
    });
    
    html += \`</div></div>\`; 
    
    if (totalFatsRendered === 0 && filterText) {
        container.innerHTML = '<div class="p-4 text-center text-xs text-slate-500">Tidak ada data yang cocok dengan pencarian</div>';
    } else {
        container.innerHTML = html;
    }
}

window.toggleAcc = function(el) {
    const content = el.nextElementSibling;
    const icon = el.querySelector('.acc-icon');
    if (content.style.display === 'block') {
        content.style.display = 'none';
        if (icon) icon.innerText = 'expand_more';
    } else {
        content.style.display = 'block';
        if (icon) icon.innerText = 'expand_less';
    }
}

window.showSidebarDetail = function(fatId) {
    const detailPanel = document.getElementById('sidebar-detail');
    const contentContainer = document.getElementById('sidebar-detail-content');
    
    const feature = fatData.find(f => f.properties.fat_id === fatId);
    if (!feature) return;
    
    const p = feature.properties;
    const coords = feature.geometry.coordinates;
    const colorHex = colors[p.color] || colors['gray'];
    
    let utilText = p.utilization === 'N/A' ? 'Data Tidak Tersedia' : p.utilization + '%';
    
    const detailHtml = \`
        <div class="flex flex-col gap-4">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-200 shadow-sm" style="background-color: \${colorHex}20">
                    <span class="material-symbols-outlined" style="color: \${colorHex}">router</span>
                </div>
                <div>
                    <h2 class="text-sm font-bold text-slate-900 font-mono">\${p.fat_id}</h2>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="w-2 h-2 rounded-full" style="background-color: \${colorHex}"></span>
                        <span class="text-[11px] text-slate-600">Status: <span class="font-semibold">\${utilText}</span></span>
                    </div>
                </div>
            </div>
            
            <div class="bg-slate-50 border border-slate-200 rounded-md p-3 grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Kapasitas Port</span>
                    <span class="text-slate-800 font-medium">\${p.capacity === 'N/A' ? '-' : p.capacity + ' Port'}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Port Kosong</span>
                    <span class="text-slate-800 font-medium">\${p.available === 'N/A' ? '-' : p.available + ' Port'}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Induk FDT</span>
                    <span class="text-slate-800 font-mono">\${p.fdt_id}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Cluster / Area</span>
                    <span class="text-slate-800">\${p.cluster_name}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Lokasi Administratif</span>
                    <span class="text-slate-800">Kec. \${p.raw_kecamatan}, Kel. \${p.raw_desa}</span>
                </div>
                <div class="flex flex-col col-span-2">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Koordinat GPS</span>
                    <span class="text-slate-800 font-mono text-[10px]">\${coords[1]}, \${coords[0]}</span>
                </div>
            </div>
            
            <div class="mt-2">
                <button onclick="focusFat(\${coords[1]}, \${coords[0]}, '\${p.fat_id}', 'fat')" class="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-[16px]">my_location</span>
                    Pusatkan di Peta
                </button>
            </div>
        </div>
    \`;
    
    contentContainer.innerHTML = detailHtml;
    detailPanel.classList.remove('translate-x-full');
    focusFat(coords[1], coords[0], p.fat_id, 'fat');
}

document.addEventListener('DOMContentLoaded', () => {
    const btnBack = document.getElementById('btn-back-sidebar');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            document.getElementById('sidebar-detail').classList.add('translate-x-full');
        });
    }
});

window.focusFat = function(lat, lon, id, type) {
    map.flyTo([lat, lon], 18);
    // highlight in UI
    document.querySelectorAll('.fat-item').forEach(el => {
        el.classList.remove('bg-brand-50', 'border-l-2', 'border-brand-800');
    });
    const prefix = type === 'fdt' ? 'fdt' : 'fat';
    const item = document.getElementById(\`\${prefix}-\${id.replace(/\\s+|\\./g, '-')}\`);
    if (item) {
        item.classList.add('bg-brand-50', 'border-l-2', 'border-brand-800');
    }
}

// Sidebar Interaction - Highlight from Map click
function highlightSidebarItem(clusterName, fatId) {
    showSidebarDetail(fatId);
}

// Sidebar Search Filter
document.getElementById('sidebar-search').addEventListener('input', (e) => {
    renderSidebar(e.target.value);
});

\n\n`;

content = content.substring(0, startIdx) + newRenderSidebar + content.substring(endIdx);
fs.writeFileSync("public/js/app.js", content, "utf8");
