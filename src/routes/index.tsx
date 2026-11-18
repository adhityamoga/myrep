import { createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Packages } from "@/components/Packages";
import { SpeedTest } from "@/components/SpeedTest";
import { CoverageChecker } from "@/components/CoverageChecker";
import { Benefits } from "@/components/Benefits";
import { ConversionCta } from "@/components/ConversionCta";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Internet Cepat Purwokerto | MyRepublic" },
      {
        name: "description",
        content:
          "Temukan paket internet fiber MyRepublic untuk rumah di Purwokerto dan cek jangkauan di alamat Anda.",
      },
      { property: "og:title", content: "Internet Cepat Purwokerto | MyRepublic" },
      {
        property: "og:description",
        content: "Paket internet fiber stabil untuk rumah dan keluarga di Purwokerto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans">
      <Header />
      <Hero />
      <Packages />
      <SpeedTest />
      <CoverageChecker />
      <Benefits />
      <Faq />
      <ConversionCta />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
