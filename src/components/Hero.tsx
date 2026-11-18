import { Button } from "@/components/ui/button";
import customerImage from "@/assets/myrepublic-customer.png";

export function Hero() {
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
                <a href="/#paket">Cek Area</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
