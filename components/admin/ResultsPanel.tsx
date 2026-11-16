"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Avatar, Modal, Spinner } from "@/components/ui";
import { api, errMsg } from "@/lib/api";
import type { Results } from "@/lib/types";

const POLL_MS = 5000;

export default function ResultsPanel() {
  const [data, setData] = useState<Results | null>(null);
  const [votingOpen, setVotingOpen] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<Results>("/api/admin/results"));
      setUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    load();
    api<{ votingOpen: boolean }>("/api/admin/settings").then((s) => setVotingOpen(s.votingOpen)).catch(() => {});
    const t = setInterval(load, POLL_MS); // "tempo real" por polling
    return () => clearInterval(t);
  }, [load]);

  async function toggleVoting() {
    if (votingOpen === null) return;
    setBusy(true);
    try {
      const r = await api<{ votingOpen: boolean }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ votingOpen: !votingOpen }),
      });
      setVotingOpen(r.votingOpen);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function resetAll() {
    setBusy(true);
    try {
      await api("/api/admin/reset?confirm=1", { method: "POST" });
      setResetOpen(false);
      await load();
    } catch (e) {
      setError(errMsg(e));
      setResetOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return error ? <Alert>{error}</Alert> : <div className="flex justify-center py-20 text-brand-500"><Spinner className="h-8 w-8" /></div>;
  }

  const candidateVotes = data.candidates.reduce((s, c) => s + c.votes, 0);
  const totalVotes = candidateVotes + data.blank;
  const participation = data.eligible ? (data.voted / data.eligible) * 100 : 0;
  const pct = (n: number) => (totalVotes ? (n / totalVotes) * 100 : 0);
  const leader = data.candidates[0]?.votes > 0 ? data.candidates[0].id : null;

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      {/* Controle da votação */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-3 w-3`}>
            {votingOpen && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-3 w-3 rounded-full ${votingOpen ? "bg-emerald-500" : "bg-graphite-400"}`} />
          </span>
          <div>
            <p className="font-bold text-graphite-900">Votação {votingOpen === null ? "…" : votingOpen ? "aberta" : "encerrada"}</p>
            <p className="text-xs text-graphite-400">
              Atualiza a cada {POLL_MS / 1000}s{updated && ` · última: ${updated.toLocaleTimeString("pt-BR")}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={votingOpen ? "btn-outline btn-sm" : "btn-primary btn-sm"} onClick={toggleVoting} disabled={busy || votingOpen === null}>
            {votingOpen ? "Encerrar votação" : "Reabrir votação"}
          </button>
          <button className="btn-ghost btn-sm text-red-600 hover:bg-red-50" onClick={() => setResetOpen(true)}>Zerar apuração</button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Eleitores aptos" value={data.eligible} />
        <Stat label="Já votaram" value={data.voted} />
        <Stat label="Participação" value={`${participation.toFixed(1)}%`} highlight />
        <Stat label="Votos em branco" value={data.blank} />
      </div>

      <div className="card p-5">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-graphite-700">
          <span>Participação</span>
          <span>{data.voted} de {data.eligible}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-graphite-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-300 transition-all duration-700" style={{ width: `${participation}%` }} />
        </div>
      </div>

      {/* Votos por candidato */}
      <div className="card p-5 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-graphite-900">Votos por candidato</h2>
          <span className="text-sm text-graphite-400">{totalVotes} voto(s) apurado(s)</span>
        </div>
        {data.candidates.length === 0 && <p className="text-graphite-600">Nenhum candidato cadastrado.</p>}
        <ul className="space-y-5">
          {data.candidates.map((c, i) => (
            <li key={c.id}>
              <div className="mb-1.5 flex items-center gap-3">
                <span className="w-5 text-center text-sm font-bold text-graphite-400">{i + 1}º</span>
                <Avatar name={c.name} src={c.photo_url} className="h-10 w-10 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-graphite-900">{c.name}</p>
                  <p className="truncate text-xs text-graphite-400">{c.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-graphite-900">{c.votes}</p>
                  <p className="text-xs text-graphite-400">{pct(c.votes).toFixed(1)}%</p>
                </div>
              </div>
              <div className="ml-8 h-3 overflow-hidden rounded-full bg-graphite-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${c.id === leader ? "bg-gradient-to-r from-brand-600 to-brand-300" : "bg-brand-300"}`}
                  style={{ width: `${pct(c.votes)}%` }}
                />
              </div>
            </li>
          ))}
          <li>
            <div className="mb-1.5 flex items-center gap-3">
              <span className="w-5" />
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-graphite-200 text-graphite-400">∅</div>
              <p className="flex-1 font-semibold text-graphite-700">Brancos</p>
              <div className="text-right">
                <p className="text-lg font-bold text-graphite-900">{data.blank}</p>
                <p className="text-xs text-graphite-400">{pct(data.blank).toFixed(1)}%</p>
              </div>
            </div>
            <div className="ml-8 h-3 overflow-hidden rounded-full bg-graphite-100">
              <div className="h-full rounded-full bg-graphite-400 transition-all duration-700" style={{ width: `${pct(data.blank)}%` }} />
            </div>
          </li>
        </ul>
        <p className="mt-6 text-xs text-graphite-400">Apuração agregada: o sistema não armazena nem exibe quem votou em quem.</p>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Zerar apuração?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setResetOpen(false)}>Cancelar</button>
            <button className="btn-danger" onClick={resetAll} disabled={busy}>{busy && <Spinner />} Sim, zerar tudo</button>
          </>
        }
      >
        <p className="text-graphite-700">
          Todos os votos serão apagados e todos os eleitores voltarão a ficar aptos a votar. Use apenas para
          testes antes da eleição. <strong>Esta ação não pode ser desfeita.</strong>
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 shadow-card ${highlight ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white" : "border border-graphite-100 bg-white"}`}>
      <p className={`text-sm font-medium ${highlight ? "text-brand-50" : "text-graphite-600"}`}>{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${highlight ? "text-white" : "text-graphite-900"}`}>{value}</p>
    </div>
  );
}
