"use client";

import { useEffect } from "react";

/** Componente invisível — só registra 1 acesso quando o site carrega. */
export function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit-count", { method: "POST" }).catch(() => {
      // Falha silenciosa — nunca deve impedir o site de funcionar por causa do contador.
    });
  }, []);

  return null;
}
