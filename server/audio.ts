/**
 * A entrega do áudio — as duas rotas que ficam entre o acervo e o ouvinte.
 *
 * ```
 *   GET /api/audio/:livroId/lista.m3u8    a lista de reprodução (por sessão)
 *   GET /api/audio/:livroId/s00042.ts     um pedaço de ~6 segundos
 * ```
 *
 * É a segunda metade da armadilha **2.5**: a §4.129 fez a ingestão, isto serve.
 *
 * ---
 *
 * ## O desenho, e o problema que ele resolve
 *
 * A §4.34 pedia "URL assinada por sessão, com expiração de minutos". Ao
 * construir, apareceu o furo dessa frase: **um audiolivro dura dez horas**. Numa
 * lista de reprodução VOD o player baixa os endereços **uma vez** e usa por toda
 * a escuta — endereços que expiram em minutos morreriam no meio do capítulo 3, e
 * endereços que durassem a escuta inteira não seriam proteção nenhuma.
 *
 * A saída é pôr o servidor no meio: os endereços dentro da lista apontam para
 * **esta rota**, e a permissão é conferida **a cada pedaço**, na hora. Não há
 * endereço que envelheça, porque não há endereço permanente. Quando o
 * armazenamento souber assinar (S3/R2), a rota redireciona para uma URL de
 * poucos segundos gerada **naquele instante** — e aí sim o áudio vai do provedor
 * direto para o ouvinte, sem atravessar o servidor.
 *
 * ## As três defesas, da mais barata para a mais cara
 *
 * 1. **Sessão obrigatória.** Sem conta, nem a lista nem um pedaço saem.
 * 2. **Limite de rajada, em memória** — contra o script que puxa tudo de uma vez.
 * 3. **Limite de livros distintos por dia, no banco** — a defesa que realmente
 *    importa (§4.34: "mil títulos saindo pela mesma conta em duas horas"), e a
 *    única que sobrevive ao reinício do servidor.
 *
 * ⚠️ **Nada disto impede alguém de gravar a saída de som do próprio aparelho** —
 * isso não tem solução e a §4.34 já dizia. O objetivo é a cópia em escala.
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

import type { Express, NextFunction, Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";

import { audioAcessos, capitulos, livros, type Conta } from "@shared/schema";
import { armazenamento, chaveDaLista, prefixoDaEntrega } from "./armazenamento";
import { db } from "./db";

/* -------------------------------------------------------------------------- */
/* Os números do limite — todos aqui, com a conta que os justifica             */
/* -------------------------------------------------------------------------- */

/**
 * Pedaços por minuto, por conta.
 *
 * 600 pedaços de 6s são **uma hora de áudio por minuto**. Quem ouve, mesmo a 2x,
 * consome 20 por minuto — passa longe. Quem baixa um livro de 10h para ouvir
 * offline leva 10 minutos, o que é aceitável. Quem quer o acervo de 10 mil
 * livros precisaria de **70 dias sem parar**, e a defesa 3 o pega muito antes.
 */
const PEDACOS_POR_MINUTO = 600;

/**
 * Livros **distintos** abertos por dia, por conta.
 *
 * Esta é a defesa que importa. Um ouvinte voraz começa dois ou três livros num
 * dia; vinte é folga generosa para quem fica passeando pelo catálogo. Para levar
 * 10 mil títulos, o concorrente precisaria de **500 dias** — e de uma conta
 * pagante o tempo todo.
 *
 * ⚠️ Conta **livro aberto**, não livro ouvido: abrir e fechar já consome. É de
 * propósito — quem raspa abre e fecha, e medir "ouviu de verdade" exigiria
 * confiar no que o navegador diz.
 */
const LIVROS_POR_DIA = 20;

/** Quanto vale um endereço assinado, quando o armazenamento souber assinar. */
const SEGUNDOS_DE_ASSINATURA = 60;

/* -------------------------------------------------------------------------- */
/* Defesa 2: a rajada, em memória                                              */
/* -------------------------------------------------------------------------- */

/**
 * Contador por conta, numa janela de um minuto.
 *
 * ⚠️ **Em memória de propósito, e o limite disso está anotado:** reiniciar o
 * servidor zera o contador. Tudo bem, porque quem burla isto reiniciando esbarra
 * na defesa 3, que está no banco. Trocar por Redis quando houver mais de uma
 * instância — hoje há uma, nesta máquina.
 */
const rajada = new Map<string, { desde: number; quantos: number }>();

function passouDaRajada(contaId: string): boolean {
  const agora = Date.now();
  const atual = rajada.get(contaId);

  if (!atual || agora - atual.desde >= 60_000) {
    rajada.set(contaId, { desde: agora, quantos: 1 });
    return false;
  }
  atual.quantos++;
  return atual.quantos > PEDACOS_POR_MINUTO;
}

/*
 * Sem esta limpeza o mapa cresceria uma entrada por conta para sempre — o tipo
 * de vazamento que só aparece meses depois, quando o servidor começa a inchar
 * sem motivo aparente. `unref()` para o timer não segurar o processo aberto.
 */
setInterval(() => {
  const limite = Date.now() - 120_000;
  for (const [conta, marca] of rajada) if (marca.desde < limite) rajada.delete(conta);
}, 120_000).unref();

/* -------------------------------------------------------------------------- */
/* Defesa 1: sessão                                                            */
/* -------------------------------------------------------------------------- */

/** O tipo MIME pela extensão — o acervo tem mp3, m4a, m4b e ogg. */
function tipoPeloNome(nome: string): string {
  const ext = path.extname(nome).toLowerCase();
  if (ext === ".m4a" || ext === ".m4b" || ext === ".aac") return "audio/mp4";
  if (ext === ".ogg" || ext === ".opus") return "audio/ogg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".flac") return "audio/flac";
  return "audio/mpeg";
}

function exigirConta(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ erro: "Entre na sua conta para ouvir." });
  return next();
}

function contaDe(req: Request): string {
  return (req.user as Conta).id;
}

/** O dia local de quem pede, para o limite diário virar no fuso certo. */
function hojeDe(req: Request): string {
  const fuso = String(req.query.fuso ?? "");
  const agora = new Date();
  if (/^-?\d{1,4}$/.test(fuso)) {
    // O navegador manda `getTimezoneOffset()`, que é minutos ATRÁS do UTC.
    return new Date(agora.getTime() - Number(fuso) * 60_000).toISOString().slice(0, 10);
  }
  return agora.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Defesa 3: livros distintos por dia                                          */
/* -------------------------------------------------------------------------- */

/**
 * Registra a abertura e devolve se a conta estourou o limite do dia.
 *
 * ⚠️ **Reabrir um livro que já se abriu hoje NUNCA é barrado, e isso não é
 * generosidade — é o conserto de um defeito que o teste pegou (08/08).** A
 * primeira versão contava todas as linhas do dia e barrava a partir do limite,
 * inclusive quando o livro pedido já estava na lista. Efeito: quem chegasse ao
 * teto ficava sem conseguir **voltar ao livro que estava ouvindo** — bastava
 * recarregar a página para o player perder o livro no meio do capítulo. Um
 * limite contra raspagem que pune quem está simplesmente ouvindo está errado.
 *
 * A pergunta certa é "esta conta pode abrir um livro **novo** agora?", e ela só
 * é feita quando o livro é de fato novo naquele dia.
 */
async function registrarAbertura(contaId: string, livroId: number, dia: string): Promise<boolean> {
  const jaAberto = await db
    .select({ livroId: audioAcessos.livroId })
    .from(audioAcessos)
    .where(
      and(
        eq(audioAcessos.contaId, contaId),
        eq(audioAcessos.dia, dia),
        eq(audioAcessos.livroId, livroId),
      ),
    )
    .limit(1);

  if (jaAberto.length > 0) {
    await db
      .update(audioAcessos)
      .set({ aberturas: sql`${audioAcessos.aberturas} + 1`, ultimoEm: new Date() })
      .where(
        and(
          eq(audioAcessos.contaId, contaId),
          eq(audioAcessos.dia, dia),
          eq(audioAcessos.livroId, livroId),
        ),
      );
    return false;
  }

  const [contagem] = await db
    .select({ livros: sql<number>`count(*)::int` })
    .from(audioAcessos)
    .where(and(eq(audioAcessos.contaId, contaId), eq(audioAcessos.dia, dia)));

  // Barra **antes** de registrar: um livro recusado não pode consumir a cota,
  // senão a pessoa perde o dia inteiro por uma tentativa que não tocou nada.
  if (contagem.livros >= LIVROS_POR_DIA) return true;

  /*
   * Corrida conhecida e aceita: dois pedidos simultâneos podem contar antes de
   * qualquer um registrar, e passar um ou dois livros do teto. Travar a linha
   * resolveria, e não vale o custo — quem raspa precisa de milhares de livros,
   * não de vinte e dois.
   */
  await db.insert(audioAcessos).values({ contaId, dia, livroId }).onConflictDoNothing();
  return false;
}

/* -------------------------------------------------------------------------- */

/**
 * ⚠️ **O nome do pedaço vem da URL, e é a única entrada não confiável daqui.**
 * `s00042.ts` e nada mais — sem isto, `../../mestres/7/livro.mp3` entregaria
 * justamente o arquivo que nunca pode ser servido. A camada de armazenamento
 * também barra `..`, mas defesa de um só nível é defesa que um dia falha.
 */
const NOME_DE_PEDACO = /^s\d{5}\.ts$/;

export function registrarAudio(app: Express) {
  /**
   * A lista de reprodução.
   *
   * Os nomes de arquivo de dentro dela são **reescritos** para apontar para a
   * rota do pedaço. A lista gerada pelo `ffmpeg` diz `s00000.ts`; o que sai
   * daqui diz `/api/audio/7/s00000.ts`. Nenhum endereço do armazenamento
   * aparece para o navegador em momento nenhum.
   */
  app.get("/api/audio/:livroId/lista.m3u8", exigirConta, async (req, res) => {
    const livroId = Number(req.params.livroId);
    if (!Number.isInteger(livroId)) return res.status(400).json({ erro: "livro inválido" });

    const [livro] = await db
      .select({ id: livros.id, titulo: livros.titulo, mestre: livros.arquivoMestre })
      .from(livros)
      .where(eq(livros.id, livroId))
      .limit(1);

    /*
     * ⚠️ **Quem diz que há narração é `arquivoMestre`, NÃO a duração** (30/08).
     *
     * Até 21/08 os dois queriam dizer a mesma coisa: duração só existia depois
     * do `npm run audio`, que a media com ffprobe. Aí o acervo entrou trazendo
     * a duração **anunciada pela loja** — e hoje são **5.711 livros com duração
     * e nenhum com áudio**. Com o teste antigo, todos esses passavam por esta
     * porta e batiam no erro 500 lá embaixo ("o banco diz que tem áudio mas o
     * arquivo não está"), quando o certo é o 404 que oferece o pedido.
     */
    if (!livro || livro.mestre === null) {
      // 404 e não 403: este livro **não tem** narração, que é diferente de
      // existir e estar barrada. A tela precisa saber a diferença para
      // oferecer o pedido sob demanda em vez de dizer "sem permissão".
      return res.status(404).json({ erro: "Este livro ainda não tem narração.", podePedir: true });
    }

    const estourou = await registrarAbertura(contaDe(req), livroId, hojeDe(req));
    if (estourou) {
      return res.status(429).json({
        erro: `Você abriu mais de ${LIVROS_POR_DIA} livros hoje. Tente de novo amanhã.`,
        limite: "livros-por-dia",
      });
    }

    const chave = chaveDaLista(livroId);
    if (!(await armazenamento.existe(chave))) {
      // O banco diz que tem áudio e o armazenamento diz que não: alguém apagou
      // a pasta à mão, ou trocou AUDIO_RAIZ. Dizer isso em voz alta economiza
      // uma hora de investigação.
      return res.status(500).json({
        erro: "O banco diz que este livro tem áudio, mas o arquivo não está no armazenamento.",
        conserto: `npm run audio refazer ${livroId}`,
      });
    }

    let lista = "";
    for await (const pedaco of await armazenamento.abrir(chave)) lista += pedaco;

    const reescrita = lista
      .split("\n")
      .map((linha) => {
        const nome = linha.trim();
        if (nome.length === 0 || nome.startsWith("#")) return linha;
        return `/api/audio/${livroId}/${nome}`;
      })
      .join("\n");

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    // A lista é de quem pediu e não deve ficar em cache compartilhado nenhum.
    res.setHeader("Cache-Control", "private, no-store");
    return res.send(reescrita);
  });

  /**
   * **Como este livro pode ser ouvido** (31/08, §4.142).
   *
   * Três respostas possíveis, e a tela precisa das três separadas:
   * - `hls` — foi ingerido pelo `npm run audio`, toca em segmentos;
   * - `acervo` — não foi ingerido, mas os arquivos estão no acervo e o servidor
   *   os serve capítulo a capítulo;
   * - `sem-narracao` — não há áudio, e o certo é oferecer o pedido.
   *
   * 🚨 **O modo `acervo` existe porque converter o acervo não cabe.** São 1,34
   * TB e 29.319 horas; em HLS a 64 kbps dariam **840 GB ao lado**, num disco com
   * 179 GB livres. A conversão continua valendo para o que for para a nuvem —
   * ela é formato de ENTREGA REMOTA, e enquanto se testa na própria máquina
   * duplicar o acervo é trabalho e disco jogados fora.
   */
  app.get("/api/audio/:livroId/situacao", exigirConta, async (req, res) => {
    const livroId = Number(req.params.livroId);
    if (!Number.isInteger(livroId)) return res.status(400).json({ erro: "livro inválido" });

    const [livro] = await db
      .select({ mestre: livros.arquivoMestre, pasta: livros.pastaAcervo })
      .from(livros)
      .where(eq(livros.id, livroId))
      .limit(1);

    if (!livro) return res.status(404).json({ erro: "livro não encontrado", podePedir: true });
    if (livro.mestre !== null) return res.json({ modo: "hls" });

    if (livro.pasta) {
      const [{ quantos }] = await db
        .select({ quantos: sql<number>`count(*) filter (where arquivo is not null)::int` })
        .from(capitulos)
        .where(eq(capitulos.livroId, livroId));
      if (quantos > 0) return res.json({ modo: "acervo", capitulos: quantos });
    }

    return res.status(404).json({ erro: "Este livro ainda não tem narração.", podePedir: true });
  });

  /**
   * Um capítulo, servido **direto do acervo** — sem cópia e sem conversão.
   *
   * ⚠️ **O nome do arquivo nunca vem do pedido.** Ele é lido do banco e passa
   * por `basename` antes de virar caminho: sem isso, um `numero` qualquer não
   * ajudaria, mas um dia alguém passaria o nome pela URL e abriria a porta para
   * ler fora da pasta do livro.
   *
   * Suporta `Range` porque é ele que faz arrastar a barra funcionar — sem
   * resposta parcial, o navegador rebaixa a busca a "baixar tudo de novo".
   */
  app.get("/api/audio/:livroId/capitulo/:numero", exigirConta, async (req, res) => {
    const livroId = Number(req.params.livroId);
    const numero = Number(req.params.numero);
    if (!Number.isInteger(livroId) || !Number.isInteger(numero) || numero < 1) {
      return res.status(400).json({ erro: "pedido inválido" });
    }

    if (passouDaRajada(contaDe(req))) {
      return res.status(429).json({
        erro: "Muitos pedidos em pouco tempo. Espere um minuto.",
        limite: "pedacos-por-minuto",
      });
    }

    const [linha] = await db
      .select({ pasta: livros.pastaAcervo, arquivo: capitulos.arquivo })
      .from(capitulos)
      .innerJoin(livros, eq(livros.id, capitulos.livroId))
      .where(and(eq(capitulos.livroId, livroId), eq(capitulos.numero, numero)))
      .limit(1);

    if (!linha?.pasta || !linha.arquivo) {
      return res.status(404).json({ erro: "capítulo não encontrado" });
    }

    const caminho = path.join(linha.pasta, path.basename(linha.arquivo));
    const info = await stat(caminho).catch(() => null);
    if (!info?.isFile()) {
      return res.status(404).json({
        erro: "O arquivo deste capítulo não está no acervo.",
        caminho: path.basename(linha.arquivo),
      });
    }

    res.setHeader("Content-Type", tipoPeloNome(linha.arquivo));
    res.setHeader("Accept-Ranges", "bytes");
    // Privado: a permissão é de quem pediu, e o arquivo não muda.
    res.setHeader("Cache-Control", "private, max-age=3600");

    const range = req.headers.range;
    const pedaco = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
    if (pedaco) {
      const inicio = pedaco[1] ? Number(pedaco[1]) : 0;
      const fim = pedaco[2] ? Number(pedaco[2]) : info.size - 1;
      if (inicio >= info.size || fim >= info.size || inicio > fim) {
        res.setHeader("Content-Range", `bytes */${info.size}`);
        return res.status(416).end();
      }
      res.status(206);
      res.setHeader("Content-Range", `bytes ${inicio}-${fim}/${info.size}`);
      res.setHeader("Content-Length", String(fim - inicio + 1));
      return createReadStream(caminho, { start: inicio, end: fim }).pipe(res);
    }

    res.setHeader("Content-Length", String(info.size));
    return createReadStream(caminho).pipe(res);
  });

  /**
   * Um pedaço de ~6 segundos.
   *
   * É a rota mais chamada do app inteiro — um livro de 10h a chama 6.000 vezes —
   * então ela faz o mínimo: confere a sessão, conta a rajada e entrega.
   * Nenhuma consulta ao banco.
   */
  app.get("/api/audio/:livroId/:pedaco", exigirConta, async (req, res) => {
    const livroId = Number(req.params.livroId);
    const pedaco = String(req.params.pedaco);

    if (!Number.isInteger(livroId) || !NOME_DE_PEDACO.test(pedaco)) {
      return res.status(400).json({ erro: "pedido inválido" });
    }

    if (passouDaRajada(contaDe(req))) {
      return res.status(429).json({
        erro: "Muitos pedidos em pouco tempo. Espere um minuto.",
        limite: "pedacos-por-minuto",
      });
    }

    const chave = `${prefixoDaEntrega(livroId)}/${pedaco}`;

    /*
     * O caminho que ainda não existe, escrito hoje para a troca de provedor não
     * precisar tocar nesta rota: se o armazenamento sabe assinar, o navegador
     * vai buscar **direto lá**, com um endereço que vale um minuto.
     */
    const direto = await armazenamento.urlTemporaria(chave, SEGUNDOS_DE_ASSINATURA);
    if (direto) return res.redirect(302, direto);

    if (!(await armazenamento.existe(chave))) {
      return res.status(404).json({ erro: "pedaço não encontrado" });
    }

    res.setHeader("Content-Type", "video/mp2t");
    // Um pedaço nunca muda de conteúdo: deixar o navegador guardar poupa repedir
    // ao voltar 15 segundos. `private` porque a permissão é de quem pediu.
    res.setHeader("Cache-Control", "private, max-age=3600");
    return (await armazenamento.abrir(chave)).pipe(res);
  });
}
