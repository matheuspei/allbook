import { useEffect } from "react";
import { X } from "lucide-react";

import { TIERS, type Achievement } from "@/lib/achievements";
import { formatarDuracao } from "@/lib/listening";

/**
 * O painel que abre ao tocar numa medalha.
 *
 * **Substituiu um toast.** Tocar num troféu antes disparava um avisinho no
 * rodapé, o mesmo componente usado para "link copiado" — recurso pobre demais
 * para a vitrine de conquistas, e que sumia antes de a pessoa ler. Aqui a
 * medalha aparece grande, com a faixa de raridade, a regra, **o quanto falta**
 * e a data em que foi ganha.
 *
 * A entrada é feita em CSS (`animate-in`), não em framer-motion: animação que
 * começa invisível e depende de `requestAnimationFrame` **trava apagada**
 * quando a janela perde o foco — foi o que aconteceu com as transições de tela
 * e com a cascata da Descobrir (ver ROTEIRO 4.9).
 */

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "40h de 100h" ou "3 de 10" — a régua da medalha, na unidade certa. */
export function textoDaMedida(item: Achievement): string {
  if (item.formato === "duracao") {
    return `${formatarDuracao(item.atual)} de ${formatarDuracao(item.alvo)}`;
  }
  return `${Math.min(item.atual, item.alvo)} de ${item.alvo}`;
}

function dataPorExtenso(iso: string): string {
  const data = new Date(iso);
  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

export default function AchievementSpotlight({
  item,
  onClose,
}: {
  item: Achievement | null;
  onClose: () => void;
}) {
  // Trava a rolagem do fundo enquanto o painel está aberto.
  useEffect(() => {
    if (!item) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [item, onClose]);

  if (!item) return null;

  const tier = TIERS[item.tier];
  const Icone = item.icon;
  const falta = Math.max(0, item.alvo - item.atual);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      data-testid="achievement-spotlight"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-in slide-in-from-bottom fade-in relative w-full max-w-md rounded-t-2xl border-t border-white/10 bg-card px-6 pb-10 pt-5 duration-300">
        <div className="mb-7 flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tier.texto}`}>
            {tier.label}
          </span>
          <button
            onClick={onClose}
            className="-mr-1.5 p-1.5 text-white/40 transition-colors hover:text-white"
            aria-label="Fechar"
            data-testid="button-close-achievement"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full ${
              item.unlocked ? `${tier.fundo} ${tier.brilho}` : "bg-white/[0.06]"
            }`}
          >
            <Icone
              className={`h-11 w-11 ${item.unlocked ? tier.icone : "text-white/25"}`}
              strokeWidth={1.8}
            />
          </div>

          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">{item.label}</h2>
          <p className="mt-2 max-w-[17rem] text-sm leading-relaxed text-white/45">
            {item.description}
          </p>
        </div>

        {item.unlocked ? (
          <p className="mt-7 text-center text-xs text-white/40">
            {item.ganhaEm
              ? `Conquistada em ${dataPorExtenso(item.ganhaEm)}.`
              : "Conquistada — a data ficou de antes de o app anotar isso."}
          </p>
        ) : (
          <div className="mt-7 space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-white/40">Seu progresso</span>
              <span className="font-medium text-white/60">{textoDaMedida(item)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${item.progresso * 100}%` }}
              />
            </div>
            {item.formato !== "marco" && (
              <p className="text-xs leading-relaxed text-white/40">
                Faltam{" "}
                <span className="font-medium text-white/70">
                  {item.formato === "duracao" ? formatarDuracao(falta) : falta}
                </span>{" "}
                para destravar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
