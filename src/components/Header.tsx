import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "./Brand";

export function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Paket Internet", "/#paket"],
    ["Speed Test", "/#speedtest"],
    ["Cek Jangkauan", "/#jangkauan"],
    ["Peta GIS", "/coverage"],
    ["Karir", "/karir"],
    ["FAQ", "/#faq"],
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex flex-col">
      <div className="bg-signal px-4 py-2 text-center text-xs font-bold text-signal-foreground sm:text-sm">
        <span className="mr-2">🔥</span> PROMO TERBATAS: Diskon 30% + Gratis Biaya Pemasangan Khusus Purwokerto!{" "}
        <a href="/#paket" className="ml-1 underline underline-offset-2 hover:text-white/80">
          Klaim Sekarang
        </a>
      </div>
      <div className="border-b border-brand-foreground/15 bg-brand/95 backdrop-blur-md">
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
            <a href="/#jangkauan">Cek Area</a>
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
              <a href="/#jangkauan">Cek Area</a>
            </Button>
          </div>
        </div>
      ) : null}
      </div>
    </header>
  );
}
