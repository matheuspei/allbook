/**
 * Onde os arquivos de áudio moram — **atrás de uma interface**, de propósito.
 *
 * ---
 *
 * ## Por que existe esta camada (08/08, §4.128)
 *
 * O Matheus levantou a preocupação de o AllBook ser derrubado por depender de um
 * fornecedor. A resposta honesta é que **nenhum provedor é imune** — a própria
 * Cloudflare já cortou clientes por decisão sua. A defesa que funciona não é
 * achar a fortaleza certa, é **não depender de nenhuma**, e ela tem duas pernas:
 *
 * 1. **O mestre é dele, no disco dele** (a regra já vinha da §4.34).
 * 2. **O código fala com esta interface, nunca com um fornecedor.** Hoje só
 *    existe a `PastaLocal`. Amanhã, o mesmo código roda contra R2, Backblaze B2,
 *    Wasabi ou Hetzner — todos falam o protocolo S3 — mudando **três variáveis
 *    no `.env`**, sem reescrever tela, rota nem script.
 *
 * É por isso que nada aqui devolve URL de provedor: quem sabe montar endereço é
 * a rota de entrega, não quem guarda o arquivo.
 *
 * ## As duas gavetas, e por que são separadas
 *
 * ```
 *   <raiz>/mestres/<livroId>/…      o que o estúdio entregou. NUNCA é servido.
 *   <raiz>/entrega/<livroId>/…      os segmentos que o app toca (gerados).
 *   <raiz>/vinhetas/…               abertura e fecho do AllBook.
 * ```
 *
 * A gaveta `mestres` é a única irreversível: com ela em mãos, `entrega` pode ser
 * refeita inteira a qualquer momento rodando a ingestão de novo. Por isso a
 * ingestão **copia o mestre antes de processar qualquer coisa** — se o `ffmpeg`
 * falhar no meio, o original já está a salvo.
 */

import { createReadStream } from "node:fs";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { Readable } from "node:stream";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

try {
  process.loadEnvFile();
} catch {
  /* sem `.env`: as variáveis vêm do ambiente, como em produção */
}

/* -------------------------------------------------------------------------- */
/* A interface — é ela que dá a portabilidade                                  */
/* -------------------------------------------------------------------------- */

/**
 * O contrato que qualquer lugar de armazenamento tem de cumprir.
 *
 * Deliberadamente pequeno: seis operações que existem igual em disco local e em
 * qualquer serviço S3. Um método a mais que só o disco saiba fazer (caminho
 * absoluto, link simbólico) reintroduziria a dependência que a interface existe
 * para evitar.
 */
export interface Armazenamento {
  /** Como aparece nos avisos do terminal ("pasta local", "R2"…). */
  readonly nome: string;
  /** Onde fica, em palavras — só para o terminal explicar o que fez. */
  readonly onde: string;

  /** Copia um arquivo do disco para a chave. Cria o caminho se faltar. */
  guardar(chave: string, arquivoDeOrigem: string): Promise<void>;
  /** Copia uma pasta inteira do disco para baixo de um prefixo. Devolve quantos. */
  guardarPasta(prefixo: string, pastaDeOrigem: string): Promise<number>;
  /** Abre a chave para leitura em fluxo — servir sem carregar na memória. */
  abrir(chave: string): Promise<Readable>;
  existe(chave: string): Promise<boolean>;
  /** Tamanho em bytes. Lança se a chave não existe. */
  tamanho(chave: string): Promise<number>;
  /** Apaga tudo que está sob o prefixo. Silencioso se já não havia nada. */
  apagar(prefixo: string): Promise<void>;
  /** As chaves sob um prefixo, em ordem. */
  listar(prefixo: string): Promise<string[]>;
  /**
   * Um endereço temporário que o **navegador** pode buscar direto, sem passar
   * pelo servidor. `null` quando o lugar não sabe fazer isso.
   *
   * ⚠️ **É o único método que existe pensando no amanhã, e não é enfeite.** Numa
   * pasta local a resposta é sempre `null` e o Express serve os bytes ele mesmo.
   * Num S3 ela devolve a URL assinada, e a rota passa a **redirecionar** — o
   * áudio vai do provedor direto para o ouvinte, sem atravessar o servidor duas
   * vezes. É a diferença entre pagar banda uma vez e pagar duas, e o único jeito
   * de a troca de provedor não virar reescrita da rota (§4.128).
   */
  urlTemporaria(chave: string, segundos: number): Promise<string | null>;
}

/* -------------------------------------------------------------------------- */

/**
 * ⚠️ **A única defesa que o disco local não tem sozinho.**
 *
 * Num serviço S3 a chave é só um nome; num disco, `../../.ssh/id_rsa` sai da
 * pasta e lê o que quiser. A chave hoje nasce sempre do nosso código, mas **a
 * rota de entrega vai receber pedaço de chave pela URL** — e é exatamente aí que
 * este tipo de furo aparece. Barrar na porta é mais barato que lembrar depois.
 */
function conferirChave(chave: string): string {
  if (chave.length === 0) throw new Error("chave vazia");
  if (chave.startsWith("/") || path.isAbsolute(chave)) {
    throw new Error(`chave não pode ser caminho absoluto: ${chave}`);
  }
  // `normalize` resolve os `..`; se sobrar algum, a chave queria sair da raiz.
  const limpa = path.normalize(chave);
  if (limpa.startsWith("..") || limpa.includes(`..${path.sep}`)) {
    throw new Error(`chave tenta sair da pasta: ${chave}`);
  }
  return limpa;
}

/* -------------------------------------------------------------------------- */
/* A implementação de hoje: uma pasta no disco                                 */
/* -------------------------------------------------------------------------- */

class PastaLocal implements Armazenamento {
  readonly nome = "pasta local";

  constructor(private readonly raiz: string) {}

  get onde(): string {
    return this.raiz;
  }

  private caminho(chave: string): string {
    return path.join(this.raiz, conferirChave(chave));
  }

  async guardar(chave: string, arquivoDeOrigem: string): Promise<void> {
    const destino = this.caminho(chave);
    await mkdir(path.dirname(destino), { recursive: true });
    await copyFile(arquivoDeOrigem, destino);
  }

  async guardarPasta(prefixo: string, pastaDeOrigem: string): Promise<number> {
    const itens = await readdir(pastaDeOrigem, { withFileTypes: true });
    let quantos = 0;
    for (const item of itens) {
      const origem = path.join(pastaDeOrigem, item.name);
      const chave = `${prefixo}/${item.name}`;
      if (item.isDirectory()) {
        quantos += await this.guardarPasta(chave, origem);
      } else {
        await this.guardar(chave, origem);
        quantos++;
      }
    }
    return quantos;
  }

  async abrir(chave: string): Promise<Readable> {
    const caminho = this.caminho(chave);
    // Conferir antes de abrir dá erro claro em vez de um fluxo que morre depois.
    await stat(caminho);
    return createReadStream(caminho);
  }

  async existe(chave: string): Promise<boolean> {
    try {
      await stat(this.caminho(chave));
      return true;
    } catch {
      return false;
    }
  }

  async tamanho(chave: string): Promise<number> {
    return (await stat(this.caminho(chave))).size;
  }

  async apagar(prefixo: string): Promise<void> {
    await rm(this.caminho(prefixo), { recursive: true, force: true });
  }

  /**
   * Uma pasta no disco não tem endereço que o navegador alcance — quem serve os
   * bytes é o Express. Devolver `null` aqui é o que faz a rota escolher o
   * caminho certo sem saber onde o arquivo mora.
   */
  async urlTemporaria(): Promise<string | null> {
    return null;
  }

  async listar(prefixo: string): Promise<string[]> {
    const base = this.caminho(prefixo);
    let itens;
    try {
      itens = await readdir(base, { withFileTypes: true });
    } catch {
      return [];
    }
    const chaves: string[] = [];
    for (const item of itens.sort((a, b) => a.name.localeCompare(b.name))) {
      const chave = `${prefixo}/${item.name}`;
      if (item.isDirectory()) chaves.push(...(await this.listar(chave)));
      else chaves.push(chave);
    }
    return chaves;
  }
}

/* -------------------------------------------------------------------------- */
/* A implementação de nuvem: qualquer serviço que fale S3                      */
/* -------------------------------------------------------------------------- */

/**
 * O mesmo contrato, contra um balde S3 — hoje o **Cloudflare R2** (§4.135).
 *
 * Nada aqui é específico da Cloudflare de propósito: trocar por Backblaze B2,
 * Wasabi ou um MinIO na própria máquina é mudar `AUDIO_S3_ENDPOINT` no `.env`.
 * O que decidiu a Cloudflare foi a camada de rede da entrega, não a API — e
 * essa parte não mora aqui.
 */
class S3Compativel implements Armazenamento {
  readonly nome = "S3";
  private readonly cliente: S3Client;

  constructor(
    private readonly endpoint: string,
    private readonly balde: string,
    chave: string,
    segredo: string,
  ) {
    this.cliente = new S3Client({
      /*
       * ⚠️ **A armadilha que faz a primeira subida falhar (§1.7c do
       * PLANO-ACERVO).** As versões novas do SDK mandam uma soma de verificação
       * CRC32 em todo `PUT`, e a R2 **recusa** o pedido — com um erro que não
       * diz isso. `WHEN_REQUIRED` só a manda quando o próprio protocolo exige.
       * O equivalente em Python (`boto3` ≥ 1.36) já tinha mordido o baixalivro.
       */
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
      /*
       * A R2 não tem região de verdade — ela mora no endpoint. `auto` é o que a
       * Cloudflare documenta; o B2 põe a região dentro do próprio endereço.
       */
      region: process.env.AUDIO_S3_REGIAO || "auto",
      endpoint,
      credentials: { accessKeyId: chave, secretAccessKey: segredo },
    });
  }

  get onde(): string {
    // Sem credencial no texto: isto vai para o log do terminal.
    return `${this.balde} em ${new URL(this.endpoint).host}`;
  }

  async guardar(chave: string, arquivoDeOrigem: string): Promise<void> {
    const limpa = conferirChave(chave);
    /*
     * `ContentLength` explícito, e não é preciosismo: com um fluxo sem tamanho
     * o SDK carrega o arquivo inteiro na memória para poder assinar. Um mestre
     * de 600 MB derrubaria o processo.
     */
    const { size } = await stat(arquivoDeOrigem);
    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.balde,
        Key: limpa,
        Body: createReadStream(arquivoDeOrigem),
        ContentLength: size,
        ContentType: tipoDoArquivo(limpa),
      }),
    );
  }

  async guardarPasta(prefixo: string, pastaDeOrigem: string): Promise<number> {
    const itens = await readdir(pastaDeOrigem, { withFileTypes: true });
    let quantos = 0;
    for (const item of itens) {
      const origem = path.join(pastaDeOrigem, item.name);
      const chave = `${prefixo}/${item.name}`;
      if (item.isDirectory()) quantos += await this.guardarPasta(chave, origem);
      else {
        await this.guardar(chave, origem);
        quantos++;
      }
    }
    return quantos;
  }

  async abrir(chave: string): Promise<Readable> {
    const r = await this.cliente.send(
      new GetObjectCommand({ Bucket: this.balde, Key: conferirChave(chave) }),
    );
    if (!r.Body) throw new Error(`chave sem corpo: ${chave}`);
    return r.Body as Readable;
  }

  async existe(chave: string): Promise<boolean> {
    try {
      await this.cliente.send(
        new HeadObjectCommand({ Bucket: this.balde, Key: conferirChave(chave) }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async tamanho(chave: string): Promise<number> {
    const r = await this.cliente.send(
      new HeadObjectCommand({ Bucket: this.balde, Key: conferirChave(chave) }),
    );
    if (r.ContentLength === undefined) throw new Error(`sem tamanho: ${chave}`);
    return r.ContentLength;
  }

  /**
   * Apagar em S3 é listar e apagar em lotes — não existe "apague a pasta".
   * O lote é de 1000 porque é o teto da API; um livro em HLS passa disso.
   */
  async apagar(prefixo: string): Promise<void> {
    const chaves = await this.listar(prefixo);
    for (let i = 0; i < chaves.length; i += 1000) {
      await this.cliente.send(
        new DeleteObjectsCommand({
          Bucket: this.balde,
          Delete: { Objects: chaves.slice(i, i + 1000).map((Key) => ({ Key })) },
        }),
      );
    }
  }

  /**
   * ⚠️ **Paginar não é opcional.** A API devolve no máximo 1000 chaves por vez
   * e avisa com `IsTruncated`. Ignorar isso dá uma lista silenciosamente curta
   * — e um livro que some do meio para o fim sem erro nenhum.
   */
  async listar(prefixo: string): Promise<string[]> {
    const chaves: string[] = [];
    let token: string | undefined;
    do {
      const r = await this.cliente.send(
        new ListObjectsV2Command({
          Bucket: this.balde,
          Prefix: conferirChave(prefixo),
          ContinuationToken: token,
        }),
      );
      for (const o of r.Contents ?? []) if (o.Key) chaves.push(o.Key);
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return chaves.sort((a, b) => a.localeCompare(b));
  }

  /**
   * A URL assinada — o método que existia esperando este dia (§4.128).
   *
   * A rota de áudio passa a **redirecionar** para cá em vez de servir os bytes,
   * e o segmento vai do R2 direto para o ouvinte. É a diferença entre pagar
   * banda uma vez e pagar duas.
   */
  async urlTemporaria(chave: string, segundos: number): Promise<string | null> {
    return getSignedUrl(
      this.cliente,
      new GetObjectCommand({ Bucket: this.balde, Key: conferirChave(chave) }),
      { expiresIn: segundos },
    );
  }
}

/**
 * O tipo do arquivo, para o navegador não ter de adivinhar.
 *
 * Só os quatro que a entrega usa. Um `.m3u8` servido como `octet-stream` faz
 * alguns players simplesmente não tocarem, sem erro.
 */
function tipoDoArquivo(chave: string): string | undefined {
  const ext = path.extname(chave).toLowerCase();
  if (ext === ".m3u8") return "application/vnd.apple.mpegurl";
  if (ext === ".ts") return "video/mp2t";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a" || ext === ".m4b") return "audio/mp4";
  return undefined;
}

/* -------------------------------------------------------------------------- */
/* A fábrica — o único lugar que sabe qual implementação está em uso           */
/* -------------------------------------------------------------------------- */

/**
 * Onde a pasta fica.
 *
 * **Fora do repositório**, como as cópias do banco (§4.126): áudio-mestre é o
 * ativo mais caro do projeto e não pode virar `git push` distraído. O padrão
 * aponta para a pasta pessoal; o Matheus tem dois discos externos, e o dia em
 * que quiser mudar é uma linha no `.env`:
 *
 * ```
 *   AUDIO_RAIZ=/Volumes/AllBook/audio
 * ```
 */
const RAIZ = (() => {
  /*
   * ⚠️ **`??` não basta aqui, e o teste provou (08/08).** O `.env` nasce com
   * `AUDIO_RAIZ=` (vazio) para documentar a variável — e string vazia **não** é
   * `undefined`, então o `??` a aceitava. `path.join("", "mestres/1/…")` vira
   * caminho **relativo**, e a primeira ingestão gravou os mestres **dentro do
   * repositório**, que é exatamente o que o comentário acima manda evitar.
   */
  const escolhida = process.env.AUDIO_RAIZ?.trim();
  const raiz = escolhida && escolhida.length > 0 ? escolhida : path.join(homedir(), "AllBook-audio");
  if (!path.isAbsolute(raiz)) {
    throw new Error(
      `AUDIO_RAIZ tem de ser um caminho absoluto (veio "${raiz}"). ` +
        "Relativo grava dentro do repositório, e áudio-mestre não entra no git.",
    );
  }
  return raiz;
})();

/**
 * ⚠️ **Duas gavetas, dois lugares — e a diferença vale ~R$ 400 por mês.**
 *
 * A regra 1 do §1.7 do `PLANO-ACERVO` é curta: **o mestre nunca sobe.** Ele
 * dobra o tamanho do acervo (~10,4 TB contra ~5,2 TB), e não serve para nada na
 * nuvem — ninguém o escuta, ele existe para a entrega poder ser refeita em casa.
 *
 * Um armazenamento só para as duas coisas faria a ingestão mandar o mestre
 * junto no instante em que `AUDIO_S3_ENDPOINT` aparecesse no `.env`, sem erro
 * nenhum e sem ninguém perceber — até a fatura. Por isso são dois:
 *
 * - `armazenamentoDeMestres` — **sempre o disco**, o HD dele. Também guarda a
 *   vinheta, que é insumo de produção e nunca é servida a ninguém.
 * - `armazenamento` — a **entrega**: a lista e os segmentos que o app toca. É a
 *   única que vai para a nuvem, e a única que precisa de URL assinada.
 */
export const armazenamentoDeMestres: Armazenamento = new PastaLocal(RAIZ);

/**
 * A entrega — **a escolha de provedor acontece aqui, e só aqui** (§4.128).
 *
 * Sem `AUDIO_S3_ENDPOINT`, é a mesma pasta local: dá para desenvolver o projeto
 * inteiro sem credencial nenhuma. Com ele, é o balde:
 *
 * ```
 *   AUDIO_S3_ENDPOINT=https://<conta>.r2.cloudflarestorage.com
 *   AUDIO_S3_BALDE=allbook-audio
 *   AUDIO_S3_CHAVE=…
 *   AUDIO_S3_SEGREDO=…
 * ```
 */
export const armazenamento: Armazenamento = (() => {
  const endpoint = process.env.AUDIO_S3_ENDPOINT?.trim();
  if (!endpoint) return armazenamentoDeMestres;

  const balde = process.env.AUDIO_S3_BALDE?.trim();
  const chave = process.env.AUDIO_S3_CHAVE?.trim();
  const segredo = process.env.AUDIO_S3_SEGREDO?.trim();

  /*
   * Falhar aqui, alto, é de propósito. Credencial pela metade não dá erro na
   * subida — dá `AccessDenied` no meio de um lote de milhares de arquivos,
   * depois de já ter gasto escrita paga.
   */
  if (!balde || !chave || !segredo) {
    throw new Error(
      "AUDIO_S3_ENDPOINT está definido, mas falta AUDIO_S3_BALDE, " +
        "AUDIO_S3_CHAVE ou AUDIO_S3_SEGREDO no `.env`.",
    );
  }
  return new S3Compativel(endpoint, balde, chave, segredo);
})();

/* -------------------------------------------------------------------------- */
/* Os nomes das chaves — num lugar só, para os dois lados concordarem          */
/* -------------------------------------------------------------------------- */

/**
 * O mestre de um livro. **Nunca servido** — só a ingestão lê daqui.
 *
 * O nome original do arquivo é preservado porque ele costuma carregar o número e
 * o título do capítulo, que é a única pista de ordem que o estúdio manda junto.
 */
export function chaveDoMestre(livroId: number, nomeDoArquivo: string): string {
  return `mestres/${livroId}/${path.basename(nomeDoArquivo)}`;
}

/** A pasta de entrega de um livro: a lista e os segmentos que o app toca. */
export function prefixoDaEntrega(livroId: number): string {
  return `entrega/${livroId}`;
}

/** A lista de reprodução (HLS) que o player pede primeiro. */
export function chaveDaLista(livroId: number): string {
  return `${prefixoDaEntrega(livroId)}/lista.m3u8`;
}

/**
 * A vinheta do AllBook.
 *
 * ⚠️ **Ela ainda não existe** — a §4.35 adiou a criação por ser trabalho de
 * identidade de marca, não de código. A ingestão funciona sem ela (grava
 * `vinhetaSegundos = 0`) e avisa; quando o arquivo aparecer aqui, basta rodar a
 * ingestão de novo, porque o mestre está guardado.
 */
export function chaveDaVinheta(qual: "abertura" | "fecho"): string {
  return `vinhetas/${qual}.mp3`;
}

/** Só para o terminal dizer onde as coisas estão sem repetir o caminho. */
export function ondeFica(): string {
  if (armazenamento === armazenamentoDeMestres) {
    return `${armazenamento.nome} — ${armazenamento.onde}`;
  }
  return (
    `entrega: ${armazenamento.nome} — ${armazenamento.onde}\n` +
    `mestres: ${armazenamentoDeMestres.nome} — ${armazenamentoDeMestres.onde}`
  );
}
