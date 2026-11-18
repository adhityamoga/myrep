import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const packages = [
  {
    name: "Value",
    speed: "30",
    price: "Rp 250 ribuan",
    description: "Untuk browsing, belajar, dan kebutuhan harian keluarga.",
    featured: false,
    badge: "Paling Hemat",
    features: [
      "Kecepatan hingga 30 Mbps",
      "True Unlimited (Tanpa batas FUP)",
      "Gratis biaya instalasi",
      "Termasuk Wi-Fi Router",
    ],
  },
  {
    name: "Fast",
    speed: "50",
    price: "Rp 300 ribuan",
    description: "Favorit warga Purwokerto untuk streaming & banyak perangkat.",
    featured: true,
    badge: "Terlaris di Purwokerto",
    features: [
      "Kecepatan hingga 50 Mbps",
      "True Unlimited (Tanpa batas FUP)",
      "Router Dual-Band Wi-Fi",
      "Cocok untuk 5–7 perangkat aktif",
      "Gratis biaya instalasi",
    ],
  },
  {
    name: "Nova",
    speed: "100",
    price: "Rp 400 ribuan",
    description: "Performa tinggi untuk gaming kompetitif, WFH, & konten kreator.",
    featured: false,
    badge: "Performa Maksimal",
    features: [
      "Kecepatan hingga 100 Mbps",
      "True Unlimited (Tanpa batas FUP)",
      "Router Gigabit Dual-Band",
      "Prioritas latency gaming & 4K streaming",
      "Gratis biaya instalasi",
    ],
  },
];

export function Packages() {
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
                "relative flex min-h-[460px] w-[85vw] shrink-0 snap-center flex-col border p-7 sm:w-auto transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
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
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm font-bold uppercase tracking-[0.12em]",
                    item.featured ? "text-signal" : "text-brand",
                  )}
                >
                  {item.name}
                </p>
                <span
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    item.featured
                      ? "bg-white/15 text-brand-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.badge}
                </span>
              </div>
              <div className="mt-6 flex items-end gap-2">
                <strong className="text-7xl font-black leading-none">{item.speed}</strong>
                <span className="pb-2 text-sm font-bold">Mbps</span>
              </div>
              <p
                className={cn(
                  "mt-4 text-sm leading-relaxed",
                  item.featured ? "text-brand-foreground/75" : "text-muted-foreground",
                )}
              >
                {item.description}
              </p>

              <ul className="mt-6 space-y-2.5 border-t border-dashed border-current/20 py-5 text-xs">
                {item.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 font-medium">
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        item.featured ? "text-signal" : "text-brand",
                      )}
                    />
                    <span
                      className={item.featured ? "text-brand-foreground/90" : "text-foreground/90"}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

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
                  Harga final mengikuti lokasi dan pilihan promo.
                </p>
                <Button
                  variant={item.featured ? "signal" : "brand"}
                  className="mt-5 w-full font-bold"
                  asChild
                >
                  <a
                    href={`https://wa.me/6281234567890?text=Halo%20Admin%20MyRepublic%20Purwokerto%2C%20saya%20tertarik%20dengan%20paket%20${item.name}%20${item.speed}Mbps`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pilih Paket {item.name}
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
