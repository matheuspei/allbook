/**
 * A pauta — o moderador põe **qualquer assunto** em votação.
 *
 * **Por que ela existe** (ROTEIRO 4.40): o Matheus pediu em 28/07 que o dono do
 * clube tivesse muita autonomia, e uma das três coisas foi *"colocar alguma
 * coisa em pauta, em votação, se ele quiser"*. Até aqui o clube só sabia votar
 * **o próximo livro** — uma votação de três capas, presa ao ciclo, que o
 * moderador nem abria.
 *
 * **Pauta e votação do próximo livro são coisas diferentes, e ficam separadas.**
 * A votação do próximo livro **muda o estado do clube**: quando encerra, o
 * vencedor vira o ciclo e o anterior vai para a estante. A pauta não muda nada
 * sozinha — ela é o grupo tomando uma decisão que o moderador executa ("mudamos
 * o ritmo para 6 semanas?", "abrimos mais vagas?", "pulamos a rodada esta
 * semana?"). Fundir as duas faria a mais inofensiva das duas herdar o poder de
 * trocar o livro de todo mundo.
 *
 * **Número aberto, nome fechado** — a mesma regra da votação do livro e da régua
 * de progresso: você vê quantos votos cada opção teve, nunca quem votou em quê.
 * Voto com nome numa turma pequena não é voto, é declaração pública, e as
 * pessoas passam a votar no que pega bem.
 */

import { EU, diasAte, type Clube } from "@/lib/clubes";

export const PAUTAS_EVENT = "allbook:pautas";

export interface Pauta {
  id: string;
  clubeId: string;
  pergunta: string;
  /** De 2 a 4 opções. Uma não é escolha; cinco ninguém lê antes de votar. */
  opcoes: string[];
  /** ISO curto: até quando dá para votar. */
  fecha: string;
  /** ISO completo de quando foi aberta — a semente do voto simulado. */
  criadaEm: string;
}

export const MAX_PERGUNTA = 140;
export const MAX_OPCAO = 60;
export const MIN_OPCOES = 2;
export const MAX_OPCOES = 4;

/* ------------------------------------------------------------------ *
 * O que é seu.
 * ------------------------------------------------------------------ */

const CHAVE = "allbook_pautas";

interface EstadoLocal {
  /** Pautas que você abriu nos clubes que modera. */
  criadas: Pauta[];
  /** O seu voto: id da pauta → índice da opção. */
  votos: Record<string, number>;
  /** Pautas encerradas por você antes do prazo. */
  encerradas: string[];
}

const VAZIO: EstadoLocal = { criadas: [], votos: {}, encerradas: [] };

function readEstado(): EstadoLocal {
  try {
    const guardado = JSON.parse(localStorage.getItem(CHAVE) || "null");
    if (!guardado || typeof guardado !== "object") return VAZIO;
    return {
      criadas: Array.isArray(guardado.criadas) ? guardado.criadas : [],
      votos: guardado.votos ?? {},
      encerradas: Array.isArray(guardado.encerradas) ? guardado.encerradas : [],
    };
  } catch {
    return VAZIO;
  }
}

function salvar(estado: EstadoLocal): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* sem storage a pauta não persiste; a tela já mostrou o resultado */
  }
  window.dispatchEvent(new Event(PAUTAS_EVENT));
}

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ *
 * Leitura.
 * ------------------------------------------------------------------ */

/** A pauta aberta de um clube. Uma por vez: duas votações ao mesmo tempo não se decidem. */
export function pautaAberta(clubeId: string): Pauta | undefined {
  const estado = readEstado();
  return estado.criadas.find(
    (pauta) =>
      pauta.clubeId === clubeId &&
      !estado.encerradas.includes(pauta.id) &&
      diasAte(pauta.fecha) >= 0,
  );
}

/** O que o clube já decidiu — o histórico, do mais recente para o mais antigo. */
export function pautasEncerradas(clubeId: string): Pauta[] {
  const estado = readEstado();
  return estado.criadas
    .filter(
      (pauta) =>
        pauta.clubeId === clubeId &&
        (estado.encerradas.includes(pauta.id) || diasAte(pauta.fecha) < 0),
    )
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
}

export function meuVotoNaPauta(pautaId: string): number | undefined {
  return readEstado().votos[pautaId];
}

/**
 * Semente estável — o mesmo membro, na mesma pauta, vota sempre igual.
 *
 * **O voto dos outros é simulado, e a tela diz isso.** Sem servidor não existe
 * voto de ninguém além do seu, e uma pauta que mostra "1 voto" para sempre não
 * deixa ver o mecanismo. É a mesma escolha (e a mesma honestidade declarada) do
 * progresso simulado dos membros em `clubes.ts`. Estável, para a apuração não
 * dançar a cada desenho da tela.
 */
function votoSimulado(slug: string, pauta: Pauta): number {
  const texto = `${slug}@${pauta.id}`;
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = (hash * 31 + texto.charCodeAt(i)) | 0;
  return Math.abs(hash) % pauta.opcoes.length;
}

/**
 * Quantos votos cada opção tem, na ordem em que foram escritas.
 *
 * A ordem **não** é por número de votos, ao contrário da votação de livros: aqui
 * as opções costumam ser uma escala ("4, 6 ou 8 semanas") e reordenar por
 * popularidade tornaria a leitura confusa a cada voto novo.
 */
export function apuracaoDaPauta(
  pauta: Pauta,
  clube: Clube,
): { opcao: string; indice: number; votos: number }[] {
  const meu = meuVotoNaPauta(pauta.id);

  const contagem = pauta.opcoes.map(() => 0);
  for (const slug of clube.membros) {
    const indice = slug === EU ? meu : votoSimulado(slug, pauta);
    if (indice !== undefined && indice < contagem.length) contagem[indice] += 1;
  }

  return pauta.opcoes.map((opcao, indice) => ({ opcao, indice, votos: contagem[indice] }));
}

/** Quantos já votaram — o número que diz se a decisão tem peso. */
export function totalDeVotos(pauta: Pauta, clube: Clube): number {
  return apuracaoDaPauta(pauta, clube).reduce((soma, item) => soma + item.votos, 0);
}

/** A opção na frente. Empate devolve a primeira escrita, e a tela avisa. */
export function opcaoVencedora(pauta: Pauta, clube: Clube): { opcao: string; votos: number; empatada: boolean } {
  const apuracao = [...apuracaoDaPauta(pauta, clube)].sort((a, b) => b.votos - a.votos);
  const topo = apuracao[0];
  const empatada = apuracao.length > 1 && apuracao[1].votos === topo.votos;
  return { opcao: topo.opcao, votos: topo.votos, empatada };
}

/* ------------------------------------------------------------------ *
 * Escrita — poderes do moderador.
 * ------------------------------------------------------------------ */

/**
 * Abrir uma pauta. Devolve a pauta criada, ou `undefined` se faltou conteúdo.
 *
 * Três dias por padrão, o mesmo da rodada e pelo mesmo motivo: menos exclui quem
 * só abre o app no fim de semana; mais e a decisão perde a hora de ser tomada.
 */
export function abrirPauta(
  clubeId: string,
  pergunta: string,
  opcoes: string[],
  dias = 3,
): Pauta | undefined {
  const limpa = pergunta.trim().slice(0, MAX_PERGUNTA);
  const limpas = opcoes
    .map((opcao) => opcao.trim().slice(0, MAX_OPCAO))
    .filter((opcao) => opcao.length > 0)
    .slice(0, MAX_OPCOES);

  if (!limpa || limpas.length < MIN_OPCOES) return undefined;

  const pauta: Pauta = {
    id: `pt-${Date.now()}`,
    clubeId,
    pergunta: limpa,
    opcoes: limpas,
    fecha: daquiA(dias),
    criadaEm: new Date().toISOString(),
  };

  const estado = readEstado();
  salvar({ ...estado, criadas: [pauta, ...estado.criadas] });
  return pauta;
}

export function votarNaPauta(pautaId: string, indice: number): void {
  const estado = readEstado();
  salvar({ ...estado, votos: { ...estado.votos, [pautaId]: indice } });
}

export function encerrarPauta(pautaId: string): void {
  const estado = readEstado();
  if (estado.encerradas.includes(pautaId)) return;
  salvar({ ...estado, encerradas: [...estado.encerradas, pautaId] });
}

/** Sugestões para quem quer abrir uma pauta e travou na pergunta. */
export const PAUTAS_SUGERIDAS: { pergunta: string; opcoes: string[] }[] = [
  { pergunta: "Qual deve ser o ritmo do próximo livro?", opcoes: ["4 semanas", "6 semanas", "8 semanas"] },
  { pergunta: "Abrimos mais vagas no clube?", opcoes: ["Sim, chamem gente", "Não, ficamos assim"] },
  { pergunta: "O que fazemos com quem está atrasado?", opcoes: ["Esperamos", "Seguimos e ele alcança"] },
  { pergunta: "Próximo gênero?", opcoes: ["Suspense", "Ficção científica", "Não ficção"] },
];
