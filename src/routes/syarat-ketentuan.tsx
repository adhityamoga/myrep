import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export const Route = createFileRoute("/syarat-ketentuan")({
  component: SyaratKetentuan,
  head: () => ({
    meta: [{ title: "Syarat & Ketentuan | MyRepublic Purwokerto" }],
  }),
});

function SyaratKetentuan() {
  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans pt-24">
      <Header />
      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="text-3xl font-black sm:text-5xl">Syarat & Ketentuan Layanan</h1>
        <p className="mt-4 text-muted-foreground">Pembaruan Terakhir: 24 September 2026</p>
        
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80 sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Definisi Layanan</h2>
            <p className="mt-2">
              Layanan MyRepublic merujuk pada penyediaan akses internet broadband berbasis fiber optic
              yang diselenggarakan untuk area Purwokerto dan sekitarnya. Kecepatan yang tertera (misalnya
              30 Mbps, 50 Mbps, 100 Mbps) adalah kecepatan maksimal (up to) dan dapat bervariasi bergantung
              pada faktor teknis di lapangan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Kebijakan Tanpa Batas Kuota (True Unlimited)</h2>
            <p className="mt-2">
              MyRepublic Purwokerto menerapkan kebijakan 100% True Unlimited. Tidak ada batasan 
              Fair Usage Policy (FUP) yang akan menurunkan kecepatan internet Anda setelah mencapai
              kapasitas penggunaan tertentu. Pelanggan bebas mengunduh dan melakukan streaming kapan saja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Biaya Pemasangan dan Perangkat</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Biaya instalasi digratiskan selama masa promo yang berlaku.</li>
              <li>Perangkat modem/router ONT dipinjamkan secara gratis selama Anda menjadi pelanggan aktif.</li>
              <li>Apabila terjadi kerusakan perangkat akibat kelalaian pelanggan, akan dikenakan biaya penggantian.</li>
              <li>Perangkat harus dikembalikan utuh apabila pelanggan memutuskan untuk berhenti berlangganan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Penagihan dan Pembayaran</h2>
            <p className="mt-2">
              Tagihan akan diterbitkan setiap bulan sesuai dengan siklus aktivasi layanan. Pembayaran
              diharapkan dilakukan sebelum tanggal jatuh tempo. Keterlambatan pembayaran dapat
              mengakibatkan isolasi (pemblokiran sementara) hingga tagihan dilunasi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Pemutusan Layanan dan Penalti</h2>
            <p className="mt-2">
              Terdapat kontrak minimum berlangganan selama 12 bulan sejak layanan diaktifkan. 
              Apabila pelanggan memutuskan untuk berhenti sebelum masa kontrak berakhir, akan 
              dikenakan biaya penalti sebesar Rp 1.000.000,- (Satu Juta Rupiah) atau sesuai dengan 
              ketentuan promo yang Anda pilih saat mendaftar.
            </p>
          </section>
        </div>
      </div>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
