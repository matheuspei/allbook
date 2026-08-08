import type { LucideIcon } from "lucide-react";

import { TIERS, type AchievementTier } from "@/lib/achievements";

/**
 * Uma medalha como **selo** — a pílula pequena ao lado do nome na página
 * pública (a sua e a de outro leitor).
 *
 * É a resposta ao "mosaico de 16" apontado em 28/07 (ROTEIRO 4.41): para quem
 * visita, a coleção inteira é planilha; dois selos escolhidos são reputação. A
 * grade completa continua existindo, em `/achievements`.
 *
 * As cores vêm de `TIERS`, as mesmas da grade e do painel — se a mesma medalha
 * mudasse de aparência conforme a tela, deixaria de significar alguma coisa
 * (a regra da 4.20).
 */
export default function SeloDeMedalha({
  icon: Icon,
  label,
  tier,
}: {
  icon: LucideIcon;
  label: string;
  tier: AchievementTier;
}) {
  const cores = TIERS[tier];

  return (
    <span
      /*
        O selo é uma ilha escura nos DOIS temas (`sobre-midia` + preto de
        verdade). As cores de `TIERS` são metálicas — prata, carmim, dourado — e
        metal só brilha sobre escuro: no tema claro, o dourado sobre o papel
        creme ficava com 1,9 de contraste, ilegível.
      */
      className={`sobre-midia inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${cores.texto}`}
      title={`${label} · ${cores.label}`}
      data-testid={`selo-${label.toLowerCase().replace(/ /g, "-")}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {label}
    </span>
  );
}
