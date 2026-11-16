"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Modal, Spinner } from "@/components/ui";
import { IconSearch, IconTrash, IconUpload } from "@/components/icons";
import { api, errMsg } from "@/lib/api";
import { parseVoterSheet, type SheetRow } from "@/lib/parseSheet";
import type { VoterRow } from "@/lib/types";

type Summary = { total: number; voted: number; rows: VoterRow[] };

export default function VotersPanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ file: string; rows: SheetRow[] } | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (search: string) => {
    try {
      setData(await api<Summary>(`/api/admin/voters?limit=50&q=${encodeURIComponent(search)}`));
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q, load]);

  async function onFile(file?: File) {
    if (!file) return;
    setError(null);
    setNotice(null);
    try {
      const rows = await parseVoterSheet(file);
      if (rows.length === 0) throw new Error("Nenhum nome encontrado. Use uma coluna “Nome” (e opcionalmente “Matrícula” ou “CPF”).");
      setPreview({ file: file.name, rows });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmImport() {
    if (!preview) return;
    setBusy(true);
    try {
      const r = await api<{ valid: number; inserted: number; skipped: number }>("/api/admin/voters", {
        method: "POST",
        body: JSON.stringify({ rows: preview.rows }),
      });
      setNotice(`Importação concluída: ${r.inserted} novo(s) eleitor(es)${r.skipped ? `, ${r.skipped} já existia(m)` : ""}.`);
      setPreview(null);
      await load(q);
    } catch (e) {
      setError(errMsg(e));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    setBusy(true);
    try {
      await api("/api/admin/voters?confirm=1", { method: "DELETE" });
      setClearOpen(false);
      setNotice("Lista de eleitores removida.");
      await load(q);
    } catch (e) {
      setError(errMsg(e));
      setClearOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-graphite-900">Eleitores</h2>
          <p className="text-sm text-graphite-600">
            {data ? `${data.total} apto(s) · ${data.voted} já votou(aram) · ${data.total - data.voted} pendente(s)` : "Carregando…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button className="btn-primary" onClick={() => fileRef.current?.click()}>
            <IconUpload className="h-4 w-4" /> Importar planilha
          </button>
          <button className="btn-outline" onClick={() => setClearOpen(true)} disabled={!data?.total}>
            <IconTrash className="h-4 w-4" /> Limpar planilha
          </button>
        </div>
      </div>

      <Alert kind="info">
        Formato aceito: <strong>.CSV</strong> ou <strong>.XLSX</strong> com coluna <strong>Nome</strong> ou <strong>Nome do colaborador</strong> (obrigatória) e{" "}
        <strong>Matrícula</strong> ou <strong>CPF</strong> (opcional). Reimportar não apaga quem já votou.
      </Alert>
      {error && <Alert>{error}</Alert>}
      {notice && <Alert kind="success">{notice}</Alert>}

      <div className="card overflow-hidden">
        <div className="relative border-b border-graphite-100 p-4">
          <IconSearch className="pointer-events-none absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-graphite-400" />
          <input className="input pl-12" placeholder="Buscar eleitor por nome…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {!data ? (
          <div className="flex justify-center py-12 text-brand-500"><Spinner className="h-7 w-7" /></div>
        ) : data.rows.length === 0 ? (
          <p className="p-8 text-center text-graphite-600">{q ? "Nenhum eleitor encontrado." : "Nenhum eleitor importado ainda."}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-graphite-50 text-xs uppercase tracking-wide text-graphite-600">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="hidden px-5 py-3 sm:table-cell">Matrícula/CPF</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100">
              {data.rows.map((v) => (
                <tr key={v.id} className="hover:bg-brand-50/40">
                  <td className="px-5 py-3 font-medium text-graphite-900">{v.name}</td>
                  <td className="hidden px-5 py-3 text-graphite-600 sm:table-cell">{v.registration ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    {v.has_voted ? <span className="chip bg-brand-100 text-brand-800">Já votou</span> : <span className="chip bg-graphite-100 text-graphite-600">Pendente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && data.total > data.rows.length && !q && (
          <p className="border-t border-graphite-100 px-5 py-3 text-xs text-graphite-400">Mostrando os primeiros {data.rows.length}. Use a busca para localizar um nome.</p>
        )}
      </div>

      {/* Pré-visualização da importação */}
      <Modal
        open={!!preview}
        onClose={() => !busy && setPreview(null)}
        title="Importar eleitores?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPreview(null)} disabled={busy}>Cancelar</button>
            <button className="btn-primary" onClick={confirmImport} disabled={busy}>{busy && <Spinner />} Importar {preview?.rows.length}</button>
          </>
        }
      >
        {preview && (
          <div>
            <p className="text-graphite-700"><strong>{preview.file}</strong> — {preview.rows.length} nome(s) encontrado(s). Exemplos:</p>
            <ul className="mt-3 divide-y divide-graphite-100 rounded-xl border border-graphite-100 text-sm">
              {preview.rows.slice(0, 5).map((r, i) => (
                <li key={i} className="flex justify-between px-4 py-2">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-graphite-400">{r.registration ?? ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Limpar lista de eleitores?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setClearOpen(false)}>Cancelar</button>
            <button className="btn-danger" onClick={clearAll} disabled={busy}>{busy && <Spinner />} Sim, limpar</button>
          </>
        }
      >
        <p className="text-graphite-700">
          Todos os eleitores importados serão removidos (inclusive o status “já votou”). Os votos já apurados{" "}
          <strong>não</strong> são apagados. Para recomeçar do zero, use “Zerar apuração” antes.
        </p>
      </Modal>
    </div>
  );
}
