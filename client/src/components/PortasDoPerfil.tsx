import { Link } from "wouter";
import { type LucideIcon } from "lucide-react";

/**
 * As três portas do topo do perfil — **recomendações, comentários e clubes**.
 *
 * ---
 *
 * **A decisão é da §4.56, e as palavras são do Matheus:** *"talvez a gente
 * poderia colocar um ícone na parte superior onde a pessoa pudesse ver o que
 * essa pessoa recomenda… você abre ali e leva para uma página"*. O que ele está
 * corrigindo é o perfil ter virado uma rolagem de blocos: três listas empilhadas
 * empurravam para baixo o que interessa — **os posts** —, e nenhuma delas cabia
 * inteira ali (a de comentários mostrava três linhas de dezenas).
 *
 * **Porta é melhor que bloco quando o conteúdo não cabe.** É a mesma régua da
 * §4.55 (bloco expandido onde bastava uma porta), agora aplicada à vitrine.
 *
 * **O número faz parte da porta**, e não é enfeite: "12 recomendações" é o que
 * faz alguém querer abrir; uma porta sem número não diz se há algo do outro
 * lado. Porta com zero fica apagada mas **continua ali** — na sua página ela é
 * onde se começa, e sumir esconderia justamente isso.
 *
 * **Componente único para a sua página e a dos outros**, pela régua da §4.41:
 * duas cópias divergem com o tempo, e foi assim que o perfil dos membros ficou
 * sem as novidades em 28/07.
 */
export interface PortaDoPerfil {
  icone: LucideIcon;
  rotulo: string;
  total: number;
  href: string;
  testid: string;
}

export default function PortasDoPerfil({ portas }: { portas: PortaDoPerfil[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-5 py-4" data-testid="portas-do-perfil">
      {portas.map(({ icone: Icone, rotulo, total, href, testid }) => (
        <Link
          key={testid}
          href={href}
          className={`flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-2 py-3 text-center transition-colors hover:bg-white/[0.07] ${
            total === 0 ? "opacity-45" : ""
          }`}
          data-testid={testid}
        >
          <Icone className="h-[18px] w-[18px] text-primary" />
          <span className="font-display text-[15px] font-bold leading-none">{total}</span>
          <span className="text-[10px] leading-tight text-white/45">{rotulo}</span>
        </Link>
      ))}
    </div>
  );
}
