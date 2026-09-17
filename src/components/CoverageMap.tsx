import {
  CheckCircle2,
  Compass,
  ExternalLink,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  MessageCircle,
  Radio,
  Search,
  XCircle,
} from "lucide-react";
import type { Map as LeafletMap, LayerGroup, Marker, Circle, Polyline } from "leaflet";
import { useEffect, useRef, useState } from "react";

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

export interface CoverageResult {
  status: "covered" | "full" | "uncovered";
  distanceMeters: number;
  nearestFat: CompactFat | null;
  userLat: number;
  userLon: number;
  addressQuery: string;
}

// Module-level in-memory cache so it only ever downloads once
let globalFatCache: CompactFat[] | null = null;
let globalFatPromise: Promise<CompactFat[]> | null = null;

async function getOrFetchFatData(): Promise<CompactFat[]> {
  if (globalFatCache && globalFatCache.length > 0) {
    return globalFatCache;
  }
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

const POPULAR_AREAS = [
  "Grendeng (UNSOED)",
  "Bancarkembar",
  "Karangklesem",
  "Berkoh",
  "Kranji",
  "Teluk",
  "Arcawinangun",
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
  const [dataLoading, setDataLoading] = useState(() => !globalFatCache);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Load compact FAT data immediately
  useEffect(() => {
    let isMounted = true;

    getOrFetchFatData()
      .then((data) => {
        if (!isMounted) return;
        setFatData(data);
        setDataLoading(false);

        // If user already clicked or searched while loading, immediately process!
        if (pendingSearchRef.current) {
          const pending = pendingSearchRef.current;
          pendingSearchRef.current = null;
          calculateAndDisplayCoverage(pending.lat, pending.lon, pending.text, data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error loading compact FAT data:", err);
        setDataLoading(false);
        setErrorMessage("Gagal memuat data jaringan. Pastikan server lokal aktif.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

      // Purwokerto default coordinates [-7.4241, 109.2302]
      map = L.map(mapContainerRef.current, {
        center: [-7.4241, 109.2302],
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
    }

    setupMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Render nearby FAT markers when data or result changes
  useEffect(() => {
    if (!mapInstanceRef.current || !fatData.length) return;

    async function drawFatMarkers() {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;
      const layer = markersLayerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      const center = result ? [result.userLat, result.userLon] : [-7.4241, 109.2302];

      // Filter nearby points (within ~4 km)
      const nearbyFats = fatData.filter((f) => {
        const dist = getDistanceMeters(center[0]!, center[1]!, f[2], f[3]);
        return dist <= 4000;
      });

      nearbyFats.forEach((fat) => {
        const [fatId, clusterName, lat, lon, isFull, capacity, available] = fat;
        const color = isFull === 1 ? "#1e293b" : "#8b5cf6";

        const marker = L.circleMarker([lat, lon], {
          radius: 5,
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
            <div style="color: #64748b; font-size: 10px; margin-top: 4px;">Kapasitas: ${capacity} | Tersedia: ${available}</div>
          </div>
        `);

        layer.addLayer(marker);
      });
    }

    drawFatMarkers();
  }, [fatData, result]);

  // 4. Calculate coverage and update visual map
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
    if (mapInstanceRef.current && typeof window !== "undefined") {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
      if (coverageCircleRef.current) map.removeLayer(coverageCircleRef.current);
      if (connectionLineRef.current) map.removeLayer(connectionLineRef.current);

      const userIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        className: "user-geo-pin",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);
      userMarker.bindPopup(`<strong>Lokasi Pengecekan</strong><br/>${addressText}`).openPopup();
      userMarkerRef.current = userMarker;

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

    // If data is still loading, store pending search so it executes the instant it finishes!
    if (!fatData.length) {
      pendingSearchRef.current = { lat, lon, text: addressText };
      setIsSearching(true);
      return;
    }

    await calculateAndDisplayCoverage(lat, lon, addressText, fatData);
  }

  // Handle address search via Nominatim
  async function handleAddressSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setErrorMessage("Silakan ketik nama jalan, perumahan, atau kelurahan di Purwokerto.");
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const localizedQuery = query.toLowerCase().includes("purwokerto")
        ? `${query}, Indonesia`
        : `${query}, Purwokerto, Banyumas, Indonesia`;

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
          `Alamat "${query}" tidak ditemukan di peta. Coba masukkan nama jalan utama atau kelurahan terdekat.`,
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

  // Quick area chips click
  function handleChipClick(areaName: string) {
    setSearchQuery(areaName);
    setIsSearching(true);
    setErrorMessage(null);

    const formQuery = `${areaName}, Purwokerto, Banyumas, Indonesia`;
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        formQuery,
      )}&limit=1`,
      { headers: { "Accept-Language": "id" } },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]?.lat && data[0]?.lon) {
          performCoverageCheck(parseFloat(data[0].lat), parseFloat(data[0].lon), areaName);
        } else {
          setIsSearching(false);
          setErrorMessage(`Area ${areaName} tidak ditemukan di peta.`);
        }
      })
      .catch(() => {
        setIsSearching(false);
        setErrorMessage("Gagal mencari area.");
      });
  }

  // WhatsApp registration URL
  const getWhatsAppRegistrationUrl = () => {
    if (!result || !result.nearestFat) return "#";
    const [fatId, clusterName] = result.nearestFat;
    const msg =
      result.status === "covered"
        ? `Halo Admin MyRepublic Purwokerto, saya sudah cek area di: "${result.addressQuery}". Hasil tercover tiang FAT: *${fatId}* (${clusterName}, jarak ~${result.distanceMeters}m). Saya ingin mendaftar pasang baru.`
        : result.status === "full"
          ? `Halo Admin MyRepublic Purwokerto, alamat saya di: "${result.addressQuery}" tercover tiang *${fatId}* (${clusterName}), namun port tercatat penuh. Mohon info antrian / jadwal penambahan kapasitas port.`
          : `Halo Admin MyRepublic Purwokerto, alamat saya di: "${result.addressQuery}" berjarak ~${result.distanceMeters}m dari tiang terdekat. Apakah ada rencana perluasan jaringan ke lokasi saya?`;

    return `https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Search Bar & Quick Location Controls */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleAddressSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-brand" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik alamat (contoh: Jl. HR Boenyamin, Grendeng, Kranji...)"
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

        {/* Quick Area Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="flex items-center gap-1 font-semibold text-muted-foreground mr-1">
            <Compass className="size-3.5" /> Area Populer:
          </span>
          {POPULAR_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => handleChipClick(area)}
              disabled={isSearching}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground transition-all hover:border-brand hover:bg-brand/5 hover:text-brand disabled:opacity-50 cursor-pointer"
            >
              {area}
            </button>
          ))}
        </div>

        {/* Loading Indicator for initial dataset */}
        {dataLoading && isSearching ? (
          <p className="flex items-center gap-1.5 text-xs text-brand font-medium animate-pulse">
            <Loader2 className="size-3.5 animate-spin" /> Menghubungkan ke 9.586 titik tiang fiber
            Purwokerto...
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
                        Kec: {result.nearestFat[7]}
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
            <span className="size-2.5 rounded-full bg-purple-600"></span> Tiang FAT MyRepublic
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-full bg-slate-800"></span> Port Penuh
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
