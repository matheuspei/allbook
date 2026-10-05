/**
 * Monta o pacote do agente de enriquecimento (05/10, §4.171).
 *
 *     npm run enriquecimento sorteio 5     — 5 livros ao acaso da vitrine
 *     npm run enriquecimento livros 108233,110074
 *     npm run enriquecimento todos         — o acervo inteiro
 *
 * Um terceiro argumento opcional é a pasta de destino; o padrão é
 * `~/AllBook-enriquecimento/<modo>-<data>`, fora do repositório.
 *
 * ## Por que um pacote, e por que tão pouco dentro dele
 *
 * O agente vai rodar **fora desta máquina**, em contas compartilhadas com
 * outras pessoas. A ordem do Matheus é que ele leve **só o que precisa**: não
 * sabemos para onde vai o que entra lá. Por isso cada tarefa é montada campo a
 * campo, só com o que já está público na página da loja — título, créditos,
 * editora, sinopse, endereço da página. **Não entram:** o banco, o `.env`, o
 * código do app, áudio, capa, nem nada de conta de usuário.
 *
 * Junto vai o kit de `enriquecimento/` (instruções, formatos, `rodar.mjs`,
 * `conferir.mjs`), que só precisa de Node e do Claude Code.
 *
 * Cada livro sorteado leva junto o perfil das pessoas e da editora dele, com a
 * lista de livros de cada uma no catálogo inteiro — é ela que deixa o agente
 * provar que achou a pessoa certa, e não um homônimo.
 */

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { pool } from "../server/db";
import { LOJAS_FORA_DA_VITRINE } from "../server/catalogo";
import { PRATELEIRAS } from "@shared/prateleiras";

// Roda-se da raiz do projeto, como os outros scripts de `script/`.
const KIT = join(process.cwd(), "enriquecimento");
const ARQUIVOS_DO_KIT = [
  "LEIA-ME.md", "instrucoes-comuns.md", "instrucoes-livro.md", "instrucoes-pessoa.md",
  "instrucoes-editora.md", "formatos.mjs", "rodar.mjs", "conferir.mjs",
];

/** Créditos que são a ausência de alguém, ou voz de máquina: não ganham perfil. */
const SEM_PERFIL = new Set([
  "autor-desconhecido", "narrador-nao-informado", "varios-autores", "varios", "diversos",
  "voz-sintetica", "voz-artificial", "voz-artifical", "voz-artificla", "voz-digital",
]);

/** Até quantos livros de cada pessoa ou editora vão como pista de identidade. */
const LIVROS_POR_PERFIL = 12;

/**
 * "Literatura e Ficção" fica fora da lista do agente de propósito: é a
 * prateleira provisória que ele vai desfazer, decidindo Ficção ou Literatura
 * livro a livro (§4.170).
 */
const PRATELEIRA_PROVISORIA = "literatura-e-ficcao";

interface Linha {
  id: number;
  titulo: string;
  subtitulo: string | null;
  autor_slug: string;
  narrador_slug: string;
  editora_slug: string | null;
  autor_nome: string | null;
  narrador_nome: string | null;
  editora_nome: string | null;
  autores: string | null;
  narradores: string | null;
  generos: string | null;
  origem_loja: string | null;
  origem_id: string | null;
  ano: number | null;
  duracao_segundos: number | null;
  sinopse: string | null;
  pasta_acervo: string | null;
}

const CONSULTA = `
  select l.id, l.titulo, l.subtitulo, l.autor_slug, l.narrador_slug, l.editora_slug,
         a.nome as autor_nome, n.nome as narrador_nome, e.nome as editora_nome,
         l.autores, l.narradores, l.generos, l.origem_loja, l.origem_id, l.ano,
         l.duracao_segundos, coalesce(nullif(l.sinopse, ''), l.sinopse_importada) as sinopse,
         l.pasta_acervo
    from livros l
    left join pessoas a on a.slug = l.autor_slug
    left join pessoas n on n.slug = l.narrador_slug
    left join editoras e on e.slug = l.editora_slug`;

const lista = (texto: string | null, reserva: string | null) =>
  texto ? texto.split(" & ").map((s) => s.trim()).filter(Boolean) : reserva ? [reserva] : [];

async function ficha(pasta: string | null): Promise<Record<string, string>> {
  if (!pasta) return {};
  try {
    const d = JSON.parse(await readFile(join(pasta, "_ficha.json"), "utf8"));
    return d.ficha ?? {};
  } catch {
    return {};
  }
}

/**
 * A ficha do Ubook não traz o endereço da página, mas ele é fixo pelo número
 * do livro — o agente do piloto o achou sozinho (`/audiobook/1431366`).
 */
function paginaDoUbook(loja: string | null, id: string | null) {
  return loja === "ubook" && id ? `https://www.ubook.com/audiobook/${id}` : null;
}

async function tarefaDoLivro(l: Linha) {
  const f = await ficha(l.pasta_acervo);
  const autorConhecido = !SEM_PERFIL.has(l.autor_slug);
  const narradorConhecido = !SEM_PERFIL.has(l.narrador_slug);
  return {
    tarefa: "livro",
    id: l.id,
    titulo: l.titulo,
    subtitulo: l.subtitulo,
    autores: autorConhecido ? lista(l.autores, l.autor_nome) : [],
    autores_desconhecidos: !autorConhecido,
    narradores: narradorConhecido ? lista(l.narradores, l.narrador_nome) : [],
    narradores_desconhecidos: !narradorConhecido,
    editora: l.editora_nome,
    produtora_do_audio: f.PUBLICADOR ?? null,
    loja: l.origem_loja,
    pagina_da_loja: f.FONTE_URL ?? paginaDoUbook(l.origem_loja, f.FONTE_ID ?? l.origem_id),
    id_na_loja: f.FONTE_ID ?? l.origem_id,
    isbn: f.ISBN ?? null,
    integral_segundo_a_loja: f.INTEGRAL ?? null,
    categorias_da_loja: l.generos ? l.generos.split(" & ") : f.CATEGORIA_ORIGEM ? [f.CATEGORIA_ORIGEM] : [],
    ano_na_loja: l.ano,
    // No Ubook a data é a da coleta (§4.149): o agente é avisado para não usá-la.
    ano_na_loja_serve: l.origem_loja !== "ubook",
    idioma: f.IDIOMA ?? "pt",
    duracao_minutos: l.duracao_segundos ? Math.round(l.duracao_segundos / 60) : null,
    sinopse: l.sinopse ?? f.SINOPSE ?? null,
  };
}

async function livrosDaPessoa(slug: string, nome: string) {
  const { rows } = await pool.query<{ titulo: string; papel: string; editora: string | null; loja: string | null; ano: number | null }>(
    `select l.titulo,
            case when l.autor_slug = $1 or $2 = any(string_to_array(l.autores, ' & ')) then 'autor' else 'narrador' end as papel,
            e.nome as editora, l.origem_loja as loja, l.ano
       from livros l left join editoras e on e.slug = l.editora_slug
      where l.autor_slug = $1 or l.narrador_slug = $1
         or $2 = any(string_to_array(l.autores, ' & ')) or $2 = any(string_to_array(l.narradores, ' & '))
      order by l.ano desc nulls last, l.titulo
      limit ${LIVROS_POR_PERFIL * 3}`,
    [slug, nome],
  );
  // Um título por obra: a mesma obra em quatro lojas não ajuda a identificar ninguém.
  const vistos = new Set<string>();
  return rows.filter((r) => !vistos.has(r.titulo) && vistos.add(r.titulo)).slice(0, LIVROS_POR_PERFIL);
}

async function tarefaDaPessoa(slug: string) {
  const { rows } = await pool.query<{ nome: string }>("select nome from pessoas where slug = $1", [slug]);
  if (!rows.length) return null;
  const nome = rows[0].nome;
  const { rows: total } = await pool.query<{ autor: string; narrador: string }>(
    `select count(*) filter (where autor_slug = $1 or $2 = any(string_to_array(autores, ' & '))) as autor,
            count(*) filter (where narrador_slug = $1 or $2 = any(string_to_array(narradores, ' & '))) as narrador
       from livros`,
    [slug, nome],
  );
  const papeis = [Number(total[0].autor) && "autor", Number(total[0].narrador) && "narrador"].filter(Boolean);
  return {
    tarefa: "pessoa",
    slug,
    nome,
    papeis,
    livros_como_autor: Number(total[0].autor),
    livros_como_narrador: Number(total[0].narrador),
    alguns_livros: await livrosDaPessoa(slug, nome),
  };
}

async function tarefaDaEditora(slug: string) {
  const { rows } = await pool.query<{ nome: string }>("select nome from editoras where slug = $1", [slug]);
  if (!rows.length) return null;
  const { rows: livros } = await pool.query<{ titulo: string; autor: string | null }>(
    `select distinct on (l.titulo) l.titulo, a.nome as autor
       from livros l left join pessoas a on a.slug = l.autor_slug
      where l.editora_slug = $1
      order by l.titulo
      limit ${LIVROS_POR_PERFIL}`,
    [slug],
  );
  const { rows: total } = await pool.query<{ n: string }>("select count(*) as n from livros where editora_slug = $1", [slug]);
  return {
    tarefa: "editora",
    slug,
    nome: rows[0].nome,
    livros_no_allbook: Number(total[0].n),
    alguns_livros: livros,
  };
}

/** Os slugs das pessoas de um livro: o principal e os que vêm na lista. */
async function pessoasDoLivro(l: Linha): Promise<string[]> {
  const nomes = [...lista(l.autores, null), ...lista(l.narradores, null)];
  const slugs = new Set([l.autor_slug, l.narrador_slug]);
  if (nomes.length) {
    const { rows } = await pool.query<{ slug: string }>("select slug from pessoas where nome = any($1)", [nomes]);
    rows.forEach((r) => slugs.add(r.slug));
  }
  return [...slugs].filter((s) => !SEM_PERFIL.has(s));
}

async function main() {
  const [modo = "", arg = "", destinoArg] = process.argv.slice(2);
  const hoje = new Date().toISOString().slice(0, 10);

  let livros: Linha[];
  let criterio: string;
  if (modo === "sorteio") {
    const n = Number(arg) || 5;
    const { rows } = await pool.query<Linha>(
      `${CONSULTA} where coalesce(l.origem_loja, '') <> all($1) order by random() limit ${n}`,
      [LOJAS_FORA_DA_VITRINE],
    );
    livros = rows;
    criterio = `${n} livros sorteados da vitrine (lojas fora: ${LOJAS_FORA_DA_VITRINE.join(", ") || "nenhuma"})`;
  } else if (modo === "livros") {
    const ids = arg.split(",").map(Number).filter(Boolean);
    livros = (await pool.query<Linha>(`${CONSULTA} where l.id = any($1)`, [ids])).rows;
    criterio = `livros escolhidos: ${ids.join(", ")}`;
  } else if (modo === "todos") {
    livros = (await pool.query<Linha>(`${CONSULTA} order by l.id`)).rows;
    criterio = "o acervo inteiro";
  } else {
    console.log("uso: npm run enriquecimento sorteio <n> | livros <id,id> | todos  [pasta]");
    process.exit(1);
  }

  const destino = destinoArg ?? join(homedir(), "AllBook-enriquecimento", `${modo}-${hoje}`);
  const tarefas = join(destino, "tarefas");
  await mkdir(tarefas, { recursive: true });
  for (const arquivo of ARQUIVOS_DO_KIT) await copyFile(join(KIT, arquivo), join(destino, arquivo));

  const prateleiras = [...PRATELEIRAS.entries()]
    .filter(([slug]) => slug !== PRATELEIRA_PROVISORIA)
    .map(([, p]) => ({ rotulo: p.rotulo, dica: p.subcategorias?.map((s) => s.rotulo).join(", ") }));
  await writeFile(join(destino, "prateleiras.json"), JSON.stringify(prateleiras, null, 2));

  const pessoas = new Set<string>();
  const editoras = new Set<string>();
  let semFicha = 0;
  for (const l of livros) {
    const t = await tarefaDoLivro(l);
    if (!t.pagina_da_loja && !t.isbn) semFicha++;
    await writeFile(join(tarefas, `livro-${l.id}.json`), JSON.stringify(t, null, 2));
    (await pessoasDoLivro(l)).forEach((s) => pessoas.add(s));
    if (l.editora_slug) editoras.add(l.editora_slug);
  }
  for (const slug of pessoas) {
    const t = await tarefaDaPessoa(slug);
    if (t) await writeFile(join(tarefas, `pessoa-${slug}.json`), JSON.stringify(t, null, 2));
  }
  for (const slug of editoras) {
    const t = await tarefaDaEditora(slug);
    if (t) await writeFile(join(tarefas, `editora-${slug}.json`), JSON.stringify(t, null, 2));
  }

  const resumo = { criado_em: new Date().toISOString(), criterio, livros: livros.length, pessoas: pessoas.size, editoras: editoras.size };
  await writeFile(join(destino, "pacote.json"), JSON.stringify(resumo, null, 2));

  console.log(`\nPacote em ${destino}`);
  console.log(`  ${criterio}`);
  console.log(`  ${livros.length} livros · ${pessoas.size} pessoas · ${editoras.size} editoras`);
  if (semFicha) console.log(`  ⚠️ ${semFicha} livros sem página da loja nem ISBN (o disco do acervo está ligado?)`);
  console.log("  Fora do pacote: banco, .env, código do app, áudio, capas e qualquer dado de conta.");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
