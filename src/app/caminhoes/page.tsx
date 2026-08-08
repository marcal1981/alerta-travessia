import { TruckSchedulePanel } from "@/components/TruckSchedulePanel";

export default function CaminhoesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-mist-100">
          Janela de Embarque para Caminhões
        </h1>
      </div>

      <TruckSchedulePanel />
    </div>
  );
}
