import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Lock, UserMinus, UserPlus, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { type CommunityMember, avatarDeLeitor } from "@/lib/community";
import {
  SEGUIDORES_EVENT,
  aceitarPedido,
  meusSeguidores,
  pedidosPendentes,
  recusarPedido,
  removerSeguidor,
} from "@/lib/seguidores";
import { readSettings } from "@/lib/settings";

/**
 * Quem te segue (`/seguidores`) — e a fila de quem pediu.
 *
 * Pedido do Matheus em 29/07 (ROTEIRO 4.54): *"a página onde a pessoa possa ver
 * quem está seguindo ela e que ela possa ir lá e tirar de seguir, tal como
 * acontece hoje no Instagram"*.
 *
 * **Por que remover um seguidor importa tanto quanto aceitar.** É a peça que só
 * dói depois: sem ela, um "sim" dado às pressas vale para sempre, e a conta
 * privada vira uma tranca que só funciona no dia em que se instala. Fica aqui,
 * ao lado de cada nome, e não escondida num submenu.
 *
 * **A aba "Pedidos" só existe com a conta privada ligada.** Com a conta pública
 * seguir é imediato — uma fila vazia ali prometeria um controle que não existe,
 * e é o tipo de tela morta que a §4.23 mandou varrer.
 *
 * ⚠️ **Maquete:** os seguidores e os pedidos vêm de `community.ts` (gente
 * fictícia), porque não há servidor. O que você faz aqui vale de verdade dentro
 * do protótipo. O que o backend precisa entregar está em
 * `docs/BANCO-DE-DADOS.md`, seção "Etapa 2 — seguidores e conta privada".
 */
export default function Seguidores() {
  const { toast } = useToast();
  const [privada, setPrivada] = useState(false);
  const [seguidores, setSeguidores] = useState<CommunityMember[]>([]);
  const [pedidos, setPedidos] = useState<CommunityMember[]>([]);
  const [aba, setAba] = useState<"seguidores" | "pedidos">("seguidores");

  useEffect(() => {
    const atualizar = () => {
      const contaPrivada = readSettings().contaPrivada;
      setPrivada(contaPrivada);
      setSeguidores(meusSeguidores());
      setPedidos(pedidosPendentes(contaPrivada));
    };
    atualizar();
    window.addEventListener(SEGUIDORES_EVENT, atualizar);
    return () => window.removeEventListener(SEGUIDORES_EVENT, atualizar);
  }, []);

  /*
   * Quem chega com pedido na fila quer ver a fila; **quando ela esvazia, a tela
   * volta para a lista.** A segunda metade é conserto de um defeito que só
   * apareceu testando: respondido o último pedido, as abas somem (não há mais
   * escolha a fazer) mas o conteúdo continuava filtrado por "pedidos" — e a
   * tela dizia "Ninguém ainda" com quatro seguidores logo abaixo.
   */
  useEffect(() => {
    setAba(pedidos.length > 0 ? "pedidos" : "seguidores");
  }, [pedidos.length]);

  const lista = aba === "pedidos" ? pedidos : seguidores;

  return (
    <div className="min-h-screen bg-background pb-24 text-white" data-testid="seguidores-page">
      <PageHeader title="Quem te segue" fallback="/you" />

      <main className="px-5 pt-4">
        {/* O estado da tranca, dito aqui também: é nesta tela que ele tem
            consequência visível, e ninguém devia ter de lembrar de cor. */}
        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <Lock className={`mt-0.5 h-4 w-4 shrink-0 ${privada ? "text-primary" : "text-white/30"}`} />
          <p className="text-xs leading-relaxed text-white/50">
            {privada ? (
              <>
                <b className="text-white/85">Conta privada.</b> Quem quiser te seguir precisa da sua
                aprovação. Só quem você aceitar vê o que você está ouvindo, comentando e avaliando.
              </>
            ) : (
              <>
                <b className="text-white/85">Conta pública.</b> Qualquer pessoa pode te seguir, e
                quem segue vê a sua atividade. Para aprovar um a um, ligue{" "}
                <Link href="/you" className="font-semibold text-primary">
                  Conta privada
                </Link>{" "}
                no painel.
              </>
            )}
          </p>
        </div>

        {pedidos.length > 0 && (
          <div className="mt-4 flex gap-2">
            {(["pedidos", "seguidores"] as const).map((qual) => (
              <button
                key={qual}
                onClick={() => setAba(qual)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  aba === qual
                    ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
                    : "bg-white/[0.06] text-white/55 ring-1 ring-inset ring-white/8 hover:text-white/85"
                }`}
                data-testid={`aba-${qual}`}
              >
                {qual === "pedidos"
                  ? `Pedidos · ${pedidos.length}`
                  : `Seguidores · ${seguidores.length}`}
              </button>
            ))}
          </div>
        )}

        <p className="mt-4 text-sm text-white/45">
          {aba === "pedidos"
            ? `${pedidos.length} ${pedidos.length === 1 ? "pessoa quer" : "pessoas querem"} te seguir`
            : `${seguidores.length} ${seguidores.length === 1 ? "pessoa segue" : "pessoas seguem"} você`}
        </p>

        {lista.length === 0 ? (
          <div className="mt-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]">
              <UserPlus className="h-6 w-6 text-white/35" />
            </div>
            <h2 className="mt-4 font-display text-base font-bold">Ninguém ainda</h2>
            <p className="mx-auto mt-2 max-w-[290px] text-sm leading-relaxed text-white/45">
              As pessoas costumam te achar pelo que você escreve: comente num livro ou publique um
              trecho, e quem gostar vem atrás.
            </p>
            <Link
              href="/community"
              className="mt-5 inline-block rounded-xl bg-white/[0.07] px-5 py-2.5 text-xs font-bold transition-colors hover:bg-white/12"
            >
              Ir para o Feed
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {lista.map((pessoa) => (
              <div
                key={pessoa.slug}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] p-3"
                data-testid={`linha-${pessoa.slug}`}
              >
                <Link href={`/user/${pessoa.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${pessoa.color} font-display text-sm font-bold`} {...avatarDeLeitor(pessoa.slug)}
                  >
                    {pessoa.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold">
                      {pessoa.name}
                    </span>
                    <span className="block truncate text-[11.5px] text-white/40">{pessoa.bio}</span>
                  </span>
                </Link>

                {aba === "pedidos" ? (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => {
                        aceitarPedido(pessoa.slug);
                        toast({
                          title: `${pessoa.name} agora te segue`,
                          description: "Passa a ver o que você ouve, comenta e avalia.",
                        });
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full bg-primary text-black transition-transform active:scale-95"
                      aria-label={`Aceitar ${pessoa.name}`}
                      data-testid={`aceitar-${pessoa.slug}`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => {
                        recusarPedido(pessoa.slug);
                        toast({ title: "Pedido recusado", description: "Ela não é avisada disso." });
                      }}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-white/60 transition-colors hover:text-white"
                      aria-label={`Recusar ${pessoa.name}`}
                      data-testid={`recusar-${pessoa.slug}`}
                    >
                      <X className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      removerSeguidor(pessoa.slug);
                      toast({
                        title: `${pessoa.name} não te segue mais`,
                        description: "Ela não é avisada. Pode pedir de novo se quiser.",
                      });
                    }}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-2 text-[11px] font-semibold text-white/50 transition-colors hover:bg-white/12 hover:text-white"
                    data-testid={`remover-${pessoa.slug}`}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dito uma vez, no rodapé: silêncio é a regra nos dois casos, e é o que
            faz remover alguém ser uma decisão fácil de tomar. */}
        {lista.length > 0 && (
          <p className="mt-5 text-center text-[11px] leading-relaxed text-white/25">
            Ninguém é avisado quando você recusa ou remove.
          </p>
        )}
      </main>
    </div>
  );
}
