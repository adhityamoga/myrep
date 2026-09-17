import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Compass,
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
  XCircle,
} from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker, Circle, Polyline, CircleMarker } from "leaflet";
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

// Quick filter chips for top areas
const HIGHLIGHTED_KECAMATANS = [
  "PURWOKERTO SELATAN",
  "PURWOKERTO TIMUR",
  "PURWOKERTO UTARA",
  "PURWOKERTO BARAT",
  "WANGON",
  "RAWALO",
  "JATILAWANG",
  "CILONGOK",
  "AJIBARANG",
  "BATURRADEN",
  "SOKARAJA",
  "SUMBANG",
  "PATIKRAJA",
];

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

  // Selected Kecamatan for quick explorer
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("ALL");

  // Filtered clusters for the selected kecamatan
  const activeClusters = useMemo(() => {
    if (!metadata) return [];
    if (selectedKecamatan === "ALL") {
      // Pick top 10 well-known clusters
      return metadata.clusters.slice(0, 8);
    }
    return metadata.clusters.filter((c) => c.kec === selectedKecamatan).slice(0, 10);
  }, [metadata, selectedKecamatan]);

  // Viewport update callback: renders FAT markers inside current screen bounds
  const updateVisibleMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !fatData.length) return;

    import("leaflet").then(({ default: L }) => {
      layer.clearLayers();

      const zoom = map.getZoom();
      const bounds = map.getBounds();

      // Zoom < 12: render cluster markers from metadata to prevent map lag
      if (zoom < 12 && metadata && metadata.clusters.length > 0) {
        metadata.clusters.forEach((cluster) => {
          if (bounds.contains([cluster.lat, cluster.lon])) {
            const marker = L.circleMarker([cluster.lat, cluster.lon], {
              radius: Math.min(10, Math.max(5, Math.sqrt(cluster.fats) * 1.5)),
              fillColor: "#7c3aed",
              color: "#ffffff",
              weight: 1.5,
              opacity: 0.9,
              fillOpacity: 0.75,
            });

            marker.bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
                <div style="font-weight: 800; color: #5b21b6;">Cluster: ${cluster.name}</div>
                <div style="color: #475569; font-size: 11px;">Kec. ${cluster.kec}${cluster.kel ? ` • Kel. ${cluster.kel}` : ""}</div>
                <div style="color: #6d28d9; font-weight: 600; font-size: 11px; margin-top: 4px;">${cluster.fats} Tiang FAT • ${cluster.hps} Port HP</div>
                <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Zoom lebih dekat untuk melihat tiang fiber</div>
              </div>
            `);
            layer.addLayer(marker);
          }
        });
        return;
      }

      // Zoom >= 12: render individual FAT points inside viewport (with 15% padding)
      const paddedBounds = bounds.pad(0.15);
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
          if (inViewFats.length >= 1000) break; // Keep DOM fast and 60fps
        }
      }

      inViewFats.forEach((fat) => {
        const [fatId, clusterName, lat, lon, isFull, capacity, available, rawKec] = fat;
        const color = isFull === 1 ? "#1e293b" : "#8b5cf6";

        const marker = L.circleMarker([lat, lon], {
          radius: zoom >= 15 ? 6 : 4.5,
          fillColor: color,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <div style="font-weight: 800; color: #5b21b6; margin-bottom: 2px;">${fatId}</div>
            <div style="color: #475569; font-size: 11px;">Cluster: <strong>${clusterName}</strong></div>
            <div style="color: #64748b; font-size: 11px;">Kecamatan: <strong>${rawKec || "-"}</strong></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 4px;">Kapasitas: ${capacity} | Tersedia: ${available}</div>
          </div>
        `);

        layer.addLayer(marker);
      });
    });
  }, [fatData, metadata]);

  // 1. Load compact FAT data & metadata in parallel
  useEffect(() => {
    let isMounted = true;

    Promise.all([getOrFetchFatData(), getOrFetchMetadata()])
      .then(([fats, meta]) => {
        if (!isMounted) return;
        setFatData(fats);
        setMetadata(meta);
        setDataLoading(false);

        // If user already clicked or searched while loading, process now!
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
        setErrorMessage("Gagal memuat data jaringan. Pastikan koneksi internet stabil.");
      });

    return () => {
      isMounted = false;
    };
  }, [updateVisibleMarkers]);

  // 2. Initialize Leaflet map (client-side only)
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let map: LeafletMap;

    async function setupMap() {
      const L = (await import("leaflet")).default;

      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Banyumas Raya center coordinates
      map = L.map(mapContainerRef.current, {
        center: [-7.435, 109.23],
        zoom: 13,
        zoomControl: true,
        preferCanvas: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Update markers whenever user moves or zooms
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

  // Re-run viewport markers whenever fatData updates
  useEffect(() => {
    if (mapInstanceRef.current && fatData.length) {
      updateVisibleMarkers();
    }
  }, [fatData, updateVisibleMarkers]);

  // Calculate coverage and update visual map elements
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

    // Visual map update
    if (mapInstanceRef.current) {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      if (coverageCircleRef.current) map.removeLayer(coverageCircleRef.current);
      if (connectionLineRef.current) map.removeLayer(connectionLineRef.current);

      const userPin = L.divIcon({
        html: `
          <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; background: #a855f7; border-radius: 50%; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 16px; height: 16px; background: #7c3aed; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        className: "custom-user-marker",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      userMarkerRef.current = L.marker([lat, lon], { icon: userPin }).addTo(map);

      const circleColor =
        status === "covered" ? "#10b981" : status === "full" ? "#f59e0b" : "#ef4444";

      const circle = L.circle([lat, lon], {
        radius: 150,
        color: circleColor,
        weight: 1.5,
        fillColor: circleColor,
        fillOpacity: 0.12,
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
            weight: 2.5,
            dashArray: "6, 6",
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
      setErrorMessage("Silakan ketik nama jalan, perumahan, kelurahan, atau kecamatan di Banyumas.");
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    // 1. Fast exact/fuzzy match against 818 clusters or 25 kecamatans in dataset
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
        await performCoverageCheck(matchedKec.center[0], matchedKec.center[1], `Kecamatan ${matchedKec.name}`);
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
          `Alamat "${query}" tidak ditemukan di peta. Coba pilih Kecamatan atau masukkan nama kelurahan terdekat.`,
        );
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setIsSearching(false);
      setErrorMessage("Terjadi kesalahan saat mencari alamat. Periksa koneksi internet Anda.");
    }
  }

  // Handle GPS location
  function handleGpsLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("Browser Anda tidak mendukung fitur lokasi GPS.");
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
          err.code === 1
            ? "Izin akses lokasi GPS ditolak oleh browser. Silakan ketik nama alamat secara manual."
            : `Gagal membaca GPS: ${err.message}`,
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Change Kecamatan from dropdown or chip
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

  // Click on a specific Cluster pill
  function handleClusterClick(cluster: ClusterInfo) {
    setSearchQuery(cluster.name);
    setIsSearching(true);
    setErrorMessage(null);
    performCoverageCheck(cluster.lat, cluster.lon, `${cluster.name} (${cluster.kec})`);
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
    <div className={`flex flex-col gap-5 ${className}`}>
      {/* Scope Info Banner */}
      <div className="rounded-xl border border-brand/20 bg-gradient-to-r from-brand/10 via-purple-500/5 to-transparent p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-brand/15 p-2 text-brand">
              <Radio className="size-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-1.5">
                Jaringan Fiber MyRepublic Banyumas Raya
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Aktif RFS
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mencakup <strong>25 Kecamatan</strong>, <strong>818 Cluster</strong>, dan{" "}
                <strong>9.586 Titik Tiang FAT</strong> di seluruh Kabupaten Banyumas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground self-start sm:self-auto">
            <span className="rounded-md border border-border bg-card px-2.5 py-1">
              {metadata?.totalKecamatans ?? 25} Kecamatan
            </span>
            <span className="rounded-md border border-border bg-card px-2.5 py-1">
              {metadata?.totalClusters ?? 818} Cluster
            </span>
            <span className="rounded-md border border-brand/30 bg-brand/10 text-brand px-2.5 py-1">
              9.586 FAT
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar & Quick Controls */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleAddressSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-brand" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jalan, desa, cluster (cth: Wangon, Berkoh, Klapagading, HR Boenyamin...)"
              className="h-12 w-full rounded-md border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-sm"
              disabled={isSearching}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="h-12 flex-1 sm:flex-none font-bold gap-2 px-6"
              disabled={isSearching}
            >
              {isSearching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              <span>{isSearching ? "Mengecek..." : "Cek Area"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGpsLocation}
              disabled={isSearching}
              title="Gunakan Titik Lokasi GPS Saya"
              className="h-12 px-3.5 shrink-0 hover:border-brand hover:text-brand"
            >
              <LocateFixed className="size-4" />
            </Button>
          </div>
        </form>

        {/* Kecamatan Filter & Dropdown */}
        <div className="flex flex-col gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-semibold text-muted-foreground">
              <Building2 className="size-3.5 text-brand" /> Pilih Kecamatan:
            </span>

            {/* Complete 25 Kecamatan Dropdown */}
            {metadata && metadata.kecamatans.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedKecamatan}
                  onChange={(e) => handleSelectKecamatan(e.target.value)}
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand cursor-pointer shadow-sm"
                >
                  <option value="ALL">📍 Semua Banyumas (25 Kecamatan)</option>
                  {metadata.kecamatans.map((kec) => (
                    <option key={kec.id} value={kec.id}>
                      Kec. {kec.name} ({kec.clusters} Cluster • {kec.fats} FAT)
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* Quick Kecamatan Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectKecamatan("ALL")}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                selectedKecamatan === "ALL"
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-border bg-card text-foreground hover:border-brand hover:bg-brand/5 hover:text-brand"
              }`}
            >
              Semua Wilayah
            </button>

            {HIGHLIGHTED_KECAMATANS.map((kecId) => {
              const info = metadata?.kecamatans.find((k) => k.id === kecId);
              const displayName = info ? info.name : kecId;
              const isSelected = selectedKecamatan === kecId;

              return (
                <button
                  key={kecId}
                  type="button"
                  onClick={() => handleSelectKecamatan(kecId)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "border-brand bg-brand text-white shadow-sm"
                      : "border-border bg-card text-foreground hover:border-brand hover:bg-brand/5 hover:text-brand"
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
          </div>

          {/* Cluster Pills in Selected Kecamatan */}
          {activeClusters.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Compass className="size-3" /> Cluster Pilihan:
              </span>
              {activeClusters.map((cluster) => (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => handleClusterClick(cluster)}
                  disabled={isSearching}
                  title={`Cek coverage di cluster ${cluster.name}`}
                  className="rounded border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-foreground transition hover:border-brand hover:bg-brand/10 hover:text-brand cursor-pointer"
                >
                  {cluster.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Loading Indicator */}
        {dataLoading ? (
          <p className="flex items-center gap-1.5 text-xs text-brand font-medium animate-pulse">
            <Loader2 className="size-3.5 animate-spin" /> Menghubungkan ke 9.586 titik tiang fiber
            se-Banyumas...
          </p>
        ) : null}

        {errorMessage ? (
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <Info className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>

      {/* Real-time Result Card */}
      {result ? (
        <div
          className={`rounded-lg border p-4 sm:p-5 transition-all shadow-sm ${
            result.status === "covered"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
              : result.status === "full"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                : "border-rose-500/50 bg-rose-500/10 text-rose-950 dark:text-rose-200"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {result.status === "covered" ? (
                <CheckCircle2 className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : result.status === "full" ? (
                <Info className="size-6 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              ) : (
                <XCircle className="size-6 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}

              <div>
                <h4 className="font-extrabold text-sm sm:text-base">
                  {result.status === "covered"
                    ? "ALAMAT TERCOVER & SIAP PASANG!"
                    : result.status === "full"
                      ? "TERCOVER FIBER (PORT SEMENTARA PENUH)"
                      : "BELUM TERCOVER FIBER LANGSUNG"}
                </h4>
                <p className="mt-1 text-xs opacity-90 leading-relaxed">
                  {result.status === "covered" ? (
                    <>
                      Jarak ke tiang fiber terdekat hanya{" "}
                      <strong>{result.distanceMeters} meter</strong> (maksimal 150m). Port kabel
                      siap dipasang oleh teknisi.
                    </>
                  ) : result.status === "full" ? (
                    <>
                      Tiang fiber berjarak <strong>{result.distanceMeters} meter</strong>, namun
                      kapasitas port sedang penuh. Anda bisa mendaftar antrian prioritas penambahan
                      port.
                    </>
                  ) : (
                    <>
                      Jarak ke tiang fiber terdekat adalah{" "}
                      <strong>{result.distanceMeters} meter</strong> (melebihi batas aman 150m).
                      Lokasi ini telah dicatat dalam rencana perluasan.
                    </>
                  )}
                </p>

                {result.nearestFat ? (
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="rounded bg-background/80 px-2 py-0.5 font-bold border border-current/20">
                      FAT ID: {result.nearestFat[0]}
                    </span>
                    <span className="rounded bg-background/80 px-2 py-0.5 font-bold border border-current/20">
                      Cluster: {result.nearestFat[1]}
                    </span>
                    {result.nearestFat[7] ? (
                      <span className="rounded bg-background/80 px-2 py-0.5 border border-current/20">
                        Kecamatan: {result.nearestFat[7]}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <Button
              variant={result.status === "covered" ? "signal" : "brand"}
              size="sm"
              className="mt-2 sm:mt-0 font-extrabold shrink-0 gap-2 shadow-sm"
              asChild
            >
              <a href={getWhatsAppRegistrationUrl()} target="_blank" rel="noreferrer">
                <MessageCircle className="size-4" />
                <span>
                  {result.status === "covered"
                    ? "Pasang Sekarang via WA"
                    : result.status === "full"
                      ? "Antrian Port via WA"
                      : "Tanya Sales via WA"}
                </span>
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      {/* Map Canvas Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-slate-100 shadow-sm sm:aspect-[16/9]">
        <div ref={mapContainerRef} className="size-full z-10" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/90 p-2 text-[10px] font-bold backdrop-blur shadow-sm pointer-events-auto">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-full bg-purple-600"></span> Tiang FAT Tersedia
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-full bg-slate-800"></span> Port Penuh
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-full bg-purple-400"></span> Cluster Area (Zoom Out)
          </span>
        </div>

        {/* Full GIS Portal Button Link */}
        {showFullPortalLink ? (
          <div className="absolute top-3 right-3 z-20 pointer-events-auto">
            <Button
              variant="outline"
              size="sm"
              className="bg-background/95 backdrop-blur text-xs font-bold gap-1.5 shadow-md hover:border-brand hover:text-brand"
              asChild
            >
              <a href="/coverage">
                <span>Peta GIS Lengkap</span>
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
