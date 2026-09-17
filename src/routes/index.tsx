import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Activity,
  Building2,
  Download,
  Globe,
  Headphones,
  House,
  MapPin,
  Menu,
  Network,
  Router,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Upload,
  Wifi,
  X,
  Zap,
  RefreshCcw,
} from "lucide-react";
import { FormEvent, useState, useEffect, useRef } from "react";

import customerImage from "@/assets/myrepublic-customer.png";
import gaugeGray from "@/assets/speedometer-gray.png";
import gaugePurple from "@/assets/speedometer-purple.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Internet Cepat Purwokerto | MyRepublic" },
      {
        name: "description",
        content:
          "Temukan paket internet fiber MyRepublic untuk rumah di Purwokerto dan cek jangkauan di alamat Anda.",
      },
      { property: "og:title", content: "Internet Cepat Purwokerto | MyRepublic" },
      {
        property: "og:description",
        content: "Paket internet fiber stabil untuk rumah dan keluarga di Purwokerto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const packages = [
  {
    name: "Value",
    speed: "30",
    price: "Rp 250 ribuan",
    description: "Untuk browsing, belajar, dan kebutuhan harian.",
    featured: false,
  },
  {
    name: "Fast",
    speed: "50",
    price: "Rp 300 ribuan",
    description: "Nyaman untuk streaming dan banyak perangkat.",
    featured: true,
  },
  {
    name: "Nova",
    speed: "100",
    price: "Rp 400 ribuan",
    description: "Performa lebih untuk keluarga digital aktif.",
    featured: false,
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Fiber Sepenuhnya",
    copy: "Koneksi cepat dan stabil langsung sampai ke rumah.",
  },
  {
    icon: Wifi,
    title: "Tanpa Batas Kuota",
    copy: "Internet lebih leluasa tanpa khawatir kuota habis.",
  },
  {
    icon: ShieldCheck,
    title: "Harga Transparan",
    copy: "Pilihan paket jelas sesuai kebutuhan rumah Anda.",
  },
  {
    icon: Headphones,
    title: "Dukungan Pelanggan",
    copy: "Tim bantuan siap mendampingi saat Anda membutuhkan.",
  },
];

function Brand() {
  return (
    <a href="#home" className="flex shrink-0 items-center gap-2" aria-label="MyRepublic Purwokerto">
      <span className="grid size-7 place-items-center rounded-sm bg-signal text-sm font-black text-signal-foreground">
        my
      </span>
      <span className="text-base font-extrabold text-brand-foreground sm:text-lg">MyRepublic</span>
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Paket Internet", "#paket"],
    ["Cek Jangkauan", "#jangkauan"],
    ["Keunggulan", "#keunggulan"],
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-brand-foreground/15 bg-brand/95">
      <nav
        className="mx-auto grid h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center px-5 lg:px-8"
        aria-label="Navigasi utama"
      >
        <Brand />
        <div className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-semibold text-brand-foreground/80 transition-colors hover:text-brand-foreground"
            >
              {label}
            </a>
          ))}
          <Button variant="signal" size="sm" asChild>
            <a href="#jangkauan">Cek Area</a>
          </Button>
        </div>
        <Button
          type="button"
          variant="brandGhost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </nav>
      {open ? (
        <div className="border-t border-brand-foreground/15 bg-brand px-5 py-5 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="py-1 text-sm font-semibold text-brand-foreground"
              >
                {label}
              </a>
            ))}
            <Button variant="signal" asChild>
              <a href="#jangkauan">Cek Area</a>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Hero() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-brand pt-20 text-brand-foreground sm:pt-24 lg:pt-28"
    >
      <div className="hero-grid absolute inset-0 opacity-25" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <p className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-signal">
          Internet fiber untuk Purwokerto
        </p>
        <h1 className="mx-auto mt-3 sm:mt-6 text-center text-[clamp(2rem,11vw,10rem)] font-black uppercase leading-[0.85] tracking-tighter">
          Connect Your
          <span className="block text-outline">Internet</span>
        </h1>

        <div className="relative mx-auto -mt-10 sm:-mt-[98px] flex max-w-[90rem] flex-row items-end justify-between">
          <div className="relative z-10 w-1/2 max-w-[220px] shrink-0 sm:w-[30%] sm:max-w-[420px] sm:-ml-4 lg:ml-8">
            <img
              src={customerImage}
              alt="Pelanggan menikmati koneksi MyRepublic"
              className="h-auto w-full object-contain object-bottom"
            />
          </div>
          <div className="relative z-20 w-1/2 pb-6 pr-2 text-right sm:mx-0 sm:pb-[114px] sm:pr-8 lg:pr-24">
            <p className="text-[13px] font-medium leading-snug text-brand-foreground/90 sm:text-xl sm:leading-relaxed">
              Streaming, kerja, belajar, dan main bareng makin lancar dengan koneksi fiber yang
              stabil.
            </p>
            <div className="mt-4 flex justify-end sm:mt-8">
              <Button
                variant="signal"
                size="sm"
                className="px-5 text-xs font-bold shadow-package sm:px-10 sm:text-base"
                asChild
              >
                <a href="#paket">Cek Area</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Packages() {
  return (
    <section id="paket" className="bg-background px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">Pilih yang paling pas</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Internet rumah untuk setiap kebutuhan
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pilih kecepatan sesuai aktivitas dan jumlah perangkat di rumah.
          </p>
        </div>
        <div className="mt-10 flex gap-5 overflow-x-auto snap-x snap-mandatory pb-8 sm:mt-12 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
          {packages.map((item) => (
            <article
              key={item.name}
              className={cn(
                "relative flex min-h-[330px] w-[85vw] shrink-0 snap-center flex-col border p-7 sm:w-auto",
                item.featured
                  ? "border-brand bg-brand text-brand-foreground shadow-package"
                  : "border-border bg-card text-card-foreground",
              )}
            >
              {item.featured ? (
                <span className="absolute right-5 top-5 bg-signal px-3 py-1 text-xs font-black uppercase text-signal-foreground">
                  Favorit
                </span>
              ) : null}
              <p
                className={cn(
                  "text-sm font-bold uppercase tracking-[0.12em]",
                  item.featured ? "text-signal" : "text-brand",
                )}
              >
                {item.name}
              </p>
              <div className="mt-8 flex items-end gap-2">
                <strong className="text-7xl font-black leading-none">{item.speed}</strong>
                <span className="pb-2 text-sm font-bold">Mbps</span>
              </div>
              <p
                className={cn(
                  "mt-5 text-sm leading-relaxed",
                  item.featured ? "text-brand-foreground/75" : "text-muted-foreground",
                )}
              >
                {item.description}
              </p>
              <div
                className={cn(
                  "mt-auto border-t pt-5",
                  item.featured ? "border-brand-foreground/20" : "border-border",
                )}
              >
                <p className="font-extrabold">
                  Mulai {item.price}
                  <span className="text-xs font-medium">/bulan</span>
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    item.featured ? "text-brand-foreground/65" : "text-muted-foreground",
                  )}
                >
                  Harga final mengikuti lokasi dan pilihan layanan.
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpeedTest() {
  const [isTesting, setIsTesting] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const needleRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsTesting(false);
          setTimeout(() => setIsTesting(true), 100);
        }
      },
      { threshold: 0.5 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isTesting) {
      if (numberRef.current) numberRef.current.innerText = "0.00";
      if (needleRef.current) needleRef.current.style.transform = `rotate(135deg)`;
      if (maskRef.current) {
        maskRef.current.style.webkitMaskImage = `conic-gradient(from 225deg, black 0deg, black 0deg, transparent 0deg)`;
        maskRef.current.style.maskImage = `conic-gradient(from 225deg, black 0deg, black 0deg, transparent 0deg)`;
      }
      return;
    }

    let startTime: number | null = null;
    const duration = 2500;

    // Matched exactly to the image's non-linear number placements
    // 135deg = Bottom-Left (0)
    // 270deg = Top (50)
    // 315deg = Top-Right (100)
    // 360deg = Right (120)
    const keyframes = [
      { t: 0, val: 0, angle: 135, maskAngle: 0 },
      { t: 0.3, val: 50, angle: 270, maskAngle: 135 },
      { t: 0.5, val: 120, angle: 360, maskAngle: 225 }, // Overshoot
      { t: 0.65, val: 70, angle: 290, maskAngle: 155 }, // Shake back
      { t: 0.75, val: 110, angle: 330, maskAngle: 195 }, // Shake forward
      { t: 0.85, val: 95, angle: 310, maskAngle: 175 }, // Settle back
      { t: 1.0, val: 100, angle: 315, maskAngle: 180 }, // Final exactly 100
    ];

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      const p = 1 - Math.pow(1 - progress, 3);

      let currentK = keyframes[0]!;
      let nextK = keyframes[keyframes.length - 1]!;

      for (let i = 0; i < keyframes.length - 1; i++) {
        const curr = keyframes[i];
        const next = keyframes[i + 1];
        if (curr && next && p >= curr.t && p <= next.t) {
          currentK = curr;
          nextK = next;
          break;
        }
      }

      const segmentProgress = (p - currentK.t) / (nextK.t - currentK.t);
      const val = currentK.val + (nextK.val - currentK.val) * segmentProgress;
      const angle = currentK.angle + (nextK.angle - currentK.angle) * segmentProgress;
      const maskAngle =
        currentK.maskAngle + (nextK.maskAngle - currentK.maskAngle) * segmentProgress;

      if (numberRef.current) numberRef.current.innerText = Math.max(0, val).toFixed(2);
      if (needleRef.current) needleRef.current.style.transform = `rotate(${angle}deg)`;

      if (maskRef.current) {
        const maskStr = `conic-gradient(from 225deg, black 0deg, black ${maskAngle}deg, transparent ${maskAngle}deg)`;
        maskRef.current.style.webkitMaskImage = maskStr;
        maskRef.current.style.maskImage = maskStr;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        if (numberRef.current) numberRef.current.innerText = "100.00";
        if (needleRef.current) needleRef.current.style.transform = `rotate(315deg)`;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isTesting]);

  return (
    <section ref={containerRef} className="bg-soft px-4 py-20 sm:py-24 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="section-kicker">Speed Test</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Kecepatan Nyata, Bukan Janji
          </h2>
        </div>

        <div className="w-full px-2 sm:px-0">
          <div className="mx-auto grid max-w-6xl grid-cols-[52px_1fr_52px] items-center justify-center gap-3 sm:grid-cols-[180px_1fr_180px] sm:gap-6 lg:grid-cols-[200px_1fr_200px] lg:gap-10">
            <div className="flex flex-col gap-2 sm:gap-3">
              <Button
                variant="brand"
                size="lg"
                className="w-full font-bold shadow-sm px-0 sm:px-8 h-12 sm:h-auto"
                onClick={() => {
                  setIsTesting(false);
                  setTimeout(() => setIsTesting(true), 50);
                }}
              >
                <span className="hidden sm:inline">Test Again</span>
                <RefreshCcw className="size-5 sm:hidden" />
              </Button>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Globe className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">IP Address</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">172.168.212.104</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <MapPin className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Location</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Purwokerto, ID</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Server className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Server</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">MyRepublic JKT</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center justify-center">
              <div className="relative aspect-square w-full z-10">
                <img
                  src={gaugeGray}
                  alt=""
                  className="absolute inset-0 size-full object-contain drop-shadow-sm"
                />

                <div
                  ref={maskRef}
                  className="absolute inset-0 size-full opacity-0 transition-opacity duration-300"
                  style={{ opacity: isTesting ? 1 : 0 }}
                >
                  <img src={gaugePurple} alt="" className="size-full object-contain" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    ref={needleRef}
                    className="absolute inset-0 size-full"
                    style={{ transform: "rotate(135deg)" }}
                  >
                    <div className="absolute left-1/2 top-1/2 h-[4px] sm:h-[5px] w-[28%] -translate-y-1/2 origin-left rounded-full bg-brand shadow-md" />
                  </div>
                  <div className="absolute size-5 sm:size-7 rounded-full bg-brand shadow-md border-4 sm:border-[5px] border-background z-20" />
                </div>
              </div>

              <div className="relative z-20 mt-[-0.5rem] sm:mt-[-2rem] text-center bg-soft/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2 sm:p-4">
                <span className="text-4xl sm:text-7xl lg:text-[5.5rem] font-black text-brand tracking-tighter">
                  <span ref={numberRef}>0.00</span>
                </span>
                <p className="text-[10px] sm:text-base font-bold text-muted-foreground flex items-center justify-center gap-1 sm:mt-2">
                  <Activity className="size-3 sm:size-5" /> Mbps
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-signal p-2 sm:p-3 rounded-lg shadow-sm border border-signal">
                <div className="grid size-8 shrink-0 place-items-center bg-background/50 text-signal-foreground rounded-md">
                  <Download className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-signal-foreground leading-tight">Download</p>
                  <p className="text-[10px] text-signal-foreground/80 font-bold mt-0.5">
                    100.00 Mbps
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Upload className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Upload</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">73.50 Mbps</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Network className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Idle Latency</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">12 ms</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Wifi className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Wi-Fi Name</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Home-Fiber</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoverageChecker() {
  const [searchedAddress, setSearchedAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section id="jangkauan" className="bg-soft px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <p className="section-kicker">Cek area Purwokerto</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Apakah rumahmu sudah terjangkau?
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
              Masukkan alamat pemasangan. Pengecekan ketersediaan aktual akan tersedia setelah
              layanan peta terhubung.
            </p>
            <form onSubmit={handleSubmit} className="mt-8" noValidate>
              <label htmlFor="address" className="text-sm font-bold text-foreground">
                Alamat pemasangan
              </label>
              <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative min-w-0">
                  <MapPin
                    className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand"
                    aria-hidden="true"
                  />
                  <input
                    id="address"
                    value={searchedAddress}
                    onChange={(event) => {
                      setSearchedAddress(event.target.value);
                      setSubmitted(false);
                    }}
                    className="h-13 w-full border border-input bg-background pl-12 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                    placeholder="Contoh: Jl. Jenderal Soedirman, Purwokerto"
                    required
                  />
                </div>
                <Button type="submit" variant="brand" size="lg" disabled={!searchedAddress.trim()}>
                  <Search /> Cek Alamat
                </Button>
              </div>
            </form>
            {submitted ? (
              <div className="mt-4 border-l-4 border-signal bg-background px-4 py-3" role="status">
                <p className="text-sm font-bold">Pengecekan online segera hadir.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Alamat belum dikirim atau dicocokkan dengan data jangkauan.
                </p>
              </div>
            ) : null}
          </div>
          <div
            className="map-grid relative aspect-[4/3] min-h-[360px] overflow-hidden border border-border bg-map shadow-map"
            aria-label="Area peta untuk integrasi layanan peta"
          >
            <div className="map-road map-road-one" aria-hidden="true" />
            <div className="map-road map-road-two" aria-hidden="true" />
            <div className="absolute left-[42%] top-[38%] grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand shadow-pin">
              <MapPin className="size-7 text-brand-foreground" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 border border-border bg-background p-4 shadow-sm">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center bg-signal text-signal-foreground">
                  <Building2 className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">Peta Jangkauan Purwokerto</p>
                  <p className="text-xs text-muted-foreground">Siap untuk integrasi Maps API</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  return (
    <section id="keunggulan" className="bg-background px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="section-kicker">Kenapa MyRepublic</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Lebih lancar untuk semua di rumah
            </h2>
          </div>
          <div className="mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-8 sm:mt-0 sm:grid sm:grid-cols-2 sm:gap-px sm:bg-border sm:pb-0">
            {benefits.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="w-[75vw] shrink-0 snap-center rounded-xl border border-border bg-background p-7 sm:w-auto sm:rounded-none sm:border-0 sm:p-8"
              >
                <span className="grid size-11 place-items-center bg-brand text-brand-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ConversionCta() {
  return (
    <section className="relative overflow-hidden bg-brand px-5 py-20 text-brand-foreground sm:py-24 lg:px-8">
      <div className="hero-grid absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-signal">
            <Sparkles className="size-4" /> Siap internetan lebih bebas?
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
            Mulai langkah pertamamu dengan cek jangkauan.
          </h2>
        </div>
        <Button variant="signal" size="xl" asChild>
          <a href="#jangkauan">
            Cek Area Sekarang <ArrowRight />
          </a>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-footer px-5 py-12 text-footer-foreground lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-9 border-b border-footer-foreground/15 pb-10 md:grid-cols-[1fr_auto_auto]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-footer-foreground/65">
              Koneksi fiber untuk mendukung keseharian keluarga dan bisnis di Purwokerto.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold">Jelajahi</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-footer-foreground/65">
              <a href="#paket">Paket Internet</a>
              <a href="#jangkauan">Cek Jangkauan</a>
              <a href="#keunggulan">Keunggulan</a>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">Area Layanan</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-footer-foreground/65">
              <House className="size-4" /> Purwokerto, Jawa Tengah
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-footer-foreground/65">
              <Router className="size-4" /> Internet fiber rumah
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-footer-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MyRepublic Purwokerto.</p>
          <p>Informasi paket dan area mengikuti ketersediaan layanan.</p>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans">
      <Header />
      <Hero />
      <Packages />
      <SpeedTest />
      <CoverageChecker />
      <Benefits />
      <ConversionCta />
      <Footer />
    </main>
  );
}
