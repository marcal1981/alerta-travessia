import { TruckSchedulePanel } from "@/components/TruckSchedulePanel";

export default function CaminhoesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="eyebrow">Para transportadoras e frotistas</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-mist-100">
          Janela de Embarque para Caminhões
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Veja agora se o seu veículo está liberado para embarcar, por categoria e sentido,
          combinando a regra oficial de horários com a maré medida em tempo real.
        </p>
      </div>

      <TruckSchedulePanel />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-panel p-6">
          <p className="eyebrow">Sem restrição de horário</p>
          <p className="mt-2 text-sm text-mist-300">
            VUC e caminhões do tipo &quot;toco&quot; (2 eixos) não têm restrição de horário
            nem de maré nesta travessia.
          </p>
        </div>
        <div className="glass-panel p-6">
          <p className="eyebrow">Limite sempre válido</p>
          <p className="mt-2 text-sm text-mist-300">
            Proibido o embarque de caminhões com peso bruto total (PBT) acima de 40
            toneladas, independente de categoria, horário ou maré.
          </p>
        </div>
      </div>
    </div>
  );
}
