"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, Spinner } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import { COMPANY_NAME, HERO_SRC, LOGO_SRC } from "@/lib/brand";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
      // Carregamento completo: evita o cache do roteador que guardou o redirect /admin -> /admin/login
      window.location.assign("/admin");
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Painel lateral com a imagem de fundo (HERO_SRC) */}
      <div className="relative hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700/40 to-graphite-900/60" />
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          {/* LOGOTIPO (LOGO_SRC) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt={COMPANY_NAME} className="mx-auto mb-8 h-20 w-auto" />
          <div className="mb-1 h-1.5 w-16 rounded-full bg-gradient-to-r from-brand-600 to-brand-300" />
          <h1 className="mt-3 text-2xl font-bold text-graphite-900">Painel administrativo</h1>
          <p className="mb-6 mt-1 text-sm text-graphite-600">Acesso restrito à comissão eleitoral da CIPA.</p>

          <label htmlFor="senha" className="label">Senha</label>
          <input
            id="senha"
            type="password"
            className="input"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="mt-4"><Alert>{error}</Alert></div>}
          <button className="btn-primary mt-5 w-full py-3.5" disabled={loading || !password}>
            {loading && <Spinner />} Entrar
          </button>
          <p className="mt-6 text-center text-xs text-graphite-400">
            <Link href="/" className="hover:text-brand-600">← Voltar à cabine de votação</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
