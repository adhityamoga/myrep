import waRocketCta from "@/assets/wa-rocket-cta.png";

export function FloatingWhatsApp() {
  return (
    <aside
      aria-label="Kontak WhatsApp"
      className="fixed bottom-5 right-5 z-50 sm:bottom-6 sm:right-6"
    >
      <a
        href="https://wa.me/6281234567890?text=Halo%20Admin%20MyRepublic%20Purwokerto%2C%20saya%20ingin%20tanya%20info%20paket%20dan%20cek%20area"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat WhatsApp Sales Purwokerto"
        className="group relative block transition-transform duration-300 hover:scale-110 active:scale-95"
      >
        <img
          src={waRocketCta}
          alt="Chat WhatsApp MyRepublic Purwokerto"
          className="w-16 sm:w-20 drop-shadow-2xl transition-transform duration-300 group-hover:-translate-y-1.5"
        />
      </a>
    </aside>
  );
}
