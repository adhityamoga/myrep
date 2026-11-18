import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/karir")({
  component: Karir,
  head: () => ({
    meta: [{ title: "Karir | MyRepublic Purwokerto" }],
  }),
});

function Karir() {
  const jobs = [
    {
      title: "Direct Sales Executive (SGS)",
      type: "Full-Time",
      location: "Purwokerto",
      description: "Bergabung bersama tim penjualan kami untuk memasarkan layanan internet fiber ke berbagai area di Purwokerto. Mendapatkan gaji pokok, insentif, dan bonus tak terbatas.",
      requirements: [
        "Pria/Wanita, usia maksimal 35 tahun.",
        "Memiliki kendaraan pribadi dan SIM C.",
        "Berpengalaman di bidang sales/marketing (diutamakan).",
        "Komunikatif, target-oriented, dan pantang menyerah.",
      ]
    },
    {
      title: "Teknisi Jaringan (Fiber Optic)",
      type: "Full-Time",
      location: "Purwokerto",
      description: "Bertanggung jawab atas instalasi, perbaikan, dan pemeliharaan jaringan internet pelanggan secara profesional dan tepat waktu.",
      requirements: [
        "Pria, usia maksimal 30 tahun.",
        "Lulusan SMK Teknik Komputer Jaringan (TKJ) / Telekomunikasi.",
        "Memahami dasar jaringan FO dan memiliki sertifikat terkait menjadi nilai tambah.",
        "Tidak takut ketinggian dan memiliki SIM C.",
      ]
    }
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans pt-24">
      <Header />
      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <div className="text-center">
          <p className="text-brand font-bold uppercase tracking-wider text-sm mb-2">Karir MyRepublic</p>
          <h1 className="text-3xl font-black sm:text-5xl">Bergabunglah dengan Tim Kami</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Jadilah bagian dari provider internet fiber optic dengan pertumbuhan tercepat. 
            Kami mencari talenta terbaik di Purwokerto untuk berkembang bersama kami.
          </p>
        </div>
        
        <div className="mt-16 space-y-8">
          {jobs.map((job) => (
            <div key={job.title} className="border rounded-2xl p-6 sm:p-8 hover:border-brand/50 transition-colors bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{job.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground font-medium">
                    <span className="bg-muted px-2.5 py-1 rounded-md">{job.type}</span>
                    <span className="bg-muted px-2.5 py-1 rounded-md">{job.location}</span>
                  </div>
                </div>
                <Button variant="brand" size="sm" asChild className="w-full sm:w-auto">
                  <a 
                    href={`https://wa.me/6281234567890?text=Halo%20Tim%20HRD%20MyRepublic%20Purwokerto,%20saya%20ingin%20melamar%20untuk%20posisi%20${job.title}.`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Lamar via WhatsApp
                  </a>
                </Button>
              </div>
              <p className="mt-6 text-sm text-foreground/80 leading-relaxed">
                {job.description}
              </p>
              <div className="mt-4">
                <p className="font-semibold text-sm mb-2">Persyaratan:</p>
                <ul className="list-inside list-disc text-sm text-foreground/80 space-y-1">
                  {job.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-8 bg-muted/50 rounded-2xl border border-dashed border-border">
          <p className="text-foreground font-medium">
            Tidak menemukan posisi yang pas?
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Kirimkan CV (Curriculum Vitae) Anda kepada kami. Kami akan menghubungi Anda jika ada posisi yang sesuai.
          </p>
          <Button variant="outline" asChild>
            <a 
              href="https://wa.me/6281234567890?text=Halo%20Tim%20HRD%20MyRepublic%20Purwokerto,%20ini%20CV%20saya%20untuk%20database%20kandidat."
              target="_blank"
              rel="noreferrer"
            >
              Drop CV / Resume
            </a>
          </Button>
        </div>

      </div>
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
