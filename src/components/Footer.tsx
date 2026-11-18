import { House, Router } from "lucide-react";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="bg-footer px-5 py-12 text-footer-foreground lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-9 border-b border-footer-foreground/15 pb-10 md:grid-cols-[1fr_auto_auto]">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-footer-foreground/65">
              Koneksi fiber untuk mendukung keseharian keluarga dan bisnis di Purwokerto.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold">Jelajahi</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-footer-foreground/65">
              <a href="/#paket">Paket Internet</a>
              <a href="/#speedtest">Speed Test</a>
              <a href="/#jangkauan">Cek Jangkauan</a>
              <a href="/coverage">Peta GIS FAT</a>
              <a href="/#keunggulan">Keunggulan</a>
              <a href="/#faq">FAQ</a>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">Legal</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-footer-foreground/65">
              <a href="/syarat-ketentuan">Syarat & Ketentuan</a>
              <a href="/kebijakan-privasi">Kebijakan Privasi</a>
              <a href="/karir">Lowongan Kerja (Karir)</a>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold">Area Layanan</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-footer-foreground/65">
              <House className="size-4" /> Purwokerto, Jawa Tengah
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm text-footer-foreground/65">
              <Router className="size-4" /> Internet fiber rumah
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-footer-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MyRepublic Purwokerto.</p>
          <p>Informasi paket dan area mengikuti ketersediaan layanan.</p>
        </div>
      </div>
    </footer>
  );
}
