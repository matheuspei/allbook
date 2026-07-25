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
 * É um componente, e não código repetido em cada tela, porque aparece em mais de
 * um lugar (Início e Busca) e a mensagem tem de ser a mesma nos dois.
 *
 * **Sem estrelinha nem varinha:** o ícone é um microfone. Ver ROTEIRO 4.17 e a
 * seção "Estilo: evitar a cara de IA".
 *
 * **Fundo sólido, e isso é conserto de um defeito real (25/07).** A primeira
 * versão usava `bg-primary/10` — laranja translúcido. Na Início a faixa fica
 * logo abaixo do billboard, cuja cor **muda a cada capa que passa**: com uma
 * capa terrosa o laranja sumia, com uma esverdeada brigava. Nas palavras do
 * Matheus: *"as cores vão se misturando de acordo com as capas que vão
 * passando"*. Cor translúcida encostada em fundo que muda nunca fica boa —
 * agora o corpo é o mesmo cinza dos cartões do app, opaco, e o laranja da marca
 * fica só no ícone e na seta, onde chama atenção sem competir.
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
      className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#1e1e1e] transition-colors hover:bg-[#242424] active:bg-[#2a2a2a] ${
        ehDestaque ? "p-4" : "p-3"
      } ${className}`}
      data-testid="banner-request"
    >
      <span
        className={`grid shrink-0 place-items-center rounded-lg bg-primary/20 ring-1 ring-primary/30 ${
          ehDestaque ? "h-11 w-11" : "h-9 w-9"
        }`}
      >
        <Mic className={ehDestaque ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary"} />
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
