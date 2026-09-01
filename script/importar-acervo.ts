/**
 * O acervo do `baixalivro` entra no catálogo do AllBook (21/08, §4.134).
 *
 *     npm run acervo             — o que existe lá e o que já entrou aqui
 *     npm run acervo importar    — importa tudo
 *     npm run acervo importar 50 — importa só os 50 primeiros (para conferir)
 *     npm run acervo fichas      — só reconcilia a EDITORA das fichas (barato)
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

import { eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "../server/db";
import { CAPAS_RAIZ } from "../server/catalogo";
import { capitulos, editoras, generos, livros, pessoas } from "@shared/schema";
import { carimbosDaFicha } from "./carimbos";
import { nomeDeEditora, resolverEditoras, type EditoraResolvida } from "./editoras";

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
 * Palavras que, sozinhas depois de um " e ", denunciam que ali começou **outro
 * crédito** e não o resto do mesmo nome.
 */
const DEPOIS_DO_E = new Set(["outros", "outro", "outras", "ubook"]);

/**
 * O primeiro nome de uma lista como o **`_ficha.json` a escreve** (01/09,
 * §4.153).
 *
 * 🚨 **Não dá para reusar `primeiroNome`**: o `catalogo.sqlite` separa por
 * `" & "` e a ficha separa por vírgula ou pela palavra "e" —
 * *"Pablo Coitino, Matheus Fernandes e outros"*, *"The Guardian e Ubook"*.
 *
 * ⚠️ **O " e " só corta quando o que vem depois é claramente outro crédito**, e
 * a razão tem nome: *"João Victor Mendes de Gomes e Mendonça"* é **uma pessoa
 * só**. Cortar em todo " e " a decapitaria sem erro nenhum. Por isso a régua é
 * o que sobra: duas palavras ou mais é outro autor ("Eliana Sá"), uma palavra
 * só não é — a não ser que esteja em `DEPOIS_DO_E`.
 *
 * ⚠️ **O `\s+` colapsado não é capricho:** a ficha do Ubook traz
 * *"Ap.  Miguel Ângelo"* com dois espaços em 142 livros e *"Ap. Miguel Ângelo"*
 * com um em 139. São a mesma pessoa, e o nome de tela sairia dobrado.
 */
function primeiroDaFicha(bruto: string | null | undefined): string | null {
  const limpo = (bruto ?? "").replace(/\s+/g, " ").trim();
  if (limpo.length < 2) return null;

  const primeiro = limpo.split(/\s*[,;&]\s*/)[0]?.trim() ?? "";
  const corte = primeiro.match(/^(.+?)\s+e\s+(.+)$/);
  if (corte) {
    const resto = corte[2].trim();
    const outroCredito = DEPOIS_DO_E.has(resto.toLowerCase()) || resto.split(" ").length >= 2;
    if (outroCredito) return corte[1].trim() || null;
  }
  return primeiro.length > 1 ? primeiro : null;
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
    if ((await triarFicha(linha.loja, pasta)).prontoParaEntrar) prontos++;

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

  /* Quantos ainda esperam a editora — é o tamanho do que falta no baixalivro. */
  const [editora] = await db
    .select({
      total: sql<number>`count(*)::int`,
      com: sql<number>`count(editora_slug)::int`,
      casas: sql<number>`count(distinct editora_slug)::int`,
    })
    .from(livros);

  console.log(`\n  Editoras (§4.148)`);
  console.log(`    ${editora.com} de ${editora.total} livros com editora, em ${editora.casas} casas`);
  if (editora.total > editora.com) {
    console.log(`    ${editora.total - editora.com} ainda sem — quando o baixalivro as achar,`);
    console.log(`      elas entram sozinhas (o serviço com.allbook.fichas roda todo dia)`);
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

/**
 * A leitura leve da ficha: só o que a triagem precisa saber ANTES de escrever.
 *
 * São duas perguntas, e as duas se respondem no mesmo `JSON.parse` — daí virem
 * juntas. A vinheta decide se o livro pode entrar; a editora precisa existir
 * como linha da tabela `editoras` **antes** de o livro referenciá-la, e é por
 * isso que ela não pode esperar pela leitura completa da etapa 3.
 */
interface TriagemDaFicha {
  /** Já levou a vinheta do AllBook (ou é Audible, que não a recebe)? */
  prontoParaEntrar: boolean;
  /** O nome da editora, como a ficha o traz. `null` quando não há. */
  editora: string | null;
  /**
   * Autor e narrador **da ficha** — a reserva de quem o `catalogo.sqlite` não
   * cobre (01/09, §4.153). Ver `pessoasDaFicha` no `importar`.
   */
  autor: string | null;
  narrador: string | null;
}

const FICHA_VAZIA: TriagemDaFicha = {
  prontoParaEntrar: false,
  editora: null,
  autor: null,
  narrador: null,
};

async function triarFicha(loja: string, pasta: string | null): Promise<TriagemDaFicha> {
  const semVinheta = !LOJAS_COM_VINHETA.includes(loja);
  const nada = { ...FICHA_VAZIA, prontoParaEntrar: semVinheta };
  if (!pasta) return nada;
  const ficha = join(pasta, "_ficha.json");
  if (!existsSync(ficha)) return nada;
  try {
    const dados = JSON.parse(await readFile(ficha, "utf8"));
    return {
      prontoParaEntrar: semVinheta || Boolean(dados?.vinheta),
      editora: nomeDeEditora(dados?.ficha?.EDITORA),
      autor: primeiroDaFicha(dados?.ficha?.AUTOR),
      narrador: primeiroDaFicha(dados?.ficha?.NARRADOR),
    };
  } catch {
    /* ficha ilegível: não entra, e não tem nada para dar */
    return nada;
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
  //
  // A mesma passada colhe a EDITORA de cada ficha (31/08, §4.148). Ela vem
  // daqui, e não do `catalogo.sqlite`, porque lá só a Audible a tem — ver
  // `script/editoras.ts`. Ler as duas coisas no mesmo `JSON.parse` é o que
  // evita uma terceira varredura de 14 mil arquivos.
  console.log(`\n  ${linhas.length} no acervo — conferindo a vinheta, a editora e as pessoas…`);
  const prontos: LinhaDoAcervo[] = [];
  const editoraDaLinha = new Map<string, string>();
  /**
   * Autor e narrador vindos da **ficha**, por livro (01/09, §4.153).
   *
   * 🚨 **Só existe porque o `catalogo.sqlite` não cobre o Ubook.** Os 47.153
   * títulos dele têm `autores` e `narradores` **vazios** — 100% —, e por isso
   * 4.938 livros entraram aqui como "Autor desconhecido". O nome está no
   * `_ficha.json` de cada pasta o tempo todo: 4.944 dos 5.014 têm AUTOR e 4.825
   * têm NARRADOR. É o mesmo defeito da editora (§4.148), no outro campo — o
   * dado não estava onde a gente olhou.
   *
   * ⚠️ **A ficha é RESERVA, não autoridade** — o contrário da editora. Lá a
   * ficha vence porque o sqlite quase não traz editora; aqui o sqlite traz o
   * nome de 8.979 livros das outras três lojas, conferido na varredura da loja,
   * e trocá-lo pelo da ficha seria mexer em quem já está certo para consertar
   * quem está vazio.
   */
  const pessoasDaFicha = new Map<string, { autor: string | null; narrador: string | null }>();
  let barrados = 0;
  for (const linha of linhas) {
    const triagem = await triarFicha(linha.loja, pastaDoPronto(linha));
    if (triagem.prontoParaEntrar) prontos.push(linha);
    else barrados++;
    // A do `catalogo.sqlite` fica de reserva: ela cobre a Audible e não custa
    // nada, mas a ficha vence sempre que existe (é a mais nova e a mais ampla).
    const chave = `${linha.loja}/${linha.loja_id}`;
    const nome = triagem.editora ?? nomeDeEditora(linha.editora);
    if (nome) editoraDaLinha.set(chave, nome);
    if (triagem.autor || triagem.narrador) {
      pessoasDaFicha.set(chave, { autor: triagem.autor, narrador: triagem.narrador });
    }
  }

  /** O autor e o narrador do livro: o sqlite manda, a ficha completa. */
  const autorDoLivro = (linha: LinhaDoAcervo) =>
    nomeUtil(primeiroNome(linha.autores)) ??
    nomeUtil(pessoasDaFicha.get(`${linha.loja}/${linha.loja_id}`)?.autor ?? null);
  const narradorDoLivro = (linha: LinhaDoAcervo) =>
    nomeUtil(primeiroNome(linha.narradores)) ??
    nomeUtil(pessoasDaFicha.get(`${linha.loja}/${linha.loja_id}`)?.narrador ?? null);

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

    for (const nome of [autorDoLivro(linha), narradorDoLivro(linha)]) {
      if (nome) pessoasNovas.set(slugify(nome), nome);
    }

  }

  /* As editoras, resolvidas de uma vez (§4.148).
   *
   * 🚨 **A importação completa é a autoridade sobre o conjunto**, e por isso
   * ela decide o slug canônico do zero (`jaNoBanco` vazio): as 139 editoras que
   * o banco tinha nasceram da coluna do `catalogo.sqlite`, só da Audible, e
   * nunca chegaram a uma tela — nenhum link nem seguimento aponta para elas.
   * Esta é a única passada em que isso vale. O `npm run acervo fichas`, que
   * roda depois, respeita o que estiver aqui: slug em uso não se troca. */
  const editorasResolvidas = resolverEditoras(editoraDaLinha.values(), []);
  for (const editora of editorasResolvidas.values()) {
    editorasNovas.set(editora.slug, editora.nome);
  }

  /** A editora deste livro do acervo, já com o slug e o nome canônicos. */
  const editoraDoLivro = (chave: string): EditoraResolvida | undefined => {
    const nome = editoraDaLinha.get(chave);
    return nome ? editorasResolvidas.get(nome) : undefined;
  };

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
  let semEditora = 0;

  for (const linha of aTrabalhar) {
    const chave = `${linha.loja}/${linha.loja_id}`;
    const idExistente = jaImportados.get(chave);
    const id = idExistente ?? proximoId++;

    const autor = autorDoLivro(linha);
    const narrador = narradorDoLivro(linha);
    if (!narrador) semNarrador++;

    const genero = generoDaCategoria(linha.categoria);
    if (genero.slug === SEM_GENERO.slug) semCategoria++;
    if (!editoraDoLivro(chave)) semEditora++;

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
      editoraSlug: editoraDoLivro(chave)?.slug ?? null,
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
  console.log(`  ${editorasNovas.size} editoras distintas · ${aTrabalhar.length - semEditora} livros com editora`);
  console.log(`\n  ⚠️  ${semCategoria} chegaram SEM categoria (foram para "Sem gênero")`);
  console.log(`  ⚠️  ${semNarrador} chegaram sem narrador com nome`);
  console.log(`  ⚠️  ${semEditora} chegaram sem editora (o baixalivro ainda vai atrás delas)\n`);

  await limparEditorasOrfas();
}

/**
 * Apaga as editoras que ficaram **sem nenhum livro**.
 *
 * Elas aparecem quando um nome muda de forma no acervo ou quando a
 * normalização junta duas variantes numa só — e editora sem livro é um perfil
 * que abre vazio e um nome a mais na lista "Outras editoras".
 *
 * ⚠️ **É o único `delete` deste script, e ele é estreito de propósito**: só
 * apaga linha da tabela `editoras` que nenhum livro referencia. Nada de conta,
 * nada de livro, nada de progresso — o `CLAUDE.md` é taxativo sobre isso.
 */
async function limparEditorasOrfas() {
  const apagadas = await db
    .delete(editoras)
    .where(
      sql`not exists (select 1 from livros where livros.editora_slug = editoras.slug)`,
    )
    .returning({ slug: editoras.slug });
  if (apagadas.length > 0) {
    console.log(`  ${apagadas.length} editoras sem nenhum livro foram removidas\n`);
  }
}

/* -------------------------------------------------------------------------- */
/* `npm run acervo fichas` — a editora que o baixalivro corrigir chega sozinha  */
/* -------------------------------------------------------------------------- */

/**
 * Preenche autor e narrador **onde eles estão vazios** (01/09, §4.153).
 *
 * ## Por que existe
 *
 * 🚨 **4.938 livros do Ubook entraram como "Autor desconhecido" com o nome do
 * autor no disco o tempo todo.** O importador lê autor e narrador do
 * `catalogo.sqlite`, e ali as quatro colunas do Ubook vêm vazias nos 47.153
 * títulos — 100%. O `_ficha.json` de cada pasta traz os dois: 4.944 dos 5.014
 * têm AUTOR, 4.825 têm NARRADOR. É o mesmo defeito da editora (§4.148), no
 * outro campo, e com a mesma lição: **antes de dar um dado por perdido, olhe
 * onde ele está.**
 *
 * ## A régua, e por que ela é estreita
 *
 * ⚠️ **Só escreve sobre o vazio** — `autor-desconhecido` e
 * `narrador-nao-informado`, os dois slugs de reserva. Nome que já está lá veio
 * da varredura da loja e não se toca: sobrescrever 13.917 livros para consertar
 * 5.000 é trocar um problema conhecido por um desconhecido, e mexeria no nome
 * pelo qual o perfil de gente já é endereçado.
 *
 * ⚠️ **Ele não desfaz.** Livro que perdeu o autor na ficha continua com o que
 * tem aqui — ao contrário da editora, que é apagada quando some da ficha. A
 * diferença é o custo do erro: editora errada é uma linha na ficha do livro;
 * autor apagado tira o livro do perfil de quem o escreveu.
 */
async function preencherPessoasVazias(
  noBanco: Map<string, { id: number; autor: string; narrador: string }>,
  daFicha: Map<number, { autor: string | null; narrador: string | null }>,
) {
  const pessoasNovas = new Map<string, string>();
  const autorPorSlug = new Map<string, number[]>();
  const narradorPorSlug = new Map<string, number[]>();

  for (const aqui of noBanco.values()) {
    const ficha = daFicha.get(aqui.id);
    if (!ficha) continue;

    const autor = aqui.autor === "autor-desconhecido" ? nomeUtil(ficha.autor) : null;
    if (autor) {
      const slug = slugify(autor);
      pessoasNovas.set(slug, autor);
      (autorPorSlug.get(slug) ?? autorPorSlug.set(slug, []).get(slug)!).push(aqui.id);
    }

    const narrador = aqui.narrador === "narrador-nao-informado" ? nomeUtil(ficha.narrador) : null;
    if (narrador) {
      const slug = slugify(narrador);
      pessoasNovas.set(slug, narrador);
      (narradorPorSlug.get(slug) ?? narradorPorSlug.set(slug, []).get(slug)!).push(aqui.id);
    }
  }

  if (pessoasNovas.size === 0) return;

  // As pessoas primeiro: os livros as referenciam por chave estrangeira.
  await db
    .insert(pessoas)
    .values([...pessoasNovas].map(([slug, nome]) => ({ slug, nome })))
    .onConflictDoNothing();

  let comAutor = 0;
  for (const [slug, ids] of autorPorSlug) {
    await db.update(livros).set({ autorSlug: slug }).where(inArray(livros.id, ids));
    comAutor += ids.length;
  }
  let comNarrador = 0;
  for (const [slug, ids] of narradorPorSlug) {
    await db.update(livros).set({ narradorSlug: slug }).where(inArray(livros.id, ids));
    comNarrador += ids.length;
  }

  console.log(`\n  Pessoas (§4.153)`);
  console.log(`    ${comAutor} livros ganharam autor, vindo do _ficha.json`);
  console.log(`    ${comNarrador} ganharam narrador`);
  console.log(`    ${pessoasNovas.size} nomes distintos envolvidos`);
}

/**
 * Reconcilia a **editora** de todo livro já importado, direto das fichas do
 * acervo (31/08, §4.148).
 *
 * ## Por que ele existe
 *
 * Hoje 11,4% dos livros do acervo chegam sem editora, e o baixalivro ainda vai
 * atrás delas — é trabalho que continua depois de o livro já ter entrado aqui.
 * Sem este comando, a correção feita lá **nunca chegaria ao AllBook** a não ser
 * reimportando os 13.917 livros: copiar capa de novo, reler capítulo de novo,
 * medir com ffprobe de novo. Caro demais para trocar um nome.
 *
 * Ele faz uma coisa só, e por isso é barato: lê o `ficha.EDITORA` de cada
 * pasta, compara com o que está no banco e **grava só o que mudou**. Não toca
 * em capa, capítulo, duração, sinopse nem em id de ninguém.
 *
 * ## Quem o chama
 *
 * 🚨 **Ninguém precisa lembrar de rodá-lo.** Ele é o alvo do LaunchAgent
 * `com.allbook.fichas`, que roda uma vez por dia como a cópia de segurança do
 * banco já faz (`scripts/sincronizar-fichas.sh`). O comando na mão fica para
 * quando se quiser ver o efeito na hora — não é a via normal, porque comando
 * que depende de memória humana é comando que não roda.
 */
async function reconciliarFichas() {
  if (!existsSync(CATALOGO_SQLITE)) {
    console.error(`\n  Não achei o acervo em ${CATALOGO_SQLITE}\n`);
    process.exitCode = 1;
    return;
  }

  const linhas = consultar<LinhaDoAcervo>(CONSULTA).filter((l) => l.titulo?.trim());
  console.log(`\n  ${linhas.length} no acervo — lendo a editora e as pessoas de cada ficha…`);

  /* O que o AllBook tem hoje, de cada livro vindo de loja. */
  const noBanco = new Map<string, { id: number; editora: string | null; autor: string; narrador: string }>();
  for (const l of await db
    .select({
      id: livros.id,
      loja: livros.origemLoja,
      origemId: livros.origemId,
      editora: livros.editoraSlug,
      autor: livros.autorSlug,
      narrador: livros.narradorSlug,
    })
    .from(livros)
    .where(isNotNull(livros.origemLoja))) {
    noBanco.set(`${l.loja}/${l.origemId}`, {
      id: l.id,
      editora: l.editora,
      autor: l.autor,
      narrador: l.narrador,
    });
  }

  /* O que as fichas dizem agora. Só interessa livro que já entrou: reconciliar
     não é importar — quem ainda não está aqui entra pelo `importar`. */
  const nomePorLivro = new Map<number, string>();
  const pessoaPorLivro = new Map<number, { autor: string | null; narrador: string | null }>();
  let semFicha = 0;
  for (const linha of linhas) {
    const aqui = noBanco.get(`${linha.loja}/${linha.loja_id}`);
    if (!aqui) continue;
    const triagem = await triarFicha(linha.loja, pastaDoPronto(linha));
    const nome = triagem.editora ?? nomeDeEditora(linha.editora);
    if (nome) nomePorLivro.set(aqui.id, nome);
    else semFicha++;
    /* A ficha só completa o que o `catalogo.sqlite` deixou vazio — a mesma
       reserva do `importar`. Aqui a régua é o que está no banco: ver
       `preencherPessoasVazias`. */
    if (triagem.autor || triagem.narrador) {
      pessoaPorLivro.set(aqui.id, { autor: triagem.autor, narrador: triagem.narrador });
    }
  }

  await preencherPessoasVazias(noBanco, pessoaPorLivro);

  /* 🚨 Aqui `jaNoBanco` vem CHEIO, ao contrário da importação: slug em uso não
     se troca (é endereço de perfil e é por ele que o app guarda quem a pessoa
     acompanha). Nome novo cuja chave já existe entra na editora existente. */
  const existentes = await db.select({ slug: editoras.slug, nome: editoras.nome }).from(editoras);
  const resolvidas = resolverEditoras(nomePorLivro.values(), existentes);

  const jaTem = new Set(existentes.map((e) => e.slug));
  const novas = new Map<string, string>();
  for (const editora of resolvidas.values()) {
    if (!jaTem.has(editora.slug)) novas.set(editora.slug, editora.nome);
  }
  if (novas.size > 0) {
    await db
      .insert(editoras)
      .values([...novas].map(([slug, nome]) => ({ slug, nome })))
      .onConflictDoNothing();
  }

  /* Agora a comparação: quem mudou de editora, quem ganhou uma, quem perdeu. */
  const porSlugNovo = new Map<string, number[]>();
  const perderam: number[] = [];
  let ganharam = 0;
  let trocaram = 0;
  for (const [chave, aqui] of noBanco) {
    const nome = nomePorLivro.get(aqui.id);
    const slugNovo = nome ? (resolvidas.get(nome)?.slug ?? null) : null;
    if (slugNovo === aqui.editora) continue;
    if (slugNovo === null) {
      // ⚠️ Editora que some da ficha é apagada aqui de propósito: o banco espelha
      // o acervo, e manter uma atribuição que a fonte desmentiu é dado velho
      // que ninguém mais sabe de onde veio. `chave` só existe para o `for`.
      void chave;
      perderam.push(aqui.id);
      continue;
    }
    if (aqui.editora === null) ganharam++;
    else trocaram++;
    const lista = porSlugNovo.get(slugNovo) ?? [];
    lista.push(aqui.id);
    porSlugNovo.set(slugNovo, lista);
  }

  for (const [slug, ids] of porSlugNovo) {
    await db.update(livros).set({ editoraSlug: slug }).where(inArray(livros.id, ids));
  }
  if (perderam.length > 0) {
    await db.update(livros).set({ editoraSlug: null }).where(inArray(livros.id, perderam));
  }

  const [{ comEditora, total }] = await db
    .select({
      total: sql<number>`count(*)::int`,
      comEditora: sql<number>`count(editora_slug)::int`,
    })
    .from(livros);

  console.log(`\n  Editoras (§4.148)`);
  console.log(`    ${ganharam} livros ganharam editora`);
  console.log(`    ${trocaram} tiveram a editora corrigida`);
  if (perderam.length > 0) console.log(`    ${perderam.length} perderam a editora (sumiu da ficha)`);
  if (novas.size > 0) console.log(`    ${novas.size} editoras novas criadas`);
  console.log(`    ${semFicha} ainda sem editora na ficha do acervo`);

  await limparEditorasOrfas();

  console.log(`  ${comEditora} de ${total} livros com editora (${((100 * comEditora) / total).toFixed(1)}%)\n`);
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
  else if (comando === "fichas") await reconciliarFichas();
  else await situacao();

  process.exit(0);
}

void principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
