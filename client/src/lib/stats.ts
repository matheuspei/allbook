/**
 * O resumo que as Estatísticas e o Perfil mostram — calculado, nunca escrito.
 *
 * Existe para os dois lugares **contarem a mesma história**: antes o Perfil
 * dizia "47h · 5 títulos · 3 sem. · 2 concluídos" e a tela de Estatísticas
 * repetia os mesmos números, ambos fixos no código e sem relação com o uso.
 * Aqui eles saem das três fontes reais — o diário de audição
 * (`listening.ts`), o progresso por livro (`playback.ts`) e a lista salva
 * (`library.ts`).
 *
 * Este módulo fica **acima** dos outros de propósito: ele importa os três, e
 * nenhum deles importa este. `playback.ts` já credita o diário, então uma
 * dependência de volta fecharia um ciclo.
 */

import { catalog, type Genre } from "@/lib/books";
import { readLibrary } from "@/lib/library";
import {
  diaISO,
  garantirDiario,
  melhorSequenciaDeDias,
  porLivro,
  segundosNaJanela,
  sequenciaDeDias,
  sequenciaDeSemanas,
  temExemplo,
  totalSegundos,
  type Diario,
} from "@/lib/listening";
import { playbackPercent, readPlaybackList } from "@/lib/playback";

/** Acima disto o livro conta como concluído — os últimos minutos são créditos. */
export const CONCLUIDO_PERCENT = 98;

export interface ResumoDeAudicao {
  diario: Diario;
  /** Segundos ouvidos desde sempre. */
  segundos: number;
  /** Livros que já foram abertos no player. */
  titulosComecados: number;
  concluidos: number;
  /** Dias seguidos ouvindo, contando de hoje (ou de ontem) para trás. */
  sequenciaDias: number;
  melhorSequencia: number;
  sequenciaSemanas: number;
  /** Últimos 21 dias, do mais antigo ao mais novo: houve audição? */
  ultimos21: boolean[];
  /** Quantos títulos estão na "Minha lista". */
  naLista: number;
  /** Segundos ouvidos nos últimos 7 dias e nos 7 anteriores. */
  estaSemana: number;
  semanaPassada: number;
  /** Ainda há dias de demonstração no diário. */
  temExemplo: boolean;
}

export function lerResumo(): ResumoDeAudicao {
  const diario = garantirDiario();
  const progresso = readPlaybackList();
  const hoje = new Date();

  const ultimos21: boolean[] = [];
  for (let atras = 20; atras >= 0; atras--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - atras);
    ultimos21.push((diario[diaISO(data)]?.sec ?? 0) > 0);
  }

  /**
   * "Títulos começados" é a união de duas evidências: os livros que aparecem
   * no diário (você ouviu algum tempo deles) e os que têm posição salva. Contar
   * só o progresso deixava a tela incoerente — dava para ver "45h ouvidas" ao
   * lado de "0 títulos começados" quando o histórico vinha do diário.
   */
  const comecados = new Set<number>(progresso.map((item) => item.bookId));
  for (const { bookId } of porLivro(diario)) comecados.add(bookId);

  return {
    diario,
    segundos: totalSegundos(diario),
    titulosComecados: comecados.size,
    concluidos: progresso.filter((item) => playbackPercent(item) >= CONCLUIDO_PERCENT).length,
    sequenciaDias: sequenciaDeDias(diario, hoje),
    melhorSequencia: melhorSequenciaDeDias(diario),
    sequenciaSemanas: sequenciaDeSemanas(diario, hoje),
    ultimos21,
    naLista: readLibrary().length,
    estaSemana: segundosNaJanela(diario, 6, 0),
    semanaPassada: segundosNaJanela(diario, 13, 7),
    temExemplo: temExemplo(diario),
  };
}

export interface FatiaDeGenero {
  genero: Genre;
  sec: number;
  /** Fração do total ouvido, de 0 a 1. */
  parte: number;
}

/** Os gêneros que você mais ouviu, do maior para o menor. */
export function generosMaisOuvidos(diario: Diario): FatiaDeGenero[] {
  const soma = new Map<Genre, number>();
  let total = 0;

  for (const { bookId, sec } of porLivro(diario)) {
    const livro = catalog.find((item) => item.id === bookId);
    if (!livro) continue;
    soma.set(livro.genre, (soma.get(livro.genre) ?? 0) + sec);
    total += sec;
  }

  if (total === 0) return [];

  return Array.from(soma.entries())
    .map(([genero, sec]) => ({ genero, sec, parte: sec / total }))
    .sort((a, b) => b.sec - a.sec);
}

export interface PessoaMaisOuvida {
  nome: string;
  sec: number;
  /** Quantos títulos diferentes dessa pessoa você ouviu. */
  titulos: number;
}

/**
 * Quem você mais ouviu — `campo` escolhe entre quem escreveu e quem narra.
 * São perguntas diferentes, e num app de audiolivro a segunda importa tanto
 * quanto a primeira.
 */
export function pessoaMaisOuvida(
  diario: Diario,
  campo: "author" | "narrator"
): PessoaMaisOuvida | null {
  const soma = new Map<string, { sec: number; livros: Set<number> }>();

  for (const { bookId, sec } of porLivro(diario)) {
    const livro = catalog.find((item) => item.id === bookId);
    if (!livro) continue;
    const nome = livro[campo];
    const atual = soma.get(nome) ?? { sec: 0, livros: new Set<number>() };
    atual.sec += sec;
    atual.livros.add(bookId);
    soma.set(nome, atual);
  }

  const melhor = Array.from(soma.entries()).sort((a, b) => b[1].sec - a[1].sec)[0];
  if (!melhor) return null;

  return { nome: melhor[0], sec: melhor[1].sec, titulos: melhor[1].livros.size };
}
