/**
 * **Acompanhar autor, narrador, editora e o Studio** — pedido do Matheus em
 * 31/07.
 *
 * > *"As pessoas poderem seguir o escritor, o narrador, a editora… Na verdade
 * > não é nem questão de seguir, é mais você ser notificado quando tiver alguma
 * > novidade, e talvez ter um acesso mais rápido àquilo."*
 *
 * ---
 *
 * **Por que o botão continua se chamando "Seguir".** Ele tem razão no
 * diagnóstico — o gesto é *me avise* —, mas nome inventado ("acompanhar",
 * "monitorar", "receber avisos de") faz a pessoa parar para entender o que o
 * botão faz. *Seguir* é o que o Spotify, o YouTube e a Netflix usam para
 * exatamente isto, e o app já usa a palavra com leitores. **O que precisa ser
 * explícito é a promessa embaixo do botão** — "avisamos quando houver novidade
 * dele" —, não o verbo.
 *
 * **A diferença que existe de verdade, e a tela respeita:** seguir um *leitor*
 * traz o que ele faz para o **feed** da Comunidade; seguir um *autor* não tem
 * feed — ele rende **aviso** e **atalho**. Por isso a lista de acompanhados
 * mora em `/acompanhando`, separada de quem você segue em `/seguidores`.
 *
 * ---
 *
 * ⚠️ **De onde sai a "novidade", e por que ela não é inventada.** Botão de
 * seguir que nunca notifica nada é enfeite morto (§4.23). Aqui a novidade sai de
 * dado que já existe no app:
 *
 * - **Lançamentos** — a coleção `lancamentos` de `collections.ts` é o que o app
 *   já chama de "chegaram agora ao catálogo". Livro do seu acompanhado que está
 *   lá é novidade dele.
 * - **Narração nova** — as narrações de origem `pedido` (`narrations.ts`)
 *   nasceram depois, porque alguém pediu. Elas são novidade do **narrador** que
 *   gravou e do **Studio** que produziu.
 *
 * A **data** de cada novidade é semeada pelo id (dias atrás, estável) — o
 * catálogo não guarda quando cada livro entrou. É a mesma honestidade do resto
 * do esqueleto: número estável, nunca sorteado a cada desenho.
 */

import { catalog, getBooksByIds, type Book } from "@/lib/books";
import { collections } from "@/lib/collections";
import { narrationsOf } from "@/lib/narrations";
import { findPerson, getBooksByAuthor, getBooksByNarrator, roleLabels } from "@/lib/people";
import { findPublisher } from "@/lib/publishers";
import { STUDIO_NAME, studioBooks } from "@/lib/studio";

const CHAVE = "allbook_acompanhando";

/** Avisa as telas de que a lista mudou (mesmo padrão de `playback.ts`). */
export const ACOMPANHANDO_EVENT = "allbook:acompanhando";

/**
 * ⚠️ **Autor e narrador são o mesmo tipo: `pessoa`.** A primeira versão tinha
 * "autor" e "narrador" separados, e isso criava um buraco imediato: metade do
 * catálogo tem gente que **escreve e narra** (é o caso que a §4.15 já tratou nas
 * notas), e quem seguisse "o autor" deixaria de ser avisado da narração nova da
 * mesma pessoa. Segue-se a **pessoa**; o papel dela aparece na tela, vindo de
 * `roleLabels`.
 */
export type TipoDeAlvo = "pessoa" | "editora" | "studio";

export interface Alvo {
  tipo: TipoDeAlvo;
  /** Slug da pessoa/editora. O Studio é um só, e usa `STUDIO_SLUG`. */
  slug: string;
}

/** O Studio é único — não tem página por slug, tem `/studio`. */
export const STUDIO_SLUG = "allbook-studio";

export interface Novidade {
  /** Estável: `<tipo>:<slug>:<bookId>`. É o id usado para marcar como lida. */
  id: string;
  alvo: Alvo;
  bookId: number;
  tipo: "lancamento" | "narracao";
  /** A linha que a tela mostra. */
  texto: string;
  /** ISO curto, semeado pelo id (ver o cabeçalho). */
  data: string;
}

function ler(): Alvo[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    if (!Array.isArray(guardado)) return [];
    return guardado.filter(
      (item): item is Alvo =>
        item && typeof item.slug === "string" && typeof item.tipo === "string",
    );
  } catch {
    return [];
  }
}

function gravar(lista: Alvo[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    /* sem storage não persiste; a tela já mostrou o efeito */
  }
  window.dispatchEvent(new Event(ACOMPANHANDO_EVENT));
}

/** Tudo o que você acompanha, na ordem em que passou a acompanhar. */
export function acompanhados(): Alvo[] {
  return ler();
}

export function acompanho(tipo: TipoDeAlvo, slug: string): boolean {
  return ler().some((item) => item.tipo === tipo && item.slug === slug);
}

/** Segue ou deixa de seguir. Devolve o estado novo, para a tela já reagir. */
export function alternarAcompanhar(tipo: TipoDeAlvo, slug: string): boolean {
  const atual = ler();
  const jaSegue = atual.some((item) => item.tipo === tipo && item.slug === slug);
  gravar(
    jaSegue
      ? atual.filter((item) => !(item.tipo === tipo && item.slug === slug))
      : [...atual, { tipo, slug }],
  );
  return !jaSegue;
}

/** Quantos acompanhados de cada tipo — para os números da tela. */
export function quantosAcompanho(): number {
  return ler().length;
}

export function nomeDoAlvo(alvo: Alvo): string {
  if (alvo.tipo === "studio") return STUDIO_NAME;
  if (alvo.tipo === "editora") return findPublisher(alvo.slug)?.name ?? "Editora";
  return findPerson(alvo.slug)?.name ?? "Alguém";
}

/** Para onde o toque leva — o atalho que ele pediu. */
export function linkDoAlvo(alvo: Alvo): string {
  if (alvo.tipo === "studio") return "/studio";
  if (alvo.tipo === "editora") return `/publisher/${alvo.slug}`;
  return `/person/${alvo.slug}`;
}

/** A foto do alvo, quando existe — as editoras e o Studio não têm. */
export function fotoDoAlvo(alvo: Alvo): string | undefined {
  return alvo.tipo === "pessoa" ? findPerson(alvo.slug)?.photo : undefined;
}

/** O papel por extenso, para a linha embaixo do nome na lista. */
export function papelDoAlvo(alvo: Alvo): string {
  if (alvo.tipo === "editora") return "Editora";
  if (alvo.tipo === "studio") return "Estúdio";
  const pessoa = findPerson(alvo.slug);
  return pessoa ? roleLabels(pessoa).join(" e ") : "Pessoa";
}

/** Os livros que o app considera lançamento. */
function lancamentos(): Book[] {
  const colecao = collections.find((item) => item.slug === "lancamentos");
  return colecao ? getBooksByIds(colecao.bookIds) : [];
}

function semear(texto: string): number {
  let n = 0;
  for (let i = 0; i < texto.length; i += 1) n = (n * 31 + texto.charCodeAt(i)) % 9973;
  return n;
}

/** Data estável a partir do id — o catálogo não guarda quando o livro entrou. */
function dataSemeada(id: string): string {
  const data = new Date();
  data.setDate(data.getDate() - (semear(id) % 13));
  return data.toISOString().slice(0, 10);
}

function novidade(
  alvo: Alvo,
  livro: Book,
  tipo: "lancamento" | "narracao",
  texto: string,
): Novidade {
  const id = `${alvo.tipo}:${alvo.slug}:${livro.id}:${tipo}`;
  return { id, alvo, bookId: livro.id, tipo, texto, data: dataSemeada(id) };
}

/** As narrações que nasceram de pedido — novidade do narrador e do Studio. */
function narracoesDePedido(): { livro: Book; slug: string; nome: string }[] {
  const achados: { livro: Book; slug: string; nome: string }[] = [];
  for (const livro of catalog) {
    for (const narracao of narrationsOf(livro)) {
      if (narracao.origem === "pedido") {
        achados.push({ livro, slug: narracao.slug, nome: narracao.name });
      }
    }
  }
  return achados;
}

/**
 * O que há de novo de um acompanhado — o que a tela mostra embaixo do nome dele.
 *
 * Lista vazia quando não há nada: **"nenhuma novidade" é uma resposta honesta**,
 * e é o que impede a tela de inventar movimento.
 */
export function novidadesDe(alvo: Alvo): Novidade[] {
  const novos = lancamentos();
  const achadas: Novidade[] = [];

  if (alvo.tipo === "pessoa") {
    const pessoa = findPerson(alvo.slug);
    if (!pessoa) return [];

    /* Os dois chapéus na mesma varredura — quem escreve e narra rende novidade
       pelos dois lados, e o `Set` impede o livro que ela escreveu **e** narrou
       de virar dois avisos iguais. */
    const jaVistos = new Set<number>();
    for (const livro of [...getBooksByAuthor(pessoa.name), ...getBooksByNarrator(pessoa.name)]) {
      if (jaVistos.has(livro.id)) continue;
      jaVistos.add(livro.id);
      if (novos.some((item) => item.id === livro.id)) {
        const escreveu = livro.author === pessoa.name;
        achadas.push(
          novidade(
            alvo,
            livro,
            "lancamento",
            escreveu
              ? `${livro.title} chegou ao catálogo`
              : `${livro.title} chegou, narrado por ${pessoa.name}`,
          ),
        );
      }
    }

    for (const item of narracoesDePedido()) {
      if (item.slug === alvo.slug) {
        achadas.push(
          novidade(alvo, item.livro, "narracao", `Nova narração de ${item.livro.title}`),
        );
      }
    }
  }

  if (alvo.tipo === "editora") {
    const editora = findPublisher(alvo.slug);
    if (!editora) return [];
    for (const livro of editora.books) {
      if (novos.some((item) => item.id === livro.id)) {
        achadas.push(novidade(alvo, livro, "lancamento", `${livro.title} chegou ao catálogo`));
      }
    }
  }

  if (alvo.tipo === "studio") {
    for (const item of narracoesDePedido()) {
      achadas.push(
        novidade(
          alvo,
          item.livro,
          "narracao",
          `${item.livro.title} ganhou narração de ${item.nome}`,
        ),
      );
    }
    for (const livro of studioBooks()) {
      if (novos.some((item) => item.id === livro.id)) {
        achadas.push(
          novidade(alvo, livro, "lancamento", `${livro.title} saiu do estúdio para o catálogo`),
        );
      }
    }
  }

  return achadas.sort((a, b) => b.data.localeCompare(a.data));
}

/** Todas as novidades de tudo o que você acompanha, da mais nova para a mais velha. */
export function minhasNovidades(limite = 20): Novidade[] {
  return acompanhados()
    .flatMap((alvo) => novidadesDe(alvo))
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, limite);
}
