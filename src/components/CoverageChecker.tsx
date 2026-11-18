import { CoverageMap } from "@/components/CoverageMap";

export function CoverageChecker() {
  return (
    <section id="jangkauan" className="bg-soft px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="section-kicker">Cek Jangkauan Fiber Riil</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Apakah Rumahmu Sudah Tercover?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sistem terhubung langsung dengan <strong>9.586 titik tiang FAT</strong> &amp; <strong>818 cluster</strong> di <strong>25 kecamatan</strong> se-Kabupaten Banyumas (Purwokerto Kota, Wangon, Cilongok, Rawalo, Jatilawang, Ajibarang, Baturraden, Sokaraja, Sumbang, dan sekitarnya).
          </p>
        </div>

        <CoverageMap />
      </div>
    </section>
  );
}
