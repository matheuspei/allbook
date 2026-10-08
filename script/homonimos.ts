/**
 * Homônimos — duas pessoas diferentes com o mesmo nome (08/10, §4.172).
 *
 * O app identifica gente pelo nome: `autores` e `narradores` são texto, e o
 * perfil é `slugify(nome)`. Isso junta as grafias de uma pessoa só (a regra
 * dele, §4.153) — e funde duas pessoas que se chamam igual. O caso que abriu o
 * assunto: o Marcelo Ribeiro que narra os 15 livros cristãos da Editora Letras
 * e o coautor de *Saúde emocional* (psicologia, Audible Studios) eram um
 * perfil só.
 *
 *   npm run homonimos                          — o que já foi separado e os
 *                                                candidatos a separar
 *   npm run homonimos separar <slug> <id>… --motivo "…"
 *                                              — tira o crédito desses livros
 *                                                do <slug> e dá a uma pessoa nova
 *   npm run homonimos desfazer <slug-novo>     — volta tudo como era
 *
 * 🚨 **Separar é decisão dele, caso a caso.** A lista de candidatos é para ele
 * ver; o script não separa nada sozinho. Um falso homônimo parte em dois o
 * perfil de uma pessoa só — o contrário exato da §4.153.
 */

import { and, eq, sql } from "drizzle-orm";

import { db } from "../server/db";
import { homonimos, livros, pessoas } from "@shared/schema";
import { slugDe } from "@shared/prateleiras";

/** Os nomes de reserva e de coletivo, que não são gente (ver `ehGente` no cliente). */
const NAO_E_GENTE = new Set([
  "autor-desconhecido",
  "narrador-nao-informado",
  "desconhecido",
  "nao-informado",
  "unknown",
  "various-narrators",
  "narrators-various",
  "varios",
  "diversos",
  "varios-autores",
]);

/** Rótulos de gênero que não dizem assunto nenhum (§4.158). */
const NAO_E_ASSUNTO = new Set(["livros", "geral"]);

type Linha = {
  id: number;
  titulo: string;
  autorSlug: string;
  narradorSlug: string;
  autorNome: string;
  narradorNome: string;
  autores: string | null;
  narradores: string | null;
  editora: string | null;
  loja: string | null;
  genero: string;
  generos: string | null;
};

async function lerLivros(): Promise<Linha[]> {
  const { rows } = await db.execute<Linha>(sql`
    select l.id, l.titulo, l.autor_slug as "autorSlug", l.narrador_slug as "narradorSlug",
           a.nome as "autorNome", n.nome as "narradorNome", l.autores, l.narradores,
           l.editora_slug as editora, l.origem_loja as loja, g.rotulo as genero, l.generos
      from livros l
      join pessoas a on a.slug = l.autor_slug
      join pessoas n on n.slug = l.narrador_slug
      join generos g on g.slug = l.genero_slug`);
  return rows;
}

const autoresDe = (l: Linha) => (l.autores ? l.autores.split(" & ") : [l.autorNome]);
const narradoresDe = (l: Linha) => (l.narradores ? l.narradores.split(" & ") : [l.narradorNome]);

/* -------------------------------------------------------------------------- */
/* A situação: o que já foi separado e os candidatos                           */
/* -------------------------------------------------------------------------- */

async function situacao() {
  const feitos = await db.select().from(homonimos).orderBy(homonimos.pessoaSlug, homonimos.livroId);
  console.log(`\n  Separados: ${feitos.length === 0 ? "nenhum" : ""}`);
  for (const h of feitos) {
    console.log(`    ${h.pessoaSlug}  ←  "${h.nome}" no livro ${h.livroId} (era ${h.slugAnterior})`);
    console.log(`      motivo: ${h.motivo}`);
  }

  /* O MESMO nome como autor e como narrador, sem nada que ligue os dois
     lados: nenhum livro em comum (quem narra o próprio livro é uma pessoa
     só), nenhum título em comum (o mesmo livro em outra loja) e nenhuma
     editora em comum. Quem também não divide assunto vem marcado. */
  const ja = new Set(feitos.map((h) => `${h.livroId}|${h.nome}`));
  const escreveu = new Map<string, Linha[]>();
  const narrou = new Map<string, Linha[]>();
  const nome = new Map<string, string>();
  const juntar = (mapa: Map<string, Linha[]>, n: string, l: Linha) => {
    if (ja.has(`${l.id}|${n}`)) return;
    const s = slugDe(n);
    if (!s || NAO_E_GENTE.has(s)) return;
    if (!nome.has(s)) nome.set(s, n);
    mapa.set(s, [...(mapa.get(s) ?? []), l]);
  };
  for (const l of await lerLivros()) {
    autoresDe(l).forEach((n) => juntar(escreveu, n, l));
    narradoresDe(l).forEach((n) => juntar(narrou, n, l));
  }

  const assuntos = (ls: Linha[]) =>
    new Set(
      ls
        .flatMap((l) => [l.genero, ...(l.generos ? l.generos.split(" & ") : [])])
        .map(slugDe)
        .filter((g) => !NAO_E_ASSUNTO.has(g)),
    );
  const cruza = <T>(a: Set<T>, b: Set<T>) => [...a].some((x) => b.has(x));

  const candidatos = [];
  for (const [slug, a] of escreveu) {
    const n = narrou.get(slug);
    if (!n) continue;
    if (cruza(new Set(a.map((l) => l.id)), new Set(n.map((l) => l.id)))) continue;
    if (cruza(new Set(a.map((l) => slugDe(l.titulo))), new Set(n.map((l) => slugDe(l.titulo))))) continue;
    const ea = new Set(a.map((l) => l.editora).filter(Boolean));
    if (cruza(ea, new Set(n.map((l) => l.editora).filter(Boolean)))) continue;
    candidatos.push({ slug, a, n, mesmoAssunto: cruza(assuntos(a), assuntos(n)) });
  }
  candidatos.sort((x, y) => Number(x.mesmoAssunto) - Number(y.mesmoAssunto) || y.n.length - x.n.length);

  const resumo = (ls: Linha[]) =>
    ls
      .slice(0, 2)
      .map((l) => `${l.id} ${l.titulo.slice(0, 32)} (${l.editora ?? "sem editora"}, ${l.genero})`)
      .join("; ") + (ls.length > 2 ? `; +${ls.length - 2}` : "");

  console.log(`\n  Candidatos — o mesmo nome como autor e como narrador, sem livro, título nem editora em comum: ${candidatos.length}`);
  for (const c of candidatos) {
    console.log(`\n    ${nome.get(c.slug)} (${c.slug})${c.mesmoAssunto ? "  · divide assunto" : ""}`);
    console.log(`      escreveu ${c.a.length}: ${resumo(c.a)}`);
    console.log(`      narrou   ${c.n.length}: ${resumo(c.n)}`);
  }
  console.log("");
}

/* -------------------------------------------------------------------------- */
/* Separar                                                                     */
/* -------------------------------------------------------------------------- */

/** `marcelo-ribeiro` → `marcelo-ribeiro-2`, o primeiro número livre (BANCO-DE-DADOS §2.9). */
async function slugLivre(base: string): Promise<string> {
  const { rows } = await db.execute<{ slug: string }>(
    sql`select slug from pessoas where slug like ${base + "-%"}`,
  );
  const usados = new Set(rows.map((r) => r.slug));
  for (let n = 2; ; n++) if (!usados.has(`${base}-${n}`)) return `${base}-${n}`;
}

async function separar(slugAtual: string, ids: number[], motivo: string) {
  const todos = await lerLivros();
  const alvo = todos.filter((l) => ids.includes(l.id));
  if (alvo.length !== ids.length) {
    const faltam = ids.filter((id) => !alvo.some((l) => l.id === id));
    throw new Error(`livro(s) não encontrado(s): ${faltam.join(", ")}`);
  }

  /* Em cada livro, o crédito que hoje leva a `slugAtual`. Um só por livro —
     dois seria o mesmo nome escrito duas vezes, e aí não há como saber qual
     dos dois é o homônimo. */
  const creditos = alvo.map((l) => {
    const nomes = [...new Set([...autoresDe(l), ...narradoresDe(l)])].filter(
      (n) => slugDe(n) === slugAtual || (n === l.autorNome && l.autorSlug === slugAtual) || (n === l.narradorNome && l.narradorSlug === slugAtual),
    );
    if (nomes.length !== 1) {
      throw new Error(`livro ${l.id} (${l.titulo}): ${nomes.length} créditos levam a ${slugAtual} — esperado 1`);
    }
    return { livro: l, nome: nomes[0] };
  });

  const novo = await slugLivre(slugAtual);
  await db.transaction(async (tx) => {
    await tx.insert(pessoas).values({ slug: novo, nome: creditos[0].nome });
    for (const { livro, nome } of creditos) {
      await tx.insert(homonimos).values({ livroId: livro.id, nome, pessoaSlug: novo, slugAnterior: slugAtual, motivo });
      // O crédito principal também tem chave no banco: ela passa junto.
      if (livro.autorSlug === slugAtual && livro.autorNome === nome) {
        await tx.update(livros).set({ autorSlug: novo }).where(eq(livros.id, livro.id));
      }
      if (livro.narradorSlug === slugAtual && livro.narradorNome === nome) {
        await tx.update(livros).set({ narradorSlug: novo }).where(eq(livros.id, livro.id));
      }
    }
  });

  console.log(`\n  ${novo} criado ("${creditos[0].nome}") com ${creditos.length} livro(s):`);
  for (const { livro } of creditos) console.log(`    ${livro.id}  ${livro.titulo}`);
  console.log(`  ${slugAtual} segue com o resto. Desfazer: npm run homonimos desfazer ${novo}`);
  console.log("  Para o app ver: zsh scripts/servidor-servico.sh reiniciar\n");
}

/* -------------------------------------------------------------------------- */
/* Desfazer                                                                    */
/* -------------------------------------------------------------------------- */

async function desfazer(slugNovo: string) {
  const linhas = await db.select().from(homonimos).where(eq(homonimos.pessoaSlug, slugNovo));
  if (linhas.length === 0) throw new Error(`nenhuma separação com ${slugNovo}`);

  await db.transaction(async (tx) => {
    for (const h of linhas) {
      await tx
        .update(livros)
        .set({ autorSlug: h.slugAnterior })
        .where(and(eq(livros.id, h.livroId), eq(livros.autorSlug, slugNovo)));
      await tx
        .update(livros)
        .set({ narradorSlug: h.slugAnterior })
        .where(and(eq(livros.id, h.livroId), eq(livros.narradorSlug, slugNovo)));
    }
    await tx.delete(homonimos).where(eq(homonimos.pessoaSlug, slugNovo));
    /* A pessoa só sai se nada mais a usa — um comentário ou uma menção feita
       nesse meio-tempo segura o registro (a chave estrangeira recusa). */
    try {
      await tx.execute(sql`savepoint antes_de_apagar`);
      await tx.delete(pessoas).where(eq(pessoas.slug, slugNovo));
    } catch {
      await tx.execute(sql`rollback to savepoint antes_de_apagar`);
      console.log(`  ⚠️ ${slugNovo} ficou no banco: alguma tabela ainda aponta para ele.`);
    }
  });

  console.log(`\n  Desfeito: ${linhas.length} crédito(s) voltaram para ${linhas[0].slugAnterior}.`);
  console.log("  Para o app ver: zsh scripts/servidor-servico.sh reiniciar\n");
}

/* -------------------------------------------------------------------------- */

async function principal() {
  const [comando = "situacao", ...resto] = process.argv.slice(2);
  if (comando === "situacao") await situacao();
  else if (comando === "separar") {
    const i = resto.indexOf("--motivo");
    const motivo = i >= 0 ? resto[i + 1] : "";
    const args = i >= 0 ? resto.slice(0, i) : resto;
    const [slug, ...ids] = args;
    if (!slug || ids.length === 0 || !motivo) {
      throw new Error('uso: npm run homonimos separar <slug> <id>… --motivo "…"');
    }
    await separar(slug, ids.map(Number), motivo);
  } else if (comando === "desfazer" && resto[0]) await desfazer(resto[0]);
  else {
    console.log("\n  Comandos:  npm run homonimos   |   separar <slug> <id>… --motivo \"…\"   |   desfazer <slug>\n");
    process.exit(1);
  }
  process.exit(0);
}

principal().catch((erro) => {
  console.error(`\n  ✗ ${erro instanceof Error ? erro.message : erro}\n`);
  process.exit(1);
});
