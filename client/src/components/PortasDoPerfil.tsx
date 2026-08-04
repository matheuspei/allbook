import { Link } from "wouter";
import { EyeOff } from "lucide-react";

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
 *
 * **Sem ícone, e com letra maior, desde 04/08** — quando as portas chegaram à
 * tela de clubes, o Matheus vetou: *"eu tiraria esses ícones laranjas… as
 * letras estão muito pequenas, não faz sentido essa proporção"*. O número e o
 * rótulo são a porta inteira; o ícone repetia o que o rótulo já diz.
 */
export interface PortaDoPerfil {
  rotulo: string;
  total: number;
  href: string;
  testid: string;
  /**
   * **Você desligou esta porta** na folha do lápis (§4.95).
   *
   * Ela **continua na sua página**, apagada e com o olho cortado, e some para
   * quem visita (quem chama filtra antes de passar a lista). Sumir para você
   * também seria tirar o seu próprio caminho para os seus comentários — e, pior,
   * deixaria você sem saber que a escondeu.
   */
  escondida?: boolean;
}

export default function PortasDoPerfil({ portas }: { portas: PortaDoPerfil[] }) {
  return (
    /* A grade acompanha quantas portas vierem — a sua página tem quatro desde
       31/07 (entrou "acompanhando"), a dos outros continua com três. Classe
       dinâmica do Tailwind não existe em tempo de execução, daí o `style`. */
    <div
      className="grid gap-2 px-5 py-4"
      style={{ gridTemplateColumns: `repeat(${portas.length}, minmax(0, 1fr))` }}
      data-testid="portas-do-perfil"
    >
      {portas.map(({ rotulo, total, href, testid, escondida }) => (
        <Link
          key={testid}
          href={href}
          className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors ${
            escondida
              ? "border-dashed border-white/[0.12] bg-transparent opacity-40 hover:opacity-70"
              : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07]"
          } ${total === 0 && !escondida ? "opacity-45" : ""}`}
          data-testid={testid}
        >
          {/* O olho cortado é o que diz *por que* a porta está apagada — sem ele,
              "apagada" já quer dizer "vazia" nesta mesma grade. */}
          {escondida && (
            <EyeOff className="absolute right-1.5 top-1.5 h-3 w-3 text-white/40" aria-label="escondida de quem visita" />
          )}
          <span className="font-display text-lg font-bold leading-none">{total}</span>
          <span className="text-xs leading-tight text-white/50">{rotulo}</span>
        </Link>
      ))}
    </div>
  );
}
