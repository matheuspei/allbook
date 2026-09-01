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
import { agruparEmObras, representanteDaObra } from "./obras";

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
  /**
   * O subtítulo, quando a loja o entrega separado (30/08, §4.138).
   *
   * Até 30/08 ele vinha **grudado** no `title`, com `": "` no meio — o
   * importador é que colava, embora a fonte sempre os tivesse em campos
   * distintos. Era essa colagem que punha títulos de 190 caracteres na vitrine.
   *
   * ⚠️ **Falta na maioria**: só existe quando a loja separou. Livro sem ele
   * pode ter o subtítulo dentro do `title` mesmo — é para esse caso que
   * `tituloDeVitrine()` continua existindo.
   */
  subtitle?: string;
  /**
   * O autor **principal** — o primeiro da lista, e o que endereça o perfil.
   *
   * ⚠️ **Não é "o autor", é o primeiro deles.** Quem escreve tela de crédito
   * usa `autoresDe(book)`, não este campo: 1.213 livros têm mais de um.
   */
  author: string;
  /**
   * Quem narra o audiolivro. O elenco é pequeno e recorrente de propósito: um
   * narrador com um título só teria um perfil sem nada para mostrar.
   *
   * ⚠️ Mesma ressalva do `author`: é o **primeiro**. Use `narradoresDe(book)`.
   */
  narrator: string;
  /**
   * Todos os autores e todos os narradores, na ordem da fonte (01/09, §4.154).
   *
   * 🚨 **Existem porque o AllBook jogava os demais fora, calado.** O Matheus
   * achou pelo ouvido: *Horóscopo mensal por João Bidu* aparecia narrado só por
   * "Alessandra Klimiont", e a ficha do acervo diz *"Alessandra Klimiont e João
   * Bidu"* — a voz do horóscopo é de homem.
   *
   * ⚠️ **Vêm só quando há mais de um nome.** Não invente `authors` de um
   * elemento no cliente: use `autoresDe(book)`, que resolve os dois casos.
   */
  authors?: string[];
  narrators?: string[];
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
  /**
   * O ano em que a **obra** foi publicada pela primeira vez — o do texto, não o
   * da gravação (31/08, §4.149).
   *
   * ⚠️ **`year` é outra coisa**: é a data que a loja anuncia para a edição em
   * áudio, e em algumas lojas ela nem isso é. Quem for mostrar ano numa tela usa
   * `anoDaObra()` e `anoDaNarracao()` de `lib/anos.ts`, nunca os campos crus.
   *
   * Falta na maioria dos livros e vai faltar por um bom tempo: só entra quando o
   * agente do `baixalivro` consegue **provar** o ano. Tela que o mostre esconde
   * a linha quando ele não existe.
   */
  anoObra?: number;
  pages?: number;
  isbn?: string;
  /**
   * A duração do audiolivro em segundos.
   *
   * Enquanto o acervo não tinha entrado, o app **estimava** a duração pelo
   * número de páginas (`duracaoEstimada`), porque não havia áudio nenhum. Agora
   * a loja entrega a duração anunciada, e o `npm run audio` grava a **medida**
   * por cima quando o arquivo entra. Este campo vence a estimativa sempre que
   * existe — ver `duracaoDoLivro`.
   */
  duracaoSegundos?: number;
  /**
   * A loja de onde a ficha veio (`audible`, `storytel`, `ubook`,
   * `tocalivros`), ou vazio quando o livro é do **AllBook Studio**.
   *
   * É o que separa o que o AllBook gravou do que ele trouxe de fora — e o selo
   * "AllBook Original" depende disso. Antes ele estava em toda ficha, porque
   * todo livro era maquete e portanto "do AllBook".
   */
  origem?: string;
  synopsis?: string;
  /**
   * A sinopse curada em PT-BR (§4.104) — na ficha ela **vence** a `synopsis`
   * importada, que vem em inglês e fica de reserva.
   */
  sinopse?: string;
  /**
   * O **slug** da editora que publicou o livro (31/08, §4.148).
   *
   * É slug, e não nome, porque é assim que a resposta do servidor o manda —
   * 13.917 livros para 692 editoras, e repetir o nome em cada um engordaria o
   * catálogo à toa. O nome de tela sai de `publisherNames`, logo abaixo, ou —
   * melhor ainda — de `publisherOfBook()` em `lib/publishers.ts`, que já
   * devolve a editora inteira.
   *
   * ⚠️ **Falta em ~11% dos livros.** Nem toda ficha do acervo traz editora, e
   * quem desenha tela precisa esconder a linha quando ela não existe, em vez
   * de escrever "Editora desconhecida".
   */
  publisher?: string;
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

/**
 * Editora → nome de tela (`mk-editora` → "MK Editora").
 *
 * ⚠️ **Preenchido em `carregarCatalogo()` sem nunca trocar de referência**,
 * pela mesma razão do `catalog`: quem importou este Map continua com o mesmo
 * objeto na mão. Um `publisherNames = novoMap` deixaria os importadores
 * segurando o mapa velho, vazio, **sem erro nenhum**.
 *
 * Quem quer a editora de um livro raramente quer só o nome — use
 * `publisherOfBook()` de `lib/publishers.ts`, que devolve também os livros
 * dela. Este mapa existe para o caso simples e para o próprio `publishers.ts`
 * se montar.
 */
export const publisherNames = new Map<string, string>();

/** Os ids que têm capa de verdade — o resto usa a tipográfica gerada. */
const comCapaReal = new Set<number>();

/* -------------------------------------------------------------------------- */
/* As gravações por trás da vitrine (31/08, §4.151)                            */
/* -------------------------------------------------------------------------- */

/**
 * **Todas** as gravações, por id — inclusive as que não representam a obra na
 * vitrine.
 *
 * 🚨 `catalog` mostra **uma por obra**; este mapa tem as 12.628. Quem procura
 * um livro por id que veio do usuário (biblioteca, progresso, marcação, um link
 * antigo) tem de usar `livroPorId()`, e não `catalog.find()`: o id salvo pode
 * ser o da gravação que ficou de fora da vitrine, e o livro sumiria da tela sem
 * erro nenhum.
 */
const porId = new Map<number, Book>();

/** id de qualquer gravação → todas as gravações daquela obra, ela incluída. */
const irmasPorId = new Map<number, Book[]>();

/** Os ids que estão em `catalog` — um por obra. */
const representantes = new Set<number>();

/** O livro de qualquer id, seja ele o representante da obra ou não. */
export function livroPorId(id: number): Book | undefined {
  return porId.get(id);
}

/**
 * As gravações da mesma obra (a do id incluída), ou uma lista de um só quando
 * o livro não tem irmãs.
 *
 * É daqui que sai o seletor de vozes da ficha e do player (`lib/narrations.ts`).
 */
export function irmasDaObra(id: number): Book[] {
  const grupo = irmasPorId.get(id);
  if (grupo) return grupo;
  const livro = porId.get(id);
  return livro ? [livro] : [];
}

/**
 * A gravação que representa a obra na vitrine — para uma tela que recebeu o id
 * de uma irmã e precisa mostrar a ficha da obra.
 */
export function representanteDe(id: number): Book | undefined {
  const grupo = irmasPorId.get(id);
  if (!grupo) return porId.get(id);
  return grupo.find((livro) => representantes.has(livro.id)) ?? grupo[0];
}

/** O catálogo já foi carregado? Serve para o aviso de tela vazia, e para teste. */
export let catalogoCarregado = false;

/** Quantos livros o servidor entregou na última carga. */
export function tamanhoDoCatalogo(): number {
  return catalog.length;
}

interface LivroDaApi {
  id: number;
  title: string;
  subtitle?: string;
  author: string;
  narrator: string;
  authors?: string[];
  narrators?: string[];
  cover: string | null;
  rating?: number;
  genre: string;
  story?: number;
  performance?: number;
  originalTitle?: string;
  year?: number;
  anoObra?: number;
  pages?: number;
  isbn?: string;
  /**
   * A duração do audiolivro em segundos.
   *
   * Enquanto o acervo não tinha entrado, o app **estimava** a duração pelo
   * número de páginas (`duracaoEstimada`), porque não havia áudio nenhum. Agora
   * a loja entrega a duração anunciada, e o `npm run audio` grava a **medida**
   * por cima quando o arquivo entra. Este campo vence a estimativa sempre que
   * existe — ver `duracaoDoLivro`.
   */
  duracaoSegundos?: number;
  origem?: string;
  synopsis?: string;
  sinopse?: string;
  publisher?: string;
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
      editoras?: { slug: string; label: string }[];
      livros: LivroDaApi[];
    };

    genres.length = 0;
    genres.push(...dados.generos.map((g) => ({ label: g.label, gradient: g.gradient })));

    // `?? []` e não `dados.editoras` direto: servidor de uma versão anterior
    // não manda o campo, e o app tem de abrir mesmo assim — só sem editora.
    publisherNames.clear();
    for (const editora of dados.editoras ?? []) publisherNames.set(editora.slug, editora.label);

    catalog.length = 0;
    comCapaReal.clear();
    porId.clear();
    irmasPorId.clear();

    const gravacoes: Book[] = [];
    for (const livro of dados.livros) {
      // A capa local (empacotada) vence a do servidor enquanto existir; na
      // falta das duas, uma capa tipográfica PRÓPRIA do livro — título e autor
      // sobre fundo sóbrio —, em vez da imagem genérica de gênero que se
      // repetia e dava cara de protótipo.
      const capa = capasPorId[livro.id] ?? livro.cover ?? null;
      if (capa) comCapaReal.add(livro.id);

      const book: Book = {
        ...livro,
        cover: capa ?? capaTipografica(livro.title, livro.author, livro.genre),
      };
      gravacoes.push(book);
      porId.set(book.id, book);
    }

    /* ---- Uma ficha por OBRA (31/08, §4.151) ------------------------------
     *
     * O acervo entrega uma entrada por GRAVAÇÃO — *A Arte da Guerra* de
     * Maquiavel chega três vezes, *O Príncipe* cinco —, e a vitrine mostrava um
     * cartão para cada. A partir daqui, `catalog` tem **um representante por
     * obra**; as outras gravações continuam inteiras e acessíveis por
     * `livroPorId()` e `irmasDaObra()`, que é o que o seletor de vozes lê.
     *
     * 🚨 **Tela que procura livro por um id VINDO DO USUÁRIO** (biblioteca,
     * progresso, marcações, estatísticas) **não pode mais usar
     * `catalog.find()`**: o id salvo pode ser o de uma gravação que não é a
     * representante, e o livro sumiria da tela sem erro nenhum. Para isso
     * existe `livroPorId()`.                                                */
    representantes.clear();
    for (const grupo of agruparEmObras(gravacoes)) {
      for (const gravacao of grupo) irmasPorId.set(gravacao.id, grupo);
      const representante = representanteDaObra(grupo, (livro) => comCapaReal.has(livro.id));
      representantes.add(representante.id);
      catalog.push(representante);
    }
    // De volta à ordem de id, que é como o servidor entrega e como as telas
    // que cortam "os primeiros N" sempre viram o catálogo.
    catalog.sort((a, b) => a.id - b.id);

    catalogoCarregado = true;
  } catch (erro) {
    // Não relança: o app abre vazio, e é isso que se quer ver.
    console.error("[catálogo] não deu para carregar do servidor:", erro);
    catalogoCarregado = true;
  }
}

/**
 * Traz as sinopses de um punhado de livros e as **escreve nos objetos do
 * `catalog`**, em vez de devolver uma cópia.
 *
 * 🚨 **Por que a sinopse não vem no catálogo.** Medido em 22/08, com o acervo
 * de verdade dentro: a resposta de `/api/catalogo` tinha **14 MB**, e **85%
 * disso era sinopse** — 10,9 MB de texto que só duas telas leem (a ficha do
 * livro e a descrição do destaque). Sem ela a lista cai para ~2 MB, e com o
 * gzip do servidor para menos de meio.
 *
 * ⚠️ **Escrever no próprio objeto é de propósito**, e é o mesmo princípio do
 * `catalog` que nunca troca de referência: quem já segurava aquele livro passa
 * a enxergar a sinopse. Mas o React **não** redesenha por causa disso — a tela
 * que chamar isto precisa guardar algo em estado para pedir um novo render.
 */
export async function carregarSinopses(ids: number[]): Promise<void> {
  const faltando = ids.filter((id) => {
    // `porId` e não `catalog`: a ficha aberta pode ser a de uma gravação que
    // não representa a obra na vitrine (§4.151), e a sinopse dela não chegaria.
    const livro = porId.get(id);
    return livro && livro.sinopse === undefined && livro.synopsis === undefined;
  });
  if (faltando.length === 0) return;

  try {
    const resposta = await fetch(`/api/catalogo/fichas?ids=${faltando.join(",")}`);
    if (!resposta.ok) throw new Error(`o servidor respondeu ${resposta.status}`);
    const fichas = (await resposta.json()) as {
      id: number;
      sinopse?: string;
      synopsis?: string;
    }[];

    for (const ficha of fichas) {
      const livro = porId.get(ficha.id);
      if (!livro) continue;
      livro.sinopse = ficha.sinopse;
      livro.synopsis = ficha.synopsis;
    }
  } catch (erro) {
    // Ficha sem sinopse não derruba tela: o texto simplesmente não aparece.
    console.error("[catálogo] não deu para trazer as sinopses:", erro);
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
 * A duração deste livro, na melhor fonte disponível.
 *
 * Ordem: a duração de verdade (medida no arquivo ou anunciada pela loja) e, só
 * na falta dela, a estimativa por páginas — que é herança da ficha da Open
 * Library e nunca valeu para livro que o AllBook mesmo grave.
 */
export function duracaoDoLivro(book: Book): string | undefined {
  if (book.duracaoSegundos) {
    const minutos = Math.round(book.duracaoSegundos / 60);
    return `${Math.floor(minutos / 60)}h ${String(minutos % 60).padStart(2, "0")}min`;
  }
  return duracaoEstimada(book.pages);
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
  // ⚠️ `porId` e não `catalog`: os ids aqui vêm da biblioteca, do progresso e
  // das recomendações da pessoa, e podem apontar para uma gravação que não é a
  // representante da obra (§4.151). Procurando na vitrine, o livro salvo
  // simplesmente não apareceria.
  return ids
    .map((id) => porId.get(id))
    .filter((book): book is Book => book !== undefined);
}

export function getBooksByGenre(genre: Genre): Book[] {
  return catalog.filter((book) => book.genre === genre);
}

/**
 * **Todos** os autores do livro, na ordem da fonte (01/09, §4.154).
 *
 * 🚨 **Use isto, e não `book.author`, em qualquer tela de crédito.** O
 * `author` é só o **primeiro** — ele existe para endereçar o perfil e agrupar a
 * obra. Mostrar só ele apaga o co-autor da tela, que foi como o *Horóscopo do
 * João Bidu* passou a ser "narrado por Alessandra Klimiont" e mais ninguém.
 *
 * Devolve sempre ao menos um nome, e nunca `authors` cru: a lista só chega do
 * servidor quando há mais de um.
 */
export function autoresDe(book: Book): string[] {
  return book.authors && book.authors.length > 0 ? book.authors : [book.author];
}

/** Todos os narradores do livro. Mesma regra de `autoresDe`. */
export function narradoresDe(book: Book): string[] {
  return book.narrators && book.narrators.length > 0 ? book.narrators : [book.narrator];
}

/**
 * O título como a **vitrine** deve mostrá-lo: sem o subtítulo.
 *
 * O acervo de verdade traz o título cru da loja, e loja grava título e
 * subtítulo no mesmo campo. Medido em 30/08: dos 13.917 livros, **3.033 passam
 * de 60 caracteres e 880 passam de 100** — o maior tem 364. Num cartão pequeno
 * isso morre num `truncate`; no billboard da Início, que deixava o título
 * crescer à vontade, um desses cobriu a capa inteira e engoliu o próprio livro.
 *
 * **Desde 30/08 há um caminho melhor antes da heurística:** se o livro tem
 * `subtitle`, a própria loja separou os dois e o `title` já é o nome curto —
 * é só devolvê-lo. A heurística abaixo vale para o resto.
 *
 * A regra é a das lojas: até 48 caracteres o título vai inteiro (título curto
 * com dois-pontos costuma ser parte do nome — "Duna: Messias"); passando disso,
 * fica só o que vem antes do primeiro separador, e apenas se antes dele sobrar
 * nome de verdade — senão "365: ..." viraria "365".
 *
 * ⚠️ **Isto NÃO substitui o corte por linhas na tela.** 1.147 dos títulos
 * longos não têm separador nenhum ("Como se tornar um tecnico de futebol de
 * sucesso dicas e estrategias para alcancar o sucesso na carreira"), e para
 * esses só o `line-clamp` segura. Quem mostra título grande precisa dos dois.
 */
export function tituloDeVitrine(book: Book): string {
  // A fonte já separou: não há o que adivinhar.
  if (book.subtitle) return book.title;
  const titulo = book.title;
  if (titulo.length <= 48) return titulo;
  for (const separador of [": ", " – ", " — ", " - "]) {
    const corte = titulo.indexOf(separador);
    if (corte >= 8) return titulo.slice(0, corte).trim();
  }
  return titulo;
}
