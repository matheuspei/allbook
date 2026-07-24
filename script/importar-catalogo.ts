/**
 * Importa capas e fichas reais dos livros a partir da Open Library.
 *
 * Rode com `npm run catalogo`. Ele NÃO faz parte do app: roda uma vez na sua
 * máquina, grava os arquivos dentro do projeto, e aí o app usa o que ficou
 * gravado. Assim o AllBook nunca depende de internet nem da API para funcionar.
 *
 * O que ele gera:
 *   - `client/src/assets/images/covers/<id>.jpg` — a capa de verdade de cada livro
 *   - `client/src/lib/catalog-enriched.ts` — ano, páginas, ISBN, sinopse e título original
 *
 * Por que a busca usa o título em inglês: a Open Library é uma base
 * majoritariamente em inglês. Medindo com 6 títulos do catálogo, a busca em
 * português achou capa para 2; pelo título original, para 6. O título em
 * português continua sendo o que aparece na tela — o original é só a chave de
 * busca (e vira informação extra na ficha).
 */

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA_CAPAS = resolve(raiz, "client/src/assets/images/covers");
const ARQUIVO_SAIDA = resolve(raiz, "client/src/lib/catalog-enriched.ts");

/** A Open Library pede que quem usa a API se identifique. */
const USER_AGENT = "AllBook/0.1 (projeto pessoal de estudo)";

/** Uma requisição por segundo: é serviço gratuito e mantido por doação. */
const INTERVALO_MS = 1000;

interface Alvo {
  id: number;
  original: string;
  autor: string;
  /**
   * Escape para quando a busca traz a capa errada.
   *
   * A Open Library agrupa as edições de uma série sob a mesma obra, então às
   * vezes a arte que vem é de outro volume — "O Problema dos 3 Corpos" veio com
   * a capa de "The Dark Forest", que é a continuação. Comparar títulos não pega
   * esse erro, porque o título devolvido está certo; só a imagem é que não.
   * Preenchendo o ISBN de uma edição específica, a capa vem dela e ponto.
   */
  isbnDaCapa?: string;
}

/**
 * Título original de cada livro do catálogo, só para a busca.
 * Ao acrescentar um livro em `books.ts`, acrescente-o aqui também.
 */
const ALVOS: Alvo[] = [
  // Ficção Científica
  { id: 7, original: "Dune", autor: "Frank Herbert" },
  { id: 8, original: "Foundation", autor: "Isaac Asimov" },
  // A busca trazia a capa de "The Dark Forest" (a continuação); fixada pelo ISBN.
  { id: 109, original: "The Three-Body Problem", autor: "Cixin Liu", isbnDaCapa: "9780765382030" },
  { id: 129, original: "The Lord of the Rings", autor: "Tolkien" },
  { id: 130, original: "Nineteen Eighty-Four", autor: "George Orwell" },
  { id: 131, original: "Brave New World", autor: "Aldous Huxley" },
  { id: 132, original: "A Game of Thrones", autor: "George R. R. Martin" },
  { id: 301, original: "The Hobbit", autor: "Tolkien" },
  { id: 302, original: "The Silmarillion", autor: "Tolkien" },
  { id: 303, original: "I, Robot", autor: "Isaac Asimov" },
  { id: 304, original: "Animal Farm", autor: "George Orwell" },

  // Romance
  { id: 140, original: "Pride and Prejudice", autor: "Jane Austen" },
  { id: 141, original: "Me Before You", autor: "Jojo Moyes" },
  { id: 142, original: "It Ends with Us", autor: "Colleen Hoover" },
  { id: 143, original: "A Walk to Remember", autor: "Nicholas Sparks" },
  { id: 307, original: "Sense and Sensibility", autor: "Jane Austen" },
  { id: 308, original: "Emma", autor: "Jane Austen" },
  { id: 309, original: "All Your Perfects", autor: "Colleen Hoover" },
  { id: 310, original: "The Notebook", autor: "Nicholas Sparks" },

  // Terror
  { id: 104, original: "It", autor: "Stephen King" },
  { id: 105, original: "The Shining", autor: "Stephen King" },
  { id: 144, original: "Dracula", autor: "Bram Stoker" },
  { id: 145, original: "The Exorcist", autor: "William Peter Blatty" },
  { id: 305, original: "Carrie", autor: "Stephen King" },
  { id: 306, original: "Misery", autor: "Stephen King" },

  // Mistério
  { id: 1, original: "Home Before Dark", autor: "Riley Sager" },
  { id: 2, original: "The Housemaid", autor: "Freida McFadden" },
  { id: 3, original: "Gone Girl", autor: "Gillian Flynn" },
  { id: 106, original: "The Silent Patient", autor: "Alex Michaelides" },
  { id: 119, original: "The Da Vinci Code", autor: "Dan Brown" },
  { id: 120, original: "The Girl on the Train", autor: "Paula Hawkins" },
  // A obra existe na Open Library, mas sem cover_i (a busca não trazia imagem);
  // capa fixada por uma edição Pocket Star. Cuidado: o ISBN 9781400079179, que
  // parecia servir, é o do "Código Da Vinci" — outro livro do mesmo autor.
  { id: 311, original: "Angels and Demons", autor: "Dan Brown", isbnDaCapa: "9780743486224" },
  { id: 312, original: "Inferno", autor: "Dan Brown" },
  { id: 313, original: "Sharp Objects", autor: "Gillian Flynn" },
  { id: 314, original: "Into the Water", autor: "Paula Hawkins" },

  // Negócios
  { id: 101, original: "The Psychology of Money", autor: "Morgan Housel" },
  { id: 108, original: "Think Again", autor: "Adam Grant" },
  { id: 125, original: "Rich Dad Poor Dad", autor: "Robert T. Kiyosaki" },
  { id: 320, original: "Cashflow Quadrant", autor: "Robert T. Kiyosaki" },

  // Biografia
  { id: 103, original: "A Promised Land", autor: "Barack Obama" },
  { id: 111, original: "Becoming", autor: "Michelle Obama" },
  { id: 112, original: "Steve Jobs", autor: "Walter Isaacson" },
  { id: 113, original: "Shoe Dog", autor: "Phil Knight" },
  { id: 135, original: "I Am Malala", autor: "Malala Yousafzai" },
  { id: 136, original: "The Diary of a Young Girl", autor: "Anne Frank" },
  { id: 137, original: "Man's Search for Meaning", autor: "Viktor E. Frankl" },
  // Sem os dois-pontos: com o subtítulo junto, a busca não achava nada.
  { id: 315, original: "Einstein", autor: "Walter Isaacson" },
  { id: 316, original: "Leonardo da Vinci", autor: "Walter Isaacson" },
  { id: 317, original: "The Light We Carry", autor: "Michelle Obama" },

  // Autoajuda
  { id: 4, original: "The 5 AM Club", autor: "Robin Sharma" },
  { id: 201, original: "The Subtle Art of Not Giving a F*ck", autor: "Mark Manson" },
  { id: 203, original: "The Alchemist", autor: "Paulo Coelho" },
  { id: 318, original: "Everything Is F*cked", autor: "Mark Manson" },
  { id: 319, original: "Brida", autor: "Paulo Coelho" },

  // Produtividade
  // "Organize-se" (Ciara Conlon): a Open Library não tem essa obra. Busca por
  // "Chaos to Control" devolve zero resultados, e por autora só aparece
  // "Productivity for Dummies" — livro diferente, não serve de capa. Fica na
  // imagem genérica do gênero até surgir uma capa própria (não pôr a errada).
  { id: 5, original: "Chaos to Control", autor: "Ciara Conlon" },
  { id: 102, original: "Atomic Habits", autor: "James Clear" },
  { id: 107, original: "Essentialism", autor: "Greg McKeown" },
  { id: 124, original: "The 7 Habits of Highly Effective People", autor: "Stephen R. Covey" },
  { id: 321, original: "Effortless", autor: "Greg McKeown" },
];

export interface FichaImportada {
  originalTitle: string;
  year?: number;
  pages?: number;
  isbn?: string;
  synopsis?: string;
  /** `true` quando a capa foi baixada e está em `assets/images/covers/<id>.jpg`. */
  hasCover: boolean;
  /** O título que a Open Library devolveu, para conferir se casou com o certo. */
  matchedTitle?: string;
}

/**
 * A busca é por aproximação, então às vezes ela devolve outro livro — na
 * primeira rodada "The Three-Body Problem" trouxe a capa de "The Dark Forest",
 * que é a continuação. Comparar os títulos não impede o erro, mas faz ele
 * aparecer no relatório em vez de passar despercebido.
 */
function pareceOutroLivro(pedido: string, recebido?: string): boolean {
  if (!recebido) return false;

  const limpar = (t: string) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

  const a = limpar(pedido);
  const b = limpar(recebido);
  return !a.includes(b) && !b.includes(a);
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Tenta de novo antes de desistir: na primeira rodada 3 livros falharam com
 * "fetch failed", que é queda passageira e não livro inexistente. Espera cada
 * vez mais entre as tentativas, para não insistir em cima de um serviço que
 * pode estar sobrecarregado.
 */
async function pegarJson(url: string, tentativas = 3): Promise<any> {
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      const resposta = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      return await resposta.json();
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa < tentativas) await esperar(INTERVALO_MS * tentativa * 2);
    }
  }

  throw ultimoErro;
}

/** A sinopse vem no "work", que é a obra — não na edição específica. */
async function pegarSinopse(chaveDaObra: string): Promise<string | undefined> {
  try {
    const obra = await pegarJson(`https://openlibrary.org${chaveDaObra}.json`);
    const bruta = obra?.description;
    const texto = typeof bruta === "string" ? bruta : bruta?.value;
    if (!texto) return undefined;

    // As descrições costumam trazer um rodapé de fonte depois de "----".
    return texto.split(/\n\s*-{3,}/)[0].trim().slice(0, 900);
  } catch {
    return undefined;
  }
}

async function baixarCapa(origem: { coverId?: number; isbn?: string }, id: number): Promise<boolean> {
  const url = origem.isbn
    ? `https://covers.openlibrary.org/b/isbn/${origem.isbn}-L.jpg`
    : `https://covers.openlibrary.org/b/id/${origem.coverId}-L.jpg`;

  try {
    const resposta = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!resposta.ok) return false;

    const bytes = Buffer.from(await resposta.arrayBuffer());
    // A Open Library devolve um PNG de 1 pixel quando não tem a imagem.
    if (bytes.length < 3000) return false;

    await writeFile(resolve(PASTA_CAPAS, `${id}.jpg`), bytes);
    return true;
  } catch {
    return false;
  }
}

async function importar(alvo: Alvo): Promise<FichaImportada | null> {
  const parametros = new URLSearchParams({
    title: alvo.original,
    author: alvo.autor,
    // Cinco resultados, não um: na primeira rodada 6 livros foram encontrados
    // mas a edição no topo não tinha imagem. Preferimos a primeira COM capa.
    limit: "5",
    fields: "key,title,first_publish_year,cover_i,isbn,number_of_pages_median",
  });

  const resultado = await pegarJson(`https://openlibrary.org/search.json?${parametros}`);
  const docs: any[] = resultado?.docs ?? [];
  if (docs.length === 0) return null;

  const doc = docs.find((d) => d.cover_i) ?? docs[0];

  const temCapa = alvo.isbnDaCapa
    ? await baixarCapa({ isbn: alvo.isbnDaCapa }, alvo.id)
    : doc.cover_i
      ? await baixarCapa({ coverId: doc.cover_i }, alvo.id)
      : false;

  await esperar(INTERVALO_MS);
  const sinopse = doc.key ? await pegarSinopse(doc.key) : undefined;

  return {
    originalTitle: alvo.original,
    year: doc.first_publish_year,
    pages: doc.number_of_pages_median,
    isbn: Array.isArray(doc.isbn) ? doc.isbn[0] : undefined,
    synopsis: sinopse,
    hasCover: temCapa,
    matchedTitle: doc.title,
  };
}

async function principal() {
  await mkdir(PASTA_CAPAS, { recursive: true });

  const fichas: Record<number, FichaImportada> = {};
  let comCapa = 0;
  let semResultado = 0;

  for (const [indice, alvo] of ALVOS.entries()) {
    const posicao = `${indice + 1}/${ALVOS.length}`;
    try {
      const ficha = await importar(alvo);
      if (!ficha) {
        semResultado++;
        console.log(`${posicao} SEM RESULTADO  ${alvo.original}`);
      } else {
        fichas[alvo.id] = ficha;
        if (ficha.hasCover) comCapa++;
        const marca = ficha.hasCover ? "capa OK  " : "sem capa ";
        const sinopse = ficha.synopsis ? "+sinopse" : "";
        const suspeito = pareceOutroLivro(alvo.original, ficha.matchedTitle)
          ? `  <<< CONFERIR: veio "${ficha.matchedTitle}"`
          : "";
        console.log(
          `${posicao} ${marca} ${alvo.original} (${ficha.year ?? "?"}) ${sinopse}${suspeito}`
        );
      }
    } catch (erro) {
      semResultado++;
      console.log(`${posicao} ERRO           ${alvo.original}: ${(erro as Error).message}`);
    }
    await esperar(INTERVALO_MS);
  }

  const conteudo = `// ARQUIVO GERADO por \`npm run catalogo\` — não edite à mão.
// Fonte: Open Library (openlibrary.org). Gerado em ${new Date().toISOString().slice(0, 10)}.
//
// As capas ficam em \`assets/images/covers/<id>.jpg\` e são achadas pelo próprio
// \`books.ts\`; aqui vai só o texto.

export interface FichaImportada {
  originalTitle: string;
  year?: number;
  pages?: number;
  isbn?: string;
  synopsis?: string;
}

export const fichasImportadas: Record<number, FichaImportada> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(fichas).map(([id, f]) => [
        id,
        { originalTitle: f.originalTitle, year: f.year, pages: f.pages, isbn: f.isbn, synopsis: f.synopsis },
      ])
    ),
    null,
    2
  )};
`;

  await writeFile(ARQUIVO_SAIDA, conteudo, "utf8");

  console.log(`\n  ${ALVOS.length} livros processados`);
  console.log(`  ${comCapa} capas baixadas`);
  console.log(`  ${semResultado} sem resultado`);
  console.log(`\n  ficha escrita em ${ARQUIVO_SAIDA}`);
}

principal();
