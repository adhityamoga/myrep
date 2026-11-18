import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Apakah pemasangan MyRepublic di Purwokerto ada promo gratis biaya instalasi?",
    a: "Ya! MyRepublic Purwokerto rutin memberikan promo bebas biaya instalasi (Free Instalasi) serta peminjaman modem router gratis selama masa berlangganan aktif.",
  },
  {
    q: "Berapa lama estimasi teknisi memasang internet setelah pendaftaran?",
    a: "Setelah alamat Anda dipastikan masuk dalam coverage tiang ODP MyRepublic, tim teknisi Purwokerto akan menjadwalkan instalasi dalam 1–2 hari kerja sesuai ketersediaan waktu Anda.",
  },
  {
    q: "Apakah internet MyRepublic benar-benar tanpa FUP (Fair Usage Policy)?",
    a: "Benar, 100% True Unlimited tanpa FUP. Kecepatan internet Anda tidak akan pernah diturunkan meskipun mengunduh file besar atau streaming video 4K terus menerus.",
  },
  {
    q: "Area mana saja di Purwokerto yang saat ini sudah terjangkau jaringan fiber?",
    a: "Jaringan fiber MyRepublic telah menjangkau kawasan Purwokerto Timur, Barat, Utara, Selatan, area sekitar kampus UNSOED, Teluk, Bancarkembar, Karangklesem, hingga perumahan utama. Anda bisa memasukkan alamat pada form Cek Area atau menghubungi tim sales via WhatsApp untuk validasi titik ODP terdekat.",
  },
  {
    q: "Apa saja syarat pendaftaran pasang baru?",
    a: "Syaratnya sangat mudah: cukup foto KTP pemohon, alamat email, nomor WhatsApp aktif, dan titik lokasi (share loc) rumah yang ingin dipasang.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border bg-background px-5 py-20 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="section-kicker">Tanya Jawab</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-4 text-muted-foreground">
            Semua hal yang perlu Anda ketahui tentang pemasangan internet MyRepublic di Purwokerto.
          </p>
        </div>

        <div className="mt-10">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="rounded-lg border border-border bg-card px-6 transition-colors hover:border-brand/40"
              >
                <AccordionTrigger className="py-5 text-left font-bold text-base hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
