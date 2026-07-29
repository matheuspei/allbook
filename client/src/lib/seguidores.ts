/**
 * Quem segue **você** — e a tranca da conta privada.
 *
 * A outra metade de `following.ts` (que guarda quem *você* segue). Nasceu da
 * conversa de 29/07 (ROTEIRO 4.54), em que o Matheus pediu privacidade de
 * verdade: *"eu sou uma pessoa que talvez não queira que as pessoas vejam o que
 * eu estou fazendo… se ele é privado, eu tenho que dizer se aceito ou não quem
 * está me seguindo"*.
 *
 * **O que a tranca protege, e o que ela não protege.** O post que você escreve
 * vai para o feed geral em qualquer caso — *"se eu escrevo para geral, eu já
 * escolhi falar para a comunidade"*. O que a conta privada esconde é o que o app
 * **registra sozinho**: que você está no capítulo 3, que entrou num clube, que
 * avaliou um livro. Por isso a decisão de privacidade mora aqui, junto de quem
 * pode ver, e não junto do que se publica.
 *
 * **Privado não é um modo do app, é uma pergunta:** quem vira seu seguidor —
 * qualquer um, ou só quem você aprovar? A atividade já é restrita a seguidores
 * nos dois casos, então não existem duas versões de tela nem dois cálculos de
 * visibilidade.
 *
 * ---
 *
 * ⚠️ **ISTO É MAQUETE — A LISTA DE SEGUIDORES É FICTÍCIA.**
 *
 * Não há servidor: ninguém pode realmente pedir para te seguir. Os pedidos e os
 * seguidores abaixo são o **esqueleto**, gente de `community.ts`, para as telas
 * terem o que mostrar. O que você faz (aceitar, recusar, remover) fica gravado
 * no `localStorage` deste navegador e **é de verdade dentro da maquete** — o que
 * é fingido é a origem, não o efeito.
 *
 * **O que o backend vai ter que fazer está escrito em `docs/BANCO-DE-DADOS.md`,
 * na seção "Etapa 2 — seguidores e conta privada".** Quem for construir o
 * servidor começa por lá.
 */

import { community, type CommunityMember } from "@/lib/community";

export const SEGUIDORES_EVENT = "allbook:seguidores";

const CHAVE = "allbook_seguidores";

interface EstadoLocal {
  /** Pedidos que você já respondeu — o slug sai da fila. */
  aceitos: string[];
  recusados: string[];
  /** Seguidores do esqueleto que você removeu. */
  removidos: string[];
}

const VAZIO: EstadoLocal = { aceitos: [], recusados: [], removidos: [] };

/**
 * Quem já te segue no esqueleto, e quem está pedindo.
 *
 * Escolhidos à mão para a tela não parecer sorteio: quem te segue são os que
 * têm mais cara de leitor ativo, e os pedidos vêm de gente que ainda não
 * apareceu como seguidora — assim as duas listas nunca se repetem.
 */
const SEGUIDORES_DO_ESQUELETO = ["ana-paula", "carla-lima", "ricardo"];
const PEDIDOS_DO_ESQUELETO = ["marcos-v", "luciana"];

function ler(): EstadoLocal {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (!guardado || typeof guardado !== "object") return VAZIO;
    const lista = (valor: unknown) =>
      Array.isArray(valor) ? valor.filter((item): item is string => typeof item === "string") : [];
    return {
      aceitos: lista(guardado.aceitos),
      recusados: lista(guardado.recusados),
      removidos: lista(guardado.removidos),
    };
  } catch {
    return VAZIO;
  }
}

function gravar(estado: EstadoLocal): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem storage a escolha não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(SEGUIDORES_EVENT));
}

function membro(slug: string): CommunityMember | undefined {
  return community.find((item) => item.slug === slug);
}

/** Quem te segue hoje: o esqueleto menos os removidos, mais quem você aceitou. */
export function meusSeguidores(): CommunityMember[] {
  const estado = ler();
  const slugs = [...SEGUIDORES_DO_ESQUELETO, ...estado.aceitos].filter(
    (slug) => !estado.removidos.includes(slug),
  );
  return Array.from(new Set(slugs)).map(membro).filter((item): item is CommunityMember => !!item);
}

/**
 * Quem está esperando resposta.
 *
 * **Só existe fila com a conta privada ligada.** Com a conta pública, seguir é
 * imediato — mostrar "pedidos" ali seria prometer um controle que não existe.
 */
export function pedidosPendentes(contaPrivada: boolean): CommunityMember[] {
  if (!contaPrivada) return [];
  const estado = ler();
  return PEDIDOS_DO_ESQUELETO.filter(
    (slug) => !estado.aceitos.includes(slug) && !estado.recusados.includes(slug),
  )
    .map(membro)
    .filter((item): item is CommunityMember => !!item);
}

export function aceitarPedido(slug: string): void {
  const estado = ler();
  gravar({
    ...estado,
    aceitos: Array.from(new Set([...estado.aceitos, slug])),
    recusados: estado.recusados.filter((item) => item !== slug),
    /* Aceitar desfaz uma remoção anterior: a pessoa pediu de novo e você disse
       sim — sem isto, o "removidos" antigo apagaria o aceite novo em silêncio. */
    removidos: estado.removidos.filter((item) => item !== slug),
  });
}

export function recusarPedido(slug: string): void {
  const estado = ler();
  gravar({
    ...estado,
    recusados: Array.from(new Set([...estado.recusados, slug])),
    aceitos: estado.aceitos.filter((item) => item !== slug),
  });
}

/**
 * Tira alguém de perto sem avisar ninguém.
 *
 * Pedido explícito do Matheus: *"a página onde a pessoa possa ver quem está
 * seguindo ela e que ela possa ir lá e tirar de seguir, tal como acontece hoje
 * no Instagram"*. É a peça que as pessoas só sentem falta depois: sem ela, um
 * "sim" dado às pressas vale para sempre.
 */
export function removerSeguidor(slug: string): void {
  const estado = ler();
  gravar({
    ...estado,
    removidos: Array.from(new Set([...estado.removidos, slug])),
    aceitos: estado.aceitos.filter((item) => item !== slug),
  });
}
