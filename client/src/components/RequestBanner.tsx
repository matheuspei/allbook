import { Link } from "wouter";
import { ChevronRight, Mic } from "lucide-react";

import { REQUEST_PROMISE } from "@/lib/requests";

/**
 * A chamada para pedir um livro que ainda não existe em áudio.
 *
 * **Por que ela existe (25/07, ver ROTEIRO 4.18).** Pedir um livro é o
 * diferencial do AllBook, e a porta estava escondida: só aparecia na busca — e,
 * pior, **só quando a busca não achava nada**, o que quase nunca acontecia,
 * porque a busca antiga casava qualquer coisa com qualquer coisa. Nas palavras
 * do Matheus: "sendo o principal diferencial do aplicativo, isso deveria ficar
 * mais visível do que está hoje".
 *
 * **Onde ela aparece hoje: só no topo da Busca.** Ela também morou na Início,
 * logo abaixo do billboard, e de lá saiu em 26/07 (ver ROTEIRO 4.18): naquele
 * ponto ela cortava o degradê do destaque, e o fundo atrás dela **muda a cada
 * capa que passa**. A porta principal do pedido virou o botão "Pedir" do menu
 * de baixo, que aparece em toda tela. Esta faixa continua na Busca porque ali
 * ela chega no momento certo — a pessoa está justamente procurando um título.
 *
 * **Sem estrelinha nem varinha:** o ícone é um microfone. Ver ROTEIRO 4.17 e a
 * seção "Estilo: evitar a cara de IA".
 *
 * **Fundo sólido, e isso é conserto de um defeito real (25/07).** A primeira
 * versão usava `bg-primary/10` — laranja translúcido, que sumia sobre capa
 * terrosa e brigava com capa esverdeada. Nas palavras do Matheus: *"as cores
 * vão se misturando de acordo com as capas que vão passando"*. Cor translúcida
 * encostada em fundo que muda nunca fica boa — agora o corpo é o mesmo cinza
 * dos cartões do app, opaco, e o laranja da marca fica só no ícone e na seta.
 * A variante `destaque` (bloco maior) ficou sem uso quando a faixa saiu da
 * Início; está de pé para a próxima tela que precisar do formato grande.
 */
export default function RequestBanner({
  /** `destaque` na Início (bloco maior); `discreto` no topo da Busca. */
  variante = "destaque",
  className = "",
}: {
  variante?: "destaque" | "discreto";
  className?: string;
}) {
  const ehDestaque = variante === "destaque";

  return (
    <Link
      href="/request"
      className={`flex items-center gap-3 rounded-xl border border-white/10 bg-card transition-colors hover:bg-[#242424] active:bg-secondary ${
        ehDestaque ? "p-4" : "p-3"
      } ${className}`}
      data-testid="banner-request"
    >
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground ${
          ehDestaque ? "h-11 w-11" : "h-9 w-9"
        }`}
      >
        <Mic className={ehDestaque ? "h-5 w-5" : "h-4 w-4"} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block font-display font-bold tracking-tight text-white ${
            ehDestaque ? "text-base" : "text-sm"
          }`}
        >
          Não tem o livro que você quer?
        </span>
        <span
          className={`block leading-snug text-white/60 ${ehDestaque ? "text-[13px]" : "text-[12px]"}`}
        >
          O AllBook narra qualquer título {REQUEST_PROMISE}. Peça o seu.
        </span>
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-primary/70" />
    </Link>
  );
}
