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

import { execFile as execFileCb, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";

import { eq, isNotNull, sql } from "drizzle-orm";

import { db } from "../server/db";
import { CAPAS_RAIZ } from "../server/catalogo";
import { capitulos, editoras, generos, livros, pessoas } from "@shared/schema";
import { carimbosDaFicha } from "./carimbos";

/* -------------------------------------------------------------------------- */
/* Onde as coisas ficam                                                        */
/* -------------------------------------------------------------------------- */

const execFile = promisify(execFileCb);

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
 * ⚠️ **A Audible é exceção, por decisão do Matheus (21/08).** Ela ficou de fora
 * da colagem de agora — nenhuma das 300 fichas conferidas tem o campo — porque
 * **os áudios dela ainda vão ser recuperados**; a vinheta entra depois, quando
 * isso estiver feito. Ele foi explícito: *"você pode subir a Audible agora, e
 * depois as vinhetas entram depois na Audible"*. Exigir a marca ali barraria
 * 1.289 livros por uma etapa que ainda nem começou.
 *
 * 🚨 **A consequência, para quem for ingerir ÁUDIO da Audible:** quando a
 * vinheta dela for colada, a duração muda. Enquanto só a ficha subiu (é o caso
 * agora), não há marcador para deslocar — a `duracaoSegundos` daqui é a
 * anunciada pela loja, não a medida. Mas áudio Audible ingerido **antes** da
 * vinheta terá de ser reingerido, ou reajustado pelo `vinhetaSegundos` como a
 * §4.129 descreve.
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

  /* O que o AllBook já sabe de cada livro de loja — uma consulta só, e a
     comparação toda acontece em memória, contra o que o acervo diz agora. */
  const noBanco = new Map<string, { ficha: string | null; vinheta: string | null }>();
  for (const l of await db
    .select({
      loja: livros.origemLoja,
      id: livros.origemId,
      ficha: livros.fichaGeradaEm,
      vinheta: livros.vinhetaFicha,
    })
    .from(livros)
    .where(isNotNull(livros.origemLoja))) {
    noBanco.set(`${l.loja}/${l.id}`, { ficha: l.ficha, vinheta: l.vinheta });
  }

  let prontos = 0;
  let ausentes = 0;
  let fichaMudou = 0;
  let vinhetaMudou = 0;
  let semCarimbo = 0;

  for (const linha of linhas) {
    const pasta = pastaDoPronto(linha);
    const carimbos = await carimbosDaFicha(pasta);
    if (await passouPelaVinheta(linha.loja, pasta)) prontos++;

    const aqui = noBanco.get(`${linha.loja}/${linha.loja_id}`);
    if (!aqui) {
      ausentes++;
      continue;
    }
    // Livro importado ANTES dos carimbos existirem: não dá para dizer se mudou
    // — e chamá-lo de "em dia" seria mentir. Ele se resolve na próxima
    // importação, que é o que a mensagem lá embaixo diz.
    // ⚠️ Livro importado ANTES dos carimbos existirem não entra em comparação
    // NENHUMA — nem de ficha, nem de vinheta. A primeira versão comparava a
    // vinheta mesmo assim e anunciava "12.628 com vinheta diferente", quando o
    // que havia era 12.628 livros sem carimbo nenhum guardado. Número que
    // assusta à toa é pior que número que falta.
    if (aqui.ficha === null) {
      semCarimbo++;
      continue;
    }
    if (carimbos.geradoEm && carimbos.geradoEm !== aqui.ficha) fichaMudou++;
    if (carimbos.vinheta !== aqui.vinheta) vinhetaMudou++;
  }

  /* A pergunta que só o banco responde: áudio ingerido com vinheta que depois
     mudou. É o caso caro — reingerir desloca toda posição salva do livro. */
  const [audio] = await db
    .select({
      ingeridos: sql<number>`count(vinheta_ingerida)::int`,
      velhos: sql<number>`count(*) filter (
        where vinheta_ingerida is not null
          and vinheta_ingerida is distinct from vinheta_ficha
      )::int`,
    })
    .from(livros);

  console.log(`\n  Vinheta  ${prontos} prontos para entrar · ${linhas.length - prontos} ainda não`);

  console.log(`\n  Sincronia (§4.138)`);
  console.log(`    ${ausentes} no acervo e ainda não no AllBook`);
  console.log(`    ${fichaMudou} com ficha mais nova que a importada`);
  console.log(`    ${vinhetaMudou} com vinheta diferente da importada`);
  if (semCarimbo > 0) {
    console.log(`    ${semCarimbo} importados antes dos carimbos (a próxima importação os carimba)`);
  }

  console.log(`\n  Áudio`);
  console.log(`    ${audio.ingeridos} livros com áudio ingerido`);
  if (audio.velhos > 0) {
    console.log(`    🚨 ${audio.velhos} ingeridos com vinheta VELHA — reingerir com npm run audio refazer <id>`);
    console.log(`       (a vinheta mudou de tamanho: sem reingerir, quem retomar cai fora do lugar)`);
  }

  console.log(`\n  Para importar:  npm run acervo importar\n`);
}

/**
 * O livro já passou pela vinheta (ou é de loja que não passa por ela)?
 *
 * Sem a pasta do "pronto" à mão não dá para saber, e nesse caso ele não entra:
 * "não sei" tem de valer como "ainda não", senão a trava não serve para nada.
 */
/**
 * Mede a duração de um arquivo com `ffprobe`. Devolve `null` se não der.
 *
 * ⚠️ **Existe porque metade do acervo não traz a duração por capítulo** e a
 * alternativa seria estimar — que é exatamente o que o gerador de capítulos de
 * maquete fazia (§4.141). Medido em 31/08: Audible 100% e Storytel 99% trazem
 * `ms` na ficha; Tocalivros 32%; **Ubook, nenhum**.
 */
async function medirComFfprobe(arquivo: string): Promise<number | null> {
  try {
    const { stdout } = await execFile("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "csv=p=0",
      arquivo,
    ]);
    const s = Number.parseFloat(stdout.trim());
    return Number.isFinite(s) && s > 0 ? Math.round(s) : null;
  } catch {
    return null;
  }
}

/** Mede em paralelo, com um teto — 89 mil arquivos de uma vez derruba a máquina. */
async function medirTodos(
  caminhos: (string | null)[],
  aoMedir: (feitos: number) => void,
): Promise<(number | null)[]> {
  const resultado: (number | null)[] = new Array(caminhos.length).fill(null);
  let proximo = 0;
  let feitos = 0;
  const trabalhar = async () => {
    while (proximo < caminhos.length) {
      const i = proximo++;
      const c = caminhos[i];
      resultado[i] = c ? await medirComFfprobe(c) : null;
      aoMedir(++feitos);
    }
  };
  await Promise.all(Array.from({ length: 8 }, trabalhar));
  return resultado;
}

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
  let comCapitulos = 0;
  let medidos = 0;

  /* Quem já tem áudio ingerido — para não sobrescrever capítulo MEDIDO com o
     que a ficha diz (a medição é melhor, e mexer nela desloca quem já ouviu). */
  const temAudio = new Set(
    (
      await db
        .select({ id: livros.id })
        .from(livros)
        .where(isNotNull(livros.arquivoMestre))
    ).map((l) => l.id),
  );
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
    // conferiu ao montar a entrega. A mesma leitura traz os carimbos (§4.138),
    // de graça — abrir o arquivo duas vezes seria 14 mil leituras a mais.
    const carimbos = await carimbosDaFicha(pasta);
    const sinopse = carimbos.sinopse ?? sinopseDoCru(linha.cru);

    const valores = {
      id,
      // ⚠️ **Título e subtítulo NÃO se colam mais** (30/08, §4.138). A fonte
      // sempre os entregou separados e era aqui que viravam um só, com `": "`
      // no meio — daí os 3.033 títulos acima de 60 caracteres, um deles
      // cobrindo a capa inteira no billboard (§4.137).
      titulo: linha.titulo!.trim(),
      subtitulo: linha.subtitulo?.trim() || null,
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
      // Onde o áudio já está, para o servidor tocá-lo sem converter (§4.142).
      pastaAcervo: pasta,
      // Os carimbos da sincronização. ⚠️ `vinhetaIngerida` NÃO entra aqui: quem
      // a escreve é o `npm run audio`, e como este `set` reescreve o que
      // listar, incluí-la apagaria a cada importação o registro de com que
      // vinheta o áudio foi de fato montado — justamente o dado que diz se ele
      // está velho.
      fichaGeradaEm: carimbos.geradoEm,
      vinhetaFicha: carimbos.vinheta,
    };

    await db
      .insert(livros)
      .values(valores)
      .onConflictDoUpdate({ target: livros.id, set: valores });

    /*
     * Os capítulos DE VERDADE (31/08, §4.141).
     *
     * Até 30/08 eles só entravam com o áudio, e enquanto isso a tela mostrava
     * uma lista **inventada** — herança da época das maquetes, quando não havia
     * livro real nenhum. Hoje 100% das fichas do acervo trazem número e título
     * certos, então não há mais desculpa para inventar: entram na importação.
     *
     * ⚠️ **Livro com áudio já ingerido é pulado.** Ali os capítulos foram
     * MEDIDOS no arquivo, com a vinheta somada (§4.129); a ficha é a fonte
     * pior, e sobrescrever jogaria fora a medição — e deslocaria toda posição
     * salva de quem já ouviu.
     */
    if (carimbos.capitulos.length > 0 && !temAudio.has(id)) {
      /* O que a ficha não trouxe, o ffprobe mede — nada de estimativa. */
      if (pasta && carimbos.capitulos.some((c) => c.segundos === null)) {
        const medidas = await medirTodos(
          carimbos.capitulos.map((c) => (c.segundos === null && c.arquivo ? join(pasta, c.arquivo) : null)),
          () => {},
        );
        medidas.forEach((seg, i) => {
          if (seg !== null) {
            carimbos.capitulos[i].segundos = seg;
            medidos++;
          }
        });
      }
      const todasAsDuracoes = carimbos.capitulos.every((c) => c.segundos !== null);
      let inicio = 0;
      const linhas = carimbos.capitulos.map((c, i) => {
        const atual = {
          livroId: id,
          numero: i + 1,
          titulo: c.titulo,
          // Só há "onde começa" se todos os anteriores tiverem duração; um
          // buraco no meio faz o resto da conta ser chute.
          inicioSegundos: todasAsDuracoes ? inicio : null,
          duracaoSegundos: c.segundos,
          arquivo: c.arquivo,
        };
        inicio += c.segundos ?? 0;
        return atual;
      });
      await db.transaction(async (tx) => {
        await tx.delete(capitulos).where(eq(capitulos.livroId, id));
        await tx.insert(capitulos).values(linhas);
      });
      comCapitulos++;
    }

    if (idExistente) atualizados++;
    else novos++;
  }

  console.log(`  ${novos} livros novos, ${atualizados} atualizados`);
  console.log(`  ${comCapitulos} com os capítulos da ficha gravados`);
  if (medidos > 0) console.log(`  ${medidos} capítulos medidos com ffprobe (a ficha não trazia a duração)`);
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
