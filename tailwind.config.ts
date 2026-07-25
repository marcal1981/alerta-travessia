import type { Config } from "tailwindcss";

// Tokens definidos a partir do brief: Dark Theme, Azul marinho, Branco, Cinza, Laranja, Vermelho.
// Paleta com papeis claros (fundo / superficie / dado / risco) para nao virar "azul generico".
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        abyss: "#060B16",       // fundo profundo (mar a noite)
        navy: {
          900: "#0B1120",
          800: "#111A2E",
          700: "#182541",
          600: "#233255",
        },
        mist: {
          100: "#F5F7FA",       // branco
          300: "#C7CEDA",
          500: "#8A94A6",       // cinza
          700: "#4C5567",
        },
        signal: {
          low: "#2DD4A7",       // baixo (verde-agua, nao pedido no brief mas necessario p/ 0-30)
          watch: "#F4B740",     // atencao (amarelo-laranja)
          high: "#F97316",      // alto (laranja - do brief)
          critical: "#E23744",  // muito alto (vermelho - do brief)
        },
        tide: "#38BDF8",         // dado meteorologico / vento / mare (acento ciano, mundo Windy)
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        instrument: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -20px rgba(0,0,0,0.6)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseRing: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
      },
      animation: {
        sweep: "sweep 4s linear infinite",
        pulseRing: "pulseRing 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
