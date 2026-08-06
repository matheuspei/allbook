import { useEffect, useState } from "react";

import { TIERS, sincronizarConquistas, type Achievement } from "@/lib/achievements";
import { LIBRARY_EVENT } from "@/lib/library";
import { LISTENING_EVENT } from "@/lib/listening";
import { PLAYBACK_EVENT } from "@/lib/playback";
import { lerDadosDeConquista, lerResumo } from "@/lib/stats";

/**
 * O aviso que aparece quando você acabou de ganhar uma medalha.
 *
 * **Antes, ganhar não fazia nada.** A pessoa cruzava as 100 horas e o app
 * seguia calado; só se ela fosse ao Perfil e reparasse num ícone aceso é que
 * descobria. Comemorar na hora é o que faz a conquista existir.
 *
 * Fica montado no `App`, e não numa tela, porque a medalha pode acender em
 * qualquer lugar — ouvindo no player, salvando na lista, curtindo um
 * comentário. Ele escuta os três eventos que mudam esses dados e pergunta ao
 * `sincronizarConquistas` se apareceu alguma novidade. **A primeira
 * sincronização é silenciosa** (ver `lib/achievements.ts`): quem abre o app com
 * histórico já formado receberia cinco avisos de enfiada, o que é ruído.
 *
 * A entrada é em CSS, não em framer-motion — animação que começa invisível e
 * depende de `requestAnimationFrame` trava apagada quando a janela perde o foco
 * (ver ROTEIRO 4.9).
 */

/** Quanto tempo cada aviso fica na tela. */
const DURACAO_MS = 5000;

export default function AvisoDeConquista() {
  const [fila, setFila] = useState<Achievement[]>([]);
  const atual = fila[0] ?? null;

  useEffect(() => {
    const verificar = () => {
      const novas = sincronizarConquistas(lerDadosDeConquista(lerResumo()));
      if (novas.length > 0) setFila((anterior) => [...anterior, ...novas]);
    };

    verificar();
    window.addEventListener(LISTENING_EVENT, verificar);
    window.addEventListener(PLAYBACK_EVENT, verificar);
    window.addEventListener(LIBRARY_EVENT, verificar);
    return () => {
      window.removeEventListener(LISTENING_EVENT, verificar);
      window.removeEventListener(PLAYBACK_EVENT, verificar);
      window.removeEventListener(LIBRARY_EVENT, verificar);
    };
  }, []);

  // Uma de cada vez: a próxima só entra quando a anterior sai.
  useEffect(() => {
    if (!atual) return;
    const relogio = window.setTimeout(() => setFila((anterior) => anterior.slice(1)), DURACAO_MS);
    return () => window.clearTimeout(relogio);
  }, [atual]);

  if (!atual) return null;

  const tier = TIERS[atual.tier];
  const Icone = atual.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-5">
      <button
        type="button"
        onClick={() => setFila((anterior) => anterior.slice(1))}
        className="animate-in slide-in-from-top fade-in pointer-events-auto flex w-full max-w-sm items-center gap-3.5 rounded-2xl border border-white/10 bg-card/95 px-4 py-3 text-left shadow-2xl shadow-black/60 backdrop-blur-md duration-300"
        data-testid="achievement-toast"
      >
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tier.fundo} ${tier.brilho}`}
        >
          <Icone className={`h-5 w-5 ${tier.icone}`} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${tier.texto}`}>
            Nova conquista
          </p>
          <p className="mt-0.5 truncate font-display text-sm font-bold tracking-tight">
            {atual.label}
          </p>
        </div>
      </button>
    </div>
  );
}
