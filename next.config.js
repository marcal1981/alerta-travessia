/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA real (manifest + service worker) entra na Fase 2 via next-pwa ou Workbox.
  // Mantido simples aqui para nao acoplar a build a um pacote ainda nao instalado.
};

module.exports = nextConfig;
