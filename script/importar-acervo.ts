/**
 * O acervo do `baixalivro` entra no catálogo do AllBook (21/08, §4.134).
 *
 *     npm run acervo             — o que existe lá e o que já entrou aqui
 *     npm run acervo importar    — importa tudo
 *     npm run acervo importar 50 — importa só os 50 primeiros (para conferir)
 *
 * ⚠️ **`npm run` engole `--flags`** (armadilha da §4.127) — por isso os
 * argumentos são posicionais, sem traço nenhum.
 *
 * ## De onde vem o dado
 *
 * O `baixalivro` guarda tudo num SQLite em `<acervo>/_catalogo/catalogo.sqlite`,
 * com duas tabelas que interessam aqui:
 *
 * - **`titulos`** — a varredura das lojas (59 mil linhas): título, autores,
 *   narradores, editora, minutos, série, categoria, idioma;
 * - **`copias`** — o que foi **baixado de fato** (14 mil linhas), com a pasta do
 *   mestre e a do "pronto" (já fatiado em capítulos).
 *
 * **Só entra o que está em `copias`.** Título varrido e não baixado é vitrine de
 * loja, não acervo — mostrá-lo no AllBook seria oferecer o que não se pode
 * entregar.
 *
 * ## O que este script NÃO faz
 *
 * **Não move um byte de áudio.** Ele traz a ficha e a capa; o áudio entra pelo
 * `npm run audio <id> <pasta>`, que copia o mestre, cola a vinheta, fatia em HLS
 * e mede os capítulos. São dois passos de propósito: a ficha é barata e
 * reversível, o áudio é caro e demorado.
 */

import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";

import { isNotNull, sql } from "drizzle-orm";

import { db } from "../server/db";
import { CAPAS_RAIZ } from "../server/catalogo";
import { editoras, generos, livros, pessoas } from "@shared/schema";

/* -------------------------------------------------------------------------- */
/* Onde as coisas ficam                                                        */
/* -------------------------------------------------------------------------- */

const ACERVO_RAIZ = process.env.ACERVO_RAIZ ?? `${process.env.HOME}/Acervo`;
const CATALOGO_SQLITE = join(ACERVO_RAIZ, "_catalogo", "catalogo.sqlite");

/**
 * O primeiro id de livro vindo de loja.
 *
 * 🚨 **Não é capricho de numeração: é uma trava contra dado semeado antigo.**
 * O app ainda tem, espalhados pelo código, comentários, notificações e chamadas
 * de billboard amarrados a **ids de livros de maquete** (1, 7, 101, 102…) —
 * ver `lib/comments.ts` e `pages/Notifications.tsx`. Enquanto não houver livro
 * nenhum, esse material aponta para o vazio e some sozinho. Se um livro real
 * recebesse o id 7, ele herdaria em silêncio os comentários do Duna e apareceria
 * na chamada de capa escrita para outro título. Começando em 100.000, a faixa
 * antiga nunca mais é ocupada e o problema deixa de existir.
 */
const PRIMEIRO_ID = 100_000;

/** Gênero de quem chega sem categoria — e é a maioria; ver o aviso no fim. */
const SEM_GENERO = { slug: "sem-genero", rotulo: "Sem gênero" };

/**
 * 🚨 **A trava da vinheta (21/08, recado da janela das vinhetas).**
 *
 * O `baixalivro` está colando a vinheta do AllBook nos arquivos do acervo — uma
 * abertura no começo do primeiro capítulo e um fecho no fim do último. Isso
 * **muda a duração do livro no disco**, e um livro ingerido antes de passar por
 * lá ficaria com `vinhetaSegundos = 0` e todos os marcadores deslocados, sem
 * erro nenhum — teria de ser reingerido.
 *
 * O sinal de que já passou é o campo `vinheta` no `_ficha.json`, escrito
 * **depois** de as duas pontas terem sido trocadas com sucesso. Se ele está lá,
 * o arquivo está pronto e a duração não muda mais.
 *
 * ⚠️ **A Audible é exceção, e não é descuido:** o Matheus a deixou de fora da
 * vinheta, então nenhum livro dela **nunca** terá esse campo (conferido: 0 em
 * 300 fichas). Como a duração dela não vai mudar, exigir a marca ali barraria
 * 1.289 livros para sempre, por uma razão que não se aplica a eles.
 */
const LOJAS_COM_VINHETA = ["storytel", "tocalivros", "ubook"];

/* -------------------------------------------------------------------------- */
/* Ler o SQLite sem instalar dependência                                       */
/* -------------------------------------------------------------------------- */

/**
 * Consulta o `catalogo.sqlite` pelo binário `sqlite3` da máquina.
 *
 * É de propósito: o AllBook tem 27 dependências e nenhuma delas fala SQLite.
 * Acrescentar um driver nativo (com etapa de compilação) para um script que roda
 * na mão, algumas vezes, seria caro para o projeto inteiro. O `sqlite3` já está
 * no macOS e entende `-json`.
 */
function consultar<T>(sql: string): T[] {
  const saida = execFileSync("sqlite3", ["-json", CATALOGO_SQLITE, sql], {
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  }).trim();
  return saida ? (JSON.parse(saida) as T[]) : [];
}

interface LinhaDoAcervo {
  loja: string;
  loja_id: string;
  titulo: string | null;
  subtitulo: string | null;
  autores: string | null;
  narradores: string | null;
  editora: string | null;
  minutos: number | null;
  lancamento: string | null;
  serie: string | null;
  serie_n: string | null;
  categoria: string | null;
  idioma: string | null;
  pasta: string | null;
  cru: string | null;
}

const CONSULTA = `
select t.loja, t.loja_id, t.titulo, t.subtitulo, t.autores, t.narradores,
       t.editora, t.minutos, t.lancamento, t.serie, t.serie_n, t.categoria,
       t.idioma, c.pasta, t.cru
from copias c
join titulos t on t.loja = c.loja and t.loja_id = c.loja_id
order by t.loja, t.loja_id
`;

/* -------------------------------------------------------------------------- */
/* Limpeza dos campos                                                          */
/* -------------------------------------------------------------------------- */

function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * O primeiro nome de uma lista separada por `" & "`.
 *
 * ⚠️ **O AllBook guarda UM autor e UM narrador por livro**, e o acervo entrega
 * listas. Ficar com o primeiro é perda de informação conhecida — está anotado no
 * ROTEIRO como dívida. O lugar certo para os demais é a tabela `narracoes`, que
 * a janela B vai ligar; até lá, inventar um esquema paralelo aqui seria criar a
 * segunda fonte de verdade que este trabalho todo está desfazendo.
 */
function primeiroNome(lista: string | null): string | null {
  if (!lista) return null;
  const nome = lista.split(/\s*&\s*/)[0]?.trim();
  return nome && nome.length > 1 ? nome : null;
}

/**
 * Nomes que a loja usa quando **não sabe** quem narra.
 *
 * Vistos no acervo: "various narrators", "narratore sconosciuto" (a Audible
 * brasileira repete o texto em italiano do fornecedor), "Não informado". Virar
 * uma pessoa com perfil e página seria dar rosto a um campo vazio.
 */
const NARRADOR_DESCONHECIDO = [
  "various narrators",
  "narratore sconosciuto",
  "não informado",
  "nao informado",
  "desconhecido",
  "ia",
];

function nomeUtil(nome: string | null): string | null {
  if (!nome) return null;
  return NARRADOR_DESCONHECIDO.includes(nome.toLowerCase()) ? null : nome;
}

/** "Audiolivros Infantis > Ação e Aventura" → "Audiolivros Infantis". */
function generoDaCategoria(categoria: string | null): { slug: string; rotulo: string } {
  const topo = (categoria ?? "").split(">")[0]?.trim();
  if (!topo) return SEM_GENERO;
  return { slug: slugify(topo), rotulo: topo };
}

/** "2007-12-19" → 2007. Ano fora de faixa plausível é descartado. */
function anoDe(lancamento: string | null): number | null {
  const ano = Number((lancamento ?? "").slice(0, 4));
  return ano >= 1000 && ano <= 2100 ? ano : null;
}

/** A sinopse, quando a loja manda uma (a Storytel e a Abook mandam). */
function sinopseDoCru(cru: string | null): string | null {
  if (!cru) return null;
  try {
    const dados = JSON.parse(cru) as Record<string, unknown>;
    const texto = dados.sinopse ?? dados.SINOPSE;
    return typeof texto === "string" && texto.trim() ? texto.trim() : null;
  } catch {
    return null;
  }
}

/**
 * A pasta do "pronto" deste livro, se ela existir **agora**.
 *
 * ⚠️ O caminho gravado em `copias.pasta` aponta para `~/AcervoPronto`, que é o
 * espelho no SSD — e o espelho é parcial: em 21/08 ele tinha 3 pastas contra as
 * 13.932 do disco externo. Por isso, quando o caminho gravado não existe, o
 * script procura no acervo (`<acervo>/<loja>/pronto/<mesma pasta>`) antes de
 * desistir. Sem isso, quase toda capa seria dada como ausente.
 */
function pastaDoPronto(linha: LinhaDoAcervo): string | null {
  if (linha.pasta && existsSync(linha.pasta)) return linha.pasta;
  if (!linha.pasta) return null;
  const alternativa = join(ACERVO_RAIZ, linha.loja, "pronto", basename(linha.pasta));
  return existsSync(alternativa) ? alternativa : null;
}

/* -------------------------------------------------------------------------- */
/* A importação                                                                */
/* -------------------------------------------------------------------------- */

async function situacao() {
  if (!existsSync(CATALOGO_SQLITE)) {
    console.log(`\n  Não achei o acervo em ${CATALOGO_SQLITE}`);
    console.log("  O disco está montado? O caminho muda com ACERVO_RAIZ no .env.\n");
    return;
  }

  const [{ n: noAcervo }] = consultar<{ n: number }>("select count(*) as n from copias");
  const [aqui] = await db
    .select({
      total: sql<number>`count(*)::int`,
      deLoja: sql<number>`count(origem_loja)::int`,
    })
    .from(livros);
  const porLoja = consultar<{ loja: string; n: number }>(
    "select loja, count(*) as n from copias group by loja order by n desc",
  );

  console.log(`\n  Acervo   ${CATALOGO_SQLITE}`);
  for (const { loja, n } of porLoja) console.log(`    ${loja.padEnd(12)} ${n}`);
  console.log(`    ${"total".padEnd(12)} ${noAcervo}`);
  console.log(`\n  AllBook  ${aqui.total} livros, ${aqui.deLoja} vindos de loja`);

  const linhas = consultar<LinhaDoAcervo>(CONSULTA).filter((l) => l.titulo?.trim());
  let prontos = 0;
  for (const linha of linhas) {
    if (await passouPelaVinheta(linha.loja, pastaDoPronto(linha))) prontos++;
  }
  console.log(`\n  Vinheta  ${prontos} prontos para entrar · ${linhas.length - prontos} ainda não`);
  console.log(`\n  Para importar:  npm run acervo importar\n`);
}

/**
 * O livro já passou pela vinheta (ou é de loja que não passa por ela)?
 *
 * Sem a pasta do "pronto" à mão não dá para saber, e nesse caso ele não entra:
 * "não sei" tem de valer como "ainda não", senão a trava não serve para nada.
 */
async function passouPelaVinheta(loja: string, pasta: string | null): Promise<boolean> {
  if (!LOJAS_COM_VINHETA.includes(loja)) return true;
  if (!pasta) return false;
  const ficha = join(pasta, "_ficha.json");
  if (!existsSync(ficha)) return false;
  try {
    const dados = JSON.parse(await readFile(ficha, "utf8"));
    return Boolean(dados?.vinheta);
  } catch {
    return false;
  }
}

async function importar(limite: number | null) {
  if (!existsSync(CATALOGO_SQLITE)) {
    console.error(`\n  Não achei o acervo em ${CATALOGO_SQLITE}\n`);
    process.exitCode = 1;
    return;
  }

  const linhas = consultar<LinhaDoAcervo>(CONSULTA).filter((l) => l.titulo?.trim());

  // A trava da vinheta: só passa quem já tem a marca (ou é Audible, que não a
  // recebe). Feita ANTES de qualquer escrita, para nada entrar pela metade.
  console.log(`\n  ${linhas.length} no acervo — conferindo a vinheta…`);
  const prontos: LinhaDoAcervo[] = [];
  let barrados = 0;
  for (const linha of linhas) {
    if (await passouPelaVinheta(linha.loja, pastaDoPronto(linha))) prontos.push(linha);
    else barrados++;
  }

  const aTrabalhar = limite ? prontos.slice(0, limite) : prontos;
  console.log(`  ${prontos.length} prontos · ${barrados} ainda sem vinheta`);
  console.log(`  importando ${aTrabalhar.length}\n`);
  if (aTrabalhar.length === 0) {
    console.log("  Nada a fazer. A colagem da vinheta ainda está correndo.\n");
    return;
  }

  /* --- 1. o que já está aqui, para não duplicar nem trocar id de ninguém --- */

  const jaImportados = new Map<string, number>();
  for (const linha of await db
    .select({ id: livros.id, loja: livros.origemLoja, origemId: livros.origemId })
    .from(livros)
    .where(isNotNull(livros.origemLoja))) {
    jaImportados.set(`${linha.loja}/${linha.origemId}`, linha.id);
  }

  const [{ maior }] = await db
    .select({ maior: sql<number>`coalesce(max(id), 0)::int` })
    .from(livros);
  let proximoId = Math.max(maior + 1, PRIMEIRO_ID);

  /* --- 2. gêneros, pessoas e editoras vêm antes: os livros os referenciam --- */

  const generosNovos = new Map<string, string>();
  const pessoasNovas = new Map<string, string>();
  const editorasNovas = new Map<string, string>();

  for (const linha of aTrabalhar) {
    const genero = generoDaCategoria(linha.categoria);
    generosNovos.set(genero.slug, genero.rotulo);

    for (const nome of [
      nomeUtil(primeiroNome(linha.autores)),
      nomeUtil(primeiroNome(linha.narradores)),
    ]) {
      if (nome) pessoasNovas.set(slugify(nome), nome);
    }

    const editora = linha.editora?.trim();
    if (editora) editorasNovas.set(slugify(editora), editora);
  }

  const [{ ordemMaxima }] = await db
    .select({ ordemMaxima: sql<number>`coalesce(max(ordem), -1)::int` })
    .from(generos);
  let ordem = ordemMaxima + 1;

  await db
    .insert(generos)
    .values(
      [...generosNovos].map(([slug, rotulo]) => ({
        slug,
        rotulo,
        // Um cinza sóbrio para todo gênero novo: gradiente é decisão de desenho,
        // e sortear cor por gênero daria uma grade de arco-íris sem critério.
        gradiente: "from-slate-700 to-slate-500",
        ordem: ordem++,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(pessoas)
    .values([...pessoasNovas].map(([slug, nome]) => ({ slug, nome })))
    .onConflictDoNothing();

  await db
    .insert(editoras)
    .values([...editorasNovas].map(([slug, nome]) => ({ slug, nome })))
    .onConflictDoNothing();

  console.log(
    `  ${generosNovos.size} gêneros · ${pessoasNovas.size} pessoas · ${editorasNovas.size} editoras\n`,
  );

  /* --- 3. os livros --- */

  await mkdir(CAPAS_RAIZ, { recursive: true });

  let novos = 0;
  let atualizados = 0;
  let semNarrador = 0;
  let comCapa = 0;
  let semCategoria = 0;

  for (const linha of aTrabalhar) {
    const chave = `${linha.loja}/${linha.loja_id}`;
    const idExistente = jaImportados.get(chave);
    const id = idExistente ?? proximoId++;

    const autor = nomeUtil(primeiroNome(linha.autores));
    const narrador = nomeUtil(primeiroNome(linha.narradores));
    if (!narrador) semNarrador++;

    const genero = generoDaCategoria(linha.categoria);
    if (genero.slug === SEM_GENERO.slug) semCategoria++;

    // A capa mora ao lado do áudio, na pasta do "pronto". Copiada para
    // CAPAS_RAIZ com o nome do id, que é como `/capas/<arquivo>` a serve.
    const pasta = pastaDoPronto(linha);
    let capa: string | null = null;
    if (pasta) {
      const origem = join(pasta, "capa.jpg");
      if (existsSync(origem)) {
        await copyFile(origem, join(CAPAS_RAIZ, `${id}.jpg`));
        capa = `${id}.jpg`;
        comCapa++;
      }
    }

    // A sinopse da ficha do pronto vence a do `cru`: ela é a que o baixalivro
    // conferiu ao montar a entrega.
    let sinopse = sinopseDoCru(linha.cru);
    if (pasta && existsSync(join(pasta, "_ficha.json"))) {
      try {
        const ficha = JSON.parse(await readFile(join(pasta, "_ficha.json"), "utf8"));
        const texto = ficha?.ficha?.SINOPSE;
        if (typeof texto === "string" && texto.trim()) sinopse = texto.trim();
      } catch {
        /* ficha ilegível não impede o livro de entrar */
      }
    }

    const valores = {
      id,
      titulo: linha.subtitulo?.trim()
        ? `${linha.titulo!.trim()}: ${linha.subtitulo.trim()}`
        : linha.titulo!.trim(),
      autorSlug: autor ? slugify(autor) : "autor-desconhecido",
      narradorSlug: narrador ? slugify(narrador) : "narrador-nao-informado",
      editoraSlug: linha.editora?.trim() ? slugify(linha.editora.trim()) : null,
      generoSlug: genero.slug,
      // Sem nota: nenhuma das lojas entrega avaliação (§4.134).
      nota: null,
      ano: anoDe(linha.lancamento),
      sinopse,
      capa,
      // Duração ANUNCIADA pela loja, em segundos. A medida de verdade só existe
      // depois do `npm run audio`, que a mede com ffprobe e a sobrescreve.
      duracaoSegundos: linha.minutos ? linha.minutos * 60 : null,
      origemLoja: linha.loja,
      origemId: linha.loja_id,
    };

    await db
      .insert(livros)
      .values(valores)
      .onConflictDoUpdate({ target: livros.id, set: valores });

    if (idExistente) atualizados++;
    else novos++;
  }

  console.log(`  ${novos} livros novos, ${atualizados} atualizados`);
  console.log(`  ${comCapa} com capa copiada para ${CAPAS_RAIZ}`);
  console.log(`\n  ⚠️  ${semCategoria} chegaram SEM categoria (foram para "Sem gênero")`);
  console.log(`  ⚠️  ${semNarrador} chegaram sem narrador com nome\n`);
}

/* -------------------------------------------------------------------------- */

async function principal() {
  // As duas pessoas de reserva, para os livros cujo campo veio vazio. Existem
  // como pessoa de verdade porque `autor_slug` e `narrador_slug` são NOT NULL —
  // e é melhor uma linha honesta chamada "Autor desconhecido" do que atribuir
  // o livro a alguém que não o escreveu.
  await db
    .insert(pessoas)
    .values([
      { slug: "autor-desconhecido", nome: "Autor desconhecido" },
      { slug: "narrador-nao-informado", nome: "Narrador não informado" },
    ])
    .onConflictDoNothing();

  const comando = process.argv[2];
  const limite = process.argv[3] ? Number(process.argv[3]) : null;

  if (comando === "importar") await importar(Number.isFinite(limite) ? limite : null);
  else await situacao();

  process.exit(0);
}

void principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
