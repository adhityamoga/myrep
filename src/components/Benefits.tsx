import { Headphones, ShieldCheck, Wifi, Zap } from "lucide-react";

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

export function Benefits() {
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
