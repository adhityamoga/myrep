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
      {
        title: "MyRepublic Purwokerto | Internet Fiber Rumah Cepat & Stabil",
      },
      {
        name: "description",
        content:
          "Pasang internet fiber MyRepublic di Purwokerto. Paket rumah cepat, tanpa batas kuota, dan harga terjangkau untuk keluarga, streaming, serta gaming.",
      },
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
      <ConversionCta />
      <Faq />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
