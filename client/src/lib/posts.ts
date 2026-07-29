/**
 * O post da Comunidade — **uma fala com um objeto do AllBook dentro**.
 *
 * É a peça central da reformulação decidida em 29/07 (ROTEIRO §4.53 a §4.58).
 * Vale reler o porquê antes de mexer aqui, porque foi a décima segunda tentativa
 * e as onze anteriores morreram do mesmo mal:
 *
 * **Onze maquetes de Comunidade falharam porque o feed delas era sobre
 * pessoas** — "fulano avaliou", "fulano está ouvindo". Texto sem corpo. O
 * Matheus reagia sempre igual: *"as coisas que eu vejo aqui são muito cruas"*.
 *
 * A virada foi dele: **dar um objeto ao post.** Aqui um post carrega a capa
 * grande de um livro, um trecho de 40s que toca, ou um clube com prazo e vagas.
 * Não é "post de rede social" — é o livro circulando pela voz das pessoas. E é o
 * que responde ao "cru": **o que dá corpo visual não é foto de gente, é a capa.**
 *
 * **Um objeto por post, nunca dois** (decisão de 29/07): dois anexos brigam pelo
 * mesmo espaço e o cartão perde a forma.
 *
 * **Texto puro é permitido, mas nunca é o padrão.** "Terminei meu primeiro livro
 * do ano" é post legítimo e não tem objeto nenhum; o compositor abre com os
 * anexos à mão para que a exceção continue exceção.
 *
 * ---
 *
 * **Herda o mural, não o substitui.** Os posts que você já escreveu vivem em
 * `lib/mural.ts` (chave `allbook_mural_posts`) e continuam ali: esta camada os
 * lê e converte. Assim nada se perde, e o Perfil — que já lia `readMeusPosts` —
 * segue funcionando sem alteração. Decisão do Matheus quando perguntei o que
 * fazer com os antigos: *"tanto faz; pode deixar os que já tem lá"*.
 *
 * ⚠️ **Os posts de outras pessoas são fictícios**, como o resto do esqueleto
 * (`community.ts`): não há servidor, então ninguém publica de verdade. O que
 * **você** publica é real dentro da maquete.
 */

import { criarCitacao, type Citacao } from "@/lib/citacoes";
import { catalog } from "@/lib/books";
import { readMeusPosts, type MeuPost } from "@/lib/mural";

/**
 * O que o post carrega. **Um só, nunca dois.**
 *
 * `livro` é o mais comum e o mais barato: a capa já existe, já é bonita e já é
 * link para a ficha. `trecho` é o que só o AllBook tem — 40 segundos que tocam
 * parando no fim. `clube` é convite disfarçado de post: quem lê pode entrar.
 */
export type ObjetoDoPost =
  | { tipo: "livro"; bookId: number }
  | { tipo: "trecho"; citacao: Citacao }
  | { tipo: "clube"; clubeId: string };

export interface Post {
  id: string;
  /** Slug em `community.ts`. **Ausente = você.** */
  autorSlug?: string;
  texto: string;
  objeto?: ObjetoDoPost;
  /**
   * Post que espera resposta ("Terminei Duna, sigo na série?").
   *
   * É **um tipo de post, e não uma aba separada** — decisão de 29/07: aba
   * dividiria a comunidade em duas plateias, e o que a aba tinha de bom (juntar
   * as sem resposta) vira um filtro dentro do próprio feed.
   */
  pergunta?: boolean;
  /** ISO completo. A ordem do feed é cronológica pura — sem algoritmo. */
  date: string;
  /** Quando foi editado, se foi. A tela mostra "editado" a partir disto. */
  editadoEm?: string;
}

/** Dias atrás, em ISO — os fictícios precisam de data relativa a hoje. */
function atras(horas: number): string {
  const d = new Date();
  d.setHours(d.getHours() - horas);
  return d.toISOString();
}

/** Só usa livro que existe de verdade no catálogo — nada de capa quebrada. */
function existe(bookId: number): boolean {
  return catalog.some((livro) => livro.id === bookId);
}

/**
 * O que a comunidade fictícia anda dizendo.
 *
 * Escritos à mão, um por um, e não gerados: post de esqueleto tem de soar como
 * gente falando de livro — se soar como exemplo de layout ("Lorem ipsum do
 * audiolivro"), o feed parece morto mesmo cheio. Cada um traz um objeto
 * diferente, de propósito, para a tela mostrar as três formas do cartão logo na
 * primeira rolagem.
 */
const DO_ESQUELETO: Post[] = [
  {
    id: "p-esq-1",
    autorSlug: "ana-paula",
    texto:
      "Parei o carro para ouvir isso duas vezes. A pausa que ela dá antes de responder muda a cena inteira.",
    objeto: { tipo: "trecho", citacao: criarCitacao(106, 1250, 40) },
    date: atras(2),
  },
  {
    id: "p-esq-2",
    autorSlug: "ricardo",
    texto: "Terminei Duna hoje. Sigo na série ou paro enquanto está bom?",
    objeto: { tipo: "livro", bookId: 7 },
    pergunta: true,
    date: atras(6),
  },
  {
    id: "p-esq-3",
    autorSlug: "carla-lima",
    texto:
      "Abri uma turma para ler devagar, três capítulos por semana. Quem nunca conseguiu terminar, é a nossa chance.",
    objeto: { tipo: "clube", clubeId: "tres-corpos" },
    date: atras(20),
  },
  {
    id: "p-esq-4",
    autorSlug: "marcos-v",
    texto:
      "Trinta segundos que resumem o livro inteiro. Se você só ouvir isso hoje, já valeu o dia.",
    objeto: { tipo: "trecho", citacao: criarCitacao(4, 688, 34) },
    date: atras(26),
  },
  {
    id: "p-esq-5",
    autorSlug: "juliana-s",
    texto:
      "Alguém tem uma narração feminina que valha por si só, independente do livro? Quero ouvir a voz, não a história.",
    pergunta: true,
    date: atras(30),
  },
  {
    id: "p-esq-6",
    autorSlug: "beto",
    texto:
      "Comecei achando que era autoajuda de aeroporto e terminei com quatro páginas de anotação. Fica o registro.",
    objeto: { tipo: "livro", bookId: 4 },
    date: atras(44),
  },
  {
    id: "p-esq-7",
    autorSlug: "luciana",
    texto: "Terminei meu quinto livro do ano. Ano passado inteiro foram três.",
    date: atras(52),
  },
];

/** Converte um post seu (do mural) para o formato do feed. */
function meuPostComoPost(item: MeuPost): Post {
  const objeto: ObjetoDoPost | undefined =
    item.bookId !== undefined
      ? { tipo: "livro", bookId: item.bookId }
      : item.clubeId !== undefined
        ? { tipo: "clube", clubeId: item.clubeId }
        : undefined;
  return { id: item.id, texto: item.texto, objeto, date: item.date };
}

/**
 * Tudo o que o feed mostra, do mais recente para o mais antigo.
 *
 * **Cronológico puro, sem algoritmo** (decisão de 29/07): com pouca gente,
 * algoritmo é teatro — finge escolher entre dez coisas. E ordem por tempo é a
 * única que a pessoa consegue prever.
 */
export function todosOsPosts(): Post[] {
  const deFora = DO_ESQUELETO.filter(
    (post) => post.objeto?.tipo !== "livro" || existe(post.objeto.bookId),
  );
  return [...deFora, ...readMeusPosts().map(meuPostComoPost)].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

/** Só os de quem você segue (mais os seus) — a lente "Seguindo". */
export function postsDeQuemVoceSegue(seguindo: string[]): Post[] {
  return todosOsPosts().filter(
    (post) => post.autorSlug === undefined || seguindo.includes(post.autorSlug),
  );
}
