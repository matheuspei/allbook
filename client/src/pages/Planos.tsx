import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Gift, Headphones, Mic } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import {
  ASSINATURA_EVENT,
  FAIXAS,
  TETO_DE_CREDITOS,
  assinar,
  cancelar,
  emReais,
  faixaDe,
  readAssinatura,
  type Assinatura,
  type Faixa,
} from "@/lib/assinatura";

/**
 * **Planos** (`/plans`) — a escada de três degraus, decisão **4B** (§4.118).
 *
 * ---
 *
 * **Ela já existiu e foi apagada.** A `/plans` do andaime original saiu em
 * 26/07 (§4.31) porque mostrava planos inventados, sem crédito e sem pedido —
 * era enfeite. O roteiro registrou na época que ela **nasceria do zero** quando
 * houvesse regra de verdade para mostrar. É esta.
 *
 * **Três faixas, com a do meio marcada** — bom · melhor · ótimo. A de cima
 * existe em boa medida para fazer a do meio parecer justa; a de baixo é a porta
 * de entrada. A quarta faixa do roteiro (2 pedidos, R$ 69,90) **saiu**: quatro
 * preços de R$ 20 em R$ 20 viram tabela, e quem para para fazer conta não
 * assina.
 *
 * ⚠️ **Nada aqui cobra.** "Assinar" grava o plano neste aparelho — o mesmo grau
 * de verdade do login. Quando houver gateway, quem troca é `lib/assinatura.ts`,
 * e esta tela não fica sabendo.
 *
 * **O aviso de que os preços são exemplo fica na tela**, e não só no roteiro:
 * mostrar número com cara de definitivo para o dono do app é a forma mais fácil
 * de um "por exemplo" virar decisão sem ninguém ter decidido.
 */
export default function Planos() {
  const { toast } = useToast();
  const [estado, setEstado] = useState<Assinatura>(readAssinatura);

  useEffect(() => {
    const atualizar = () => setEstado(readAssinatura());
    atualizar();
    window.addEventListener(ASSINATURA_EVENT, atualizar);
    return () => window.removeEventListener(ASSINATURA_EVENT, atualizar);
  }, []);

  function escolher(faixa: Faixa) {
    const novo = assinar(faixa.id);
    setEstado(novo);
    toast({
      title: `Plano ${faixa.nome}`,
      description: novo.boasVindas
        ? "Assinado. Seu pedido de boas-vindas já está disponível."
        : faixa.creditosPorMes > 0
          ? `Assinado. Você tem ${novo.creditos} ${novo.creditos === 1 ? "pedido" : "pedidos"}.`
          : "Assinado. O catálogo inteiro está liberado.",
    });
  }

  function sair() {
    setEstado(cancelar());
    toast({
      title: "Assinatura cancelada",
      description: "Os pedidos que você já tinha guardados continuam seus.",
    });
  }

  const atual = faixaDe(estado.plano);

  return (
    <div className="min-h-screen bg-background pb-24 text-white" data-testid="planos-page">
      <PageHeader title="Planos" fallback="/request" />

      <header className="px-5 pb-6 pt-5 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-2 ring-white/15">
          <Mic className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-[22px] font-bold leading-tight tracking-tight">
          Ouvir o catálogo,
          <br />
          ou mandar gravar o que falta
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-white/60">
          Todo plano dá o catálogo inteiro. O que muda é quantos livros por mês você manda o estúdio
          narrar — <b className="font-semibold text-white/80">um pedido é um livro inteiro</b>, do
          primeiro ao último capítulo.
        </p>
      </header>

      {/* O estado atual em primeiro lugar: quem já assina precisa saber o que
          tem antes de olhar o que poderia ter. Sem isso a tela vira só venda. */}
      {atual && (
        <section className="px-5 pb-2" data-testid="plano-atual">
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.07] px-4 py-3.5">
            <p className="text-[13px] font-semibold">
              Seu plano hoje: <span className="text-primary">{atual.nome}</span>
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-white/55">
              {estado.boasVindas && "Seu pedido de boas-vindas está disponível. "}
              {estado.creditos > 0
                ? `${estado.creditos} ${estado.creditos === 1 ? "pedido guardado" : "pedidos guardados"} (o máximo é ${TETO_DE_CREDITOS}).`
                : estado.boasVindas
                  ? ""
                  : "Sem pedidos guardados no momento."}
            </p>
          </div>
        </section>
      )}

      <section className="space-y-3 px-5 pt-4" data-testid="faixas">
        {FAIXAS.map((faixa) => (
          <CartaoDeFaixa
            key={faixa.id}
            faixa={faixa}
            atual={faixa.id === estado.plano}
            aoEscolher={() => escolher(faixa)}
          />
        ))}
      </section>

      {/* A regra que a escada inteira depende, dita uma vez. Ela é decisão dele
          de 26/07 — *"era exatamente assim que eu pretendia fazer"* — e sem ela
          o plano de cima parece punição em vez de degrau. */}
      <p className="px-5 pt-4 text-[11.5px] leading-relaxed text-white/35">
        Os planos <b className="text-white/55">não se somam</b>: quem tem pedidos já tem o acesso ao
        catálogo incluído. Pedido não usado fica guardado enquanto a assinatura estiver ativa, até{" "}
        <b className="text-white/55">{TETO_DE_CREDITOS}</b> — assim nada vira pó, e a produção não
        leva um susto de dez livros no mesmo dia.
      </p>

      {atual && (
        <section className="px-5 pt-6">
          <button
            type="button"
            onClick={sair}
            className="w-full rounded-xl border border-white/10 py-3 text-[13px] font-semibold text-white/60 transition-colors hover:bg-white/5"
            data-testid="cancelar-assinatura"
          >
            Cancelar assinatura
          </button>
          <p className="pt-2 text-center text-[11px] text-white/30">
            Os pedidos que você já tem guardados continuam seus.
          </p>
        </section>
      )}

      {/* Dito na tela, e não só no roteiro: número com cara de definitivo vira
          decisão sem ninguém ter decidido. */}
      <p className="px-5 pt-7 text-[11px] leading-relaxed text-white/25">
        Valores de exemplo, ainda em definição — e nada aqui cobra de verdade: o AllBook não tem
        pagamento ligado.{" "}
        <Link href="/help" className="underline hover:text-white/40">
          Dúvidas
        </Link>
        .
      </p>
    </div>
  );
}

function CartaoDeFaixa({
  faixa,
  atual,
  aoEscolher,
}: {
  faixa: Faixa;
  atual: boolean;
  aoEscolher: () => void;
}) {
  const Icone = faixa.creditosPorMes > 0 ? Mic : Headphones;
  return (
    <div
      className={`relative rounded-2xl border px-4 pb-4 pt-4 transition-colors ${
        faixa.destaque
          ? "border-primary/40 bg-primary/[0.06]"
          : "border-white/[0.09] bg-white/[0.03]"
      }`}
      data-testid={`faixa-${faixa.id}`}
    >
      {/* "Mais escolhido" é o que faz a do meio se escolher sozinha — e é a
          razão de a escada ter três degraus e não quatro. */}
      {faixa.destaque && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          Mais escolhido
        </span>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            faixa.destaque ? "bg-primary/20" : "bg-white/[0.06]"
          }`}
        >
          <Icone className={`h-5 w-5 ${faixa.destaque ? "text-primary" : "text-white/60"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[16px] font-bold tracking-tight">{faixa.nome}</p>
          <p className="mt-0.5 text-[12px] text-white/55">{faixa.entrega}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[17px] font-bold tracking-tight">
            {emReais(faixa.preco)}
          </p>
          <p className="text-[10.5px] text-white/35">por mês</p>
        </div>
      </div>

      {faixa.nota && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-white/45">
          {faixa.creditosPorMes === 0 ? (
            <Gift className="h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          {faixa.nota}
        </p>
      )}

      <button
        type="button"
        onClick={aoEscolher}
        disabled={atual}
        className={`mt-3.5 w-full rounded-xl py-2.5 text-[13px] font-bold transition-opacity disabled:opacity-40 ${
          faixa.destaque
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "border border-white/15 text-white/85 hover:bg-white/5"
        }`}
        data-testid={`assinar-${faixa.id}`}
      >
        {atual ? "Seu plano hoje" : `Assinar ${faixa.nome}`}
      </button>
    </div>
  );
}
