"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Avatar, Modal, Spinner } from "@/components/ui";
import { IconPencil, IconPlus, IconTrash, IconUpload } from "@/components/icons";
import { api, errMsg } from "@/lib/api";
import { resizeImage } from "@/lib/image";
import type { Candidate } from "@/lib/types";

type Form = { id?: string; name: string; department: string; photo_url: string };
const EMPTY: Form = { name: "", department: "", photo_url: "" };

export default function CandidatesPanel() {
  const [list, setList] = useState<Candidate[] | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [toDelete, setToDelete] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setList(await api<Candidate[]>("/api/candidates"));
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setFormError(null);
    try {
      const small = await resizeImage(file);
      const fd = new FormData();
      fd.append("file", small);
      const { url } = await api<{ url: string }>("/api/admin/upload", { method: "POST", body: fd });
      setForm((f) => (f ? { ...f, photo_url: url } : f));
    } catch (e) {
      setFormError(errMsg(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setFormError(null);
    try {
      const body = JSON.stringify({ name: form.name, department: form.department, photo_url: form.photo_url });
      if (form.id) await api(`/api/admin/candidates/${form.id}`, { method: "PUT", body });
      else await api("/api/admin/candidates", { method: "POST", body });
      setForm(null);
      await load();
    } catch (e) {
      setFormError(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!toDelete) return;
    setSaving(true);
    try {
      await api(`/api/admin/candidates/${toDelete.id}`, { method: "DELETE" });
      setToDelete(null);
      setError(null);
      await load();
    } catch (e) {
      setError(errMsg(e));
      setToDelete(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-graphite-900">Candidatos</h2>
          <p className="text-sm text-graphite-600">{list ? `${list.length} cadastrado(s)` : "Carregando…"}</p>
        </div>
        <button className="btn-primary" onClick={() => { setFormError(null); setForm(EMPTY); }}>
          <IconPlus className="h-4 w-4" /> Novo candidato
        </button>
      </div>

      {error && <Alert>{error}</Alert>}

      {!list ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner className="h-8 w-8" /></div>
      ) : list.length === 0 ? (
        <div className="card p-10 text-center text-graphite-600">Nenhum candidato ainda. Clique em “Novo candidato”.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 border-l-4 border-l-brand-500 p-4">
              <Avatar name={c.name} src={c.photo_url} className="h-16 w-16 text-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-graphite-900">{c.name}</p>
                <p className="truncate text-sm text-graphite-600">{c.department}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button className="rounded-lg p-2 text-graphite-600 hover:bg-brand-50 hover:text-brand-700" aria-label={`Editar ${c.name}`}
                  onClick={() => { setFormError(null); setForm({ id: c.id, name: c.name, department: c.department, photo_url: c.photo_url ?? "" }); }}>
                  <IconPencil className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-graphite-600 hover:bg-red-50 hover:text-red-600" aria-label={`Remover ${c.name}`} onClick={() => setToDelete(c)}>
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cadastro / edição */}
      <Modal
        open={!!form}
        onClose={() => !saving && setForm(null)}
        title={form?.id ? "Editar candidato" : "Novo candidato"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setForm(null)} disabled={saving}>Cancelar</button>
            <button className="btn-primary" onClick={save} disabled={saving || uploading}>{saving && <Spinner />} Salvar</button>
          </>
        }
      >
        {form && (
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="c-nome">Nome completo</label>
              <input id="c-nome" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="c-setor">Setor / Departamento</label>
              <input id="c-setor" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <span className="label">Foto</span>
              <div className="flex items-center gap-4">
                <Avatar name={form.name || "?"} src={form.photo_url || null} className="h-20 w-20 text-2xl" />
                <div className="flex-1 space-y-2">
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  <button type="button" className="btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Spinner className="h-4 w-4" /> : <IconUpload className="h-4 w-4" />} Enviar imagem
                  </button>
                  <input className="input !py-2 text-sm" placeholder="ou cole a URL da foto (https://…)" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
                </div>
              </div>
            </div>
            {formError && <Alert>{formError}</Alert>}
          </div>
        )}
      </Modal>

      {/* Exclusão */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remover candidato?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setToDelete(null)}>Cancelar</button>
            <button className="btn-danger" onClick={remove} disabled={saving}>{saving && <Spinner />} Remover</button>
          </>
        }
      >
        <p className="text-graphite-700">
          Deseja remover <strong>{toDelete?.name}</strong> da cédula?
        </p>
      </Modal>
    </div>
  );
}
