/**
 * A mesa do estúdio — a fila dos pedidos de narração.
 *
 * Rode com `npm run estudio`. É a armadilha **2.6** do
 * `docs/BANCO-DE-DADOS.md` deixando de existir: até 08/08 o pedido nascia e
 * **permanecia em `recebido`** para sempre, porque não havia fila, servidor nem
 * ninguém do outro lado. A tela era honesta com a pessoa, mas a promessa pública
 * do AllBook é de **24 horas**.
 *
 * ```
 *   npm run estudio                          a fila, do mais antigo ao mais novo
 *   npm run estudio mover <id> <etapa>       recebido | procurando | produzindo
 *   npm run estudio pronto <id> <id do livro>  encerra e entrega
 *   npm run estudio recusar <id> [motivo]
 * ```
 *
 * ---
 *
 * ## Por que isto é um comando de terminal, e não uma tela de administração
 *
 * **Decisão de segurança (08/08, §4.127):** esta ferramenta fala **direto com o
 * banco**, sem passar por rota HTTP. Uma rota de administração é uma porta a
 * mais exposta na internet, com autenticação, papéis e o risco de alguém achá-la
 * — tudo isso para um estúdio que hoje é **uma pessoa, nesta máquina**. Quem tem
 * acesso ao banco local já é o dono do projeto; não há o que proteger a mais.
 *
 * Quando o estúdio virar equipe, aí a rota (e a coluna de papel em `contas`)
 * passam a valer a pena. Antes disso seria superfície de ataque sem dono.
 *
 * ## O que este comando NÃO faz, e é de propósito
 *
 * Ele **não cria livro novo no catálogo**. O catálogo que o app mostra vem de
 * `client/src/lib/books.ts` — **código**, não banco (63 arquivos leem de lá). Um
 * livro inserido só no banco existiria para as chaves estrangeiras e **não
 * apareceria em tela nenhuma** — a pior mentira possível para quem pediu.
 *
 * Por isso `pronto` **exige** um livro que já existe, e ensina o caminho quando
 * ele não existe ainda. Ver o texto de ajuda em `entregar()`.
 */

import { asc, eq, inArray, sql } from "drizzle-orm";

import { contas, livros, pedidos } from "@shared/schema";
import { db, pool } from "../server/db";

type Etapa = "recebido" | "procurando" | "produzindo" | "pronto" | "recusado";

/** As etapas na ordem em que a tela do app as desenha (`REQUEST_STEPS`). */
const ETAPAS: Etapa[] = ["recebido", "procurando", "produzindo", "pronto"];

/** O que cada etapa quer dizer — o mesmo texto que a pessoa lê na trilha. */
const EXPLICA: Record<Etapa, string> = {
  recebido: "registrado, esperando a vez",
  procurando: "já existe narração desta obra?",
  produzindo: "trazendo a que existe, ou gravando do zero",
  pronto: "no catálogo, e é de quem pediu",
  recusado: "não deu para atender",
};

/* -------------------------------------------------------------------------- */

/** Aceita o id inteiro ou só o começo dele — ninguém digita um uuid à mão. */
async function acharPedido(pedaco: string) {
  const achados = await db
    .select()
    .from(pedidos)
    .where(sql`${pedidos.id}::text like ${pedaco + "%"}`)
    .limit(5);

  if (achados.length === 0) {
    console.error(`Não achei pedido começando por "${pedaco}".`);
    process.exit(1);
  }
  if (achados.length > 1) {
    console.error(`"${pedaco}" casa com ${achados.length} pedidos. Use mais caracteres:`);
    for (const p of achados) console.error(`  ${p.id.slice(0, 8)}  ${p.titulo}`);
    process.exit(1);
  }
  return achados[0];
}

function curto(data: Date): string {
  return data.toISOString().slice(0, 16).replace("T", " ");
}

/** Quantas horas o pedido está esperando — a promessa pública é de 24. */
function esperando(desde: Date): string {
  const horas = Math.floor((Date.now() - desde.getTime()) / 3_600_000);
  if (horas < 1) return "há minutos";
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias}d${dias > 1 ? "" : ""} ⚠️ passou de 24h`;
}

/* -------------------------------------------------------------------------- */

async function fila() {
  const abertos = await db
    .select({
      id: pedidos.id,
      titulo: pedidos.titulo,
      autor: pedidos.autor,
      observacao: pedidos.observacao,
      vozSlug: pedidos.vozSlug,
      situacao: pedidos.situacao,
      criadoEm: pedidos.criadoEm,
      quem: contas.nome,
      email: contas.email,
    })
    .from(pedidos)
    .innerJoin(contas, eq(contas.id, pedidos.contaId))
    .where(inArray(pedidos.situacao, ["recebido", "procurando", "produzindo"]))
    .orderBy(asc(pedidos.criadoEm));

  if (abertos.length === 0) {
    console.log("A fila está vazia. Nenhum pedido esperando.");
    return;
  }

  console.log(`\n${abertos.length} pedido(s) na fila, do mais antigo para o mais novo:\n`);
  for (const p of abertos) {
    console.log(`  ${p.id.slice(0, 8)}  ${p.titulo}${p.autor ? ` — ${p.autor}` : ""}`);
    console.log(`            de ${p.quem} <${p.email}>, ${esperando(p.criadoEm)} (${curto(p.criadoEm)})`);
    console.log(`            etapa: ${p.situacao} · ${EXPLICA[p.situacao as Etapa]}`);
    if (p.vozSlug) console.log(`            voz pedida: ${p.vozSlug}`);
    else console.log(`            voz: o estúdio escolhe (a pessoa não indicou — e isso é uma escolha, não um esquecimento)`);
    if (p.observacao) console.log(`            observação: "${p.observacao}"`);
    console.log();
  }
  console.log("Mover:  npm run estudio mover <id> <procurando|produzindo>");
  console.log("Entregar: npm run estudio pronto <id> <id do livro>\n");
}

async function mover(pedaco: string, destino: string) {
  if (!ETAPAS.includes(destino as Etapa) || destino === "pronto") {
    console.error(`Etapa inválida: "${destino}".`);
    console.error("Use: recebido, procurando ou produzindo.");
    console.error('Para "pronto" use o comando `pronto`, que exige o livro entregue.');
    process.exit(1);
  }

  const pedido = await acharPedido(pedaco);
  if (pedido.situacao === "pronto") {
    console.error("Este pedido já foi entregue. Não dá para voltar atrás.");
    process.exit(1);
  }

  await db
    .update(pedidos)
    .set({ situacao: destino as Etapa, atualizadoEm: new Date() })
    .where(eq(pedidos.id, pedido.id));

  console.log(`"${pedido.titulo}": ${pedido.situacao} → ${destino}`);
  console.log(`(${EXPLICA[destino as Etapa]})`);
  console.log("\nA pessoa vê a mudança na próxima vez que o app dela sincronizar.");
}

async function entregar(pedaco: string, livroId?: number) {
  const pedido = await acharPedido(pedaco);

  if (livroId === undefined) {
    console.error("Falta dizer qual livro foi entregue:");
    console.error("  npm run estudio pronto <id do pedido> <id do livro>\n");
    console.error("Se o livro AINDA NÃO EXISTE no catálogo, o caminho de hoje é:");
    console.error("  1. acrescente-o em client/src/lib/books.ts (e na lista ALVOS de");
    console.error("     script/importar-catalogo.ts, para ele ganhar capa e ficha)");
    console.error("  2. npm run catalogo      # baixa capa e ficha da Open Library");
    console.error("  3. npm run db:catalogo   # leva o catálogo para o banco");
    console.error("  4. volte aqui com o id novo");
    console.error("\n⚠️ O catálogo que o app mostra vem do CÓDIGO, não do banco — um livro");
    console.error("   criado só no banco não apareceria em tela nenhuma, e o pedido diria");
    console.error("   'pronto' apontando para o nada.");
    process.exit(1);
  }

  const [livro] = await db.select().from(livros).where(eq(livros.id, livroId)).limit(1);
  if (!livro) {
    console.error(`Não existe livro com id ${livroId} no banco.`);
    console.error("Rode `npm run db:catalogo` se você acabou de acrescentá-lo em books.ts.");
    process.exit(1);
  }

  const agora = new Date();
  await db
    .update(pedidos)
    .set({ situacao: "pronto", livroId, prontoEm: agora, atualizadoEm: agora })
    .where(eq(pedidos.id, pedido.id));

  const horas = Math.floor((agora.getTime() - pedido.criadoEm.getTime()) / 3_600_000);
  console.log(`"${pedido.titulo}" → pronto, entregue como "${livro.titulo}" (id ${livroId}).`);
  console.log(
    horas <= 24
      ? `Levou ${horas}h — dentro das 24h prometidas.`
      : `⚠️ Levou ${horas}h — a promessa pública é de 24h.`,
  );
}

async function recusar(pedaco: string, motivo?: string) {
  const pedido = await acharPedido(pedaco);
  await db
    .update(pedidos)
    .set({
      situacao: "recusado",
      atualizadoEm: new Date(),
      observacao: motivo ? `${pedido.observacao ?? ""}\n[estúdio] ${motivo}`.trim() : pedido.observacao,
    })
    .where(eq(pedidos.id, pedido.id));

  console.log(`"${pedido.titulo}" → recusado.`);
  console.log(
    "⚠️ A tela do app ainda não desenha o estado 'recusado' — ela conhece as quatro\n" +
      "   etapas da trilha. Enquanto isso, avise a pessoa por fora, e não deixe o\n" +
      "   pedido dela mudo (isso é dívida anotada na §4.127).",
  );
}

/* -------------------------------------------------------------------------- */

async function main() {
  const [comando, ...resto] = process.argv.slice(2);

  switch (comando) {
    case undefined:
    case "fila":
      await fila();
      break;
    case "mover":
      await mover(resto[0], resto[1]);
      break;
    case "pronto": {
      /*
       * ⚠️ **Aceita o livro como número solto, e não só como `--livro`** —
       * apurado testando: o `npm run` **engole** qualquer `--flag` antes de
       * chegar aqui (ele a interpreta como flag dele), e o comando falhava
       * dizendo que faltava o livro mesmo com o livro escrito. Funciona com
       * `npm run estudio -- pronto <id> --livro 8`, mas exigir aquele `--`
       * perdido no meio é o tipo de detalhe que ninguém lembra.
       *
       * Então o jeito curto passou a ser: `npm run estudio pronto <id> 8`.
       */
      const i = resto.indexOf("--livro");
      const cru = i >= 0 ? resto[i + 1] : resto.find((a, n) => n > 0 && /^\d+$/.test(a));
      const livroId = Number(cru);
      await entregar(resto[0], Number.isFinite(livroId) && cru ? livroId : undefined);
      break;
    }
    case "recusar":
      await recusar(resto[0], resto.slice(1).join(" ") || undefined);
      break;
    default:
      console.error(`Não conheço "${comando}".`);
      console.error("Use: fila | mover <id> <etapa> | pronto <id> --livro <n> | recusar <id> [motivo]");
      process.exitCode = 1;
  }
}

main()
  .catch((erro) => {
    console.error("[estúdio] falhou:", erro);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
