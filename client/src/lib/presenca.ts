/**
 * **Quem está neste livro, e em que capítulo** — a presença por capítulo.
 *
 * ---
 *
 * **Esta peça existe porque eu perdi um argumento, e o registro importa** (§4.58,
 * item 8). Eu era contra: sem servidor, presença de outra pessoa seria invenção.
 * O Matheus apontou o erro — o app inteiro é maquete esperando servidor, e
 * rejeitar por isso rejeitaria tudo. E o mecanismo que ele propôs resolve a
 * objeção que sobrava, a de privacidade:
 *
 * - **É opcional** (`mostrarMeuCapitulo`, que nasce **desligada**);
 * - **É recíproco:** quem não mostra, não vê;
 * - **Vale só entre quem se segue** — e mutuamente, não basta você seguir;
 * - **É grosso:** *"está no capítulo 12"*, nunca *"ouvindo agora, neste
 *   segundo"*. Foi a condição que eu defendi e que ficou. Entrega quase todo o
 *   valor ("tem gente perto de mim neste livro") e tira o que é de fato
 *   sensível: presença ao vivo revela **rotina** — a que horas você acorda, se
 *   dormiu fora, quando parou de ouvir por três dias.
 *
 * **Anotado, e continua valendo:** a reciprocidade pressiona a ligar (quem não
 * liga fica cego). É bom mecanismo e não é neutro — daí o padrão desligado.
 *
 * ⚠️ **O capítulo dos outros é simulado e estável** (semente por pessoa +
 * livro), como o progresso dos membros do clube. Com servidor, muda a fonte do
 * número e nenhuma tela.
 */

import { getChapters } from "@/lib/chapters";
import { community, type CommunityMember } from "@/lib/community";
import { readFollowing } from "@/lib/following";
import { meusSeguidores } from "@/lib/seguidores";
import { readSettings } from "@/lib/settings";

export interface PresencaNoLivro {
  member: CommunityMember;
  /** Em que capítulo essa pessoa está. */
  chapter: number;
  /** Total de capítulos do livro — para dizer "12 de 30". */
  total: number;
}

/**
 * Quem se segue com você **nos dois sentidos**.
 *
 * A regra é essa e não "quem eu sigo": mostrar onde você está para alguém que
 * você não escolheu ver é dar sem receber, e é justamente o que a reciprocidade
 * existe para evitar.
 */
function mutuos(): CommunityMember[] {
  const sigo = new Set(readFollowing());
  return meusSeguidores().filter((membro) => sigo.has(membro.slug));
}

/**
 * As pessoas que estão neste livro agora, com o capítulo de cada uma.
 *
 * **Devolve lista vazia com o interruptor desligado** — é a reciprocidade, e ela
 * mora aqui em vez de na tela de propósito: regra de privacidade espalhada pelas
 * telas é regra que uma tela nova esquece.
 */
export function quemEstaNoLivro(bookId: number): PresencaNoLivro[] {
  if (!readSettings().mostrarMeuCapitulo) return [];

  const total = getChapters(bookId).length;
  if (total === 0) return [];

  return mutuos()
    .filter((membro) => membro.ouvindoAgora?.bookId === bookId)
    .map((membro) => ({
      member: membro,
      chapter: Math.min(total, membro.ouvindoAgora?.chapter ?? 1),
      total,
    }))
    .sort((a, b) => b.chapter - a.chapter);
}

/**
 * Quantas pessoas **poderiam** aparecer se você ligasse o interruptor.
 *
 * Serve ao convite honesto: em vez de um "ligue isto aqui" solto, a tela pode
 * dizer *"2 pessoas que você segue estão neste livro"* — e quem lê decide
 * sabendo o que ganha. Sem isso, o interruptor pede um sim no escuro.
 *
 * **Não vaza nada:** é uma contagem, sem nome e sem capítulo.
 */
export function quantosPoderiaVer(bookId: number): number {
  return community.filter(
    (membro) =>
      membro.ouvindoAgora?.bookId === bookId &&
      mutuosSlugs().has(membro.slug),
  ).length;
}

function mutuosSlugs(): Set<string> {
  return new Set(mutuos().map((membro) => membro.slug));
}
