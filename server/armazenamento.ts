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

import { createReadStream, createWriteStream } from "node:fs";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { Readable } from "node:stream";

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
 * O armazenamento em uso.
 *
 * ⚠️ **Quando entrar um provedor S3, é AQUI que a escolha acontece** — uma
 * classe `S3Compativel` implementando a mesma interface e um `if` sobre
 * `process.env.AUDIO_S3_ENDPOINT`. Nada mais no projeto muda, e é esse o ponto
 * inteiro desta camada (§4.128).
 */
export const armazenamento: Armazenamento = new PastaLocal(RAIZ);

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
  return `${armazenamento.nome} — ${armazenamento.onde}`;
}
