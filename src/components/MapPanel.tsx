"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

// Coordenadas reais dos terminais (Google Places), mais precisas que a estimativa inicial.
const TERMINAL_SAO_SEBASTIAO: [number, number] = [-23.809321, -45.397407];
const TERMINAL_ILHABELA: [number, number] = [-23.818508, -45.376278];

/**
 * Mapa interativo dos terminais. Fase 1: marcadores dos dois terminais + indicador
 * de direção do vento sobre o canal. As camadas de radar/ondas/nuvens/chuva (mencionadas
 * no brief) dependem de provedores de tile externos (ex. RainViewer, Windy Map API) e
 * entram na Fase 2 como overlays adicionais — a estrutura de camadas já está preparada
 * abaixo (`LAYER_SLOTS`) para receber essas integrações sem refatorar o componente.
 */
const LAYER_SLOTS = ["radar", "ondas", "nuvens", "chuva"] as const;

export function MapPanel({ windDirectionDeg }: { windDirectionDeg?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(
        [
          (TERMINAL_SAO_SEBASTIAO[0] + TERMINAL_ILHABELA[0]) / 2,
          (TERMINAL_SAO_SEBASTIAO[1] + TERMINAL_ILHABELA[1]) / 2,
        ],
        13
      );

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);

      const terminalIcon = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 4px ${color}33;"></div>`,
          iconSize: [14, 14],
        });

      L.marker(TERMINAL_SAO_SEBASTIAO, { icon: terminalIcon("#38BDF8") })
        .addTo(map)
        .bindPopup("Terminal São Sebastião");

      L.marker(TERMINAL_ILHABELA, { icon: terminalIcon("#F97316") })
        .addTo(map)
        .bindPopup("Terminal Ilhabela");

      mapRef.current = map;
    }

    initMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="glass-panel overflow-hidden p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <p className="eyebrow">Mapa da Travessia</p>
        <div className="flex gap-3">
          {LAYER_SLOTS.map((layer) => (
            <span
              key={layer}
              title="Disponível na Fase 2 (requer provedor de tiles externo)"
              className="cursor-not-allowed rounded-full border border-white/10 px-2.5 py-1 text-[11px] capitalize text-mist-700"
            >
              {layer}
            </span>
          ))}
        </div>
      </div>
      {typeof windDirectionDeg === "number" && (
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-3 text-xs text-mist-500">
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ transform: `rotate(${windDirectionDeg}deg)` }}>
            <path d="M12 2 L18 14 L12 10.5 L6 14 Z" fill="#38BDF8" />
          </svg>
          Direção do vento sobre o canal
        </div>
      )}
      <div ref={containerRef} className="h-[360px] w-full" />
    </div>
  );
}
