/**
 * As conquistas (troféus) do perfil.
 *
 * Antes eram quatro, embutidas em `Profile.tsx` e de propósito discretas. O
 * Matheus pediu o contrário: **muitas conquistas, como medalhas de verdade**,
 * cobrindo várias frentes do uso — e principalmente puxando a pessoa para a
 * comunidade (comentar, curtir, seguir, recomendar). Este arquivo é a fonte
 * única delas.
 *
 * **`unlocked` ainda é fixo (mock).** Não existe backend para calcular o que a
 * pessoa realmente fez, então marcamos à mão um conjunto plausível para o perfil
 * de exemplo (47h ouvidas, 5 títulos, 3 semanas de sequência, 2 concluídos).
 * Quando a API existir, é aqui que cada `unlocked` passa a ser calculado de
 * verdade a partir da audição, da biblioteca e da atividade na comunidade.
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

export interface Achievement {
  /** Identificador curto e estável — usado em `key`/`data-testid`. */
  id: string;
  label: string;
  /** O que a pessoa precisa fazer para ganhar. */
  description: string;
  icon: LucideIcon;
  category: AchievementCategory;
  /** Fixo por enquanto (ver o comentário do topo). */
  unlocked: boolean;
}

export const achievements: Achievement[] = [
  // — Audição: quanto se ouve —
  {
    id: "primeira-escuta",
    label: "Primeira Escuta",
    description: "Você ouviu seu primeiro audiolivro na AllBook.",
    icon: Play,
    category: "audicao",
    unlocked: true,
  },
  {
    id: "maratonista",
    label: "Maratonista",
    description: "Ouviu por mais de 3 horas seguidas, sem parar.",
    icon: BookOpen,
    category: "audicao",
    unlocked: true,
  },
  {
    id: "centenario",
    label: "Centenário",
    description: "Alcance 100 horas ouvidas na AllBook.",
    icon: Trophy,
    category: "audicao",
    unlocked: false,
  },
  {
    id: "milionario-de-minutos",
    label: "Milionário de Minutos",
    description: "Alcance 500 horas ouvidas — meio milhar!",
    icon: Crown,
    category: "audicao",
    unlocked: false,
  },

  // — Constância: o hábito de voltar —
  {
    id: "constante",
    label: "Constante",
    description: "Ouviu ao menos um dia por semana, 3 semanas seguidas.",
    icon: Flame,
    category: "constancia",
    unlocked: true,
  },
  {
    id: "coruja",
    label: "Coruja",
    description: "Ouviu depois da meia-noite. A noite é sua.",
    icon: Moon,
    category: "constancia",
    unlocked: true,
  },
  {
    id: "madrugador",
    label: "Madrugador",
    description: "Ouça antes das 7h da manhã, começando o dia bem.",
    icon: Sunrise,
    category: "constancia",
    unlocked: false,
  },
  {
    id: "sequencia-de-fogo",
    label: "Sequência de Fogo",
    description: "Ouça 7 dias seguidos, sem falhar nenhum.",
    icon: Zap,
    category: "constancia",
    unlocked: false,
  },

  // — Exploração: variar e concluir —
  {
    id: "explorador",
    label: "Explorador",
    description: "Ouviu livros de 5 gêneros diferentes.",
    icon: Compass,
    category: "exploracao",
    unlocked: true,
  },
  {
    id: "concluido",
    label: "Ponto Final",
    description: "Concluiu seu primeiro livro, do começo ao fim.",
    icon: CheckCircle2,
    category: "exploracao",
    unlocked: true,
  },
  {
    id: "ecletico",
    label: "Eclético",
    description: "Ouça livros de 10 gêneros diferentes.",
    icon: Sparkles,
    category: "exploracao",
    unlocked: false,
  },
  {
    id: "colecionador",
    label: "Colecionador",
    description: "Adicione 10 livros à sua lista.",
    icon: Bookmark,
    category: "exploracao",
    unlocked: false,
  },

  // — Comunidade: o pulo do gato do engajamento —
  {
    id: "voz-ativa",
    label: "Voz Ativa",
    description: "Deixe seu primeiro comentário em um livro.",
    icon: MessageCircle,
    category: "comunidade",
    unlocked: false,
  },
  {
    id: "curtido",
    label: "Bem Falado",
    description: "Receba 10 curtidas nos seus comentários.",
    icon: Heart,
    category: "comunidade",
    unlocked: false,
  },
  {
    id: "formador-de-roda",
    label: "Formador de Roda",
    description: "Siga 5 outros leitores da comunidade.",
    icon: Users,
    category: "comunidade",
    unlocked: false,
  },
  {
    id: "recomendador",
    label: "Recomendador",
    description: "Recomende um livro para a comunidade.",
    icon: Star,
    category: "comunidade",
    unlocked: false,
  },
];

/** Quantas já foram conquistadas — o "X de N" da tela. */
export const unlockedCount = achievements.filter((item) => item.unlocked).length;
