/**
 * Comentários dos leitores — uma lista própria, não um pedaço de cada livro.
 *
 * **Por que isto existe.** Antes o comentário morava dentro do `bookData` do
 * `BookDetails.tsx`, como `{ user: "Beto", text }` — um nome solto em texto, sem
 * dono e sem data. Estrutura assim responde "o que disseram deste livro", mas
 * não responde "o que o Beto andou comentando", que é justamente o que a
 * Comunidade precisa saber. Aqui o comentário tem autor (slug de alguém de
 * `community.ts`), livro e data, e as duas perguntas se respondem por filtro.
 *
 * É também o formato que o banco vai querer: uma tabela de comentários com
 * chave para usuário e para livro. Quando houver API, isto vira uma chamada.
 *
 * Os autores são os leitores fictícios — esqueleto de propósito, até haver
 * gente de verdade.
 */

import { catalog, type Book } from "@/lib/books";
import { findMember, type CommunityMember } from "@/lib/community";

export interface Comment {
  id: string;
  /** `slug` de quem escreveu, em `community.ts`. */
  authorSlug: string;
  bookId: number;
  /**
   * O comentário ao qual este responde. Vazio = comentário de primeiro nível.
   *
   * **Só existe um nível de resposta**: responder a uma resposta continua na
   * mesma conversa, em vez de abrir mais uma casinha para dentro. Sem isso a
   * conversa vira escada e some da tela do celular no terceiro nível.
   */
  parentId?: string;
  /**
   * De 1 a 5, como as estrelas mostradas na tela do livro.
   *
   * **Resposta não tem nota**, e por isso o campo é opcional: quem responde
   * está falando com uma pessoa, não avaliando o livro. Estrela na resposta
   * misturaria as duas coisas e sujaria a média.
   */
  rating?: number;
  text: string;
  /** ISO. Serve para ordenar a atividade de quem você segue. */
  date: string;
  /**
   * Curtidas que o comentário já tinha antes de você. É a base sobre a qual a
   * sua curtida soma 1 — sem ela todo comentário nasceria em zero e o número
   * não ordenaria nada. Vem do servidor quando houver servidor.
   */
  likes: number;
  /**
   * Descurtidas. **Contam para a ordem, mas o número não aparece na tela**
   * (ver `reactions.ts`): quem discorda também engajou, e o comentário que
   * moveu gente merece ser lido antes — mas placar negativo visível vira
   * punição a quem escreveu.
   */
  dislikes: number;
}

/**
 * Os oito primeiros vieram do `bookData` antigo, palavra por palavra, para a
 * tela do livro não mudar de conteúdo na mudança. Os demais foram escritos
 * para dar densidade: perfil de gente que comentou uma vez só não mostra nada,
 * e a tela de atividade precisa de mais de um acontecimento por pessoa.
 */
export const comments: Comment[] = [
  // — herdados do BookDetails —
  { id: "c1", authorSlug: "ana-paula", bookId: 1, rating: 5, likes: 28, dislikes: 7, date: "2026-07-14", text: "Suspense do início ao fim! A narração traz um peso incrível para a história." },
  { id: "c2", authorSlug: "marcos-v", bookId: 1, rating: 4, likes: 13, dislikes: 3, date: "2026-07-09", text: "Reviravoltas inesperadas. Um dos melhores que ouvi este ano." },
  { id: "c3", authorSlug: "ricardo", bookId: 5, rating: 5, likes: 33, dislikes: 7, date: "2026-07-12", text: "Dicas muito práticas que comecei a aplicar no mesmo dia. Recomendo!" },
  { id: "c4", authorSlug: "juliana-s", bookId: 5, rating: 4, likes: 7, dislikes: 0, date: "2026-07-05", text: "A voz da narradora é muito calmante e o conteúdo é bem estruturado." },
  { id: "c5", authorSlug: "felipe-g", bookId: 101, rating: 5, likes: 12, dislikes: 1, date: "2026-07-17", text: "Mudou completamente minha visão sobre investimentos. Essencial." },
  { id: "c6", authorSlug: "carla-lima", bookId: 101, rating: 5, likes: 60, dislikes: 15, date: "2026-06-28", text: "Texto leve e profundo ao mesmo tempo. Excelente narração." },
  { id: "c7", authorSlug: "beto", bookId: 102, rating: 5, likes: 42, dislikes: 10, date: "2026-07-16", text: "O melhor livro sobre hábitos já escrito. Ponto final." },
  { id: "c8", authorSlug: "luciana", bookId: 102, rating: 5, likes: 14, dislikes: 1, date: "2026-07-02", text: "Prático, direto e transformador. Ouço repetidamente para fixar." },

  // — Ana Paula: suspense —
  { id: "c9", authorSlug: "ana-paula", bookId: 2, rating: 5, likes: 31, dislikes: 1, date: "2026-07-19", text: "Comecei achando que sabia onde ia dar. Não sabia. Ouvi as últimas duas horas de uma vez." },
  { id: "c10", authorSlug: "ana-paula", bookId: 120, rating: 4, likes: 7, dislikes: 1, date: "2026-06-30", text: "A narradora acerta o tom da personagem bêbada sem virar caricatura. Difícil de fazer." },
  { id: "c11", authorSlug: "ana-paula", bookId: 106, rating: 4, likes: 36, dislikes: 4, date: "2026-06-21", text: "O final justifica a paciência do meio. Segure a vontade de acelerar." },

  // — Marcos V.: negócios e biografia, ouve no trânsito —
  { id: "c12", authorSlug: "marcos-v", bookId: 112, rating: 5, likes: 21, dislikes: 1, date: "2026-07-18", text: "Cinco semanas de trânsito bem gastas. O trecho sobre a saída da Apple vale sozinho." },
  { id: "c13", authorSlug: "marcos-v", bookId: 113, rating: 5, likes: 10, dislikes: 0, date: "2026-07-06", text: "Não parece livro de empresa, parece diário de alguém quase quebrando. Melhor por isso." },
  { id: "c14", authorSlug: "marcos-v", bookId: 108, rating: 4, likes: 9, dislikes: 2, date: "2026-06-24", text: "Bom, mas eu já tinha ouvido metade das ideias em outros lugares." },

  // — Juliana S.: clássicos —
  { id: "c15", authorSlug: "juliana-s", bookId: 140, rating: 5, likes: 35, dislikes: 0, date: "2026-07-15", text: "Já tinha lido três vezes e mesmo assim a narração me fez rir em lugares novos." },
  { id: "c16", authorSlug: "juliana-s", bookId: 136, rating: 5, likes: 34, dislikes: 6, date: "2026-07-01", text: "Precisei parar duas vezes. Não pela narração — pelo que está sendo dito." },
  { id: "c17", authorSlug: "juliana-s", bookId: 130, rating: 5, likes: 12, dislikes: 3, date: "2026-06-18", text: "Envelheceu para pior, no sentido de que ficou mais parecido com o noticiário." },

  // — Ricardo: começou a ouvir há pouco —
  { id: "c18", authorSlug: "ricardo", bookId: 107, rating: 5, likes: 23, dislikes: 5, date: "2026-07-20", text: "Li o resumo em algum lugar e achei óbvio. Ouvindo inteiro, não é. Faz diferença." },
  { id: "c19", authorSlug: "ricardo", bookId: 124, rating: 4, likes: 9, dislikes: 2, date: "2026-07-03", text: "Datado em alguns exemplos, mas o miolo continua de pé." },

  // — Carla Lima: ficção científica —
  { id: "c20", authorSlug: "carla-lima", bookId: 7, rating: 5, likes: 43, dislikes: 9, date: "2026-07-13", text: "O narrador dá voz diferente para cada casa sem exagerar. Terminei e comecei de novo." },
  { id: "c21", authorSlug: "carla-lima", bookId: 109, rating: 4, likes: 31, dislikes: 2, date: "2026-06-26", text: "A parte da física é densa no áudio. Ouvi em 1x, coisa que quase nunca faço." },
  { id: "c22", authorSlug: "carla-lima", bookId: 8, rating: 5, likes: 11, dislikes: 2, date: "2026-06-15", text: "Setenta anos depois e ainda é o melhor começo de série que existe." },

  // — Beto: terror —
  { id: "c23", authorSlug: "beto", bookId: 105, rating: 5, likes: 60, dislikes: 0, date: "2026-07-11", text: "Ouvi de madrugada e me arrependi na hora certa. O narrador sabe onde fazer a pausa." },
  { id: "c24", authorSlug: "beto", bookId: 104, rating: 5, likes: 44, dislikes: 8, date: "2026-06-29", text: "Trinta e poucas horas e eu queria mais. A parte das crianças é melhor que a dos adultos." },
  { id: "c25", authorSlug: "beto", bookId: 144, rating: 4, likes: 11, dislikes: 0, date: "2026-06-12", text: "O formato de cartas funciona surpreendentemente bem em áudio." },

  // — Felipe G.: dinheiro, depois histórias —
  { id: "c26", authorSlug: "felipe-g", bookId: 125, rating: 3, likes: 8, dislikes: 0, date: "2026-07-08", text: "Ouvi porque todo mundo cita. Tem coisa boa, mas leve com desconfiança." },
  { id: "c27", authorSlug: "felipe-g", bookId: 137, rating: 5, likes: 48, dislikes: 0, date: "2026-06-20", text: "Entrei esperando autoajuda e saí com outra coisa. Não é livro para ouvir com pressa." },

  // — Luciana: reouve o que gostou —
  { id: "c28", authorSlug: "luciana", bookId: 203, rating: 4, likes: 7, dislikes: 0, date: "2026-07-10", text: "Terceira vez. Continua funcionando, ainda que eu já saiba cada frase." },
  { id: "c29", authorSlug: "luciana", bookId: 4, rating: 4, likes: 29, dislikes: 3, date: "2026-06-23", text: "A ideia principal cabe em vinte minutos, mas a companhia da narração compensa." },
  { id: "c30", authorSlug: "luciana", bookId: 201, rating: 4, likes: 7, dislikes: 0, date: "2026-06-08", text: "Menos agressivo do que o título promete. O narrador acerta a ironia." },

  // — respostas (têm `parentId` e não têm nota) —
  { id: "r1", parentId: "c7", authorSlug: "ricardo", bookId: 102, likes: 19, dislikes: 2, date: "2026-07-17", text: "\"Ponto final\" é forte. E o do Duhigg, que veio antes e explica a mesma coisa?" },
  { id: "r2", parentId: "c7", authorSlug: "beto", bookId: 102, likes: 24, dislikes: 6, date: "2026-07-18", text: "Li os dois. O do Duhigg explica melhor por que o hábito funciona; este aqui explica melhor como montar um. Serve para coisas diferentes." },
  { id: "r3", parentId: "c7", authorSlug: "luciana", bookId: 102, likes: 8, dislikes: 1, date: "2026-07-19", text: "Concordo com o Beto. Ouvi na ordem inversa e me atrapalhei." },
  { id: "r4", parentId: "c1", authorSlug: "marcos-v", bookId: 1, likes: 11, dislikes: 4, date: "2026-07-15", text: "Peso da narração eu concordo, mas o final me pareceu apressado. Alguém mais achou?" },
  { id: "r5", parentId: "c1", authorSlug: "ana-paula", bookId: 1, likes: 16, dislikes: 2, date: "2026-07-16", text: "Apressado não — enxuto. O livro passa o tempo todo dizendo que ninguém ia acreditar nela, e o final faz exatamente isso com o leitor." },
  { id: "r6", parentId: "c20", authorSlug: "juliana-s", bookId: 7, likes: 9, dislikes: 0, date: "2026-07-14", text: "Comecei ontem por causa deste comentário. Já entendi o que você quis dizer sobre as vozes." },
  { id: "r7", parentId: "c26", authorSlug: "marcos-v", bookId: 125, likes: 14, dislikes: 9, date: "2026-07-09", text: "\"Leve com desconfiança\" é o melhor conselho que já li sobre esse livro." },
  { id: "r8", parentId: "c17", authorSlug: "carla-lima", bookId: 130, likes: 21, dislikes: 12, date: "2026-06-19", text: "Discordo. Ele não ficou parecido com o noticiário — a gente é que passou a ler o noticiário procurando o livro." },
];

/** Do mais novo para o mais velho — a ordem em que se lê comentário. */
function byNewest(a: Comment, b: Comment): number {
  return b.date.localeCompare(a.date);
}

/**
 * Engajamento: curtidas **mais** descurtidas.
 *
 * Discordar também é engajar. Um comentário que dividiu a opinião de trinta
 * pessoas moveu mais gente do que um que agradou a cinco, e quem chega depois
 * quer ler os dois lados — não só o consenso morno. Por isso a soma, e não a
 * diferença.
 */
export function engagementOf(comment: Comment): number {
  return comment.likes + comment.dislikes;
}

/**
 * Os comentários de primeiro nível de um livro, **do mais engajado para o
 * menos**. Empate desfaz pela data, para o mais recente aparecer antes. As
 * respostas não entram aqui: elas vêm por `repliesTo`, dentro de cada conversa.
 */
export function commentsForBook(bookId: number): Comment[] {
  return comments
    .filter((item) => item.bookId === bookId && !item.parentId)
    .sort((a, b) => engagementOf(b) - engagementOf(a) || byNewest(a, b));
}

/**
 * As respostas a um comentário, **da mais antiga para a mais nova**.
 *
 * Aqui a ordem é cronológica de propósito, ao contrário do primeiro nível: numa
 * conversa, quem responde está falando com o que veio antes. Ordenar réplica
 * por engajamento embaralharia o diálogo — a resposta apareceria antes da
 * pergunta que ela responde.
 */
export function repliesTo(commentId: string): Comment[] {
  return comments
    .filter((item) => item.parentId === commentId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * O que uma pessoa andou comentando. É o que o perfil dela mostra.
 *
 * Só o primeiro nível: resposta solta, fora da conversa em que nasceu, não se
 * entende — "Discordo, ele não ficou parecido com o noticiário" sem a pergunta
 * acima é ruído.
 */
export function commentsByAuthor(authorSlug: string): Comment[] {
  return comments
    .filter((item) => item.authorSlug === authorSlug && !item.parentId)
    .sort(byNewest);
}

/** Quem escreveu, já resolvido. `undefined` se o slug não existir mais. */
export function authorOf(comment: Comment): CommunityMember | undefined {
  return findMember(comment.authorSlug);
}

/** O livro comentado, já resolvido. */
export function bookOf(comment: Comment): Book | undefined {
  return catalog.find((book) => book.id === comment.bookId);
}
