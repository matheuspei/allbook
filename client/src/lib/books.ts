/**
 * Os livros do app — agora vindos do **banco**, não do código (21/08).
 *
 * Este arquivo era a fonte única dos livros: um array literal com 63 maquetes
 * escritas à mão. Isso travava três coisas ao mesmo tempo — livro novo não
 * nascia de um pedido, o player não tinha capítulo medido para ler, e o acervo
 * de verdade não tinha por onde entrar.
 *
 * Ele continua sendo a fonte única para as telas: **62 arquivos importam daqui
 * e nenhum deles mudou**. O que mudou é de onde `catalog` se enche.
 *
 * ## As duas regras que fazem isso funcionar sem tocar em tela nenhuma
 *
 * 1. **`catalog` nunca troca de referência.** Ele nasce como um array vazio e é
 *    preenchido com `push`. Quem importou o array continua com o mesmo objeto na
 *    mão, cheio. Trocar por um `catalog = novoArray` deixaria todo mundo
 *    segurando o array velho, vazio, **sem erro nenhum**.
 * 2. **O carregamento acontece ANTES do primeiro render** — `main.tsx` faz
 *    `await carregarCatalogo()` antes do `createRoot(...).render(...)`. É o que
 *    permite as telas continuarem lendo `catalog` de forma síncrona, como
 *    sempre fizeram. Sem isso, cada uma delas precisaria virar assíncrona, e
 *    seria a "meia migração" que o CLAUDE.md avisa que quebra em silêncio.
 */

import { capaTipografica } from "./coverFallback";

/**
 * O gênero do livro.
 *
 * **Era um union fechado de 8 nomes; virou `string` em 21/08.** Os 8 continuam
 * existindo (são as linhas da tabela `generos`), mas o tipo não pode mais
 * enumerá-los: os gêneros passam a vir do banco, e o acervo de verdade traz as
 * categorias das lojas. Um union fechado faria o TypeScript recusar um gênero
 * novo que o banco entregasse — erro numa linha que não tem defeito nenhum.
 */
export type Genre = string;

export interface Book {
  id: number;
  title: string;
  author: string;
  /**
   * Quem narra o audiolivro. O elenco é pequeno e recorrente de propósito: um
   * narrador com um título só teria um perfil sem nada para mostrar.
   */
  narrator: string;
  cover: string;
  /**
   * A nota geral, de 0 a 5.
   *
   * ⚠️ **Pode faltar, e falta na maioria** (21/08, §4.134). Nenhuma das quatro
   * lojas do acervo entrega avaliação, então livro real chega sem nota. Quem
   * desenha estrela precisa esconder o bloco quando ela não existe — mostrar
   * "0,0" seria inventar que o livro é ruim.
   */
  rating?: number;
  genre: Genre;

  /**
   * As duas notas separadas, quando existem: `story` é a obra (o texto) e
   * `performance` é a leitura **desta edição**.
   *
   * **São opcionais de propósito.** Só quem tem ficha curada as tem; o resto do
   * catálogo fica com `rating` e pronto — inventar dois números para cada livro
   * seria dado falso, e daqui a um mês ninguém saberia que foi chute. Quem
   * precisa da nota por dimensão usa `notaHistoria`/`notaNarracao` de
   * `lib/ratings.ts`, que caem no `rating` quando o campo falta.
   *
   * Elas importam porque a herança sai daqui: o autor recebe a média de
   * `story`; o narrador, a de `performance`. Antes os dois recebiam a nota
   * geral, e isso era injusto nos dois sentidos — livro fraco com narração
   * excelente punia o narrador (ver ROTEIRO 4.15).
   */
  story?: number;
  performance?: number;

  /** Título no idioma original — é por ele que a busca de capas funciona. */
  originalTitle?: string;
  year?: number;
  pages?: number;
  isbn?: string;
  synopsis?: string;
  /**
   * A sinopse curada em PT-BR (§4.104) — na ficha ela **vence** a `synopsis`
   * importada, que vem em inglês e fica de reserva.
   */
  sinopse?: string;
}

/**
 * A nota da **obra** e a da **narração**, com queda para o `rating` geral
 * quando o livro não tem as duas separadas (a maioria).
 *
 * Moram aqui, e não em `ratings.ts`, porque são leitura de um campo do livro —
 * quem só precisa disso não deve arrastar junto o portão de avaliação, o
 * progresso de audição e os comentários.
 */
/**
 * Comparador para ordenar do mais bem avaliado ao menos — **e livro sem nota
 * vai para o fim**, em vez de ser tratado como nota zero.
 *
 * Existe porque `b.rating - a.rating` deixou de compilar quando a nota virou
 * opcional (§4.134), e a correção ingênua (`?? 0`) diria que um livro sem
 * avaliação é pior que um avaliado com 0,1. Ele não é pior: é desconhecido.
 */
export function porNota(a: Book, b: Book): number {
  if (a.rating === undefined && b.rating === undefined) return 0;
  if (a.rating === undefined) return 1;
  if (b.rating === undefined) return -1;
  return b.rating - a.rating;
}

/**
 * A média das notas que **existem**, ou `undefined` se nenhuma existe.
 *
 * Livro sem nota não entra na conta nem como zero: uma prateleira com dois
 * livros 5,0 e oito sem avaliação tem média 5,0, não 1,0.
 */
export function mediaDeNotas(livros: Book[]): number | undefined {
  const notas = livros
    .map((livro) => livro.rating)
    .filter((nota): nota is number => nota !== undefined);
  if (notas.length === 0) return undefined;
  return notas.reduce((soma, nota) => soma + nota, 0) / notas.length;
}

export function notaHistoria(book: Book): number | undefined {
  return book.story ?? book.rating;
}

export function notaNarracao(book: Book): number | undefined {
  return book.performance ?? book.rating;
}

/**
 * Capas que estão **dentro do repositório**, empacotadas pelo Vite
 * (`assets/images/covers/7.jpg`).
 *
 * ⚠️ Esta pasta é herança das 58 capas que o `npm run catalogo` baixou para as
 * maquetes, e **não é para onde as capas do acervo vão**: milhares de imagens
 * não entram no git, pela mesma razão que o áudio-mestre não entra. A capa de
 * livro de verdade vem do servidor, em `/capas/<arquivo>` (ver `CAPAS_RAIZ` em
 * `server/catalogo.ts`). O glob fica porque enquanto houver capa local ela
 * continua valendo — e some sozinho quando a pasta esvaziar.
 */
const arquivosDeCapa = import.meta.glob("../assets/images/covers/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const capasPorId: Record<string, string> = Object.fromEntries(
  Object.entries(arquivosDeCapa).map(([caminho, url]) => [
    caminho.split("/").pop()!.replace(/\.\w+$/, ""),
    url,
  ])
);

/**
 * O catálogo que o app usa.
 *
 * ⚠️ **Nasce vazio e é preenchido em `carregarCatalogo()`, sem nunca trocar de
 * referência** (ver o cabeçalho). Quem lê isto durante o render já encontra a
 * lista cheia, porque o `main.tsx` espera o carregamento antes de renderizar.
 */
export const catalog: Book[] = [];

/**
 * Gêneros na ordem em que aparecem na grade da tela Descobrir.
 *
 * Também vem do banco (tabela `generos`, coluna `ordem`) e também é preenchido
 * sem trocar de referência.
 */
export const genres: { label: Genre; gradient: string }[] = [];

/** Os ids que têm capa de verdade — o resto usa a tipográfica gerada. */
const comCapaReal = new Set<number>();

/** O catálogo já foi carregado? Serve para o aviso de tela vazia, e para teste. */
export let catalogoCarregado = false;

/** Quantos livros o servidor entregou na última carga. */
export function tamanhoDoCatalogo(): number {
  return catalog.length;
}

interface LivroDaApi {
  id: number;
  title: string;
  author: string;
  narrator: string;
  cover: string | null;
  rating?: number;
  genre: string;
  story?: number;
  performance?: number;
  originalTitle?: string;
  year?: number;
  pages?: number;
  isbn?: string;
  synopsis?: string;
  sinopse?: string;
}

/**
 * Traz o catálogo do servidor e enche `catalog` e `genres`.
 *
 * Chamada uma vez, em `main.tsx`, **antes do primeiro render**. Chamar de novo
 * recarrega (limpa e reenche a mesma referência) — útil depois de uma ingestão,
 * sem precisar recarregar a página.
 *
 * ⚠️ **Erro aqui não derruba o app.** Se o servidor ou o Postgres estiverem
 * fora, o catálogo fica vazio e as telas mostram o estado vazio — que é melhor
 * do que uma tela branca sem explicação. O erro vai para o console.
 */
export async function carregarCatalogo(): Promise<void> {
  try {
    const resposta = await fetch("/api/catalogo");
    if (!resposta.ok) throw new Error(`o servidor respondeu ${resposta.status}`);

    const dados = (await resposta.json()) as {
      generos: { label: string; slug: string; gradient: string }[];
      livros: LivroDaApi[];
    };

    genres.length = 0;
    genres.push(...dados.generos.map((g) => ({ label: g.label, gradient: g.gradient })));

    catalog.length = 0;
    comCapaReal.clear();
    for (const livro of dados.livros) {
      // A capa local (empacotada) vence a do servidor enquanto existir; na
      // falta das duas, uma capa tipográfica PRÓPRIA do livro — título e autor
      // sobre fundo sóbrio —, em vez da imagem genérica de gênero que se
      // repetia e dava cara de protótipo.
      const capa = capasPorId[livro.id] ?? livro.cover ?? null;
      if (capa) comCapaReal.add(livro.id);

      catalog.push({
        ...livro,
        cover: capa ?? capaTipografica(livro.title, livro.author, livro.genre),
      });
    }

    catalogoCarregado = true;
  } catch (erro) {
    // Não relança: o app abre vazio, e é isso que se quer ver.
    console.error("[catálogo] não deu para carregar do servidor:", erro);
    catalogoCarregado = true;
  }
}

/**
 * "Ficção Científica" → "ficcao-cientifica". Sem acentos, para caber numa URL.
 *
 * Mora aqui, e não em `people.ts`, porque `people.ts` importa deste arquivo —
 * o contrário criaria um ciclo entre os dois módulos.
 */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function genreSlug(genre: Genre): string {
  return slugify(genre);
}

export function findGenreBySlug(slug: string): Genre | undefined {
  return genres.find((genero) => genreSlug(genero.label) === slug)?.label;
}

/** O gradiente do gênero, usado na grade da Descobrir e no topo da Categoria. */
export function genreGradient(genre: Genre): string {
  return genres.find((genero) => genero.label === genre)?.gradient ?? "from-slate-700 to-slate-500";
}

/**
 * Quantas páginas cabem em uma hora de narração — a média que transforma
 * páginas em duração.
 *
 * **Só vale nesse sentido, e só enquanto não há áudio de verdade.** A peça de
 * story chegou a mostrar "páginas ouvidas" por este caminho, de volta (horas ×
 * 33), e a ideia foi descartada: a página vem da ficha da Open Library, então
 * ela existe para os livros importados e **não** para os que o AllBook subir.
 * Métrica que morre quando o produto cresce não entra em peça pública — ver
 * `lerResumoDoPeriodo` em `lib/stats.ts`. Aqui ela fica porque estimar duração
 * é melhor do que mostrar "5h 00m" fixo em todo livro; quando houver arquivo de
 * áudio, a duração real toma o lugar.
 */
export const PAGINAS_POR_HORA = 33;

/**
 * A mesma estimativa de duração, só que em minutos e em número — é a base de
 * `duracaoEstimada` e o que a Biblioteca soma para dizer o tamanho do acervo
 * ("41h de audição"). Livro sem número de páginas conta zero: somar menos é
 * melhor do que inventar tempo.
 */
export function minutosEstimados(pages?: number): number {
  if (!pages) return 0;
  return Math.round((pages / PAGINAS_POR_HORA) * 60);
}

/**
 * Duração estimada do audiolivro a partir do número de páginas.
 *
 * Um audiolivro roda perto de 9.000 palavras por hora e uma página tem umas 275
 * palavras — dá mais ou menos uma hora a cada 33 páginas. É **estimativa**, não
 * medição: quando houver arquivo de áudio de verdade, trocar pelo tempo real.
 * Ainda assim é melhor que os "5h 00m" fixos que todo livro mostrava antes.
 */
export function duracaoEstimada(pages?: number): string | undefined {
  if (!pages) return undefined;

  const totalDeMinutos = minutosEstimados(pages);
  const horas = Math.floor(totalDeMinutos / 60);
  const minutos = totalDeMinutos % 60;
  return `${horas}h ${String(minutos).padStart(2, "0")}min`;
}

/**
 * O livro tem capa real (e não a tipográfica gerada de reserva)?
 * As vitrines de colagem usam isto para nunca estampar a capa-reserva no meio
 * de artes de verdade (§4.104) — o livro continua no catálogo e nas listas.
 */
export function temCapaReal(book: Book): boolean {
  return comCapaReal.has(book.id);
}

/** Busca livros por id, mantendo a ordem pedida e ignorando ids inexistentes. */
export function getBooksByIds(ids: number[]): Book[] {
  return ids
    .map((id) => catalog.find((book) => book.id === id))
    .filter((book): book is Book => book !== undefined);
}

export function getBooksByGenre(genre: Genre): Book[] {
  return catalog.filter((book) => book.genre === genre);
}
