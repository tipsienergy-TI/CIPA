"use client";

import { useState } from "react";
import { IconBallot, IconChart, IconLogout, IconUsers } from "@/components/icons";
import { api } from "@/lib/api";
import { COMPANY_NAME, LOGO_SRC } from "@/lib/brand";
import ResultsPanel from "./ResultsPanel";
import CandidatesPanel from "./CandidatesPanel";
import VotersPanel from "./VotersPanel";

const TABS = [
  { id: "results", label: "Apuração", icon: IconChart },
  { id: "candidates", label: "Candidatos", icon: IconBallot },
  { id: "voters", label: "Eleitores", icon: IconUsers },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminApp() {
  const [tab, setTab] = useState<TabId>("results");

  async function logout() {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/admin/login");
  }

  return (
    <div className="min-h-screen">
      {/* Cabeçalho com LOGOTIPO (LOGO_SRC) e borda laranja de destaque */}
      <header className="border-b-4 border-brand-500 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SRC} alt={COMPANY_NAME} className="h-10 w-auto sm:h-12" />
            <div className="hidden border-l border-graphite-200 pl-4 sm:block">
              <p className="text-sm font-bold text-graphite-900">Eleição da CIPA</p>
              <p className="text-xs text-graphite-400">Painel administrativo</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost btn-sm"><IconLogout className="h-4 w-4" /> Sair</button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto overflow-y-hidden px-4" aria-label="Seções">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-4 px-4 py-3 text-sm font-semibold transition ${
                tab === t.id ? "border-brand-500 text-brand-700" : "border-transparent text-graphite-600 hover:text-brand-600"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "results" && <ResultsPanel />}
        {tab === "candidates" && <CandidatesPanel />}
        {tab === "voters" && <VotersPanel />}
      </main>
    </div>
  );
}
