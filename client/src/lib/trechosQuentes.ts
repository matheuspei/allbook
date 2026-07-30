/**
 * **Trechos quentes** — os pedaços de áudio que estão circulando na comunidade.
 *
 * Item 8 da §4.58, aprovado pelo Matheus. É a vitrine que só um app de
 * audiolivro pode ter: não é "os livros mais falados" (isso qualquer catálogo
 * mostra), é **os 40 segundos que fizeram alguém parar o carro**.
 *
 * ---
 *
 * **De onde sai o calor.** Um trecho entra aqui de dois jeitos, que são os dois
 * jeitos de um trecho existir no app:
 *
 * 1. **Anexado a um post** do feed (`objeto: { tipo: "trecho" }`) — o calor são
 *    as curtidas do post;
 * 2. **Citado num comentário** da conversa do livro (`positionSec` +
 *    `duracaoSec`) — o calor são as curtidas do comentário, que ali já existem
 *    de verdade em `comments.ts`.
 *
 * **Janela de 15 dias, e o nome não promete "da semana".** A §4.58 chamou de
 * "trechos quentes da semana", mas rótulo que promete uma janela que os dados
 * não têm é o tipo de mentira pequena que corrói a tela: com pouca gente, sete
 * dias devolvem uma lista vazia na maior parte do tempo. Quando houver
 * movimento de verdade, a janela aperta e o nome pode voltar.
 *
 * **O mesmo trecho não aparece duas vezes:** dois comentários no mesmo ponto do
 * mesmo livro são o mesmo pedaço de áudio, e os calores somam — é justamente
 * isso que faz um trecho ser quente.
 */

import { criarCitacao, type Citacao } from "@/lib/citacoes";
import { comments } from "@/lib/comments";
import { curtidasDoPost } from "@/lib/curtidas";
import { todosOsPosts } from "@/lib/posts";

export interface TrechoQuente {
  citacao: Citacao;
  /** Quantas reações o trecho juntou — a "temperatura". */
  calor: number;
  /** Quantas pessoas o citaram: 2 é mais forte que 1, mesmo com menos curtidas. */
  vozes: number;
  /** A fala mais curtida sobre ele — o que dá contexto ao play. */
  frase?: string;
  /** Quem disse a frase. Ausente = você. */
  autorSlug?: string;
}

const JANELA_EM_DIAS = 15;

/** Trechos que se sobrepõem no mesmo livro são o mesmo pedaço de áudio. */
function chaveDoTrecho(bookId: number, inicioSec: number): string {
  /* Arredonda para blocos de 30s: quem corta "a mesma cena" raramente começa no
     mesmo segundo, e dois cartões quase idênticos lado a lado leem como bug. */
  return `${bookId}-${Math.round(inicioSec / 30)}`;
}

export function trechosQuentes(limite = 5): TrechoQuente[] {
  const corte = new Date();
  corte.setDate(corte.getDate() - JANELA_EM_DIAS);
  const dataCorte = corte.toISOString().slice(0, 10);

  const porTrecho = new Map<string, TrechoQuente>();

  const somar = (
    citacao: Citacao,
    calor: number,
    frase: string | undefined,
    autorSlug: string | undefined,
  ) => {
    const chave = chaveDoTrecho(citacao.bookId, citacao.inicioSec);
    const atual = porTrecho.get(chave);
    if (!atual) {
      porTrecho.set(chave, { citacao, calor, vozes: 1, frase, autorSlug });
      return;
    }
    porTrecho.set(chave, {
      ...atual,
      calor: atual.calor + calor,
      vozes: atual.vozes + 1,
      /* Fica a frase da fala mais curtida: é a que melhor apresenta o trecho. */
      ...(calor > atual.calor ? { frase, autorSlug } : {}),
    });
  };

  for (const post of todosOsPosts()) {
    if (post.objeto?.tipo !== "trecho") continue;
    if (post.date.slice(0, 10) < dataCorte) continue;
    somar(
      post.objeto.citacao,
      curtidasDoPost(post.id),
      post.texto || undefined,
      post.autorSlug,
    );
  }

  for (const comentario of comments) {
    if (comentario.bookId === undefined || comentario.duracaoSec === undefined) continue;
    if (comentario.positionSec === undefined) continue;
    if (comentario.date < dataCorte) continue;
    somar(
      criarCitacao(comentario.bookId, comentario.positionSec, comentario.duracaoSec),
      comentario.likes ?? 0,
      comentario.text,
      comentario.authorSlug,
    );
  }

  return Array.from(porTrecho.values())
    /* Duas vozes valem mais que curtidas soltas: um trecho que duas pessoas
       cortaram por conta própria é mais "quente" que um post popular. */
    .sort((a, b) => b.vozes - a.vozes || b.calor - a.calor)
    .slice(0, limite);
}
