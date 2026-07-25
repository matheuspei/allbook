/**
 * As conquistas (troféus) do perfil.
 *
 * Antes eram quatro, embutidas em `Profile.tsx` e de propósito discretas. O
 * Matheus pediu o contrário: **muitas conquistas, como medalhas de verdade**,
 * cobrindo várias frentes do uso — e principalmente puxando a pessoa para a
 * comunidade (comentar, curtir, seguir, recomendar). Este arquivo é a fonte
 * única delas.
 *
 * **Cada medalha tem uma regra, e ela decide sozinha (25/07).** Até aqui o
 * `unlocked` era marcado à mão — um conjunto plausível para o perfil de exemplo
 * (47h, 5 títulos, 3 semanas, 2 concluídos) que **não respondia ao uso**: dava
 * para nunca ter aberto um livro e mesmo assim exibir seis troféus. Agora cada
 * conquista traz um `check` que lê os dados reais (`DadosDeConquista`, montado
 * em `lib/stats.ts` a partir do diário de audição, da lista e da comunidade).
 *
 * Duas metas mudaram porque eram **impossíveis de ganhar**: "Eclético" pedia 10
 * gêneros num catálogo de 8, e "Bem Falado" pedia *receber* 10 curtidas — sem
 * servidor ninguém curte você. Estão anotadas na própria definição.
 *
 * A `description` é a dica do que fazer para ganhar — a tela mostra ela ao tocar
 * na medalha, o que ajuda o engajamento (a pessoa vê a meta que falta).
 */

import {
  Play,
  BookOpen,
  Trophy,
  Crown,
  Flame,
  Moon,
  Sunrise,
  Zap,
  Compass,
  Sparkles,
  Bookmark,
  CheckCircle2,
  MessageCircle,
  Heart,
  Users,
  Star,
  type LucideIcon,
} from "lucide-react";

/** Os quatro grupos, só para organizar (a tela ainda mostra todas juntas). */
export type AchievementCategory = "audicao" | "constancia" | "exploracao" | "comunidade";

/**
 * O que uma conquista precisa saber para decidir se está ganha. Vem de
 * `lib/stats.ts`, que junta o diário de audição, a lista e a atividade na
 * comunidade — nenhum destes números é escrito à mão.
 */
export interface DadosDeConquista {
  /** Segundos ouvidos no total. */
  segundos: number;
  /** O dia mais cheio: segundos ouvidos nele. */
  maiorDiaSec: number;
  sequenciaSemanas: number;
  melhorSequenciaDias: number;
  /** Houve audição entre 0h e 4h. */
  ouviuDeMadrugada: boolean;
  /** Houve audição entre 4h e 7h. */
  ouviuAoAmanhecer: boolean;
  /** Gêneros diferentes que já apareceram na sua audição. */
  generosOuvidos: number;
  concluidos: number;
  naLista: number;
  comentarios: number;
  /** Curtidas que **você** deu em comentários. */
  curtidas: number;
  seguindo: number;
  recomendacoes: number;
}

export interface Achievement {
  /** Identificador curto e estável — usado em `key`/`data-testid`. */
  id: string;
  label: string;
  /** O que a pessoa precisa fazer para ganhar. */
  description: string;
  icon: LucideIcon;
  category: AchievementCategory;
  /** A regra da medalha — é ela que decide, a partir dos dados reais. */
  check: (dados: DadosDeConquista) => boolean;
  /** Preenchido por `achievementsFor`. */
  unlocked: boolean;
}

/** As definições. `unlocked` aqui é só o valor de partida — quem decide é `check`. */
const definicoes: Achievement[] = [
  // — Audição: quanto se ouve —
  {
    id: "primeira-escuta",
    label: "Primeira Escuta",
    description: "Ouça seu primeiro audiolivro na AllBook.",
    icon: Play,
    category: "audicao",
    check: (d) => d.segundos > 0,
    unlocked: false,
  },
  {
    id: "maratonista",
    label: "Maratonista",
    // Era "3 horas seguidas, sem parar": o diário guarda o total do dia, não a
    // sessão, então a régua virou o dia — mensurável e igualmente difícil.
    description: "Ouça 3 horas em um mesmo dia.",
    icon: BookOpen,
    category: "audicao",
    check: (d) => d.maiorDiaSec >= 3 * 3600,
    unlocked: false,
  },
  {
    id: "centenario",
    label: "Centenário",
    description: "Alcance 100 horas ouvidas na AllBook.",
    icon: Trophy,
    category: "audicao",
    check: (d) => d.segundos >= 100 * 3600,
    unlocked: false,
  },
  {
    id: "milionario-de-minutos",
    label: "Milionário de Minutos",
    description: "Alcance 500 horas ouvidas — meio milhar!",
    icon: Crown,
    category: "audicao",
    check: (d) => d.segundos >= 500 * 3600,
    unlocked: false,
  },

  // — Constância: o hábito de voltar —
  {
    id: "constante",
    label: "Constante",
    description: "Ouça ao menos um dia por semana, 3 semanas seguidas.",
    icon: Flame,
    category: "constancia",
    check: (d) => d.sequenciaSemanas >= 3,
    unlocked: false,
  },
  {
    id: "coruja",
    label: "Coruja",
    description: "Ouça depois da meia-noite. A noite é sua.",
    icon: Moon,
    category: "constancia",
    check: (d) => d.ouviuDeMadrugada,
    unlocked: false,
  },
  {
    id: "madrugador",
    label: "Madrugador",
    description: "Ouça antes das 7h da manhã, começando o dia bem.",
    icon: Sunrise,
    category: "constancia",
    check: (d) => d.ouviuAoAmanhecer,
    unlocked: false,
  },
  {
    id: "sequencia-de-fogo",
    label: "Sequência de Fogo",
    description: "Ouça 7 dias seguidos, sem falhar nenhum.",
    icon: Zap,
    category: "constancia",
    check: (d) => d.melhorSequenciaDias >= 7,
    unlocked: false,
  },

  // — Exploração: variar e concluir —
  {
    id: "explorador",
    label: "Explorador",
    description: "Ouça livros de 5 gêneros diferentes.",
    icon: Compass,
    category: "exploracao",
    check: (d) => d.generosOuvidos >= 5,
    unlocked: false,
  },
  {
    id: "concluido",
    label: "Ponto Final",
    description: "Conclua seu primeiro livro, do começo ao fim.",
    icon: CheckCircle2,
    category: "exploracao",
    check: (d) => d.concluidos >= 1,
    unlocked: false,
  },
  {
    id: "ecletico",
    label: "Eclético",
    // Pedia 10 gêneros, e o catálogo só tem 8 — era **impossível de ganhar**.
    // A meta virou "todos os gêneros", que é o teto real do acervo.
    description: "Ouça livros de todos os 8 gêneros do catálogo.",
    icon: Sparkles,
    category: "exploracao",
    check: (d) => d.generosOuvidos >= 8,
    unlocked: false,
  },
  {
    id: "colecionador",
    label: "Colecionador",
    description: "Tenha 10 livros na sua lista.",
    icon: Bookmark,
    category: "exploracao",
    check: (d) => d.naLista >= 10,
    unlocked: false,
  },

  // — Comunidade: o pulo do gato do engajamento —
  {
    id: "voz-ativa",
    label: "Voz Ativa",
    description: "Deixe seu primeiro comentário em um livro.",
    icon: MessageCircle,
    category: "comunidade",
    check: (d) => d.comentarios >= 1,
    unlocked: false,
  },
  {
    id: "curtido",
    label: "Bom Público",
    // Era "receba 10 curtidas nos seus comentários" — sem servidor, ninguém
    // curte de verdade, então a medalha nunca poderia ser ganha. Virou o gesto
    // que **existe** hoje: curtir os outros.
    description: "Curta 10 comentários da comunidade.",
    icon: Heart,
    category: "comunidade",
    check: (d) => d.curtidas >= 10,
    unlocked: false,
  },
  {
    id: "formador-de-roda",
    label: "Formador de Roda",
    description: "Siga 5 outros leitores da comunidade.",
    icon: Users,
    category: "comunidade",
    check: (d) => d.seguindo >= 5,
    unlocked: false,
  },
  {
    id: "recomendador",
    label: "Recomendador",
    description: "Recomende um livro para a comunidade.",
    icon: Star,
    category: "comunidade",
    check: (d) => d.recomendacoes >= 1,
    unlocked: false,
  },
];

/** Todas as medalhas, ainda sem julgar — para contar o total ("X de 16"). */
export const achievements: Achievement[] = definicoes;

/** As medalhas com o `unlocked` **decidido pelos seus dados**. */
export function achievementsFor(dados: DadosDeConquista): Achievement[] {
  return definicoes.map((item) => ({ ...item, unlocked: item.check(dados) }));
}

/** Quantas já foram conquistadas — o "X de N" da tela. */
export function unlockedCountFor(dados: DadosDeConquista): number {
  return definicoes.reduce((total, item) => total + (item.check(dados) ? 1 : 0), 0);
}

/** Só as conquistadas — usadas para "estampar" os troféus no topo do perfil. */
export function unlockedAchievementsFor(dados: DadosDeConquista): Achievement[] {
  return achievementsFor(dados).filter((item) => item.unlocked);
}

/**
 * Conquistas a partir de uma lista de ids, na ordem pedida e sem ids órfãos.
 * Usada pelos perfis dos leitores da comunidade, que guardam só os ids.
 */
export function getAchievementsByIds(ids: string[]): Achievement[] {
  return ids.flatMap((id) => {
    const found = achievements.find((item) => item.id === id);
    return found ? [found] : [];
  });
}
