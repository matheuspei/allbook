import { catalog, slugify, type Book, porNota} from "./books";

/**
 * O AllBook Studio — quem **produz** as narrações, e as vozes que ele usa.
 *
 * **Por que isto existe (decisão do Matheus, 25/07).** A ficha do livro
 * misturava dois créditos diferentes. A editora publicou o **livro**; ela não
 * gravou o **áudio**. E, na ideia central do app (ver ROTEIRO, "Modelo de
 * negócio"), o audiolivro muitas vezes **não existe em lugar nenhum** — o
 * AllBook pega o texto e gera a narração. Nesse caso quem produz é o AllBook, e
 * o crédito tem de dizer isso.
 *
 * **A voz é elenco, não aviso legal.** A tentação era carimbar "narrado por IA"
 * em cada ficha; o Matheus notou que isso empobrece a tela, e ele tem razão —
 * vira advertência de bula repetida 59 vezes. Aqui a voz tem **nome próprio,
 * timbre e perfil**, como qualquer narrador, e a informação de que ela é
 * sintética aparece **uma vez, no perfil dela**. É o mesmo caminho da Apple nos
 * audiolivros de narração digital: a ficha diz o nome da voz, não "computador".
 *
 * **Nome de pessoa real só quando a pessoa narrou de verdade.** O catálogo tinha
 * "Cid Moreira" e "Tiago Abravanel" como narradores — duas pessoas reais. Como
 * maquete sem áudio era inofensivo; com áudio gerado saindo com o nome delas
 * viraria voz falsificada de gente de verdade. Viraram Aurélio Prado e Bruno
 * Sampaio, vozes do Studio. `narratorKind` existe justamente para o dia em que
 * entrar uma narração humana real: aquele livro é marcado como `human`, o
 * crédito do Studio some da ficha e o nome verdadeiro fica.
 */

export const STUDIO_NAME = "AllBook Studio";

export const STUDIO_SOBRE =
  "O estúdio de narração do AllBook. Quando um livro nunca ganhou versão em áudio — " +
  "e é a maioria deles —, é aqui que ela nasce: o texto vira narração inteira, lida por " +
  "uma das vozes da casa.";

/**
 * Que as vozes são sintéticas se diz **aqui e no perfil de cada voz** — não na
 * ficha de cada livro. Repetir o aviso 59 vezes transformaria informação em
 * advertência de bula; dito uma vez, no lugar onde a pessoa foi buscar, é ficha
 * técnica como qualquer outra.
 */
export const STUDIO_COMO_FUNCIONA =
  "As vozes do estúdio são sintéticas e têm nome próprio: cada uma tem timbre, ritmo e um " +
  "tipo de livro em que funciona melhor, e o livro inteiro é lido pela mesma voz, do " +
  "primeiro ao último capítulo.";

export interface StudioVoice {
  slug: string;
  name: string;
  /** Como a voz soa e onde ela funciona melhor. Uma frase, sem adjetivo solto. */
  timbre: string;
}

/**
 * As vozes da casa. Hoje **todas** as narrações do catálogo são delas — nenhum
 * audiolivro do AllBook foi gravado por um humano ainda, e a ficha não deve
 * fingir que foi.
 */
export const studioVoices: StudioVoice[] = [
  {
    slug: "rafael-nogueira",
    name: "Rafael Nogueira",
    timbre:
      "Grave e pausada. Dá voz diferente a cada personagem sem cair na imitação, o que segura livro longo de fantasia e ficção científica.",
  },
  {
    slug: "diogo-serrano",
    name: "Diogo Serrano",
    timbre:
      "Seca e precisa. Sabe onde parar de falar — em distopia e em terror, metade do efeito está no silêncio.",
  },
  {
    slug: "helena-vasques",
    name: "Helena Vasques",
    timbre: "Quente e próxima, como quem conta um caso. É a voz do romance no catálogo.",
  },
  {
    slug: "otavio-marques",
    name: "Otávio Marques",
    timbre:
      "Rouca, de respiração curta. Aguenta trinta horas de Stephen King sem perder o fio nem o susto.",
  },
  {
    slug: "aurelio-prado",
    name: "Aurélio Prado",
    timbre:
      "Locução clássica de rádio: dicção limpa e ritmo constante, que sustenta thriller de trama complicada.",
  },
  {
    slug: "camila-ferraz",
    name: "Camila Ferraz",
    timbre:
      "Voz de narradora em quem não dá para confiar inteiramente — funciona onde a personagem esconde alguma coisa.",
  },
  {
    slug: "roberto-rocha",
    name: "Roberto Rocha",
    timbre: "Direta, sem solenidade. Lê número e exemplo de mercado sem fazer o ouvinte desligar.",
  },
  {
    slug: "tulio-bandeira",
    name: "Túlio Bandeira",
    timbre: "Firme, de documentário. Cabe na biografia de quem já era conhecido antes do livro.",
  },
  {
    slug: "livia-bonfim",
    name: "Lívia Bonfim",
    timbre:
      "Baixa e sem pressa. Combina com memória contada na primeira pessoa: parece alguém lembrando, não atuando.",
  },
  {
    slug: "bruno-sampaio",
    name: "Bruno Sampaio",
    timbre: "Clara e animada, sem virar palestra motivacional. É a voz da autoajuda no catálogo.",
  },
  {
    slug: "maite-cunha",
    name: "Maitê Cunha",
    timbre:
      "Calma e cadenciada, inteligível em 1,5x — que é como quase todo mundo ouve livro de produtividade.",
  },
];

const vozPorSlug = new Map(studioVoices.map((voz) => [voz.slug, voz]));

/**
 * Quem narrou: uma voz do Studio ou uma pessoa que gravou de verdade.
 *
 * Hoje a resposta é sempre `studio`, e é a verdade — nenhum áudio humano existe
 * no AllBook. O tipo existe para o dia em que existir.
 */
export type NarratorKind = "studio" | "human";

export function narratorKind(nomeDoNarrador: string): NarratorKind {
  return vozPorSlug.has(slugify(nomeDoNarrador)) ? "studio" : "human";
}

/** A ficha da voz, se aquele nome for uma voz da casa. */
export function findVoice(slug: string): StudioVoice | undefined {
  return vozPorSlug.get(slug);
}

/** Foi o Studio que produziu a narração deste livro? */
export function isStudioProduction(book: Book): boolean {
  return narratorKind(book.narrator) === "studio";
}

/** Tudo que o Studio produziu, do mais bem avaliado para o menos. */
export function studioBooks(): Book[] {
  return catalog.filter(isStudioProduction).sort(porNota);
}

/** Os livros narrados por uma voz específica, do mais bem avaliado para o menos. */
export function booksByVoice(slug: string): Book[] {
  return catalog
    .filter((livro) => slugify(livro.narrator) === slug)
    .sort(porNota);
}
