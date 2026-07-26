import { OfficialStatus } from "@/types";

/**
 * Módulo do Status Oficial da travessia.
 *
 * Regra de ouro do produto: este módulo NUNCA deve derivar seu valor do MPT (previsão de IA).
 * Enquanto não houver integração com uma API oficial da operadora/porto, o valor só muda
 * por atualização manual do Admin (ver /admin). Quando a API oficial existir, basta
 * substituir `getOfficialStatus` por uma chamada real mantendo o mesmo tipo de retorno.
 */

let currentOfficialStatus: OfficialStatus = {
  status: "operando",
  reason: null,
  updatedAt: new Date().toISOString(),
  updatedBy: "admin-manual",
  source: null,
};

export async function getOfficialStatus(): Promise<OfficialStatus> {
  // Fase 2: substituir por fetch à API oficial da operadora/DER-SP/Marinha, quando disponível.
  return currentOfficialStatus;
}

export async function setOfficialStatus(
  next: Pick<OfficialStatus, "status" | "reason">
): Promise<OfficialStatus> {
  currentOfficialStatus = {
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy: "admin-manual",
    source: null,
  };
  return currentOfficialStatus;
}
