import { useEffect, useState } from "react";

import PageHeader from "@/components/PageHeader";
import AchievementSpotlight from "@/components/AchievementSpotlight";
import {
  CATEGORIAS,
  TIERS,
  achievements,
  achievementsFor,
  type Achievement,
} from "@/lib/achievements";
import { lerDadosDeConquista, lerResumo } from "@/lib/stats";

/**
 * Conquistas (`/achievements`) — a grade completa das medalhas, em tela própria.
 *
 * Morava no meio do Perfil e era o que quebrava o ritmo da tela: dezesseis
 * medalhas em mosaico no meio de uma página de listas (apontado pelo Matheus em
 * 28/07, ROTEIRO 4.41). Aqui a coleção tem espaço para ser o assunto — e na
 * página pública ela aparece resumida em **dois selos** ao lado do nome.
 *
 * A grade é a mesma de antes: separada por categoria, cada medalha na cor da
 * sua raridade, as bloqueadas com anel de progresso (ROTEIRO 4.16 e 4.19).
 */

/**
 * Uma medalha na grade. Ganha: círculo cheio na cor da faixa. Bloqueada:
 * círculo apagado com um anel de progresso — é ele que transforma a grade de
 * uma lista de "não" num caminho.
 */
function Medalha({ item, onOpen }: { item: Achievement; onOpen: () => void }) {
  const tier = TIERS[item.tier];
  const Icon = item.icon;
  const raio = 20;
  const volta = 2 * Math.PI * raio;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center gap-2"
      data-testid={`achievement-${item.id}`}
    >
      <div className="relative h-11 w-11">
        {!item.unlocked && item.progresso > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
            <circle cx="22" cy="22" r={raio} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            <circle
              cx="22"
              cy="22"
              r={raio}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={volta}
              strokeDashoffset={volta * (1 - item.progresso)}
            />
          </svg>
        )}

        <div
          className={`flex h-full w-full items-center justify-center rounded-full transition-all ${
            item.unlocked
              ? `${tier.fundo} ${tier.brilho} group-hover:scale-105`
              : "bg-white/[0.05] group-hover:bg-white/[0.08]"
          }`}
        >
          <Icon
            className={`h-[18px] w-[18px] ${item.unlocked ? tier.icone : "text-white/25"}`}
            strokeWidth={item.unlocked ? 2 : 1.75}
          />
        </div>
      </div>

      <span
        className={`text-center text-[10px] leading-tight ${
          item.unlocked ? "text-white/60" : "text-white/25"
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}

export default function Achievements() {
  const [medalhas, setMedalhas] = useState<Achievement[]>([]);
  const [medalhaAberta, setMedalhaAberta] = useState<Achievement | null>(null);

  useEffect(() => {
    // Julgadas pelos números reais de uso — nada marcado à mão (ROTEIRO 4.16).
    setMedalhas(achievementsFor(lerDadosDeConquista(lerResumo())));
  }, []);

  const conquistadas = medalhas.filter((item) => item.unlocked);

  return (
    <div className="min-h-screen pb-24 bg-background text-white" data-testid="achievements-page">
      <PageHeader
        title="Conquistas"
        fallback="/you"
        action={
          <span className="text-xs text-white/30" data-testid="achievements-score">
            {conquistadas.length} de {achievements.length}
          </span>
        }
      />

      <main className="px-5 py-6 space-y-8">
        {CATEGORIAS.map((categoria) => {
          const doGrupo = medalhas.filter((item) => item.category === categoria.key);
          if (doGrupo.length === 0) return null;
          const ganhasNoGrupo = doGrupo.filter((item) => item.unlocked).length;

          return (
            <section key={categoria.key} data-testid={`achievement-group-${categoria.key}`}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  {categoria.label}
                </h2>
                <span className="text-[10px] text-white/25">
                  {ganhasNoGrupo}/{doGrupo.length}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                {doGrupo.map((item) => (
                  <Medalha key={item.id} item={item} onOpen={() => setMedalhaAberta(item)} />
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <AchievementSpotlight item={medalhaAberta} onClose={() => setMedalhaAberta(null)} />
    </div>
  );
}
