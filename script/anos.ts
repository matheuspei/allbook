/**
 * O ano da OBRA sai da ficha do acervo e entra no catálogo (31/08).
 *
 *     npm run anos          — a situação: quantos anos existem lá e aqui
 *     npm run anos gravar   — lê as fichas, grava o que faltar e espalha
 *                             o ano entre as edições da mesma obra
 *
 * ⚠️ **`npm run` engole `--flags`** (armadilha da §4.127) — argumentos são
 * posicionais, sem traço nenhum.
 *
 * ## Por que não é a importação do acervo que faz isso
 *
 * O **agente do ano** do `baixalivro` (`tools/ano_barato.py`) segue rodando por
 * dias, escrevendo `ANO` e `ANO_ORIGEM` no `_ficha.json` de cada livro à medida
 * que consegue **provar** o ano. Reimportar 13.917 livros — com capa, capítulos
 * e sinopse — a cada leva de anos novos seria caro e arriscado à toa. Este
 * script lê só o `_ficha.json` e toca só duas colunas.
 *
 * É seguro rodar quantas vezes quiser: ele só escreve o que mudou.
 *
 * ## O que ele NÃO faz
 *
 * **Não inventa e não estima.** Ficha sem `ANO` deixa a coluna vazia, e a ficha
 * do livro some com a linha — a mesma regra dos capítulos (§4.141): o que não
 * veio da origem não aparece. Quem decide se um ano é provável é o agente, que
 * recusa sozinho toda prova que fale em audiolivro, narração ou lançamento em
 * loja.
 *
 * ## O ano é da OBRA, não da edição — por isso ele se espalha
 *
 * O mesmo texto aparece uma vez por loja: *A Arte da Guerra*, de Maquiavel, tem
 * cinco fichas no acervo, e o agente provou o ano em duas. Como 1521 é o ano do
 * **texto**, as outras três não precisam ser provadas de novo — herdam.
 *
 * O casamento é **título normalizado + autor**, os dois: só o título juntaria a
 * *Arte da Guerra* de Sun Tzu com a de Maquiavel. Título com sufixo ("- Adaptado
 * infanto-juvenil", "(resumo)") não casa, e é o certo — pode ser outro texto.
 *
 * ⚠️ **Herdado nunca vira fonte de outro herdado**, e a prova diz de onde veio
 * (`herdado do livro 108233 · Wikidata (P577…)`). Sem isso, um ano errado se
 * espalharia sem deixar rastro de origem.
 *
 * ⚠️ **Edições que discordam** (o Maquiavel tem 1520 e 1521, de provas
 * diferentes) resolvem pelo **menor**: o que se procura é a primeira publicação.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { isNotNull, sql } from "drizzle-orm";

import { db } from "../server/db";
import { livros } from "@shared/schema";

/* -------------------------------------------------------------------------- */
/* Ler a ficha                                                                 */
/* -------------------------------------------------------------------------- */

interface AnoDaFicha {
  ano: number | null;
  fonte: string | null;
}

const VAZIO: AnoDaFicha = { ano: null, fonte: null };

/**
 * O ano da obra escrito no `_ficha.json`, com a prova ao lado.
 *
 * A faixa 1000–(ano que vem) não é preciosismo: o agente já valida quatro
 * dígitos, mas esta é a última porta antes do banco, e um `"20266"` de digitação
 * errada viraria uma ficha dizendo "obra de 20266" sem erro nenhum.
 */
async function anoDaFicha(pasta: string): Promise<AnoDaFicha> {
  try {
    const d = JSON.parse(await readFile(join(pasta, "_ficha.json"), "utf8"));
    const bruto = String(d?.ficha?.ANO ?? "").trim();
    if (!/^\d{4}$/.test(bruto)) return VAZIO;
    const ano = Number(bruto);
    if (ano < 1000 || ano > new Date().getFullYear() + 1) return VAZIO;
    const fonte = String(d?.ficha?.ANO_ORIGEM ?? "").trim();
    return { ano, fonte: fonte ? fonte.slice(0, 300) : null };
  } catch {
    /* ficha ilegível ou ausente: o livro só fica sem ano, como estava */
    return VAZIO;
  }
}

/** Lê as fichas de N em N — 14 mil `open` de uma vez estoura o limite do macOS. */
async function emLotes<T, R>(itens: T[], tamanho: number, f: (item: T) => Promise<R>): Promise<R[]> {
  const saida: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    saida.push(...(await Promise.all(itens.slice(i, i + tamanho).map(f))));
  }
  return saida;
}

/* -------------------------------------------------------------------------- */
/* Os dois comandos                                                            */
/* -------------------------------------------------------------------------- */

interface LinhaDoBanco {
  id: number;
  titulo: string;
  loja: string | null;
  pasta: string | null;
  anoObra: number | null;
  fonte: string | null;
}

async function lerBanco(): Promise<LinhaDoBanco[]> {
  return db
    .select({
      id: livros.id,
      titulo: livros.titulo,
      loja: livros.origemLoja,
      pasta: livros.pastaAcervo,
      anoObra: livros.anoObra,
      fonte: livros.anoObraFonte,
    })
    .from(livros)
    .where(isNotNull(livros.pastaAcervo));
}

function porLoja(linhas: { loja: string | null }[]): Map<string, number> {
  const conta = new Map<string, number>();
  for (const l of linhas) conta.set(l.loja ?? "?", (conta.get(l.loja ?? "?") ?? 0) + 1);
  return conta;
}

async function situacao() {
  const linhas = await lerBanco();
  const fichas = await emLotes(linhas, 64, async (l) => ({ ...l, ficha: await anoDaFicha(l.pasta!) }));

  const comAno = fichas.filter((f) => f.ficha.ano !== null);
  const aGravar = fichas.filter(
    (f) => f.ficha.ano !== null && (f.ficha.ano !== f.anoObra || f.ficha.fonte !== f.fonte),
  );
  const noBanco = fichas.filter((f) => f.anoObra !== null);

  console.log(`\n  ${linhas.length} livros do acervo no catálogo\n`);
  console.log(`  Ficha com ano da obra   ${comAno.length}`);
  console.log(`  Já gravados aqui        ${noBanco.length}`);
  console.log(`  A gravar agora          ${aGravar.length}`);

  console.log("\n  Por loja (com ano / total):");
  const total = porLoja(linhas);
  const achados = porLoja(comAno);
  for (const [loja, quantos] of [...total].sort((a, b) => b[1] - a[1])) {
    const tem = achados.get(loja) ?? 0;
    const pct = quantos ? Math.round((tem / quantos) * 100) : 0;
    console.log(`    ${loja.padEnd(12)} ${String(tem).padStart(5)} / ${String(quantos).padStart(5)}  ${pct}%`);
  }

  const herdar = await calcularHerancas();
  console.log(`\n  Edições irmãs esperando herdar o ano   ${herdar.length}`);

  if (aGravar.length || herdar.length) console.log(`\n  Para gravar:  npm run anos gravar\n`);
  else console.log(`\n  Nada a fazer — o banco já tem tudo o que as fichas provam.\n`);
}

async function gravar() {
  const linhas = await lerBanco();
  const fichas = await emLotes(linhas, 64, async (l) => ({ ...l, ficha: await anoDaFicha(l.pasta!) }));
  const mudaram = fichas.filter(
    (f) => f.ficha.ano !== null && (f.ficha.ano !== f.anoObra || f.ficha.fonte !== f.fonte),
  );

  if (!mudaram.length) {
    console.log("\n  Nada a gravar das fichas — o banco já tem tudo o que elas provam.");
    await espalhar();
    return;
  }

  console.log(`\n  Gravando o ano da obra em ${mudaram.length} livros…`);
  /* Numa transação só: ou o catálogo inteiro fica com a leva nova, ou nenhum
     livro fica — meia leva gravada seria impossível de distinguir de uma leva
     que o agente ainda não terminou. */
  await db.transaction(async (tx) => {
    for (const l of mudaram) {
      await tx
        .update(livros)
        .set({ anoObra: l.ficha.ano, anoObraFonte: l.ficha.fonte })
        .where(sql`${livros.id} = ${l.id}`);
    }
  });

  const novos = mudaram.filter((l) => l.anoObra === null).length;
  console.log(`  ${novos} ganharam ano pela primeira vez; ${mudaram.length - novos} foram corrigidos.`);
  console.log("\n  Exemplos:");
  for (const l of mudaram.slice(0, 5)) {
    console.log(`    ${l.ficha.ano}  ${l.titulo.slice(0, 60)}`);
    console.log(`          ${(l.ficha.fonte ?? "sem prova anotada").slice(0, 90)}`);
  }
  await espalhar();
}

/** A segunda fase: as edições irmãs herdam o ano já provado. */
async function espalhar() {
  const herdar = await calcularHerancas();
  if (!herdar.length) {
    console.log("\n  Nenhuma edição irmã para herdar ano.\n");
    return;
  }

  console.log(`\n  Espalhando o ano para ${herdar.length} edições da mesma obra…`);
  await db.transaction(async (tx) => {
    for (const l of herdar) {
      await tx
        .update(livros)
        .set({ anoObra: l.ano, anoObraFonte: l.fonte })
        .where(sql`${livros.id} = ${l.id}`);
    }
  });
  for (const l of herdar.slice(0, 5)) {
    console.log(`    ${l.ano}  ${l.titulo.slice(0, 60)}`);
    console.log(`          ${l.fonte.slice(0, 90)}`);
  }
  console.log();
}

/* -------------------------------------------------------------------------- */
/* Espalhar o ano entre as edições da mesma obra                               */
/* -------------------------------------------------------------------------- */

/**
 * "A Arte da Guerra - Maquiavel" → `nicolau-maquiavel::aartedaguerra`.
 *
 * ⚠️ **O nome do autor sai do título** antes da comparação: a Storytel vende
 * *A Arte da Guerra - Maquiavel* e a Tocalivros, *A Arte da Guerra* — mesma
 * obra, chaves diferentes sem esta limpeza. Só pedaços de 4 letras ou mais, para
 * "de", "da" e iniciais não comerem parte do título.
 */
function chaveDaObra(titulo: string, autorSlug: string): string {
  const semAcento = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  let t = semAcento(titulo).replace(/[^a-z0-9]/g, "");
  for (const pedaco of autorSlug.split("-")) {
    if (pedaco.length >= 4) t = t.split(semAcento(pedaco)).join("");
  }
  return `${autorSlug}::${t}`;
}

/** O prefixo que marca um ano herdado — e o que impede a herança em cadeia. */
const MARCA_DE_HERANCA = "herdado do livro ";

interface ParaHerdar {
  id: number;
  titulo: string;
  ano: number;
  fonte: string;
}

/**
 * Quem ainda não tem ano e tem uma edição irmã com ano **provado na própria
 * ficha**. Discordância entre irmãs resolve pelo ano menor.
 */
async function calcularHerancas(): Promise<ParaHerdar[]> {
  const todos = await db
    .select({
      id: livros.id,
      titulo: livros.titulo,
      autor: livros.autorSlug,
      anoObra: livros.anoObra,
      fonte: livros.anoObraFonte,
    })
    .from(livros);

  /* Só quem tem prova própria entra como doador. */
  const doador = new Map<string, { id: number; ano: number; fonte: string }>();
  for (const l of todos) {
    if (l.anoObra === null) continue;
    if ((l.fonte ?? "").startsWith(MARCA_DE_HERANCA)) continue;
    const chave = chaveDaObra(l.titulo, l.autor);
    const atual = doador.get(chave);
    if (!atual || l.anoObra < atual.ano) {
      doador.set(chave, { id: l.id, ano: l.anoObra, fonte: l.fonte ?? "sem prova anotada" });
    }
  }

  const herdar: ParaHerdar[] = [];
  for (const l of todos) {
    if (l.anoObra !== null) continue;
    const de = doador.get(chaveDaObra(l.titulo, l.autor));
    if (!de) continue;
    herdar.push({
      id: l.id,
      titulo: l.titulo,
      ano: de.ano,
      fonte: `${MARCA_DE_HERANCA}${de.id} · ${de.fonte}`.slice(0, 300),
    });
  }
  return herdar;
}

async function principal() {
  const comando = process.argv[2] ?? "situacao";
  if (comando === "gravar") await gravar();
  else if (comando === "situacao") await situacao();
  else {
    console.log("\n  Comandos:  npm run anos   |   npm run anos gravar\n");
    process.exit(1);
  }
  process.exit(0);
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
