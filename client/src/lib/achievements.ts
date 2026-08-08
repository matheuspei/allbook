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
 * conquista traz uma `medida` que lê os dados reais (`DadosDeConquista`, montado
 * em `lib/stats.ts` a partir do diário de audição, da lista e da comunidade).
 *
 * **A medida devolve `atual` e `alvo`, não um sim/não** — e é isso que permite
 * mostrar *o quanto falta* numa medalha ainda bloqueada. Uma grade só de ícones
 * apagados é uma lista de "não"; com progresso, vira caminho.
 *
 * **Raridade (25/07).** As 16 medalhas tinham o mesmo peso visual: "Primeira
 * Escuta", que se ganha em cinco minutos, era idêntica a "Milionário de
 * Minutos", que pede 500 horas. Quando tudo vale igual, nada vale. Agora cada
 * uma tem um `tier` — comum, rara ou lendária — com tratamento próprio
 * (`TIERS`), sóbrio: prata fria, cor da marca, e um dourado contido no topo.
 *
 * Duas metas mudaram porque eram **impossíveis de ganhar**: "Eclético" pedia 10
 * gêneros num catálogo de 8, e "Bem Falado" pedia *receber* 10 curtidas — sem
 * servidor ninguém curte você. Estão anotadas na própria definição.
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

/** Os quatro grupos — a tela do Perfil mostra as medalhas separadas por eles. */
export type AchievementCategory = "audicao" | "constancia" | "exploracao" | "comunidade";

export const CATEGORIAS: { key: AchievementCategory; label: string }[] = [
  { key: "audicao", label: "Audição" },
  { key: "constancia", label: "Constância" },
  { key: "exploracao", label: "Exploração" },
  { key: "comunidade", label: "Comunidade" },
];

/** O quanto a medalha é difícil — define o tratamento visual. */
export type AchievementTier = "comum" | "rara" | "lendaria";

/**
 * O visual de cada faixa. Sem degradê por ícone (o "arco-íris" que dá cara de
 * template): cada faixa tem **uma** cor sólida, e só a lendária ganha um brilho,
 * contido, porque é ela que precisa parecer rara.
 */
export const TIERS: Record<
  AchievementTier,
  { label: string; fundo: string; icone: string; texto: string; brilho: string }
> = {
  comum: {
    // Prata sólida, não um branco translúcido: com opacidade baixa a medalha
    // comum **ganha** ficava quase igual a uma bloqueada, e a hierarquia toda
    // perdia o sentido logo na primeira faixa.
    label: "Comum",
    fundo: "bg-[#b6bcc6]",
    icone: "text-black",
    texto: "text-white/60",
    brilho: "",
  },
  rara: {
    label: "Rara",
    fundo: "bg-primary",
    icone: "text-black",
    texto: "text-primary",
    brilho: "",
  },
  lendaria: {
    label: "Lendária",
    fundo: "bg-[#e3c169]",
    icone: "text-black",
    texto: "text-[#e3c169]",
    brilho: "shadow-[0_0_16px_rgba(227,193,105,0.35)]",
  },
};

/**
 * O que as medalhas precisam saber. Vem de `lib/stats.ts`, que junta o diário
 * de audição, a lista e a atividade na comunidade — nenhum destes números é
 * escrito à mão.
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

/** Como a tela escreve o progresso de cada medalha. */
export type FormatoDaMedida = "duracao" | "contagem" | "marco";

interface DefinicaoDeConquista {
  /** Identificador curto e estável — usado em `key`/`data-testid`. */
  id: string;
  label: string;
  /** O que a pessoa precisa fazer para ganhar. */
  description: string;
  icon: LucideIcon;
  category: AchievementCategory;
  tier: AchievementTier;
  formato: FormatoDaMedida;
  /** Onde você está e onde precisa chegar. */
  medida: (dados: DadosDeConquista) => { atual: number; alvo: number };
}

export interface Achievement extends DefinicaoDeConquista {
  unlocked: boolean;
  atual: number;
  alvo: number;
  /** 0 a 1 — o anel em volta da medalha bloqueada. */
  progresso: number;
  /** ISO de quando foi ganha, quando o app já tinha registro. */
  ganhaEm?: string;
}

/** Marco: vale 1 quando aconteceu, 0 enquanto não. */
const marco = (aconteceu: boolean) => ({ atual: aconteceu ? 1 : 0, alvo: 1 });

const definicoes: DefinicaoDeConquista[] = [
  // — Audição: quanto se ouve —
  {
    id: "primeira-escuta",
    label: "Primeira Escuta",
    description: "Ouça seu primeiro audiolivro na AllBook.",
    icon: Play,
    category: "audicao",
    tier: "comum",
    formato: "marco",
    medida: (d) => marco(d.segundos > 0),
  },
  {
    id: "maratonista",
    label: "Maratonista",
    // Era "3 horas seguidas, sem parar": o diário guarda o total do dia, não a
    // sessão, então a régua virou o dia — mensurável e igualmente difícil.
    description: "Ouça 3 horas em um mesmo dia.",
    icon: BookOpen,
    category: "audicao",
    tier: "rara",
    formato: "duracao",
    medida: (d) => ({ atual: d.maiorDiaSec, alvo: 3 * 3600 }),
  },
  {
    id: "centenario",
    label: "Centenário",
    description: "Alcance 100 horas ouvidas na AllBook.",
    icon: Trophy,
    category: "audicao",
    tier: "lendaria",
    formato: "duracao",
    medida: (d) => ({ atual: d.segundos, alvo: 100 * 3600 }),
  },
  {
    id: "milionario-de-minutos",
    label: "Milionário de Minutos",
    description: "Alcance 500 horas ouvidas — meio milhar!",
    icon: Crown,
    category: "audicao",
    tier: "lendaria",
    formato: "duracao",
    medida: (d) => ({ atual: d.segundos, alvo: 500 * 3600 }),
  },

  // — Constância: o hábito de voltar —
  {
    id: "constante",
    label: "Constante",
    description: "Ouça ao menos um dia por semana, 3 semanas seguidas.",
    icon: Flame,
    category: "constancia",
    tier: "rara",
    formato: "contagem",
    medida: (d) => ({ atual: d.sequenciaSemanas, alvo: 3 }),
  },
  {
    id: "coruja",
    label: "Coruja",
    description: "Ouça depois da meia-noite. A noite é sua.",
    icon: Moon,
    category: "constancia",
    tier: "comum",
    formato: "marco",
    medida: (d) => marco(d.ouviuDeMadrugada),
  },
  {
    id: "madrugador",
    label: "Madrugador",
    description: "Ouça antes das 7h da manhã, começando o dia bem.",
    icon: Sunrise,
    category: "constancia",
    tier: "comum",
    formato: "marco",
    medida: (d) => marco(d.ouviuAoAmanhecer),
  },
  {
    id: "sequencia-de-fogo",
    label: "Sequência de Fogo",
    description: "Ouça 7 dias seguidos, sem falhar nenhum.",
    icon: Zap,
    category: "constancia",
    tier: "lendaria",
    formato: "contagem",
    medida: (d) => ({ atual: d.melhorSequenciaDias, alvo: 7 }),
  },

  // — Exploração: variar e concluir —
  {
    id: "explorador",
    label: "Explorador",
    description: "Ouça livros de 5 gêneros diferentes.",
    icon: Compass,
    category: "exploracao",
    tier: "rara",
    formato: "contagem",
    medida: (d) => ({ atual: d.generosOuvidos, alvo: 5 }),
  },
  {
    id: "concluido",
    label: "Ponto Final",
    description: "Conclua seu primeiro livro, do começo ao fim.",
    icon: CheckCircle2,
    category: "exploracao",
    tier: "comum",
    formato: "marco",
    medida: (d) => marco(d.concluidos >= 1),
  },
  {
    id: "ecletico",
    label: "Eclético",
    // Pedia 10 gêneros, e o catálogo só tem 8 — era **impossível de ganhar**.
    // A meta virou "todos os gêneros", que é o teto real do acervo.
    description: "Ouça livros de todos os 8 gêneros do catálogo.",
    icon: Sparkles,
    category: "exploracao",
    tier: "lendaria",
    formato: "contagem",
    medida: (d) => ({ atual: d.generosOuvidos, alvo: 8 }),
  },
  {
    id: "colecionador",
    label: "Colecionador",
    description: "Tenha 10 livros na sua lista.",
    icon: Bookmark,
    category: "exploracao",
    tier: "rara",
    formato: "contagem",
    medida: (d) => ({ atual: d.naLista, alvo: 10 }),
  },

  // — Comunidade: o pulo do gato do engajamento —
  {
    id: "voz-ativa",
    label: "Voz Ativa",
    description: "Deixe seu primeiro comentário em um livro.",
    icon: MessageCircle,
    category: "comunidade",
    tier: "comum",
    formato: "marco",
    medida: (d) => marco(d.comentarios >= 1),
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
    tier: "rara",
    formato: "contagem",
    medida: (d) => ({ atual: d.curtidas, alvo: 10 }),
  },
  {
    id: "formador-de-roda",
    label: "Formador de Roda",
    description: "Siga 5 outros leitores da comunidade.",
    icon: Users,
    category: "comunidade",
    tier: "rara",
    formato: "contagem",
    medida: (d) => ({ atual: d.seguindo, alvo: 5 }),
  },
  {
    id: "recomendador",
    label: "Recomendador",
    description: "Recomende um livro para a comunidade.",
    icon: Star,
    category: "comunidade",
    tier: "comum",
    formato: "marco",
    medida: (d) => marco(d.recomendacoes >= 1),
  },
];

/** Quantas medalhas existem — o "de 16" do placar. */
export const achievements = definicoes;

/* ------------------------------------------------------------------ *
 * Quando cada medalha foi ganha
 * ------------------------------------------------------------------ */

const GANHAS_KEY = "allbook_achievements_won";

/** `{ [id]: ISO }` — a data em que cada medalha acendeu. Nunca quebra. */
export function readGanhas(): Record<string, string> {
  try {
    const guardado = JSON.parse(localStorage.getItem(GANHAS_KEY) || "{}");
    if (!guardado || typeof guardado !== "object" || Array.isArray(guardado)) return {};
    return guardado as Record<string, string>;
  } catch {
    return {};
  }
}

/** Avisa que um troféu foi ganho — o padrão de evento da casa (§4.122). */
export const ACHIEVEMENTS_EVENT = "allbook:conquistas";

function gravarGanhas(mapa: Record<string, string>): void {
  try {
    localStorage.setItem(GANHAS_KEY, JSON.stringify(mapa));
  } catch {
    // Sem storage a data se perde, mas a medalha continua acesa.
  }
  // Fora do try: mesmo sem conseguir gravar aqui, a conquista precisa subir
  // para a conta — é lá que ela passa a viver.
  window.dispatchEvent(new Event(ACHIEVEMENTS_EVENT));
}

/** As medalhas com o `unlocked`, o progresso e a data **decididos pelos dados**. */
export function achievementsFor(dados: DadosDeConquista): Achievement[] {
  const ganhas = readGanhas();

  return definicoes.map((item) => {
    const { atual, alvo } = item.medida(dados);
    const unlocked = atual >= alvo;
    return {
      ...item,
      atual,
      alvo,
      unlocked,
      progresso: alvo > 0 ? Math.min(atual / alvo, 1) : 0,
      ganhaEm: unlocked ? ganhas[item.id] : undefined,
    };
  });
}

/** Quantas já foram conquistadas — o "X de N" da tela. */
export function unlockedCountFor(dados: DadosDeConquista): number {
  return achievementsFor(dados).filter((item) => item.unlocked).length;
}

/**
 * Carimba a data das medalhas recém-ganhas e devolve **só as novas** — é assim
 * que o app sabe que tem uma novidade para anunciar.
 *
 * **A primeira sincronização é silenciosa de propósito.** Quem já vinha usando
 * (ou quem abre com o histórico de exemplo semeado) tem várias medalhas ganhas
 * de uma vez; anunciar todas de enfiada na primeira abertura seria ruído, não
 * comemoração. Então a primeira passada só registra.
 */
export function sincronizarConquistas(dados: DadosDeConquista): Achievement[] {
  const ganhas = readGanhas();
  const primeiraVez = Object.keys(ganhas).length === 0;
  const agora = new Date().toISOString();
  const novas: Achievement[] = [];

  for (const item of achievementsFor(dados)) {
    if (!item.unlocked || ganhas[item.id]) continue;
    ganhas[item.id] = agora;
    if (!primeiraVez) novas.push({ ...item, ganhaEm: agora });
  }

  gravarGanhas(ganhas);
  return novas;
}

/**
 * Só as medalhas que aparecem no perfil de **outro** leitor. Ali não há dados
 * reais para calcular (a comunidade é fictícia), então a lista vem por id.
 */
export function getAchievementsByIds(ids: string[]): DefinicaoDeConquista[] {
  return ids.flatMap((id) => {
    const item = definicoes.find((achievement) => achievement.id === id);
    return item ? [item] : [];
  });
}

/* ------------------------------------------------------------------ *
 * Selos — as medalhas como reputação, não como coleção
 * ------------------------------------------------------------------ */

const PESO_DO_TIER: Record<AchievementTier, number> = { lendaria: 3, rara: 2, comum: 1 };

/**
 * As `n` melhores medalhas de uma lista — as que viram **selo** ao lado do nome
 * na página pública (ROTEIRO 4.41: "reputação, não coleção"). Melhor = mais
 * rara; empate resolve pela ordem de definição, que já vai do cedo ao tarde.
 *
 * Recebe qualquer coisa com `tier` para servir às duas páginas: a sua (medalhas
 * calculadas, já filtradas por `unlocked`) e a de um membro da comunidade
 * (definições vindas de `getAchievementsByIds`).
 */
export function melhoresConquistas<T extends { tier: AchievementTier }>(
  itens: T[],
  n = 2,
): T[] {
  return [...itens].sort((a, b) => PESO_DO_TIER[b.tier] - PESO_DO_TIER[a.tier]).slice(0, n);
}
