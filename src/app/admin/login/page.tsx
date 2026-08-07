"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Usuário ou senha incorretos.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Falha ao tentar entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-xl font-semibold text-mist-100">Painel Administrativo</h1>
      <p className="mt-1 text-sm text-mist-500">Acesso restrito.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs text-mist-500">Usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-mist-100 outline-none focus:border-signal-low"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-mist-500">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-mist-100 outline-none focus:border-signal-low"
          />
        </div>
        {error && <p className="text-sm text-signal-critical">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-lg bg-signal-low px-4 py-2 text-sm font-semibold text-navy-900 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
