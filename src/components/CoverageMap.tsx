import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Compass,
  Crosshair,
  ExternalLink,
  Info,
  Layers,
  Loader2,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Radio,
  Search,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker, Circle, Polyline } from "leaflet";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";

// Compact format: [0: fat_id, 1: cluster_name, 2: lat, 3: lon, 4: isFull, 5: capacity, 6: available, 7: raw_kecamatan]
export type CompactFat = [
  string,
  string,
  number,
  number,
  number,
  number | string,
  number | string,
  string,
];

export interface KecamatanInfo {
  id: string;
  name: string;
  center: [number, number];
  clusters: number;
  fats: number;
  hps: number;
  kelurahans: string[];
}

export interface ClusterInfo {
  id: string;
  name: string;
  kec: string;
  kel: string;
  lat: number;
  lon: number;
  fats: number;
  hps: number;
}

export interface CoverageMetadata {
  totalFats: number;
  totalClusters: number;
  totalKecamatans: number;
  kecamatans: KecamatanInfo[];
  clusters: ClusterInfo[];
}

export interface CoverageResult {
  status: "covered" | "full" | "uncovered";
  distanceMeters: number;
  nearestFat: CompactFat | null;
  userLat: number;
  userLon: number;
  addressQuery: string;
}

// Module-level in-memory cache
let globalFatCache: CompactFat[] | null = null;
let globalFatPromise: Promise<CompactFat[]> | null = null;

let globalMetadataCache: CoverageMetadata | null = null;
let globalMetadataPromise: Promise<CoverageMetadata> | null = null;

async function getOrFetchFatData(): Promise<CompactFat[]> {
  if (globalFatCache && globalFatCache.length > 0) return globalFatCache;
  if (!globalFatPromise) {
    globalFatPromise = fetch("/data/fat_compact.json")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengunduh data jangkauan FAT");
        return res.json();
      })
      .then((data: CompactFat[]) => {
        globalFatCache = data;
        return data;
      })
      .catch((err) => {
        globalFatPromise = null;
        throw err;
      });
  }
  return globalFatPromise;
}

async function getOrFetchMetadata(): Promise<CoverageMetadata> {
  if (globalMetadataCache) return globalMetadataCache;
  if (!globalMetadataPromise) {
    globalMetadataPromise = fetch("/data/coverage_metadata.json")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengunduh data metadata cluster");
        return res.json();
      })
      .then((data: CoverageMetadata) => {
        globalMetadataCache = data;
        return data;
      })
      .catch((err) => {
        globalMetadataPromise = null;
        throw err;
      });
  }
  return globalMetadataPromise;
}

// Haversine formula for distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

interface CoverageMapProps {
  className?: string;
  showFullPortalLink?: boolean;
}

export function CoverageMap({ className = "", showFullPortalLink = true }: CoverageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const coverageCircleRef = useRef<Circle | null>(null);
  const connectionLineRef = useRef<Polyline | null>(null);
  const pendingSearchRef = useRef<{ lat: number; lon: number; text: string } | null>(null);

  const [fatData, setFatData] = useState<CompactFat[]>(() => globalFatCache || []);
  const [metadata, setMetadata] = useState<CoverageMetadata | null>(() => globalMetadataCache);
  const [dataLoading, setDataLoading] = useState(() => !globalFatCache);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("ALL");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search input suggestions: match against 818 clusters in Banyumas
  const searchSuggestions = useMemo(() => {
    if (!metadata || !searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    return metadata.clusters
      .filter((c) => c.name.toLowerCase().includes(q) || (c.kel && c.kel.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [metadata, searchQuery]);

  // Viewport update callback: renders delicate FAT markers inside current screen bounds
  const updateVisibleMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !fatData.length) return;

    import("leaflet").then(({ default: L }) => {
      layer.clearLayers();

      const zoom = map.getZoom();
      const bounds = map.getBounds();

      // Zoom < 12: render subtle cluster nodes to avoid clutter
      if (zoom < 12 && metadata && metadata.clusters.length > 0) {
        metadata.clusters.forEach((cluster) => {
          if (bounds.contains([cluster.lat, cluster.lon])) {
            const marker = L.circleMarker([cluster.lat, cluster.lon], {
              radius: Math.min(8, Math.max(4, Math.sqrt(cluster.fats) * 1.2)),
              fillColor: "#8b5cf6",
              color: "#ffffff",
              weight: 1.5,
              opacity: 0.9,
              fillOpacity: 0.75,
            });

            marker.bindPopup(`
              <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 3px;">
                <div style="font-weight: 800; color: #5b21b6;">${cluster.name}</div>
                <div style="color: #64748b; font-size: 11px;">Kec. ${cluster.kec}${cluster.kel ? ` • Kel. ${cluster.kel}` : ""}</div>
                <div style="color: #7c3aed; font-weight: 600; font-size: 11px; margin-top: 3px;">${cluster.fats} Tiang FAT • ${cluster.hps} Port</div>
                <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">Perbesar peta untuk melihat titik tiang fiber</div>
              </div>
            `);
            layer.addLayer(marker);
          }
        });
        return;
      }

      // Zoom >= 12: render individual FAT points inside viewport with refined delicate styling
      const paddedBounds = bounds.pad(0.12);
      const south = paddedBounds.getSouth();
      const north = paddedBounds.getNorth();
      const west = paddedBounds.getWest();
      const east = paddedBounds.getEast();

      const inViewFats: CompactFat[] = [];
      for (let i = 0; i < fatData.length; i++) {
        const f = fatData[i]!;
        const lat = f[2];
        const lon = f[3];
        if (lat >= south && lat <= north && lon >= west && lon <= east) {
          inViewFats.push(f);
          if (inViewFats.length >= 1000) break; // Keep rendering silky smooth at 60fps
        }
      }

      const iconSize = zoom >= 16 ? 24 : zoom >= 14 ? 20 : 16;
      const rocketIcon = L.icon({
        iconUrl: "/image/rocket_marker_24.png",
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize / 2],
        popupAnchor: [0, -Math.round(iconSize / 2)],
      });

      const fullSize = Math.round(iconSize * 0.85);
      const rocketFullIcon = L.icon({
        iconUrl: "/image/rocket_marker_24.png",
        iconSize: [fullSize, fullSize],
        iconAnchor: [fullSize / 2, fullSize / 2],
        popupAnchor: [0, -Math.round(fullSize / 2)],
        className: "grayscale opacity-50",
      });

      inViewFats.forEach((fat) => {
        const [fatId, clusterName, lat, lon, isFull, capacity, available, rawKec] = fat;
        const icon = isFull === 1 ? rocketFullIcon : rocketIcon;

        const marker = L.marker([lat, lon], { icon });

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
              <img src="/image/rocket_marker_24.png" style="width: 16px; height: 16px;" alt="Rocket FAT" />
              <div style="font-weight: 800; font-family: monospace; color: #5b21b6;">${fatId}</div>
            </div>
            <div style="color: #334155; font-size: 11px;">Cluster: <strong>${clusterName}</strong></div>
            <div style="color: #64748b; font-size: 11px;">Kecamatan: <strong>${rawKec || "-"}</strong></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 3px; font-weight: 600;">
              Status: <span style="color: ${isFull === 1 ? "#ef4444" : "#10b981"}">${isFull === 1 ? "Port Penuh" : "Tersedia"}</span> (Port: ${available}/${capacity})
            </div>
          </div>
        `);

        layer.addLayer(marker);
      });
    });
  }, [fatData, metadata]);

  // 1. Fetch compact dataset and metadata
  useEffect(() => {
    let isMounted = true;

    Promise.all([getOrFetchFatData(), getOrFetchMetadata()])
      .then(([fats, meta]) => {
        if (!isMounted) return;
        setFatData(fats);
        setMetadata(meta);
        setDataLoading(false);

        if (pendingSearchRef.current) {
          const pending = pendingSearchRef.current;
          pendingSearchRef.current = null;
          calculateAndDisplayCoverage(pending.lat, pending.lon, pending.text, fats);
        } else {
          updateVisibleMarkers();
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error loading coverage data:", err);
        setDataLoading(false);
        setErrorMessage("Gagal memuat peta jaringan. Silakan refresh halaman.");
      });

    return () => {
      isMounted = false;
    };
  }, [updateVisibleMarkers]);

  // 2. Initialize Leaflet map with clean CARTO Voyager tiles (no ugly raw raster tiles)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let map: LeafletMap;

    async function setupMap() {
      const L = (await import("leaflet")).default;

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Banyumas center
      map = L.map(mapContainerRef.current, {
        center: [-7.435, 109.23],
        zoom: 13,
        zoomControl: false, // Use custom placed zoom controls
        preferCanvas: true,
      });

      // Clean OpenStreetMap tiles with modern subtle CSS styling (no API key / no watermark)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
        className: "map-tiles-modern",
      }).addTo(map);

      // Custom zoom control in bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      map.on("moveend zoomend", () => {
        updateVisibleMarkers();
      });

      updateVisibleMarkers();
    }

    setupMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [updateVisibleMarkers]);

  useEffect(() => {
    if (mapInstanceRef.current && fatData.length) {
      updateVisibleMarkers();
    }
  }, [fatData, updateVisibleMarkers]);

  // Calculate coverage and visually position pin
  async function calculateAndDisplayCoverage(
    lat: number,
    lon: number,
    addressText: string,
    currentFatList: CompactFat[],
  ) {
    if (!currentFatList.length) return;

    let nearest: CompactFat | null = null;
    let minDistance = Infinity;

    for (const fat of currentFatList) {
      const dist = getDistanceMeters(lat, lon, fat[2], fat[3]);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = fat;
      }
    }

    const isWithinRadius = minDistance <= 150;
    const isFull = nearest ? nearest[4] === 1 : false;

    let status: "covered" | "full" | "uncovered" = "uncovered";
    if (isWithinRadius) {
      status = isFull ? "full" : "covered";
    }

    const coverageResult: CoverageResult = {
      status,
      distanceMeters: Math.round(minDistance),
      nearestFat: nearest,
      userLat: lat,
      userLon: lon,
      addressQuery: addressText,
    };

    setResult(coverageResult);
    setIsSearching(false);
    setShowSuggestions(false);

    // Visual map update
    if (mapInstanceRef.current) {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      if (coverageCircleRef.current) map.removeLayer(coverageCircleRef.current);
      if (connectionLineRef.current) map.removeLayer(connectionLineRef.current);

      const userPin = L.divIcon({
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; background: #9333ea; border-radius: 50%; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; background: #7c3aed; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.5);"></div>
          </div>
        `,
        className: "custom-user-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      userMarkerRef.current = L.marker([lat, lon], { icon: userPin }).addTo(map);

      const circleColor =
        status === "covered" ? "#10b981" : status === "full" ? "#f59e0b" : "#f43f5e";

      const circle = L.circle([lat, lon], {
        radius: 150,
        color: circleColor,
        weight: 1.5,
        fillColor: circleColor,
        fillOpacity: 0.08,
        dashArray: "4, 6",
      }).addTo(map);
      coverageCircleRef.current = circle;

      if (nearest) {
        const line = L.polyline(
          [
            [lat, lon],
            [nearest[2], nearest[3]],
          ],
          {
            color: circleColor,
            weight: 2,
            dashArray: "4, 6",
          },
        ).addTo(map);
        connectionLineRef.current = line;
      }

      map.flyTo([lat, lon], 16, { duration: 1.2 });
    }
  }

  // Check coverage entry point
  async function performCoverageCheck(lat: number, lon: number, addressText: string) {
    setErrorMessage(null);

    if (!fatData.length) {
      pendingSearchRef.current = { lat, lon, text: addressText };
      setIsSearching(true);
      return;
    }

    await calculateAndDisplayCoverage(lat, lon, addressText, fatData);
  }

  // Handle address or cluster search
  async function handleAddressSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setErrorMessage("Ketik nama jalan, perumahan, atau desa yang ingin dicek.");
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setShowSuggestions(false);

    // 1. Fast match against clusters in metadata
    const queryLower = query.toLowerCase();
    if (metadata) {
      const matchedCluster = metadata.clusters.find(
        (c) =>
          c.name.toLowerCase().includes(queryLower) ||
          (c.kel && c.kel.toLowerCase().includes(queryLower)),
      );
      if (matchedCluster) {
        await performCoverageCheck(
          matchedCluster.lat,
          matchedCluster.lon,
          `${matchedCluster.name} (${matchedCluster.kec})`,
        );
        return;
      }

      const matchedKec = metadata.kecamatans.find((k) =>
        k.name.toLowerCase().includes(queryLower) || k.id.toLowerCase().includes(queryLower),
      );
      if (matchedKec) {
        setSelectedKecamatan(matchedKec.id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(matchedKec.center, 14, { duration: 1 });
        }
        await performCoverageCheck(
          matchedKec.center[0],
          matchedKec.center[1],
          `Kecamatan ${matchedKec.name}`,
        );
        return;
      }
    }

    // 2. Fallback to OpenStreetMap geocoding
    try {
      const localizedQuery =
        queryLower.includes("purwokerto") || queryLower.includes("banyumas")
          ? `${query}, Jawa Tengah, Indonesia`
          : `${query}, Banyumas, Jawa Tengah, Indonesia`;

      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        localizedQuery,
      )}&limit=1`;

      const res = await fetch(endpoint, {
        headers: { "Accept-Language": "id" },
      });

      if (!res.ok) throw new Error("Gagal menghubungi server pencari alamat.");
      const data = await res.json();

      if (data && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        await performCoverageCheck(lat, lon, query);
      } else {
        setIsSearching(false);
        setErrorMessage(
          `Alamat "${query}" tidak ditemukan di peta. Coba pilih Kecamatan atau gunakan nama jalan terdekat.`,
        );
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setIsSearching(false);
      setErrorMessage("Gagal mencari alamat. Periksa koneksi internet Anda.");
    }
  }

  // Handle GPS location
  function handleGpsLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("Browser tidak mendukung GPS.");
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSearchQuery("Titik Lokasi GPS Saya");
        await performCoverageCheck(latitude, longitude, "Lokasi GPS Saya");
      },
      (err) => {
        setIsSearching(false);
        setErrorMessage(
          err.code === 1 ? "Izin GPS ditolak. Silakan ketik nama lokasi secara manual." : err.message,
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Change Kecamatan from unified dropdown
  function handleSelectKecamatan(kecId: string) {
    setSelectedKecamatan(kecId);
    setErrorMessage(null);

    if (kecId === "ALL") {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([-7.435, 109.23], 13, { duration: 1 });
      }
      return;
    }

    const kecInfo = metadata?.kecamatans.find((k) => k.id === kecId);
    if (kecInfo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(kecInfo.center, 14, { duration: 1.2 });
    }
  }

  // WhatsApp registration URL
  const getWhatsAppRegistrationUrl = () => {
    if (!result || !result.nearestFat) return "#";
    const [fatId, clusterName, , , , , , rawKec] = result.nearestFat;
    const msg =
      result.status === "covered"
        ? `Halo Admin MyRepublic Purwokerto, saya sudah cek area di: "${result.addressQuery}". Hasil TERCOVER tiang FAT: *${fatId}* (Cluster ${clusterName}, Kec. ${rawKec || "-"}, jarak ~${result.distanceMeters}m). Saya ingin mendaftar pasang baru.`
        : result.status === "full"
          ? `Halo Admin MyRepublic Purwokerto, alamat saya di: "${result.addressQuery}" dekat dengan tiang *${fatId}* (Cluster ${clusterName}, Kec. ${rawKec || "-"}), namun kapasitas port penuh. Mohon info antrian / penambahan kapasitas.`
          : `Halo Admin MyRepublic Purwokerto, alamat saya di: "${result.addressQuery}" berjarak ~${result.distanceMeters}m dari tiang terdekat. Apakah ada rencana ekspansi fiber ke titik saya?`;

    return `https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Sleek Hardware-Frame Container with Map */}
      <div className="relative h-[620px] w-full overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-xl sm:h-[660px]">
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="size-full z-0" />

        {/* FLOATING COMMAND ISLAND: Clean unified top HUD (Heads Up Display) */}
        <div className="absolute top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[620px] z-20 pointer-events-auto">
          <div className="rounded-2xl border border-border/70 bg-card/95 p-1.5 shadow-2xl backdrop-blur-md">
            <form onSubmit={handleAddressSearch} className="flex items-center gap-1.5">
              {/* Kecamatan Quick Select */}
              <div className="relative shrink-0">
                <select
                  value={selectedKecamatan}
                  onChange={(e) => handleSelectKecamatan(e.target.value)}
                  className="h-10 pl-8 pr-7 text-xs font-semibold rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border/60 outline-none transition focus:ring-2 focus:ring-brand/30 cursor-pointer appearance-none truncate max-w-[145px] sm:max-w-[200px]"
                >
                  <option value="ALL">Semua Wilayah Banyumas</option>
                  <optgroup label="Purwokerto Kota">
                    <option value="PURWOKERTO SELATAN">Pwt Selatan (485 FAT)</option>
                    <option value="PURWOKERTO TIMUR">Pwt Timur (270 FAT)</option>
                    <option value="PURWOKERTO UTARA">Pwt Utara (320 FAT)</option>
                    <option value="PURWOKERTO BARAT">Pwt Barat (365 FAT)</option>
                  </optgroup>
                  <optgroup label="Banyumas Barat">
                    <option value="WANGON">Wangon (840 FAT)</option>
                    <option value="RAWALO">Rawalo (803 FAT)</option>
                    <option value="JATILAWANG">Jatilawang (693 FAT)</option>
                    <option value="CILONGOK">Cilongok (621 FAT)</option>
                    <option value="AJIBARANG">Ajibarang (454 FAT)</option>
                    <option value="PURWOJATI">Purwojati (363 FAT)</option>
                    <option value="PEKUNCEN">Pekuncen (134 FAT)</option>
                    <option value="LUMBIR">Lumbir (70 FAT)</option>
                  </optgroup>
                  <optgroup label="Banyumas Utara & Lereng Slamet">
                    <option value="BATURRADEN">Baturraden (296 FAT)</option>
                    <option value="SUMBANG">Sumbang (321 FAT)</option>
                    <option value="KEDUNGBANTENG">Kedungbanteng (292 FAT)</option>
                    <option value="KARANGLEWAS">Karanglewas (268 FAT)</option>
                  </optgroup>
                  <optgroup label="Banyumas Timur & Selatan">
                    <option value="BANYUMAS">Banyumas (687 FAT)</option>
                    <option value="KALIBAGOR">Kalibagor (662 FAT)</option>
                    <option value="PATIKRAJA">Patikraja (419 FAT)</option>
                    <option value="KEMBARAN">Kembaran (396 FAT)</option>
                    <option value="KEBASEN">Kebasen (392 FAT)</option>
                    <option value="KEMRANJEN">Kemranjen (198 FAT)</option>
                    <option value="SOKARAJA">Sokaraja (149 FAT)</option>
                    <option value="SOMAGEDE">Somagede (78 FAT)</option>
                  </optgroup>
                </select>
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-brand pointer-events-none" />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              </div>

              {/* Address Search Input */}
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Ketik jalan, cluster, atau RW..."
                  className="h-10 w-full rounded-xl bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none"
                  disabled={isSearching}
                />
              </div>

              {/* GPS Button */}
              <button
                type="button"
                onClick={handleGpsLocation}
                disabled={isSearching}
                title="Gunakan Lokasi GPS Saya"
                className="size-10 shrink-0 flex items-center justify-center rounded-xl text-muted-foreground hover:text-brand hover:bg-muted/70 transition-colors"
              >
                <Crosshair className="size-4" />
              </button>

              {/* Search Submit Button */}
              <Button
                type="submit"
                variant="brand"
                size="sm"
                className="h-10 px-4 rounded-xl font-bold text-xs gap-1.5 shrink-0 shadow-sm"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                <span className="hidden sm:inline">{isSearching ? "Cek..." : "Cek Area"}</span>
              </Button>
            </form>

            {/* Live Autocomplete Suggestions Popover */}
            {showSuggestions && searchSuggestions.length > 0 ? (
              <div className="mt-1.5 border-t border-border/50 pt-1.5 px-1">
                <p className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cluster yang Cocok:
                </p>
                <div className="space-y-0.5">
                  {searchSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(c.name);
                        setShowSuggestions(false);
                        performCoverageCheck(c.lat, c.lon, `${c.name} (${c.kec})`);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-muted transition-colors group cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Compass className="size-3.5 text-brand shrink-0" />
                        <span className="font-semibold text-foreground group-hover:text-brand truncate">
                          {c.name}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        Kec. {c.kec} • {c.fats} FAT
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Error Message Pill */}
          {errorMessage ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/95 px-3 py-2 text-xs text-white shadow-lg backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <Info className="size-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="rounded p-0.5 hover:bg-white/20"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        {/* FLOATING RESULT CARD: Docked bottom sheet (Apple Maps / Modern HUD style) */}
        {result ? (
          <div className="absolute bottom-4 inset-x-3 sm:inset-x-auto sm:left-6 sm:w-96 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  {result.status === "covered" ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : result.status === "full" ? (
                    <Info className="size-4 text-amber-500 shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-rose-500 shrink-0" />
                  )}
                  <h4 className="font-extrabold text-xs sm:text-sm text-foreground uppercase tracking-wider">
                    {result.status === "covered"
                      ? "TERCOVER & SIAP PASANG"
                      : result.status === "full"
                        ? "TERCOVER (PORT PENUH)"
                        : "DI LUAR JANGKAUAN FIBER"}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Tutup Hasil"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Main Distance & Details */}
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Jarak ke Tiang FAT:
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-black font-mono ${
                        result.status === "covered"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : result.status === "full"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {result.distanceMeters}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">meter</span>
                  </div>
                </div>

                {result.nearestFat ? (
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground">Tiang Terdekat</span>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {result.nearestFat[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                      {result.nearestFat[1]}
                    </p>
                  </div>
                ) : null}
              </div>

              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {result.status === "covered" ? (
                  <>
                    Jarak sangat dekat (&le;150m). Tim teknisi MyRepublic siap langsung memasang kabel
                    ke rumah Anda.
                  </>
                ) : result.status === "full" ? (
                  <>
                    Tiang berjarak aman ({result.distanceMeters}m), namun port sementara terisi penuh.
                    Daftar antrian untuk prioritas penambahan port.
                  </>
                ) : (
                  <>
                    Jarak {result.distanceMeters}m melebihi batas aman tarikan kabel fiber (150m). Lokasi
                    telah tercatat untuk rencana perluasan.
                  </>
                )}
              </p>

              {/* Action Button */}
              <Button
                variant={result.status === "covered" ? "signal" : "brand"}
                size="sm"
                className="mt-4 w-full font-bold gap-2 text-xs h-10 shadow-md"
                asChild
              >
                <a href={getWhatsAppRegistrationUrl()} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  <span>
                    {result.status === "covered"
                      ? "Daftar Pasang Baru via WhatsApp"
                      : result.status === "full"
                        ? "Reservasi Antrian via WhatsApp"
                        : "Tanya Jadwal Survey via WA"}
                  </span>
                </a>
              </Button>
            </div>
          </div>
        ) : null}

        {/* FLOATING BOTTOM BAR: Discreet Legend & Full Portal Link */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Subtle Clean Legend */}
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/90 px-3 py-1.5 text-[11px] font-medium backdrop-blur-md shadow-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <img src="/image/rocket_marker_24.png" alt="FAT" className="size-4 shrink-0 object-contain" /> Tiang FAT Tersedia
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <img src="/image/rocket_marker_24.png" alt="Full" className="size-3.5 shrink-0 object-contain grayscale opacity-50" /> Port Penuh
            </span>
          </div>

          {/* Direct Link to GIS Portal */}
          {showFullPortalLink ? (
            <a
              href="/coverage"
              className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/90 px-3 py-1.5 text-[11px] font-bold text-foreground hover:text-brand hover:border-brand/40 backdrop-blur-md shadow-sm transition-colors"
            >
              <span>Database GIS Lengkap</span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          ) : null}
        </div>

        {/* Top-Left Live Status Tag */}
        <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2 rounded-xl border border-border/50 bg-card/85 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur-md shadow-sm pointer-events-none">
          <Radio className="size-3.5 text-emerald-500 animate-pulse" />
          <span>9.586 Tiang FAT • 25 Kecamatan</span>
        </div>
      </div>
    </div>
  );
}
