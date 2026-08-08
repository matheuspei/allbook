/**
 * Copia o catálogo do código para dentro do banco.
 *
 * Rode com `npm run db:catalogo`. É a **primeira etapa da migração** (§4 do
 * `docs/BANCO-DE-DADOS.md`): livros, gêneros, pessoas, editoras e coleções não
 * têm dado de usuário dentro, então errar aqui é barato — apaga e roda de novo.
 *
 * ⚠️ **Os ids dos livros são preservados** (armadilha 2.1). O `id` que está em
 * `books.ts` vira a chave primária, sem remapeamento: ele está gravado no
 * navegador de quem já usa o app (biblioteca, progresso, avaliações, pedidos) e
 * nos nomes dos arquivos de capa. Um id trocado não dá erro — só faz cada pessoa
 * abrir o livro errado.
 *
 * **É idempotente**: rodar duas vezes atualiza, não duplica.
 *
 * ---
 *
 * ## Por que este script precisa do esbuild
 *
 * `client/src/lib/books.ts` é um arquivo do **navegador**: ele importa PNGs
 * (`import coverScifi from "@/assets/images/cover-scifi.png"`) e usa
 * `import.meta.glob`, que é uma invenção do Vite. Nada disso existe no Node, e
 * `tsx script/ingestao-catalogo.ts` quebraria na primeira linha.
 *
 * A saída é empacotar o catálogo com o esbuild — que **já é dependência do
 * projeto**, usado pelo `npm run build` —, trocando as imagens por texto vazio e
 * o `import.meta.glob` por um objeto vazio. O que sobra são os dados puros, que
 * é tudo de que a ingestão precisa: os arquivos de capa e de foto são lidos
 * direto do disco logo abaixo, o que é mais confiável do que reproduzir o glob.
 */

import { sql } from "drizzle-orm";
import { build } from "esbuild";
import { readdir, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { db, pool } from "../server/db";
import {
  colecoes,
  colecoesLivros,
  editoras,
  generos,
  livros,
  pessoas,
} from "@shared/schema";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PASTA_CAPAS = resolve(raiz, "client/src/assets/images/covers");
const PASTA_FOTOS = resolve(raiz, "client/src/assets/images/people");
const PACOTE = resolve(raiz, "node_modules/.cache/allbook-catalogo.mjs");

/* -------------------------------------------------------------------------- */
/* 1. Ler o catálogo que hoje mora no código                                   */
/* -------------------------------------------------------------------------- */

/** Troca `import "…/foo.png"` por uma string vazia. */
const semImagens = {
  name: "sem-imagens",
  setup(construtor: any) {
    construtor.onResolve({ filter: /\.(png|jpe?g|webp|avif|svg)$/ }, (args: any) => ({
      path: args.path,
      namespace: "imagem-vazia",
    }));
    construtor.onLoad({ filter: /.*/, namespace: "imagem-vazia" }, () => ({
      contents: 'export default ""',
      loader: "js" as const,
    }));
  },
};

async function lerCatalogoDoCodigo() {
  await mkdir(dirname(PACOTE), { recursive: true });

  await build({
    stdin: {
      contents: `
        export { catalog, genres, genreSlug, slugify } from "@/lib/books";
        export { publishers } from "@/lib/publishers";
        export { people } from "@/lib/people";
        export { collections, homeRows } from "@/lib/collections";
        export { studioVoices, narratorKind } from "@/lib/studio";
      `,
      resolveDir: raiz,
      loader: "ts",
    },
    outfile: PACOTE,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    alias: { "@": resolve(raiz, "client/src") },
    // `import.meta.glob(...)` vira `__semGlob(...)`, que devolve um objeto vazio:
    // as capas e as fotos são lidas do disco mais abaixo, o que é mais confiável.
    // (O `define` do esbuild só aceita um nome ou um literal — daí a função vir
    // pelo `banner`, e não escrita aqui dentro.)
    define: { "import.meta.glob": "__semGlob" },
    banner: { js: "const __semGlob = () => ({});" },
    plugins: [semImagens],
    logLevel: "silent",
  });

  return import(pathToFileURL(PACOTE).href);
}

/** Os arquivos que existem de verdade numa pasta, indexados pelo nome sem extensão. */
async function arquivosPorNome(pasta: string): Promise<Record<string, string>> {
  try {
    const nomes = await readdir(pasta);
    return Object.fromEntries(
      nomes
        .filter((nome) => /\.(jpe?g|png|webp|avif)$/i.test(nome))
        .map((nome) => [nome.replace(/\.\w+$/, ""), nome]),
    );
  } catch {
    return {};
  }
}

/* -------------------------------------------------------------------------- */
/* 2. Gravar no banco                                                          */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("[ingestão] lendo o catálogo do código…");
  const cat = await lerCatalogoDoCodigo();

  const capas = await arquivosPorNome(PASTA_CAPAS);
  const fotos = await arquivosPorNome(PASTA_FOTOS);

  /* --- gêneros --- */
  const linhasDeGenero = cat.genres.map((genero: any, i: number) => ({
    slug: cat.genreSlug(genero.label),
    rotulo: genero.label,
    gradiente: genero.gradient,
    ordem: i,
  }));

  await db
    .insert(generos)
    .values(linhasDeGenero)
    .onConflictDoUpdate({
      target: generos.slug,
      set: {
        rotulo: sqlExcluded("rotulo"),
        gradiente: sqlExcluded("gradiente"),
        ordem: sqlExcluded("ordem"),
      },
    });
  console.log(`[ingestão] ${linhasDeGenero.length} gêneros`);

  /* --- pessoas (autores, narradores e as vozes do Studio) --- */
  const timbrePorSlug: Record<string, string> = Object.fromEntries(
    cat.studioVoices.map((voz: any) => [voz.slug, voz.timbre]),
  );

  const linhasDePessoa = cat.people.map((pessoa: any) => ({
    slug: pessoa.slug,
    nome: pessoa.name,
    foto: fotos[pessoa.slug] ?? null,
    // Só quem narra tem tipo de voz; quem só escreve fica sem, e isso é o que
    // distingue autor de narrador sem precisar de uma coluna de "papel".
    tipoDeVoz: pessoa.roles.includes("narrator")
      ? ((cat.narratorKind(pessoa.name) === "studio" ? "studio" : "humana") as "studio" | "humana")
      : null,
    timbre: timbrePorSlug[pessoa.slug] ?? null,
  }));

  await db
    .insert(pessoas)
    .values(linhasDePessoa)
    .onConflictDoUpdate({
      target: pessoas.slug,
      set: {
        nome: sqlExcluded("nome"),
        foto: sqlExcluded("foto"),
        tipoDeVoz: sqlExcluded("tipo_de_voz"),
        timbre: sqlExcluded("timbre"),
      },
    });
  console.log(`[ingestão] ${linhasDePessoa.length} pessoas`);

  /* --- editoras --- */
  const linhasDeEditora = cat.publishers.map((editora: any) => ({
    slug: editora.slug,
    nome: editora.name,
    linha: editora.linha,
  }));

  await db
    .insert(editoras)
    .values(linhasDeEditora)
    .onConflictDoUpdate({
      target: editoras.slug,
      set: { nome: sqlExcluded("nome"), linha: sqlExcluded("linha") },
    });
  console.log(`[ingestão] ${linhasDeEditora.length} editoras`);

  /* --- livros --- */
  // Livro → editora: a relação é declarada uma vez por editora, como lista de
  // ids, e o mapa sai daí (é assim em `publishers.ts`, para o nome da editora
  // não ser repetido 59 vezes e virar erro de digitação).
  const editoraPorLivro = new Map<number, string>();
  for (const editora of cat.publishers) {
    for (const livro of editora.books) editoraPorLivro.set(livro.id, editora.slug);
  }

  const linhasDeLivro = cat.catalog.map((livro: any) => ({
    id: livro.id, // ⚠️ preservado — ver o aviso do topo
    titulo: livro.title,
    autorSlug: cat.slugify(livro.author),
    narradorSlug: cat.slugify(livro.narrator),
    editoraSlug: editoraPorLivro.get(livro.id) ?? null,
    generoSlug: cat.genreSlug(livro.genre),
    nota: livro.rating,
    notaHistoria: livro.story ?? null,
    notaNarracao: livro.performance ?? null,
    tituloOriginal: livro.originalTitle ?? null,
    ano: livro.year ?? null,
    paginas: livro.pages ?? null,
    isbn: livro.isbn ?? null,
    sinopseImportada: livro.synopsis ?? null,
    sinopse: livro.sinopse ?? null,
    capa: capas[String(livro.id)] ?? null,
  }));

  await db
    .insert(livros)
    .values(linhasDeLivro)
    .onConflictDoUpdate({
      target: livros.id,
      set: {
        titulo: sqlExcluded("titulo"),
        autorSlug: sqlExcluded("autor_slug"),
        narradorSlug: sqlExcluded("narrador_slug"),
        editoraSlug: sqlExcluded("editora_slug"),
        generoSlug: sqlExcluded("genero_slug"),
        nota: sqlExcluded("nota"),
        notaHistoria: sqlExcluded("nota_historia"),
        notaNarracao: sqlExcluded("nota_narracao"),
        tituloOriginal: sqlExcluded("titulo_original"),
        ano: sqlExcluded("ano"),
        paginas: sqlExcluded("paginas"),
        isbn: sqlExcluded("isbn"),
        sinopseImportada: sqlExcluded("sinopse_importada"),
        sinopse: sqlExcluded("sinopse"),
        capa: sqlExcluded("capa"),
      },
    });
  console.log(`[ingestão] ${linhasDeLivro.length} livros`);

  /* --- coleções (os cards coloridos e as fileiras da Início) --- */
  const todasAsListas = [
    ...cat.collections.map((lista: any, i: number) => ({ lista, tipo: "card" as const, ordem: i })),
    ...cat.homeRows.map((lista: any, i: number) => ({ lista, tipo: "fileira" as const, ordem: i })),
  ];

  await db
    .insert(colecoes)
    .values(
      todasAsListas.map(({ lista, tipo, ordem }) => ({
        slug: lista.slug,
        rotulo: lista.label,
        gradiente: lista.gradient,
        descricao: lista.description,
        tipo,
        ordem,
      })),
    )
    .onConflictDoUpdate({
      target: colecoes.slug,
      set: {
        rotulo: sqlExcluded("rotulo"),
        gradiente: sqlExcluded("gradiente"),
        descricao: sqlExcluded("descricao"),
        tipo: sqlExcluded("tipo"),
        ordem: sqlExcluded("ordem"),
      },
    });

  // A lista é reescrita inteira: coleção é curadoria, e um livro tirado do array
  // tem de sair do banco também. Como não há dado de usuário aqui, apagar é seguro.
  await db.delete(colecoesLivros);

  const idsValidos = new Set<number>(cat.catalog.map((livro: any) => livro.id));
  const linhasDeVinculo = todasAsListas.flatMap(({ lista }) =>
    lista.bookIds
      // Id fantasma (livro retirado do catálogo) é ignorado sozinho, como na tela.
      .filter((id: number) => idsValidos.has(id))
      .map((id: number, ordem: number) => ({ colecaoSlug: lista.slug, livroId: id, ordem })),
  );

  await db.insert(colecoesLivros).values(linhasDeVinculo);
  console.log(
    `[ingestão] ${todasAsListas.length} coleções, ${linhasDeVinculo.length} livros dentro delas`,
  );

  await rm(PACOTE, { force: true });
  console.log("[ingestão] pronto.");
}

/**
 * `excluded.<coluna>` — o valor que a linha *teria* recebido, e que o
 * `ON CONFLICT DO UPDATE` usa para atualizar em vez de duplicar. Fica numa
 * função só para o `set` de cada tabela não virar dez linhas de `sql` cru.
 */
function sqlExcluded(coluna: string) {
  return sql.raw(`excluded."${coluna}"`);
}

main()
  .catch((erro) => {
    console.error("[ingestão] falhou:", erro);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
