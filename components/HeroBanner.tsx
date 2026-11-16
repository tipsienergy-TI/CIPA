import { COMPANY_NAME, HERO_SRC } from "@/lib/brand";

/**
 * BANNER DA CABINE DE VOTAÇÃO
 * Usa HERO_SRC (public/images/hero-psi.jpg). A imagem já traz o logotipo branco
 * da PSI Energy no centro, por isso o recorte é feito com object-center.
 * Para trocar a imagem, edite lib/brand.ts.
 */
export default function HeroBanner({ tall = false }: { tall?: boolean }) {
  return (
    <header className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_SRC}
        alt={`${COMPANY_NAME} — logotipo`}
        className={`w-full object-cover object-center ${tall ? "h-64 sm:h-80" : "h-44 sm:h-56"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-brand-300" />
    </header>
  );
}
