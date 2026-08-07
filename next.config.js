/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA real (manifest + service worker) entra na Fase 2 via next-pwa ou Workbox.
  // Mantido simples aqui para nao acoplar a build a um pacote ainda nao instalado.

  // Evita que proxies/caches intermediários (operadora, provedor) guardem uma cópia
  // antiga das PÁGINAS — sem isso, celular e PC podem mostrar versões diferentes do
  // site por dias após um deploy, mesmo em aba anônima (caso real já observado).
  // Não afeta /_next/static/* (JS/CSS com nome único por versão — cache ali é seguro
  // e importante pra performance, por isso ficam de fora dessa regra).
  // Headers de segurança básicos — defesa em profundidade, não dependem de nenhuma
  // lógica de negócio, então é seguro aplicar em todas as rotas de uma vez.
  //
  // Content-Security-Policy foi deixado de fora de propósito por agora: o mapa usa
  // tiles externos (basemaps.cartocdn.com) e a stack usa bastante estilo inline via
  // Tailwind/SVG do Recharts — uma CSP mal calibrada quebraria o mapa ou o gráfico
  // silenciosamente. Precisa de um levantamento completo de todo domínio/inline
  // usado antes de escrever a política, não é algo pra adicionar apressado.
  async headers() {
    return [
      {
        source: "/((?!_next/static).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
