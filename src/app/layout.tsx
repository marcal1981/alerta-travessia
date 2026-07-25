import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Navbar } from "@/components/Navbar";

const display = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

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
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable} dark`}>
      <body className="font-body min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
