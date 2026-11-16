"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/HeroBanner";
import { Alert, Avatar, Modal, Spinner } from "@/components/ui";
import { IconCheck } from "@/components/icons";
import { api, errMsg } from "@/lib/api";
import { ELECTION_TITLE } from "@/lib/brand";
import type { Candidate } from "@/lib/types";

type Choice = { kind: "candidate"; candidate: Candidate } | { kind: "blank" };

export default function Ballot() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(10);

  useEffect(() => {
    api<Candidate[]>("/api/candidates").then(setCandidates).catch((e) => setError(errMsg(e)));
  }, []);

  // Após votar, volta sozinho para a tela inicial (próximo colaborador).
  useEffect(() => {
    if (!done) return;
    if (count <= 0) { router.replace("/"); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [done, count, router]);

  async function submit() {
    if (!choice) return;
    setSending(true);
    setError(null);
    try {
      await api("/api/vote", {
        method: "POST",
        body: JSON.stringify(choice.kind === "blank" ? { blank: true } : { candidateId: choice.candidate.id }),
      });
      setConfirming(false);
      setDone(true);
    } catch (e) {
      setError(errMsg(e));
      setConfirming(false);
      setSending(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen">
        <HeroBanner />
        <section className="mx-auto -mt-10 max-w-lg px-4 pb-16">
          <div className="card p-8 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-white shadow-card">
              <IconCheck className="h-10 w-10" />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-graphite-900">Voto registrado!</h1>
            <p className="mt-2 text-graphite-600">Obrigado por participar da {ELECTION_TITLE}. Seu voto é secreto.</p>
            <button className="btn-primary mt-6" onClick={() => router.replace("/")}>
              Concluir ({count}s)
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isSelected = (c: Candidate) => choice?.kind === "candidate" && choice.candidate.id === c.id;
  const blankSelected = choice?.kind === "blank";

  return (
    <main className="min-h-screen pb-32">
      <HeroBanner />

      <section className="mx-auto max-w-6xl px-4 pt-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-graphite-900 sm:text-3xl">Escolha seu candidato</h1>
          <p className="mt-1 text-graphite-600">Toque no cartão desejado e depois em “Confirmar voto”.</p>
        </div>

        {error && <div className="mx-auto mb-6 max-w-xl"><Alert>{error}</Alert></div>}

        {!candidates ? (
          <div className="flex justify-center py-16 text-brand-500"><Spinner className="h-8 w-8" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChoice({ kind: "candidate", candidate: c })}
                aria-pressed={isSelected(c)}
                className={`group relative flex flex-col items-center rounded-2xl border-2 bg-white p-5 text-center shadow-card transition hover:-translate-y-0.5 hover:border-brand-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${
                  isSelected(c) ? "border-brand-500 ring-4 ring-brand-200" : "border-transparent"
                }`}
              >
                {isSelected(c) && (
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white">
                    <IconCheck className="h-4 w-4" />
                  </span>
                )}
                <Avatar name={c.name} src={c.photo_url} className="h-32 w-32 text-4xl ring-4 ring-brand-100" />
                <span className="mt-4 text-lg font-bold leading-snug text-graphite-900">{c.name}</span>
                <span className="chip mt-2 bg-brand-100 text-brand-800">{c.department}</span>
              </button>
            ))}

            {/* Voto em branco */}
            <button
              type="button"
              onClick={() => setChoice({ kind: "blank" })}
              aria-pressed={blankSelected}
              className={`relative flex min-h-[14rem] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white p-5 text-center transition hover:border-brand-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${
                blankSelected ? "border-brand-500 bg-brand-50 ring-4 ring-brand-200" : "border-graphite-200"
              }`}
            >
              {blankSelected && (
                <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white">
                  <IconCheck className="h-4 w-4" />
                </span>
              )}
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-graphite-200 text-graphite-400">
                <span className="h-8 w-8 rounded border-2 border-current" />
              </span>
              <span className="mt-4 text-lg font-bold text-graphite-800">Voto em branco</span>
              <span className="mt-1 text-sm text-graphite-600">Não escolher nenhum candidato</span>
            </button>
          </div>
        )}

        {candidates && candidates.length === 0 && (
          <p className="mt-6 text-center text-graphite-600">Nenhum candidato cadastrado. Procure a comissão eleitoral.</p>
        )}
      </section>

      {/* Barra fixa de ação */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite-100 bg-white/95 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-brand-300" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <p className="min-w-0 truncate text-sm text-graphite-600">
            {choice
              ? <>Selecionado: <strong className="text-graphite-900">{choice.kind === "blank" ? "Voto em branco" : choice.candidate.name}</strong></>
              : "Nenhuma opção selecionada"}
          </p>
          <button className="btn-primary shrink-0 px-8 py-3.5 text-base" disabled={!choice} onClick={() => setConfirming(true)}>
            Confirmar voto
          </button>
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => !sending && setConfirming(false)}
        title="Confirmação de voto"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirming(false)} disabled={sending}>Voltar e alterar</button>
            <button className="btn-primary" onClick={submit} disabled={sending}>
              {sending ? <Spinner /> : <IconCheck />} Confirmar e votar
            </button>
          </>
        }
      >
        {choice && (
          <div className="text-center">
            <p className="mb-4 text-graphite-600">Você está votando em:</p>
            {choice.kind === "blank" ? (
              <p className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 py-6 text-xl font-bold text-graphite-900">Voto em branco</p>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border-2 border-brand-300 bg-brand-50 py-6">
                <Avatar name={choice.candidate.name} src={choice.candidate.photo_url} className="h-24 w-24 text-3xl ring-4 ring-white" />
                <p className="mt-3 text-xl font-bold text-graphite-900">{choice.candidate.name}</p>
                <span className="chip mt-1 bg-brand-200 text-brand-900">{choice.candidate.department}</span>
              </div>
            )}
            <p className="mt-4 text-sm font-semibold text-brand-800">Após confirmar, o voto não poderá ser alterado.</p>
          </div>
        )}
      </Modal>
    </main>
  );
}
