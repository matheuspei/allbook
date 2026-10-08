import { Search, Headphones, ChevronRight, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import PersonAvatar from "@/components/PersonAvatar";
import PublisherMark from "@/components/PublisherMark";
import { autoresDe, catalog, narradoresDe, porNota, publisherNames, type Book } from "@/lib/books";
import { people, roleLabels, type Person } from "@/lib/people";
import { allPublishers, type Publisher } from "@/lib/publishers";
import { REQUEST_PROMISE } from "@/lib/requests";

/**
 * Resultados da busca no catálogo — componente único, usado pela tela de Busca
 * (`pages/Search.tsx`). Nasceu de dois `SearchResults` quase idênticos que viviam
 * dentro da Início e da Descobrir; agora é a fonte única (ver decisão da busca no
 * ROTEIRO). Recebe o texto já digitado e um jeito de limpar; quem monta o campo é
 * a tela que o usa.
 *
 * A busca é 100% no navegador, sobre o catálogo fixo, em duas etapas:
 * 1. **casamento direto** — título, autor, narrador ou editora contendo o
 *    texto, já sem acento (é o que faz "en" trazer "O Senhor dos Anéis" e
 *    "habitos" trazer "Hábitos Atômicos");
 * 2. só quando a primeira não acha nada, **casamento aproximado palavra a
 *    palavra**, que perdoa erro de digitação de verdade.
 *
 * **Por que a etapa 2 deixou de ser o Fuse.js (25/07, ver ROTEIRO 4.18).** O Fuse
 * comparava a consulta com o campo inteiro e aceitava parecença vaga: "carro"
 * devolvia "Carrie, a Estranha", "flor" devolvia "Sem Esforço". O erro em si já
 * era ruim; o efeito colateral era pior — a busca quase nunca admitia que não
 * achou, e assim **a oferta de produzir a narração praticamente não aparecia**,
 * justamente a porta do diferencial do app.
 *
 * **Apertar o limiar do Fuse não resolvia**, e isso foi medido no catálogo real: o
 * limiar que matava "carro → Carrie" matava junto "tolkein → Tolkien", porque
 * acerto e falso positivo caíam na mesma faixa de pontuação. Tolerar erro continua
 * valendo — o que não valia era tolerar semelhança solta.
 *
 * **Desde 08/10 (§4.172) ela acha GENTE e EDITORA, não só livro.** O Matheus
 * digitou "Marcelo Ribeiro" — narrador de 15 audiolivros da Editora Letras, com
 * perfil e tudo — e a busca não achou nada, porque só olhava o título e o
 * PRIMEIRO autor. O pedido dele: pesquisar *"tanto por narradores como perfis
 * de editora, como dubladores, como tudo"*. Agora:
 * - cada livro é achado por **todos** os autores e narradores (o elenco de uma
 *   dramatização entra como narrador — é o "dublador" do pedido) e pela editora;
 * - acima dos livros vêm **Pessoas** e **Editoras**, cada linha levando ao
 *   perfil. Não é a busca de *membros* que a §4.97 adiou: lá é o `@` das
 *   contas; aqui são as pessoas e as casas do **catálogo**, que já têm perfil
 *   público desde sempre.
 */

/** Quantos cart\u00f5es entram por vez \u2014 ver `visiveis`, mais abaixo. */
const LOTE = 60;

/**
 * Quantas pessoas e quantas editoras aparecem antes do "ver mais".
 *
 * Poucas de propósito: elas vêm ACIMA dos livros, e uma busca por "maria"
 * acha centenas de pessoas — sem corte, os livros sumiriam lá embaixo.
 */
const PRIMEIROS_NOMES = 3;
const MAIS_NOMES = 10;

/**
 * Sem acento, minúsculo e com os espaços colapsados. O colapso importa para
 * gente: o acervo tem *"Ap.  Miguel Ângelo"* (dois espaços) e *"Ap. Miguel
 * Ângelo"*, e quem digita um espaço só precisa achar os dois.
 */
function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * O texto de cada livro j\u00e1 normalizado, montado UMA vez (23/09, \u00a74.168).
 *
 * \ud83d\udea8 **Antes isto era refeito a cada letra digitada**: tr\u00eas `normalize()` por
 * livro vezes 12.628 livros \u2014 cerca de 38 mil normaliza\u00e7\u00f5es por tecla \u2014, e a
 * etapa 2 ainda partia os tr\u00eas campos em palavras de novo, livro por livro. No
 * Mac davam 10 ms e 130 ms; no celular de quem recebeu o link, o bastante para
 * a tela parar de responder enquanto se digita.
 *
 * \u26a0\ufe0f **A r\u00e9gua de "o \u00edndice est\u00e1 velho" \u00e9 o TAMANHO de `catalog`** \u2014 ele nasce
 * vazio e \u00e9 preenchido com `push`, sem nunca trocar de refer\u00eancia (CLAUDE.md).
 * Guardar a refer\u00eancia aqui daria um \u00edndice eternamente vazio.
 */
type Fichado = {
  book: Book;
  titulo: string;
  subtitulo: string;
  /** **Todos** os autores e narradores (08/10), não só o primeiro. */
  autores: string[];
  narradores: string[];
  /** O nome da editora, para "editora letras" achar os livros dela. */
  editora: string;
  /** Palavras de conteúdo de título, subtítulo e créditos, para o casamento aproximado. */
  palavras: string[];
};

let indice: Fichado[] = [];

function indiceDoCatalogo(): Fichado[] {
  if (indice.length !== catalog.length) {
    indice = catalog.map((book) => {
      const titulo = normalize(book.title);
      const subtitulo = normalize(book.subtitle ?? "");
      const autores = autoresDe(book).map(normalize);
      const narradores = narradoresDe(book).map(normalize);
      return {
        book,
        titulo,
        subtitulo,
        autores,
        narradores,
        editora: normalize((book.publisher && publisherNames.get(book.publisher)) || ""),
        // A editora fica fora do casamento aproximado: "editora" é palavra de
        // centenas de nomes, e um erro de digitação casaria com todas.
        palavras: [
          ...palavrasDe(titulo),
          ...palavrasDe(subtitulo),
          ...autores.flatMap(palavrasDe),
          ...narradores.flatMap(palavrasDe),
        ],
      };
    });
  }
  return indice;
}

/**
 * Um nome procurável — de pessoa ou de editora —, já normalizado.
 *
 * ⚠️ **Mesma régua de "índice velho" do catálogo** (o tamanho), pela mesma
 * razão: `allPublishers()` refaz a lista se o catálogo recarregar.
 */
type Nomeado<T> = { item: T; nome: string; palavras: string[] };

function fichar<T>(itens: T[], nomeDe: (item: T) => string): Nomeado<T>[] {
  return itens.map((item) => {
    const nome = normalize(nomeDe(item)).trim();
    return { item, nome, palavras: palavrasDe(nome) };
  });
}

let indiceDePessoas: Nomeado<Person>[] = [];
let indiceDeEditoras: Nomeado<Publisher>[] = [];

function pessoasFichadas(): Nomeado<Person>[] {
  if (indiceDePessoas.length !== people.length) indiceDePessoas = fichar(people, (p) => p.name);
  return indiceDePessoas;
}

function editorasFichadas(): Nomeado<Publisher>[] {
  const todas = allPublishers();
  if (indiceDeEditoras.length !== todas.length) indiceDeEditoras = fichar(todas, (e) => e.name);
  return indiceDeEditoras;
}

/**
 * Pessoas ou editoras cujo nome casa com a consulta, da mais certa para a
 * menos: nome idêntico; o texto como **palavra inteira** — no começo do nome e
 * depois no meio ("ribeiro" → "Marcelo Ribeiro", "maria" → "Editora
 * Ave-Maria"); o texto como **começo de palavra** ("mari" → "Mariana"); e, por
 * último, no meio de uma palavra. Dentro de cada faixa, quem tem mais livros
 * vem antes. Sem nada direto, cai no mesmo casamento aproximado dos livros —
 * "marcelo ribero" ainda acha o Marcelo.
 *
 * ⚠️ **Palavra inteira antes de quantidade de livros** — a primeira versão
 * ordenava só por "começa com", e "maria" punha *Mariana Princival* (32
 * livros) acima de *Maria Silvia Betti* (13): quem digitou "maria" procurava
 * uma Maria.
 */
function procurarNomes<T extends { titles: number }>(fichas: Nomeado<T>[], q: string): T[] {
  const diretos: { ficha: Nomeado<T>; faixa: number }[] = [];
  for (const ficha of fichas) {
    const onde = ficha.nome.indexOf(q);
    if (onde < 0) continue;
    const abre = onde === 0 || /[^a-z0-9]/.test(ficha.nome[onde - 1]);
    const fecha = onde + q.length === ficha.nome.length || /[^a-z0-9]/.test(ficha.nome[onde + q.length]);
    const faixa =
      ficha.nome === q ? 0 : abre && fecha ? (onde === 0 ? 1 : 2) : abre ? (onde === 0 ? 3 : 4) : 5;
    diretos.push({ ficha, faixa });
  }
  if (diretos.length > 0) {
    return diretos
      .sort((a, b) => a.faixa - b.faixa || b.ficha.item.titles - a.ficha.item.titles)
      .map((d) => d.ficha.item);
  }

  /* No aproximado, quem está MAIS PERTO vem antes, e só depois quem tem mais
     livros: "marcelo ribero" punha o Marco Ribeiro (74 livros, dois erros) acima
     do Marcelo Ribeiro (10 livros, um erro). */
  const termos = palavrasDe(q);
  if (termos.length === 0) return [];
  const erros = (ficha: Nomeado<T>) =>
    termos.reduce((soma, termo) => soma + Math.min(...ficha.palavras.map((p) => distancia(termo, p))), 0);
  return fichas
    .filter((ficha) => pareceCom(termos, ficha))
    .map((ficha) => ({ ficha, erros: erros(ficha) }))
    .sort((a, b) => a.erros - b.erros || b.ficha.item.titles - a.ficha.item.titles)
    .map(({ ficha }) => ficha.item);
}

/**
 * Distância de edição de Damerau-Levenshtein: quantos toques separam duas
 * palavras. Conta troca de letras vizinhas ("tolkein" → "tolkien") como **um**
 * erro — é o deslize de digitação mais comum, e o Levenshtein puro o cobraria em
 * dobro.
 */
function distancia(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/**
 * Quantos erros se perdoa numa palavra, pelo tamanho dela.
 *
 * Palavra curta não ganha desconto: com três letras, um erro já vira outra
 * palavra ("gato"/"gata"). Esta escala saiu de medição no catálogo real — é ela
 * que separa "tolkein → Tolkien" (aceito) de "carro → Carrie" (recusado).
 */
function tolerancia(tamanho: number): number {
  if (tamanho <= 3) return 0;
  if (tamanho <= 6) return 1;
  return 2;
}

/**
 * As palavras de conteúdo de um texto — "o", "de", "da" ficam de fora.
 *
 * ⚠️ **Recebe o texto JÁ normalizado** (ver `indiceDoCatalogo`); quem tiver
 * texto cru normaliza antes de chamar.
 */
function palavrasDe(normalizado: string): string[] {
  return normalizado.split(/[^a-z0-9]+/).filter((palavra) => palavra.length >= 3);
}

/**
 * Casamento aproximado: **toda** palavra da consulta precisa achar uma parecida
 * no título ou no autor. Exigir todas, e não alguma, é o que impede "o nome do
 * vento" de casar com qualquer livro que tenha uma palavra parecida com "nome".
 *
 * O subtítulo entra na busca desde 30/08 (§4.138): ele saiu de dentro do
 * `title` e virou campo próprio, e sem ele quem procurasse por uma palavra dali
 * deixaria de achar o livro que achava ontem. As três listas já vêm prontas no
 * índice.
 */
function pareceCom(termos: string[], ficha: { palavras: string[] }): boolean {
  return termos.every((termo) =>
    ficha.palavras.some((palavra) => distancia(termo, palavra) <= tolerancia(termo.length))
  );
}

export function ResultCard({ book, onEscolher }: { book: Book; onEscolher?: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="group cursor-pointer"
      /*
       * ⚠️ **`onEscolher` antes de navegar, e ele não é opcional na prática**
       * (05/08). Navegar sozinho parecia bastar — e basta na página `/search`,
       * onde a tela inteira é trocada. Mas a **lupa do topo** abre a busca como
       * uma folha `fixed inset-0`: a rota mudava por baixo e a folha continuava
       * montada por cima, então a ficha do livro abria **atrás** e a pessoa
       * ficava olhando a mesma lista. O Matheus descreveu exatamente assim:
       * *"clico no livro, ele não abre, simplesmente trava"*. Pior no caso de
       * clicar no livro em que já se está: aí nem a rota muda, e o app parece
       * morto.
       */
      onClick={() => {
        onEscolher?.();
        setLocation(`/book/${book.id}`);
      }}
      data-testid={`card-search-${book.id}`}
    >
      <div className="relative rounded-lg overflow-hidden aspect-[3/4] mb-2 transition-transform duration-200 group-hover:scale-105">
        {/* ⚠️ `loading="lazy"`: a capa só é baixada quando chega perto da tela.
            Sem isto, uma busca larga pedia uma imagem por resultado de uma vez
            só — e pelo túnel, na casa de quem abriu o link, isso é o que
            engasgava o celular (§4.168). */}
        <img
          src={book.cover}
          alt={book.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-xs font-medium text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      {/* `autoresDe` e não `book.author`: o "Autor desconhecido" de reserva não
          é gente, e a decisão dele é que a linha suma (§4.159). */}
      {autoresDe(book)[0] && (
        <p className="text-[10px] text-white/50 mt-0.5 line-clamp-1">{autoresDe(book)[0]}</p>
      )}
    </div>
  );
}

/** "Autor", "Narrador" ou "Autor e narrador" — o que a pessoa faz no catálogo. */
function papelDe(pessoa: Person): string {
  const [primeiro, ...resto] = roleLabels(pessoa);
  return [primeiro, ...resto.map((rotulo) => rotulo.toLowerCase())].join(" e ");
}

function contarLivros(quantos: number): string {
  return `${quantos.toLocaleString("pt-BR")} ${quantos === 1 ? "livro" : "livros"}`;
}

/**
 * Uma pessoa ou editora achada — linha simples, sem cartão: avatar (ou selo),
 * nome e o que ela é, levando ao perfil.
 *
 * Linha e não cartão, de propósito: são poucas, vêm antes da grade de capas e
 * precisam se ler como um índice, não competir com os livros.
 */
function LinhaDeNome({
  href,
  onEscolher,
  marca,
  nome,
  detalhe,
  testid,
}: {
  href: string;
  /** Fecha a busca sobreposta antes de navegar — ver o comentário de `ResultCard`. */
  onEscolher?: () => void;
  marca: React.ReactNode;
  nome: string;
  /** Pedaços da segunda linha; os vazios saem, o resto se junta com "·". */
  detalhe: (string | undefined)[];
  testid: string;
}) {
  return (
    <Link
      href={href}
      onClick={onEscolher}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5 active:bg-white/10"
      data-testid={testid}
    >
      {marca}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{nome}</span>
        <span className="block truncate text-xs text-white/50">{detalhe.filter(Boolean).join(" · ")}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
    </Link>
  );
}

function VerMais({ rotulo, onClick, testid }: { rotulo: string; onClick: () => void; testid: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 py-1 text-xs font-medium text-white/60 transition-colors hover:text-white"
      data-testid={testid}
    >
      {rotulo}
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

export default function SearchResults({
  query,
  onClear,
  onEscolher,
}: {
  query: string;
  onClear: () => void;
  /**
   * A pessoa escolheu um resultado e a tela vai mudar.
   *
   * Quem abre a busca **por cima** de outra tela (a lupa do topo) passa aqui o
   * seu "fechar": sem isso a folha fica montada sobre a página nova e o app
   * parece travado — ver o comentário em `ResultCard`. Na página `/search` não é
   * preciso, porque ali a busca *é* a tela.
   */
  onEscolher?: () => void;
}) {
  /**
   * ⚠️ **A busca corre sobre o valor ADIADO, não sobre o que está sendo
   * digitado** (23/09). `useDeferredValue` deixa o React pintar a letra nova
   * primeiro e refazer a lista depois — sem isso, cada tecla segurava a tela
   * até a varredura dos 12.628 livros terminar.
   */
  const buscado = useDeferredValue(query);
  const procurando = buscado !== query;

  /** A consulta como o índice a guarda: sem acento, minúscula, espaços colapsados. */
  const q = useMemo(() => normalize(buscado).trim(), [buscado]);

  const results = useMemo(() => {
    if (!q) return [];

    const fichas = indiceDoCatalogo();

    /*
     * Etapa 1, agora COM ORDEM (23/09). Antes era um `filter` só e a ordem era
     * a do catálogo: buscar "dom" mostrava primeiro um livro que por acaso
     * tinha "dom" no meio do nome do autor. Agora título que **começa** com o
     * que se digitou vem na frente, depois título que contém, depois subtítulo
     * e por fim autor — e dentro de cada faixa decide a nota.
     *
     * Desde 08/10 (§4.172) há mais duas faixas depois do autor: **narrador** e
     * **editora**. Quem digita o nome de um narrador quer os livros que ele
     * narra; quem digita "editora letras", o catálogo da casa.
     */
    const diretos: { ficha: Fichado; faixa: number }[] = [];
    for (const ficha of fichas) {
      const faixa = ficha.titulo.startsWith(q)
        ? 0
        : ficha.titulo.includes(q)
          ? 1
          : ficha.subtitulo.includes(q)
            ? 2
            : ficha.autores.some((nome) => nome.includes(q))
              ? 3
              : ficha.narradores.some((nome) => nome.includes(q))
                ? 4
                : ficha.editora.includes(q)
                  ? 5
                  : -1;
      if (faixa >= 0) diretos.push({ ficha, faixa });
    }

    if (diretos.length > 0) {
      return diretos
        .sort((a, b) => a.faixa - b.faixa || porNota(a.ficha.book, b.ficha.book))
        .map((d) => d.ficha.book);
    }

    const termos = palavrasDe(q);
    if (termos.length === 0) return [];
    return fichas.filter((ficha) => pareceCom(termos, ficha)).map((ficha) => ficha.book);
  }, [q]);

  /*
   * Pessoas e editoras só a partir de duas letras: com uma, "a" casaria com
   * quase todo nome do acervo, e a lista empurraria os livros para baixo sem
   * ajudar ninguém a achar nada.
   */
  const pessoas = useMemo(() => (q.length >= 2 ? procurarNomes(pessoasFichadas(), q) : []), [q]);
  const editoras = useMemo(() => (q.length >= 2 ? procurarNomes(editorasFichadas(), q) : []), [q]);

  /**
   * 🚨 **Quantos resultados são DESENHADOS — a causa do travamento** (23/09,
   * §4.168). Quem recebeu o link digitou uma letra, a busca devolveu **12.504
   * livros** e a tela montou 12.504 cartões, cada um pedindo a sua capa pelo
   * túnel. O celular parava, e parecia que a busca não tinha achado nada.
   *
   * A conta continua honesta no alto ("12.504 encontrados"); o que muda é que
   * a lista cresce de 60 em 60, a pedido de quem procura.
   */
  const [visiveis, setVisiveis] = useState(LOTE);
  const [pessoasVisiveis, setPessoasVisiveis] = useState(PRIMEIROS_NOMES);
  const [editorasVisiveis, setEditorasVisiveis] = useState(PRIMEIROS_NOMES);
  useEffect(() => {
    setVisiveis(LOTE);
    setPessoasVisiveis(PRIMEIROS_NOMES);
    setEditorasVisiveis(PRIMEIROS_NOMES);
  }, [buscado]);
  const mostrados = results.slice(0, visiveis);
  const pessoasMostradas = pessoas.slice(0, pessoasVisiveis);

  /* Dois homônimos na mesma lista (os dois "Marcelo Ribeiro", §4.172) só se
     distinguem pelo que fazem: para eles a linha ganha o gênero principal. */
  const nomesRepetidos = new Set(
    pessoasMostradas
      .map((p) => normalize(p.name))
      .filter((nome, i, todos) => todos.indexOf(nome) !== i),
  );
  const nadaAchado = results.length === 0 && pessoas.length === 0 && editoras.length === 0;

  return (
    <section className="px-4 py-4 space-y-6" data-testid="search-results">
      {pessoas.length > 0 && (
        <div className="space-y-1" data-testid="search-people">
          <h2 className="font-display font-bold text-lg text-white tracking-tight">Pessoas</h2>
          <ul>
            {pessoasMostradas.map((pessoa) => (
              <li key={pessoa.slug}>
                <LinhaDeNome
                  href={`/person/${pessoa.slug}`}
                  onEscolher={onEscolher}
                  marca={<PersonAvatar name={pessoa.name} photo={pessoa.photo} size="sm" />}
                  nome={pessoa.name}
                  detalhe={[
                    papelDe(pessoa),
                    contarLivros(pessoa.titles),
                    nomesRepetidos.has(normalize(pessoa.name)) ? pessoa.genres[0] : undefined,
                  ]}
                  testid={`result-person-${pessoa.slug}`}
                />
              </li>
            ))}
          </ul>
          {pessoas.length > pessoasVisiveis && (
            <VerMais
              rotulo={`Ver mais pessoas (${pessoas.length - pessoasVisiveis})`}
              onClick={() => setPessoasVisiveis((n) => n + MAIS_NOMES)}
              testid="button-more-people"
            />
          )}
        </div>
      )}

      {editoras.length > 0 && (
        <div className="space-y-1" data-testid="search-publishers">
          <h2 className="font-display font-bold text-lg text-white tracking-tight">Editoras</h2>
          <ul>
            {editoras.slice(0, editorasVisiveis).map((editora) => (
              <li key={editora.slug}>
                <LinhaDeNome
                  href={`/publisher/${editora.slug}`}
                  onEscolher={onEscolher}
                  marca={<PublisherMark name={editora.name} size="sm" />}
                  nome={editora.name}
                  detalhe={[contarLivros(editora.titles)]}
                  testid={`result-publisher-${editora.slug}`}
                />
              </li>
            ))}
          </ul>
          {editoras.length > editorasVisiveis && (
            <VerMais
              rotulo={`Ver mais editoras (${editoras.length - editorasVisiveis})`}
              onClick={() => setEditorasVisiveis((n) => n + MAIS_NOMES)}
              testid="button-more-publishers"
            />
          )}
        </div>
      )}

      {/* "Livros" some só quando a busca achou gente ou editora e nenhum livro —
          aí não há o que contar. Sem nada achado, ele fica, com o "nenhum
          resultado" embaixo, como sempre foi. */}
      {(results.length > 0 || nadaAchado) && (
        <div className="space-y-4" data-testid="search-books">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white tracking-tight">Livros</h2>
            <span className="text-xs text-white/50">
              {procurando
                ? "buscando…"
                : `${results.length} ${results.length === 1 ? "encontrado" : "encontrados"}`}
            </span>
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {mostrados.map((book) => (
                <ResultCard key={book.id} book={book} onEscolher={onEscolher} />
              ))}
            </div>
          )}

          {results.length > mostrados.length && (
            <button
              type="button"
              onClick={() => setVisiveis((n) => n + LOTE)}
              className="w-full h-11 rounded-lg bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/20"
              data-testid="button-more-results"
            >
              Mostrar mais {Math.min(LOTE, results.length - mostrados.length)} de{" "}
              {results.length - mostrados.length}
            </button>
          )}
        </div>
      )}

      {nadaAchado && (
        /*
          Busca sem resultado é o momento de maior intenção do app inteiro: a
          pessoa disse exatamente o que queria ouvir e o catálogo não tinha.
          Antes isto era um beco — "nenhum resultado" e um botão de limpar. Agora
          é a porta do diferencial: pedir a narração daquele título, que já vai
          preenchido para a tela de pedido. Ver ROTEIRO 4.17.
        */
        <div className="text-center py-14 space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/5">
            <Search className="w-6 h-6 text-white/30" />
          </div>

          <p className="text-white/50">Nenhum resultado para "{query}"</p>

          <div className="space-y-3 pt-1">
            {/* Afirma o que se sabe (não está no catálogo) e oferece com
                firmeza. A versão anterior começava com "talvez", que põe dúvida
                justo onde o app deveria soar seguro do que entrega. */}
            <p className="mx-auto max-w-[17rem] text-sm leading-relaxed text-white/60">
              Este título ainda não está no catálogo. O estúdio grava o livro inteiro e entrega{" "}
              {REQUEST_PROMISE}.
            </p>

            <Link
              href={`/request?titulo=${encodeURIComponent(query.trim())}`}
              onClick={onEscolher}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 h-11 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              data-testid="button-request-narration"
            >
              <Headphones className="w-4 h-4" />
              Pedir a narração
            </Link>
          </div>

          <button onClick={onClear} className="text-white/40 text-sm hover:text-white/70 transition-colors" data-testid="button-clear-search">
            Limpar busca
          </button>
        </div>
      )}
    </section>
  );
}
