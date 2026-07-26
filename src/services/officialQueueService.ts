import { OfficialCamera, OfficialQueueStatus } from "@/types";

/**
 * Câmeras oficiais do Departamento Hidroviário, hospedadas na infraestrutura própria
 * do governo (Azure) — não é um proxy de terceiro. URLs confirmadas na página oficial:
 * https://semil.sp.gov.br/travessias/travessias-automoveis/sao-sebastiao-ilhabela/
 */
/**
 * Distâncias até o ponto de embarque em metros — fornecidas pelo usuário (não são
 * estimativa da IA). ATENÇÃO: a correspondência exata entre cada distância e o número
 * da câmera (1-5 / 1-4) está assumindo a ordem crescente natural (Câmera 1 = mais
 * próxima) — ainda não confirmada contra a numeração real do Departamento Hidroviário.
 */
export const OFFICIAL_CAMERAS: OfficialCamera[] = [
  { id: "saosebastiao", label: "São Sebastião · 50m da balsa", terminal: "sao_sebastiao", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/saosebastiao.jpg", distanceM: 50 },
  { id: "saosebastiao2", label: "São Sebastião · 100m da balsa", terminal: "sao_sebastiao", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/saosebastiao2.jpg", distanceM: 100 },
  { id: "saosebastiao3", label: "São Sebastião · 150m da balsa", terminal: "sao_sebastiao", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/saosebastiao3.jpg", distanceM: 150 },
  { id: "saosebastiao4", label: "São Sebastião · 200m da balsa", terminal: "sao_sebastiao", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/saosebastiao4.jpg", distanceM: 200 },
  { id: "saosebastiao5", label: "São Sebastião · 30m da balsa", terminal: "sao_sebastiao", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/saosebastiao5.jpg", distanceM: 30 },
  { id: "ilhabela", label: "Ilhabela · 100m da balsa", terminal: "ilhabela", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/ilhabela.jpg", distanceM: 100 },
  { id: "ilhabela2", label: "Ilhabela · 150m da balsa", terminal: "ilhabela", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/ilhabela2.jpg", distanceM: 150 },
  { id: "ilhabela3", label: "Ilhabela · 200m da balsa", terminal: "ilhabela", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/ilhabela3.jpg", distanceM: 200 },
  { id: "ilhabela4", label: "Ilhabela · 250m da balsa", terminal: "ilhabela", imageUrl: "https://dhapp3.azurewebsites.net/cameras/imagens/ilhabela4.jpg", distanceM: 250 },
];

export async function getOfficialQueueStatus(): Promise<OfficialQueueStatus> {
  try {
    const res = await fetch("/api/dh-status", { cache: "no-store" });
    if (!res.ok) throw new Error(`API respondeu ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Falha ao consultar /api/dh-status:", err);
    return {
      waitTimeSaoSebastiaoMin: null,
      waitTimeIlhabelaMin: null,
      ferriesInOperation: null,
      systemUnstableWarning: false,
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
    };
  }
}
