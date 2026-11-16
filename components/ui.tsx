"use client";

import { useEffect } from "react";
import { IconX } from "./icons";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-graphite-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md"}`}
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-300" />
        {title && (
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-lg font-bold text-graphite-900">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-graphite-400 hover:bg-graphite-100" aria-label="Fechar">
              <IconX />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-graphite-100 bg-graphite-50 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Carregando">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "info" | "success"; children: React.ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-brand-200 bg-brand-50 text-brand-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}

/** Foto do candidato; sem foto -> iniciais sobre o gradiente laranja. */
export function Avatar({ name, src, className = "h-14 w-14 text-lg" }: { name: string; src?: string | null; className?: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={`rounded-full object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white ${className}`}>
      {initials}
    </div>
  );
}
