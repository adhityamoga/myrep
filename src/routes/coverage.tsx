import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Info,
  Layers,
  LocateFixed,
  MapPin,
  MessageCircle,
  Network,
  Radio,
  Search,
  Share2,
  Sparkles,
  X,
} from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker, Circle, Polyline } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";

import brandLogo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/coverage")({
  head: () => ({
    meta: [
      { title: "Peta Jangkauan & GIS Fiber Purwokerto | MyRepublic" },
      {
        name: "description",
        content:
          "Peta interaktif jaringan fiber optic & tiang FAT MyRepublic se-Purwokerto dan Banyumas.",
      },
      { property: "og:title", content: "Peta Jangkauan & GIS Fiber Purwokerto | MyRepublic" },
    ],
  }),
  component: CoveragePage,
});

interface FatFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: {
    fat_id: string;
    fdt_id: string;
    cluster_id: string;
    cluster_name: string;
    raw_kecamatan?: string;
    raw_desa?: string;
    capacity: number | string;
    available: number | string;
    utilization: number | string;
    color: string;
  };
}

interface FdtFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    fdt_id: string;
    cluster_name: string;
    raw_kecamatan?: string;
    raw_desa?: string;
    fats_count?: number;
  };
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const colorMap: Record<string, string> = {
  green: "#10b981",
  lightgreen: "#34d399",
  yellow: "#f59e0b",
  orange: "#f97316",
  red: "#ef4444",
  black: "#1e293b",
  gray: "#8b5cf6",
};

function CoveragePage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const coverageCircleRef = useRef<Circle | null>(null);
  const connectionLineRef = useRef<Polyline | null>(null);

  const [fatList, setFatList] = useState<FatFeature[]>([]);
  const [fdtList, setFdtList] = useState<FdtFeature[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFat, setSelectedFat] = useState<FatFeature | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    status: "covered" | "full" | "uncovered";
    distance: number;
    nearest: FatFeature | null;
  } | null>(null);

  const [openKecamatan, setOpenKecamatan] = useState<Record<string, boolean>>({});

  // 1. Fetch compact FAT data (<900KB instead of 4.8MB)
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const res = await fetch("/data/fat_compact.json");
        const compactData = await res.json();
        if (active && Array.isArray(compactData)) {
          const mappedFats: FatFeature[] = compactData.map((f: any) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [f[3], f[2]], // [lon, lat]
            },
            properties: {
              fat_id: f[0],
              fdt_id: f[0].split(".")[0] || "FDT",
              cluster_id: f[1],
              cluster_name: f[1],
              raw_kecamatan: f[7] || "PURWOKERTO",
              capacity: f[5],
              available: f[6],
              utilization: f[4] === 1 ? 100 : 50,
              color: f[4] === 1 ? "black" : "green",
            },
          }));
          setFatList(mappedFats);
        }
      } catch (err) {
        console.error("Gagal memuat data GIS:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // 2. Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let map: LeafletMap;

    async function init() {
      const L = (await import("leaflet")).default;

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();

      map = L.map(mapContainerRef.current, {
        center: [-7.4241, 109.2302],
        zoom: 14,
        zoomControl: false,
        preferCanvas: true,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Render markers on canvas
  useEffect(() => {
    if (!mapInstanceRef.current || !fatList.length) return;

    async function renderMarkers() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      const layer = markersLayerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      fatList.forEach((fat) => {
        const [lon, lat] = fat.geometry.coordinates;
        const color = colorMap[fat.properties.color] || "#8b5cf6";

        const marker = L.circleMarker([lat, lon], {
          radius: 5,
          fillColor: color,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.on("click", () => {
          setSelectedFat(fat);
          map.setView([lat, lon], 17, { animate: true });
        });

        layer.addLayer(marker);
      });
    }

    renderMarkers();
  }, [fatList]);

  // Grouping by Kecamatan for sidebar
  const hierarchyData = useMemo(() => {
    const mapByKec: Record<string, FatFeature[]> = {};
    const searchLower = sidebarSearch.toLowerCase().trim();

    fatList.forEach((fat) => {
      const kec = (fat.properties.raw_kecamatan || "PURWOKERTO LAINNYA").toUpperCase();
      const fatId = fat.properties.fat_id.toLowerCase();
      const cluster = fat.properties.cluster_name.toLowerCase();

      if (searchLower && !fatId.includes(searchLower) && !cluster.includes(searchLower)) {
        return;
      }

      if (!mapByKec[kec]) mapByKec[kec] = [];
      mapByKec[kec]!.push(fat);
    });

    return mapByKec;
  }, [fatList, sidebarSearch]);

  // Click on FAT from sidebar
  function handleSelectFatFromSidebar(fat: FatFeature) {
    setSelectedFat(fat);
    const [lon, lat] = fat.geometry.coordinates;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 18, { animate: true });
    }
  }

  // Address search & coverage check
  async function handleCheckAddress(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = addressSearch.trim();
    if (!q || !fatList.length) return;

    setIsSearchingAddress(true);
    try {
      const queryParam = q.toLowerCase().includes("purwokerto")
        ? `${q}, Indonesia`
        : `${q}, Purwokerto, Banyumas, Indonesia`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          queryParam,
        )}&limit=1`,
        { headers: { "Accept-Language": "id" } },
      );
      const data = await res.json();

      if (data && data[0]?.lat && data[0]?.lon) {
        const userLat = parseFloat(data[0].lat);
        const userLon = parseFloat(data[0].lon);

        // Find nearest FAT
        let nearest: FatFeature | null = null;
        let minDist = Infinity;

        for (const fat of fatList) {
          const [fLon, fLat] = fat.geometry.coordinates;
          const d = getDistanceMeters(userLat, userLon, fLat, fLon);
          if (d < minDist) {
            minDist = d;
            nearest = fat;
          }
        }

        const isCovered = minDist <= 150;
        const isFull =
          nearest?.properties.color === "black" ||
          (typeof nearest?.properties.utilization === "number" &&
            nearest.properties.utilization >= 100);

        const status = isCovered ? (isFull ? "full" : "covered") : "uncovered";
        const distRounded = Math.round(minDist);

        setCheckResult({ status, distance: distRounded, nearest });
        if (nearest) setSelectedFat(nearest);

        // Visual on map
        if (mapInstanceRef.current) {
          const L = (await import("leaflet")).default;
          const map = mapInstanceRef.current;

          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          if (coverageCircleRef.current) map.removeLayer(coverageCircleRef.current);
          if (connectionLineRef.current) map.removeLayer(connectionLineRef.current);

          const userPin = L.divIcon({
            html: `
              <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="width: 14px; height: 14px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
              </div>
            `,
            className: "user-portal-pin",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userMarkerRef.current = L.marker([userLat, userLon], { icon: userPin }).addTo(map);

          const circleColor = isCovered ? "#10b981" : "#ef4444";
          coverageCircleRef.current = L.circle([userLat, userLon], {
            radius: 150,
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: "4, 6",
          }).addTo(map);

          if (nearest) {
            const [nLon, nLat] = nearest.geometry.coordinates;
            connectionLineRef.current = L.polyline(
              [
                [userLat, userLon],
                [nLat, nLon],
              ],
              {
                color: circleColor,
                weight: 2.5,
                dashArray: "6, 6",
              },
            ).addTo(map);
          }

          map.setView([userLat, userLon], 16, { animate: true });
        }
      } else {
        alert("Alamat tidak ditemukan di peta. Coba masukkan nama jalan atau kelurahan terdekat.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mencari alamat.");
    } finally {
      setIsSearchingAddress(false);
    }
  }

  // Handle GPS location
  function handleGps() {
    if (!navigator.geolocation) return alert("Browser tidak mendukung GPS.");
    setIsSearchingAddress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setAddressSearch("Lokasi GPS Saya");
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        let nearest: FatFeature | null = null;
        let minDist = Infinity;

        for (const fat of fatList) {
          const [fLon, fLat] = fat.geometry.coordinates;
          const d = getDistanceMeters(userLat, userLon, fLat, fLon);
          if (d < minDist) {
            minDist = d;
            nearest = fat;
          }
        }

        const isCovered = minDist <= 150;
        const status = isCovered ? "covered" : "uncovered";
        setCheckResult({ status, distance: Math.round(minDist), nearest });
        if (nearest) setSelectedFat(nearest);

        if (mapInstanceRef.current) {
          const L = (await import("leaflet")).default;
          const map = mapInstanceRef.current;
          map.setView([userLat, userLon], 16, { animate: true });
        }
        setIsSearchingAddress(false);
      },
      (err) => {
        setIsSearchingAddress(false);
        alert(`Gagal membaca GPS: ${err.message}`);
      },
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background font-sans text-foreground select-none">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div className="flex items-center gap-2.5">
            <img src={brandLogo} alt="MyRepublic" className="h-6 w-auto object-contain sm:h-7" />
            <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold text-brand tracking-wider uppercase">
              GIS Portal
            </span>
          </div>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground border-l border-border pl-4 md:flex">
            <span>
              Area: <strong className="text-foreground font-bold">Purwokerto & Banyumas</strong>
            </span>
            <span>•</span>
            <span>
              Total Tiang FAT:{" "}
              <strong className="text-brand font-black">
                {loading ? "..." : fatList.length.toLocaleString()} Titik
              </strong>
            </span>
          </div>
        </div>

        {/* Address check bar inside header */}
        <form onSubmit={handleCheckAddress} className="flex items-center gap-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              placeholder="Cek alamat (Jalan, Kelurahan)..."
              className="h-8 w-44 rounded-md border border-input bg-background pl-2.5 pr-2 text-xs outline-none focus:border-brand sm:w-64"
            />
          </div>
          <Button
            type="submit"
            variant="brand"
            size="sm"
            className="h-8 px-3 text-xs font-bold gap-1"
            disabled={isSearchingAddress || loading}
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Cek</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGps}
            disabled={isSearchingAddress || loading}
            className="h-8 w-8 p-0"
            title="Lokasi GPS Saya"
          >
            <LocateFixed className="size-3.5 text-muted-foreground hover:text-brand" />
          </Button>
        </form>
      </header>

      {/* Main Workspace (Sidebar + Map) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar: Network Hierarchy & Search */}
        <aside className="relative flex w-80 shrink-0 flex-col border-r border-border bg-card shadow-sm sm:w-96 z-20 overflow-hidden">
          {/* Search FAT or Cluster */}
          <div className="border-b border-border bg-muted/40 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Cari ID FAT atau Cluster..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Quick Result Alert if checked */}
          {checkResult ? (
            <div
              className={`border-b p-3 text-xs ${
                checkResult.status === "covered"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : checkResult.status === "full"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-200"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-950 dark:text-rose-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold uppercase">
                  {checkResult.status === "covered"
                    ? "Tercover & Siap Pasang"
                    : checkResult.status === "full"
                      ? "Tercover (Port Penuh)"
                      : "Belum Tercover"}
                </span>
                <span className="rounded bg-background/80 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                  {checkResult.distance} m
                </span>
              </div>
              <p className="mt-1 text-[11px] opacity-80">
                {checkResult.status === "covered"
                  ? "Tiang fiber siap dipasangi kabel ke rumah."
                  : checkResult.status === "full"
                    ? "Port penuh, hubungi sales untuk reservasi."
                    : "Jarak melebihi radius aman pemasangan 150m."}
              </p>
            </div>
          ) : null}

          {/* Hierarchy List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Wilayah & Tiang Fiber ({Object.keys(hierarchyData).length} Kecamatan)
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8 text-xs text-muted-foreground gap-2">
                <Radio className="size-4 text-brand animate-spin" />
                <span>Memuat data GIS...</span>
              </div>
            ) : Object.keys(hierarchyData).length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                Tidak ada data tiang yang cocok dengan pencarian "{sidebarSearch}".
              </p>
            ) : (
              <div className="space-y-1">
                {Object.entries(hierarchyData).map(([kec, fats]) => {
                  const isOpen = !!openKecamatan[kec] || !!sidebarSearch;
                  return (
                    <div key={kec} className="rounded-md border border-border bg-background">
                      <button
                        type="button"
                        onClick={() => setOpenKecamatan((prev) => ({ ...prev, [kec]: !prev[kec] }))}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold hover:bg-muted/50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="size-3.5 text-brand shrink-0" />
                          <span className="truncate">{kec}</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                          <span className="text-[10px] font-normal">{fats.length} FAT</span>
                          {isOpen ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronRight className="size-3.5" />
                          )}
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="max-h-60 overflow-y-auto border-t border-border/60 bg-muted/20 p-1 space-y-0.5">
                          {fats.slice(0, 50).map((fat) => {
                            const isSelected =
                              selectedFat?.properties.fat_id === fat.properties.fat_id;
                            const color = colorMap[fat.properties.color] || "#8b5cf6";
                            return (
                              <button
                                key={fat.properties.fat_id}
                                type="button"
                                onClick={() => handleSelectFatFromSidebar(fat)}
                                className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] transition-colors ${
                                  isSelected
                                    ? "bg-brand text-brand-foreground font-bold"
                                    : "hover:bg-muted text-foreground"
                                }`}
                              >
                                <span className="flex items-center gap-2 truncate">
                                  <span
                                    className="size-2 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-mono truncate">
                                    {fat.properties.fat_id}
                                  </span>
                                </span>
                                <span
                                  className={`text-[9px] truncate max-w-[110px] ${
                                    isSelected
                                      ? "text-brand-foreground/80"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {fat.properties.cluster_name}
                                </span>
                              </button>
                            );
                          })}
                          {fats.length > 50 ? (
                            <p className="p-1 text-center text-[10px] text-muted-foreground italic">
                              + {fats.length - 50} FAT lainnya (gunakan pencarian untuk spesifik)
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Map Container */}
        <main className="relative flex-1 bg-slate-100">
          <div ref={mapContainerRef} className="size-full z-10" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/90 px-3 py-2 text-xs font-bold backdrop-blur shadow-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-emerald-500"></span> Port Tersedia
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-amber-500"></span> Utilisasi Sedang
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-purple-600"></span> Fiber Active
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-slate-800"></span> Port Penuh
            </span>
          </div>

          {/* Floating Detail Panel for Selected FAT */}
          {selectedFat ? (
            <div className="absolute top-4 right-4 z-20 w-80 rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur sm:w-96">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor: colorMap[selectedFat.properties.color] || "#8b5cf6",
                      }}
                    />
                    <h3 className="font-mono text-sm font-black text-brand truncate">
                      {selectedFat.properties.fat_id}
                    </h3>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground">
                    Cluster: {selectedFat.properties.cluster_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFat(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-muted/50 p-2">
                  <span className="text-[10px] text-muted-foreground font-medium">Kapasitas</span>
                  <p className="font-bold font-mono text-foreground">
                    {selectedFat.properties.capacity} Port
                  </p>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <span className="text-[10px] text-muted-foreground font-medium">Tersedia</span>
                  <p className="font-bold font-mono text-emerald-600">
                    {selectedFat.properties.available} Port
                  </p>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <span className="text-[10px] text-muted-foreground font-medium">FDT Induk</span>
                  <p className="font-bold font-mono truncate text-foreground">
                    {selectedFat.properties.fdt_id}
                  </p>
                </div>
                <div className="rounded bg-muted/50 p-2">
                  <span className="text-[10px] text-muted-foreground font-medium">Kecamatan</span>
                  <p className="font-bold truncate text-foreground">
                    {selectedFat.properties.raw_kecamatan || "Purwokerto"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="signal"
                  size="sm"
                  className="w-full font-bold gap-2 text-xs"
                  asChild
                >
                  <a
                    href={`https://wa.me/6281234567890?text=Halo%20Admin%20MyRepublic%20Purwokerto%2C%20saya%20tertarik%20pasang%20internet%20di%20tiang%20FAT%20${encodeURIComponent(
                      selectedFat.properties.fat_id,
                    )}%20(${encodeURIComponent(selectedFat.properties.cluster_name)})`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="size-3.5" />
                    <span>Daftar dengan FAT Ini</span>
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
