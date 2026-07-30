/**
 * Os comentários de um post do feed — **rasos, um nível só**.
 *
 * Decisão da §4.58, e ela foi negociada: eu recomendei *"curtir sim, comentar
 * sim, mas raso"* e o Matheus concordou (*"onde o post tem que curtir e comentar,
 * com certeza"*). O motivo do raso é concreto: já existem **duas** conversas
 * profundas no app (a do livro e a do clube), e uma terceira com fios aninhados
 * viraria um lugar onde a conversa se esconde de si mesma.
 *
 * **Um nível, com `@Fulano`.** Responder a um comentário **não** cria um fio: a
 * resposta entra na mesma lista, com o nome de quem ela responde. É a mesma
 * gramática de `replies.ts` (a conversa do livro) e das respostas do fórum — três
 * lugares, uma regra.
 *
 * ---
 *
 * **Por que não reusou `replies.ts`, que faz quase isto.** Duas razões concretas,
 * não estéticas:
 *
 * 1. Lá o `bookId` é **obrigatório** na semântica (a resposta mora na conversa de
 *    um livro), e post pode não ter livro nenhum.
 * 2. O `parentId` de lá é um **comentário** do catálogo fixo `comments.ts`; aqui é
 *    um **post**, que pode ser seu e nasceu no `localStorage`.
 *
 * Generalizar `replies.ts` exigiria mudar a assinatura de `addReply` e mexer em
 * `CommentThread.tsx`, que é território da outra janela (ver `COORDENACAO.md`).
 * Duas libs pequenas com a mesma gramática é mais seguro que uma grande com
 * campos que mentem.
 *
 * ⚠️ **Os comentários dos outros são fictícios**, como o resto do esqueleto. Os
 * **seus** são reais dentro da maquete e ficam no `localStorage`.
 */

import { community, findMember } from "@/lib/community";
import { type Mencao } from "@/lib/posts";

const CHAVE = "allbook_comentarios_post";

export const COMENTARIOS_EVENT = "allbook:comentarios-de-post";

/** Curto de propósito: comentário é conversa, não resenha. */
export const MAX_COMENTARIO = 500;

export interface ComentarioDePost {
  id: string;
  postId: string;
  texto: string;
  /** ISO completo — a lista é do mais antigo para o mais novo, como conversa. */
  date: string;
  /** Slug em `community.ts`. **Ausente = você.** */
  autorSlug?: string;
  /**
   * A quem este comentário responde, para o "@Fulano".
   *
   * Como a lista é **plana**, sem isto não daria para saber quem fala com quem
   * dentro de um post com cinco vozes.
   */
  respondeA?: string;
  /** O campo de escrever é o mesmo do compositor, então a menção vem de graça. */
  mencoes?: Mencao[];
}

/** Horas atrás, em ISO — os fictícios precisam de data relativa a hoje. */
function atras(horas: number): string {
  const d = new Date();
  d.setHours(d.getHours() - horas);
  return d.toISOString();
}

/**
 * O que a comunidade fictícia respondeu.
 *
 * Escritos à mão, um por um. **Post sem comentário nenhum faz o mecanismo parecer
 * morto** — e o pior lugar para isso é a pergunta, que existe justamente para ser
 * respondida. Note que há **discordância** entre eles: conversa em que todos
 * concordam soa a propaganda.
 */
const DO_ESQUELETO: ComentarioDePost[] = [
  /* A pergunta do Ricardo sobre seguir na série de Duna — a que mais pede
     resposta, e por isso a que tem mais. */
  {
    id: "c-esq-1",
    postId: "p-esq-2",
    autorSlug: "ana-paula",
    texto: "Segue. O segundo é mais lento, mas o terceiro paga tudo.",
    date: atras(5),
  },
  {
    id: "c-esq-2",
    postId: "p-esq-2",
    autorSlug: "beto",
    texto:
      "Discordo da Ana. Eu pararia no primeiro e ficaria com a lembrança boa. O resto vira política de deserto.",
    date: atras(4),
    respondeA: "Ana Paula",
  },
  {
    id: "c-esq-3",
    postId: "p-esq-2",
    autorSlug: "marcos-v",
    texto: "Depende do que te prendeu. Se foi o mundo, segue; se foi o Paul, para aqui.",
    date: atras(3),
  },

  /* O trecho da Ana Paula. */
  {
    id: "c-esq-4",
    postId: "p-esq-1",
    autorSlug: "juliana-s",
    texto: "Ouvi três vezes seguidas. É a respiração antes da fala, não a fala.",
    date: atras(1),
  },
  {
    id: "c-esq-5",
    postId: "p-esq-1",
    autorSlug: "ricardo",
    texto: "Agora não consigo mais ouvir essa cena sem esperar a pausa.",
    date: atras(1),
  },

  /* O clube da Carla. */
  {
    id: "c-esq-6",
    postId: "p-esq-3",
    autorSlug: "luciana",
    texto: "Três capítulos por semana eu consigo. Entrei.",
    date: atras(18),
  },

  /* A pergunta da Juliana sobre voz feminina. */
  {
    id: "c-esq-7",
    postId: "p-esq-5",
    autorSlug: "carla-lima",
    texto:
      "A Camila Ferraz. Ouvi coisa que eu nunca leria só para ficar com a voz dela no ouvido.",
    date: atras(28),
  },
  {
    id: "c-esq-8",
    postId: "p-esq-5",
    autorSlug: "beto",
    texto: "Segunda na Camila. E a Lívia Bonfim em biografia é outro nível.",
    date: atras(26),
    respondeA: "Carla Lima",
  },

  /* O post do Beto sobre autoajuda. */
  {
    id: "c-esq-9",
    postId: "p-esq-6",
    autorSlug: "ana-paula",
    texto: "Quatro páginas de anotação em autoajuda é mais do que eu tirei de muito romance.",
    date: atras(40),
  },
];

function ler(): ComentarioDePost[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (item): item is ComentarioDePost =>
        item &&
        typeof item.id === "string" &&
        typeof item.postId === "string" &&
        typeof item.texto === "string" &&
        typeof item.date === "string",
    );
  } catch {
    return [];
  }
}

function gravar(lista: ComentarioDePost[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage o comentário não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(COMENTARIOS_EVENT));
}

/**
 * Os comentários de um post, **do mais novo para o mais antigo**.
 *
 * ⚠️ **Era o contrário, e estava errado** (30/07). Eu tinha ordenado como
 * conversa — antigo em cima —, e o Matheus achou o defeito usando: *"eu acabei de
 * comentar e o meu comentário foi lá pra baixo, muito ruim"*. Ele tem razão, e o
 * problema é maior que gosto: **quem escreve não vê o que escreveu**, e sem
 * confirmação a pessoa escreve de novo.
 *
 * O encadeamento não se perde porque a lista é **rasa**: quem responde alguém
 * carrega o `@Fulano` junto, e é ele que diz com quem se está falando — não a
 * posição na lista.
 */
export function comentariosDoPost(postId: string): ComentarioDePost[] {
  return [...DO_ESQUELETO, ...ler()]
    .filter((item) => item.postId === postId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function totalDeComentarios(postId: string): number {
  return comentariosDoPost(postId).length;
}

/** Quais posts já foram respondidos — o que a página `/perguntas` usa para cobrar. */
export function temResposta(postId: string): boolean {
  return totalDeComentarios(postId) > 0;
}

/** Você comenta. Devolve o comentário, ou `null` se não havia texto. */
export function comentar(
  postId: string,
  texto: string,
  opcoes?: { respondeA?: string; mencoes?: Mencao[] },
): ComentarioDePost | null {
  const limpo = texto.trim().slice(0, MAX_COMENTARIO);
  if (!limpo) return null;

  const comentario: ComentarioDePost = {
    id: `c-meu-${Date.now()}`,
    postId,
    texto: limpo,
    date: new Date().toISOString(),
    ...(opcoes?.respondeA ? { respondeA: opcoes.respondeA } : {}),
    ...(opcoes?.mencoes?.length
      ? { mencoes: opcoes.mencoes.filter((m) => limpo.includes(`@${m.rotulo}`)) }
      : {}),
  };
  gravar([...ler(), comentario]);
  return comentario;
}

/**
 * Apaga um comentário **seu**.
 *
 * Só os seus: quem escreveu é dono do que escreveu. Os do esqueleto são código e
 * não estão no `localStorage` — nem daria.
 */
export function apagarComentario(id: string): void {
  gravar(ler().filter((item) => item.id !== id));
}

/**
 * Guarda um comentário **recebido** — a simulação do esqueleto reagindo.
 *
 * **A honestidade disto**, igual à do `replies.ts`: num app de verdade quem é
 * avisado é a outra pessoa. Aqui não há a outra pessoa, há o esqueleto — então
 * quem reage é ele, e você vê o ciclo funcionando.
 */
export function comentarioRecebido(entrada: {
  postId: string;
  autorSlug: string;
  texto: string;
  respondeA: string;
}): ComentarioDePost {
  const comentario: ComentarioDePost = {
    id: `c-in-${Date.now()}`,
    postId: entrada.postId,
    texto: entrada.texto,
    date: new Date().toISOString(),
    autorSlug: entrada.autorSlug,
    respondeA: entrada.respondeA,
  };
  gravar([...ler(), comentario]);
  return comentario;
}

/**
 * Falas prontas para a reação do esqueleto. **Não é IA escrevendo na hora:** é um
 * punhado de frases fixas, escolhidas ao acaso, com opinião e às vezes
 * discordando — que é o que faz parecer gente e não atendimento.
 */
const FALAS = [
  "Boa. Anotei aqui.",
  "Não tinha visto assim, mas faz sentido.",
  "Discordo, e é por isso que gosto de conversar sobre livro.",
  "Isso! Foi exatamente o que eu senti.",
  "Vou ouvir de novo prestando atenção nisso.",
  "Justo. Cada um ouve um livro diferente.",
];

/** Quem responde e o que diz: o autor do post, se houver; senão, qualquer um. */
export function reacaoDoEsqueleto(
  autorDoPostSlug: string | undefined,
  seuNome: string,
): { autorSlug: string; texto: string; respondeA: string } {
  const quem =
    (autorDoPostSlug ? findMember(autorDoPostSlug) : undefined) ??
    community[Math.floor(Math.random() * community.length)];
  return {
    autorSlug: quem.slug,
    texto: FALAS[Math.floor(Math.random() * FALAS.length)],
    respondeA: seuNome,
  };
}
