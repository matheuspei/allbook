/**
 * A meta semanal de audição.
 *
 * Um total ("39h ouvidas") diz de onde você veio, mas não dá o que perseguir —
 * e é o alvo que faz voltar amanhã. A meta mora aqui, no `localStorage`, e é a
 * régua da barra de progresso das Estatísticas.
 *
 * **Por que ela vive numa chave só sua, e não em `settings.ts`:** aquele arquivo
 * é dos ajustes do app (tema, velocidade, downloads) e é lido por várias telas;
 * a meta é um número de uso pessoal, mexido de dentro da própria tela de
 * Estatísticas. Separar evita que um ajuste esbarre no outro.
 */

const META_KEY = "allbook_weekly_goal";

/** Avisa a tela aberta que a meta mudou. */
export const GOAL_EVENT = "allbook:goal";

/** As opções oferecidas, em minutos por semana. */
export const METAS_DISPONIVEIS = [60, 120, 180, 300, 420, 600];

/** 3 h por semana ≈ 25 min por dia — um hábito que se sustenta. */
export const META_PADRAO = 180;

/** A meta em minutos por semana. Storage estragado cai no padrão. */
export function readMetaSemanal(): number {
  try {
    const guardado = Number(localStorage.getItem(META_KEY));
    return Number.isFinite(guardado) && guardado > 0 ? guardado : META_PADRAO;
  } catch {
    return META_PADRAO;
  }
}

export function setMetaSemanal(minutos: number): void {
  try {
    localStorage.setItem(META_KEY, String(minutos));
    window.dispatchEvent(new Event(GOAL_EVENT));
  } catch {
    // Sem storage a meta não persiste, mas a tela continua funcionando.
  }
}

/** "3h por semana" — o rótulo das opções e do resumo. */
export function rotuloDaMeta(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto}min por semana`;
  if (resto === 0) return `${horas}h por semana`;
  return `${horas}h ${resto}min por semana`;
}
