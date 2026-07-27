/**
 * A sala do livro — a regra de quem vê o quê.
 *
 * **A ideia, em uma frase:** a conversa mora no livro, cada comentário pode
 * estar preso a um segundo do áudio, e ninguém lê o que está à frente de onde
 * chegou. A defesa contra spoiler não depende de a pessoa declarar onde está —
 * **o player já sabe**, porque é ele que toca. É isso que a sala tem de
 * diferente de uma caixa de comentários comum (ROTEIRO 4.39).
 *
 * **A regra, escrita para poder ser conferida:**
 *
 * > Um comentário é **livre** quando não tem âncora, ou quando a âncora está em
 * > algum ponto por onde a pessoa já passou. Quando a âncora está à frente, ele
 * > é **adiante** — a pessoa vê que existe, nunca o texto. E um comentário
 * > **marcado como spoiler** fica velado mesmo estando atrás, atrás de um toque.
 *
 * A ordem importa: `adiante` ganha de `spoiler`. Se o comentário está à frente
 * *e* é spoiler, a pessoa nem sabe que há algo revelável ali.
 *
 * **Sem âncora = fala do livro em geral** (a opinião de quem terminou, o elogio
 * à narração). Esses são a faixa que todo mundo vê, inclusive quem nunca abriu
 * o livro — sem eles a sala pareceria morta justamente para quem está decidindo
 * se vai ouvir.
 *
 * **Limite conhecido, e é importante:** a posição vem do `playback.ts`, que
 * guarda no **navegador**, não na pessoa. Quem ouve no celular e abre no
 * computador aparece no começo, e a sala se fecha sozinha. A trava só é
 * confiável depois das contas — até lá isto é demonstração honesta, não
 * mecanismo. (Registrado no ROTEIRO 4.39.)
 */

import { chapterAtSec } from "@/lib/chapters";
import { comments, type Comment } from "@/lib/comments";
import { readPlaybackList } from "@/lib/playback";

export type EstadoNaSala =
  /** Dá para ler agora. */
  | "livre"
  /** Está à frente de onde a pessoa chegou: mostra que existe, nunca o texto. */
  | "adiante"
  /** Marcado como spoiler: o texto fica atrás de um toque. */
  | "spoiler";

/**
 * Onde a pessoa parou neste livro, em segundos. `0` se nunca começou.
 *
 * Lê a lista inteira (e não só o último livro) porque a sala de um livro
 * precisa da posição **daquele** livro, mesmo que a pessoa esteja ouvindo outro
 * agora.
 */
export function posicaoNoLivro(bookId: number): number {
  const entrada = readPlaybackList().find((item) => item.bookId === bookId);
  return entrada?.positionSec ?? 0;
}

/** A pessoa já começou este livro? Serve para o texto da tela mudar de tom. */
export function comecouOLivro(bookId: number): boolean {
  return readPlaybackList().some((item) => item.bookId === bookId);
}

/**
 * O estado de um comentário para quem está a `posicaoSec` do livro.
 *
 * A margem de 1 segundo existe para o caso comum de comentar exatamente onde se
 * está: sem ela, o próprio comentário recém-escrito apareceria "adiante" por
 * causa de um arredondamento.
 */
export function estadoNaSala(comment: Comment, posicaoSec: number): EstadoNaSala {
  if (comment.positionSec !== undefined && comment.positionSec > posicaoSec + 1) {
    return "adiante";
  }
  return comment.spoiler ? "spoiler" : "livre";
}

/**
 * Separa a conversa em "o que dá para ler" e "o que está guardado".
 *
 * Os que estão adiante não voltam com texto nenhum — só a contagem, para a tela
 * poder dizer "+3 mensagens à frente" sem entregar nada.
 */
export function separarSala(
  comentarios: Comment[],
  posicaoSec: number,
): { visiveis: Comment[]; adiante: number } {
  const visiveis: Comment[] = [];
  let adiante = 0;

  for (const comment of comentarios) {
    if (estadoNaSala(comment, posicaoSec) === "adiante") adiante += 1;
    else visiveis.push(comment);
  }

  return { visiveis, adiante };
}

/**
 * Os comentários presos **perto do ponto onde a pessoa está** — a conversa que
 * o player mostra enquanto ela ouve.
 *
 * Só olha para trás: de `posicaoSec - janelaSec` até `posicaoSec`. Nada que
 * esteja adiante entra, nem por um segundo — é a mesma trava da sala, e é o que
 * permite mostrar um contador no player sem entregar o que vem depois.
 *
 * Cinco minutos de janela por padrão: um comentário feito quatro minutos antes
 * ainda é sobre a mesma cena; meia hora depois já é outro assunto.
 */
export function comentariosNoTrecho(
  comentarios: Comment[],
  posicaoSec: number,
  janelaSec = 300,
): Comment[] {
  return comentarios
    .filter(
      (item) =>
        item.positionSec !== undefined &&
        item.positionSec <= posicaoSec + 1 &&
        item.positionSec >= posicaoSec - janelaSec,
    )
    .sort((a, b) => (a.positionSec ?? 0) - (b.positionSec ?? 0));
}

/**
 * Os livros com conversa, do mais movimentado para o menos — o que a tela
 * Comunidade mostra.
 *
 * **Por que isto existe:** a Comunidade era uma lista de *gente*, e quem não
 * seguia ninguém não tinha o que ver. Livro é um endereço melhor do que pessoa:
 * você entra numa conversa porque o assunto interessa, não porque conhece quem
 * está falando (ROTEIRO 4.39).
 *
 * A prévia respeita a trava: só volta o que **aquela pessoa** já pode ler
 * naquele livro, e nunca um comentário marcado como spoiler — numa vitrine, a
 * pessoa não escolheu abrir nada.
 */
export function livrosComConversa(limite = 6): {
  bookId: number;
  total: number;
  liberadas: number;
  previa: Comment[];
}[] {
  const porLivro = new Map<number, Comment[]>();

  for (const comment of comments) {
    if (comment.bookId === undefined || comment.parentId) continue;
    const lista = porLivro.get(comment.bookId) ?? [];
    lista.push(comment);
    porLivro.set(comment.bookId, lista);
  }

  // `Array.from` e não spread: o alvo do TypeScript deste projeto não itera Map
  // direto (TS2802), e mudar o alvo por causa de uma linha não vale.
  return Array.from(porLivro.entries())
    .map(([bookId, lista]) => {
      const { visiveis } = separarSala(lista, posicaoNoLivro(bookId));
      return {
        bookId,
        total: lista.length,
        liberadas: visiveis.length,
        previa: visiveis.filter((item) => !item.spoiler).slice(0, 2),
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limite);
}

/** "12:40" ou "1:12:40" — o mesmo formato do player. */
export function formatarPosicao(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * "cap. 7 · 12:40" — o carimbo que aparece no comentário.
 *
 * O capítulo entra como **rótulo**, para a pessoa se situar; quem manda é o
 * segundo. Tocar no carimbo abre o player naquele ponto exato (`?t=`), que é o
 * caminho que já existia para as marcações.
 */
export function rotuloDaAncora(bookId: number, positionSec: number): string {
  return `cap. ${chapterAtSec(bookId, positionSec)} · ${formatarPosicao(positionSec)}`;
}
