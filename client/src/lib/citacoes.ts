/**
 * A citação de áudio — um trecho do livro, de no máximo 40 segundos.
 *
 * **A ideia é do Matheus (28/07, ROTEIRO 4.43):** *"ela pode, no momento que
 * está ouvindo ali no player, selecionar uma parte que ela quer compartilhar e
 * compartilhar com as pessoas, para as pessoas poderem ouvir aquela parte"* — e
 * a citação **só reproduz aquilo**, não abre o livro inteiro.
 *
 * **Por que ela é barata: a peça já existia.** Um comentário da sala já carrega
 * uma âncora em segundos (`positionSec`). Uma citação é essa âncora **com fim**.
 * A marca na barra do player, a trava de spoiler e o carimbo "cap. 7 · 12:40"
 * passam a valer para ela sem uma linha nova de regra.
 *
 * **Isto NÃO é o "áudio gravado por leitor" que a §4.39 descartou**, e o registro
 * existe para ninguém barrar com o argumento errado. Lá era a pessoa gravando a
 * própria voz — o que identifica quem fala, grava o fundo da casa junto e não se
 * modera em escala. Aqui é um trecho do **próprio audiolivro**: não há voz de
 * terceiro, não há fundo, não há áudio novo para moderar.
 *
 * **Peça compartilhada de propósito.** A citação é um valor solto (livro +
 * início + duração), não um campo enterrado dentro do comentário. Assim ela vale
 * igual na sala do livro e no feed da Comunidade — que é da janela B — sem cada
 * tela reimplementar a sua. É a lição que a §4.40 cobrou caro: escrever **um**
 * mecanismo, não três parecidos.
 */

import { livroPorId } from "@/lib/books";
import { chapterAtSec } from "@/lib/chapters";
import { formatarPosicao } from "@/lib/sala";

/**
 * O teto, em segundos.
 *
 * Quarenta é o número que o Matheus deu, e ele tem lógica de uso: é o bastante
 * para uma frase inteira com o ar do narrador em volta, e curto o bastante para
 * alguém ouvir num feed sem decidir se vale a pena. Trecho de três minutos
 * ninguém abre.
 */
export const MAX_CITACAO_SEC = 40;

/**
 * O mínimo. Um trecho de um segundo não é citação, é acidente de arraste.
 *
 * (As durações fixas de 10/20/30/40s que existiam aqui saíram: viraram um
 * **cortador com as duas pontas móveis**, a pedido do Matheus — *"cortar
 * exatamente o local onde ele quer citar"*. Escolher entre quatro comprimentos a
 * partir de um início fixo servia para "guardei por aqui", não para "é esta
 * frase".)
 */
export const MIN_CITACAO_SEC = 3;

export interface Citacao {
  bookId: number;
  /** Onde o trecho começa, em segundos do livro inteiro. */
  inicioSec: number;
  /** Quanto ele dura. Nunca passa de `MAX_CITACAO_SEC`. */
  duracaoSec: number;
}

/**
 * Monta uma citação já dentro dos limites.
 *
 * A trava fica **aqui**, e não na tela: a tela pode ser contornada, e uma
 * citação de dez minutos deixaria de ser citação para virar o livro.
 */
export function criarCitacao(bookId: number, inicioSec: number, duracaoSec: number): Citacao {
  return {
    bookId,
    inicioSec: Math.max(0, Math.round(inicioSec)),
    duracaoSec: Math.min(MAX_CITACAO_SEC, Math.max(1, Math.round(duracaoSec))),
  };
}

export function fimDaCitacao(citacao: Citacao): number {
  return citacao.inicioSec + citacao.duracaoSec;
}

/** "cap. 3 · 1:52:10 → 1:52:50" — o carimbo que aparece no cartão. */
export function rotuloDaCitacao(citacao: Citacao): string {
  const capitulo = chapterAtSec(citacao.bookId, citacao.inicioSec);
  return `cap. ${capitulo} · ${formatarPosicao(citacao.inicioSec)} → ${formatarPosicao(
    fimDaCitacao(citacao),
  )}`;
}

/**
 * O endereço que toca **só** o trecho.
 *
 * `?t=` já existia (é como as marcações abrem o player num ponto); `&ate=` é
 * novo e é o que faz o player **parar no fim da citação** em vez de seguir livro
 * adentro. Sem ele, "ouvir o trecho" viraria "abrir o livro por aqui", que é
 * outra coisa — e entregaria a quem só queria ouvir a frase todo o resto do
 * capítulo.
 */
export function linkDaCitacao(citacao: Citacao): string {
  return `/player/${citacao.bookId}?t=${citacao.inicioSec}&ate=${fimDaCitacao(citacao)}`;
}

/** O livro citado, resolvido — `undefined` se o id não existe mais. */
export function livroDaCitacao(citacao: Citacao) {
  return livroPorId(citacao.bookId);
}

/**
 * A citação de um comentário, quando ele tem uma.
 *
 * Um comentário vira citação quando tem **âncora e duração**: o começo é a
 * âncora que ele já tinha. Guardar o par (início, duração) em vez de um objeto
 * novo evita que o mesmo trecho exista duas vezes, com valores que podem
 * divergir.
 */
export function citacaoDoComentario(item: {
  bookId?: number;
  positionSec?: number;
  duracaoSec?: number;
}): Citacao | undefined {
  if (item.bookId === undefined || item.positionSec === undefined) return undefined;
  if (item.duracaoSec === undefined) return undefined;
  return criarCitacao(item.bookId, item.positionSec, item.duracaoSec);
}
