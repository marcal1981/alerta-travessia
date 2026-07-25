"use client";

import { useEffect, useState } from "react";
import { OFFICIAL_CAMERAS, getOfficialQueueStatus } from "@/services/officialQueueService";
import { OfficialQueueStatus } from "@/types";

const REFRESH_MS = 20_000; // câmeras e tempo de espera atualizam a cada 20s

export function CamerasPanel() {
  const [status, setStatus] = useState<OfficialQueueStatus | null>(null);
  const [cacheBuster, setCacheBuster] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const s = await getOfficialQueueStatus();
      if (!cancelled) setStatus(s);
    }
    load();
    const id = setInterval(() => {
      load();
      setCacheBuster(Date.now()); // força as câmeras (imagens) a recarregar
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const saoSebastiaoCams = OFFICIAL_CAMERAS.filter((c) => c.terminal === "sao_sebastiao").sort(
    (a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0)
  );
  const ilhabelaCams = OFFICIAL_CAMERAS.filter((c) => c.terminal === "ilhabela").sort(
    (a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0)
  );

  return (
    <div className="glass-panel p-6">
      <p className="eyebrow mb-4">Câmeras — Departamento Hidroviário</p>

      {status?.systemUnstableWarning && (
        <div className="mb-4 rounded-lg border border-signal-watch/30 bg-signal-watch/10 px-4 py-2 text-xs text-signal-watch">
          O próprio Departamento Hidroviário avisa que o sistema está instável agora —
          os dados de fila podem estar desatualizados. Confirme pelo 0800 77 33 711.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CameraGroup title="São Sebastião" cameras={saoSebastiaoCams} cacheBuster={cacheBuster} />
        <CameraGroup title="Ilhabela" cameras={ilhabelaCams} cacheBuster={cacheBuster} />
      </div>

      <p className="mt-4 rounded-lg border border-white/[0.06] bg-navy-900/60 p-3 text-xs leading-relaxed text-mist-500">
        Câmeras e tempo de espera vêm direto da infraestrutura oficial do Departamento
        Hidroviário. Não existe uma API pública documentada para este dado — se o layout
        do site oficial mudar, esta leitura pode parar de funcionar até ser ajustada.
      </p>
    </div>
  );
}

function CameraGroup({
  title,
  cameras,
  cacheBuster,
}: {
  title: string;
  cameras: typeof OFFICIAL_CAMERAS;
  cacheBuster: number;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-mist-100">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {cameras.map((cam) => (
          <CameraTile key={cam.id} camera={cam} cacheBuster={cacheBuster} />
        ))}
      </div>
    </div>
  );
}

function CameraTile({
  camera,
  cacheBuster,
}: {
  camera: (typeof OFFICIAL_CAMERAS)[number];
  cacheBuster: number;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false); // tenta de novo a cada ciclo de atualização, em vez de ficar quebrado pra sempre
  }, [cacheBuster]);

  return (
    <div>
      {failed ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-navy-900/60 px-2 text-center">
          <span className="text-[11px] text-mist-700">Câmera indisponível agora</span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${camera.imageUrl}?_=${cacheBuster}`}
          alt={camera.label}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="aspect-video w-full rounded-lg border border-white/[0.06] object-cover"
          loading="lazy"
        />
      )}
      <p className="mt-1 text-center text-[11px] text-mist-500">{camera.label}</p>
    </div>
  );
}
