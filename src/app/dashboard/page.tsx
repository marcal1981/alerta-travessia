import { redirect } from "next/navigation";

// A página inicial foi removida — o conteúdo do Dashboard agora é a própria raiz do
// site (`src/app/page.tsx`). Isso aqui existe só pra não quebrar links/favoritos
// antigos que apontem para /dashboard.
export default function DashboardRedirect() {
  redirect("/");
}
