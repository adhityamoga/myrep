import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export const Route = createFileRoute("/kebijakan-privasi")({
  component: KebijakanPrivasi,
  head: () => ({
    meta: [{ title: "Kebijakan Privasi | MyRepublic Purwokerto" }],
  }),
});

function KebijakanPrivasi() {
  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans pt-24">
      <Header />
      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <h1 className="text-3xl font-black sm:text-5xl">Kebijakan Privasi</h1>
        <p className="mt-4 text-muted-foreground">Pembaruan Terakhir: 24 September 2026</p>
        
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/80 sm:text-base">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Pendahuluan</h2>
            <p className="mt-2">
              Privasi Anda sangat penting bagi kami. Kebijakan Privasi ini menjelaskan bagaimana 
              kami mengumpulkan, menggunakan, melindungi, dan membagikan informasi pribadi Anda 
              ketika Anda menggunakan layanan dan situs web MyRepublic Purwokerto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Informasi yang Kami Kumpulkan</h2>
            <p className="mt-2">
              Untuk memproses pendaftaran dan mengecek jangkauan area (Coverage Check), kami mungkin
              meminta informasi pribadi seperti:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Nama lengkap</li>
              <li>Alamat lengkap (untuk survei jaringan)</li>
              <li>Nomor telepon / WhatsApp yang aktif</li>
              <li>Alamat email</li>
              <li>Foto KTP (hanya saat proses registrasi resmi pemasangan baru)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Penggunaan Informasi</h2>
            <p className="mt-2">
              Informasi yang Anda berikan hanya akan digunakan untuk:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Memvalidasi ketersediaan jaringan fiber optic di lokasi Anda.</li>
              <li>Memproses pendaftaran dan pemasangan layanan internet.</li>
              <li>Menghubungi Anda terkait pembaruan layanan, tagihan, atau dukungan teknis.</li>
              <li>Meningkatkan kualitas layanan pelanggan kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Keamanan Data</h2>
            <p className="mt-2">
              Kami berkomitmen untuk melindungi data pribadi Anda. Kami menggunakan langkah-langkah
              keamanan yang wajar untuk mencegah akses, penggunaan, atau pengungkapan data Anda oleh
              pihak yang tidak berwenang. Data Anda tidak akan diperjualbelikan kepada pihak ketiga
              mana pun.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Hubungi Kami</h2>
            <p className="mt-2">
              Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau ingin meminta 
              penghapusan data Anda dari sistem kami, silakan hubungi tim dukungan pelanggan kami 
              melalui tombol WhatsApp yang tersedia di situs web ini.
            </p>
          </section>
        </div>
      </div>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
