import { useState, FormEvent } from "react";
import { Building2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CoverageChecker() {
  const [searchedAddress, setSearchedAddress] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!searchedAddress.trim()) return;

    const phoneNumber = "6281234567890";
    const message = `Halo Admin MyRepublic Purwokerto, tolong cek jaringan untuk alamat: ${searchedAddress}`;
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, "_blank");
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
