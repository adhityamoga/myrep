import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConversionCta() {
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
          <a href="/#jangkauan">
            Cek Area Sekarang <ArrowRight />
          </a>
        </Button>
      </div>
    </section>
  );
}
