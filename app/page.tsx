"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeroBanner from "@/components/HeroBanner";
import { Alert, Spinner } from "@/components/ui";
import { IconBallot, IconCheck, IconSearch } from "@/components/icons";
import { api, errMsg } from "@/lib/api";
import { ELECTION_TITLE } from "@/lib/brand";
import type { VoterHit } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<VoterHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [selected, setSelected] = useState<VoterHit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [going, setGoing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ votingOpen: boolean }>("/api/status")
      .then((s) => setOpen(s.votingOpen))
      .catch(() => setOpen(true)); // se falhar, a própria identificação acusará o erro
  }, []);

  // autocompletar com debounce
  useEffect(() => {
    if (selected) return;
    if (q.trim().length < 3) {
      setHits([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const data = await api<VoterHit[]>(`/api/voter/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setHits(data);
        setActive(-1);
        setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(errMsg(e));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, selected]);

  function pick(h: VoterHit) {
    if (h.voted) return;
    setSelected(h);
    setHits([]);
    setError(null);
  }

  function reset() {
    setSelected(null);
    setQ("");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function confirm() {
    if (!selected) return;
    setGoing(true);
    setError(null);
    try {
      await api("/api/voter/identify", { method: "POST", body: JSON.stringify({ voterId: selected.id }) });
      router.push("/votar");
    } catch (e) {
      setError(errMsg(e));
      setGoing(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? hits.length - 1 : a - 1)); }
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(hits[active]); }
  }

  return (
    <main className="min-h-screen">
      <HeroBanner tall />

      <section className="mx-auto -mt-12 max-w-xl px-4 pb-16">
        <div className="card relative p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
              <IconBallot className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold leading-tight text-graphite-900">{ELECTION_TITLE}</h1>
              <p className="text-sm text-graphite-600">Seu voto é secreto e não é vinculado ao seu nome.</p>
            </div>
          </div>

          {open === false ? (
            <Alert kind="info">A votação não está aberta no momento. Procure a comissão eleitoral.</Alert>
          ) : selected ? (
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-brand-300 bg-brand-50 p-5 text-center">
                <p className="text-sm font-medium text-brand-800">Você é</p>
                <p className="mt-1 text-xl font-bold text-graphite-900">{selected.name}</p>
                {selected.hint && <p className="mt-1 text-sm text-graphite-600">Matrícula {selected.hint}</p>}
              </div>
              {error && <Alert>{error}</Alert>}
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <button className="btn-primary flex-1 py-3.5 text-base" onClick={confirm} disabled={going}>
                  {going ? <Spinner /> : <IconCheck />} Sim, ir para a votação
                </button>
                <button className="btn-ghost flex-1" onClick={reset} disabled={going}>Não sou eu</button>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="nome" className="label">Digite seu nome completo</label>
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-graphite-400" />
                <input
                  id="nome"
                  ref={inputRef}
                  className="input pl-12"
                  placeholder="Ex.: Maria da Silva"
                  autoComplete="off"
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onKeyDown}
                  role="combobox"
                  aria-expanded={hits.length > 0}
                  aria-controls="lista-nomes"
                />
                {loading && <Spinner className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500" />}
              </div>

              {hits.length > 0 && (
                <ul id="lista-nomes" role="listbox" className="mt-2 overflow-hidden rounded-xl border border-graphite-200 bg-white shadow-card">
                  {hits.map((h, i) => (
                    <li key={h.id} role="option" aria-selected={i === active} aria-disabled={h.voted}>
                      <button
                        type="button"
                        disabled={h.voted}
                        onClick={() => pick(h)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                          i === active ? "bg-brand-50" : ""
                        } ${h.voted ? "cursor-not-allowed opacity-60" : "hover:bg-brand-50"}`}
                      >
                        <span className="font-medium text-graphite-900">{h.name}</span>
                        {h.voted ? (
                          <span className="chip bg-graphite-100 text-graphite-600">Já votou</span>
                        ) : h.hint ? (
                          <span className="text-xs text-graphite-400">{h.hint}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!loading && q.trim().length >= 3 && hits.length === 0 && !error && (
                <p className="mt-3 text-sm text-graphite-600">
                  Nenhum nome encontrado. Confira a digitação ou procure a comissão eleitoral.
                </p>
              )}
              {error && <div className="mt-3"><Alert>{error}</Alert></div>}
              <p className="mt-4 text-xs text-graphite-400">Digite ao menos 3 letras e escolha seu nome na lista.</p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-graphite-400">
          <Link href="/admin" prefetch={false} className="hover:text-brand-600">Acesso administrativo</Link>
        </p>
      </section>
    </main>
  );
}
