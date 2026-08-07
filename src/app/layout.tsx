import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "Alerta Travessia IA — São Sebastião ↔ Ilhabela",
  description:
    "Monitoramento e previsão probabilística do risco de interrupção da travessia de balsa entre São Sebastião e Ilhabela.",
  manifest: "/manifest.json",
  applicationName: "Alerta Travessia IA",
};

export const viewport: Viewport = {
  themeColor: "#0B1120",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-body min-h-screen">
        <Navbar />
        <VisitTracker />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
