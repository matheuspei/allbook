import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  LISTENING_EVENT,
  diaISO,
  formatarDuracao,
  garantirDiario,
  historicoDoLivro,
  type HistoricoDeUmLivro,
} from "@/lib/listening";

/**
 * O painel "Histórico de escuta" do tocador.
 *
 * **O que existia antes (e por que virou isto):** o item nos "…" abria um aviso
 * escrito *"você está no capítulo 1 de X"* — o **presente**, e ainda por cima já
 * visível na própria tela, no botão de capítulo logo acima. "Histórico" é
 * promessa de **passado**: o que ouvi, quando, quanto. Ver ROTEIRO 4.36.
 *
 * O dado sempre esteve lá: o diário de audição (`lib/listening.ts`, ROTEIRO
 * 4.14) guarda os segundos **por livro dentro de cada dia**. Ninguém tinha
 * olhado por essa fatia — é a única coisa que faltava para o item cumprir o
 * nome. Nenhuma outra tela do app responde "quanto eu já ouvi *deste* livro".
 */

/**
 * "3 dias", "cerca de 2 meses" — a unidade acompanha o tamanho da previsão.
 *
 * **Por que não deixar em dias sempre:** o primeiro teste devolveu *"219 dias"*,
 * que é a conta certa e a comunicação errada — ninguém processa 219 dias, e o
 * número soa a julgamento. Em meses a mesma verdade fica legível.
 */
function prazoLegivel(dias: number): string {
  if (dias === 1) return "1 dia";
  if (dias <= 45) return `${dias} dias`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return `${meses} meses`;
  const anos = Math.round(dias / 365);
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

/** "hoje", "ontem", "25 de julho" — data curta, sem soletrar ano à toa. */
function rotuloDoDia(diaChave: string, hoje: Date): string {
  const hojeChave = diaISO(hoje);
  if (diaChave === hojeChave) return "hoje";

  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (diaChave === diaISO(ontem)) return "ontem";

  // Meio-dia para a data não escorregar de dia por fuso.
  const data = new Date(`${diaChave}T12:00:00`);
  const mesmoAno = data.getFullYear() === hoje.getFullYear();
  return data.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    ...(mesmoAno ? {} : { year: "numeric" }),
  });
}

export default function HistoricoDoLivro({
  aberto,
  onClose,
  bookId,
  titulo,
  capituloAtual,
  totalDeCapitulos,
  restanteSec,
}: {
  aberto: boolean;
  onClose: () => void;
  bookId: number;
  titulo: string;
  capituloAtual: number;
  totalDeCapitulos: number;
  /** Quanto falta do livro, em segundos — para a previsão de término. */
  restanteSec: number;
}) {
  const [historico, setHistorico] = useState<HistoricoDeUmLivro | null>(null);

  /*
   * Lido ao abrir e a cada evento do diário — o tocador credita audição
   * enquanto o painel está aberto, e o número tem de acompanhar.
   */
  useEffect(() => {
    if (!aberto) return;
    const atualizar = () => setHistorico(historicoDoLivro(garantirDiario(), bookId));
    atualizar();
    window.addEventListener(LISTENING_EVENT, atualizar);
    return () => window.removeEventListener(LISTENING_EVENT, atualizar);
  }, [aberto, bookId]);

  const hoje = useMemo(() => new Date(), [aberto]);
  const maiorDia = historico?.dias.reduce((maior, d) => Math.max(maior, d.sec), 0) ?? 0;
  const vazio = !historico || historico.dias.length === 0;

  /*
   * "Nesse ritmo, ~N dias" — usa o ritmo **deste** livro, não a média geral de
   * audição. Some quando falta pouco (menos de 5 min é reta final, previsão ali
   * é ruído) ou quando não há base para chamar de ritmo.
   */
  const diasParaTerminar = useMemo(() => {
    if (!historico?.secPorDiaCorrido || restanteSec < 300) return null;
    return Math.max(1, Math.ceil(restanteSec / historico.secPorDiaCorrido));
  }, [historico, restanteSec]);

  return (
    <Drawer open={aberto} onOpenChange={(estado) => !estado && onClose()}>
      <DrawerContent className="mx-auto max-h-[80vh] max-w-[480px] border-white/10 bg-[#1a1a1a] text-white">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display tracking-tight text-white">
            Meu ritmo neste livro
          </DrawerTitle>
          <DrawerDescription className="text-white/50">{titulo}</DrawerDescription>
        </DrawerHeader>

        {vazio ? (
          <div className="px-6 pb-10 pt-2 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/[0.06]">
              <History className="h-6 w-6 text-white/40" />
            </div>
            <p className="mt-4 text-sm font-medium text-white">Ainda sem tempo somado aqui</p>
            <p className="mx-auto mt-1.5 max-w-[280px] text-xs leading-relaxed text-white/45">
              Assim que você ouvir alguns minutos deste título, eles aparecem nesta lista, dia a
              dia. Você está no capítulo {capituloAtual} de {totalDeCapitulos}.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto px-5 pb-8">
            {/* O número que responde a pergunta, antes da lista que a detalha. */}
            <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <p className="font-display text-3xl font-bold tracking-tight text-primary tabular-nums">
                {formatarDuracao(historico.totalSec)}
              </p>
              <p className="mt-1 text-sm text-white/60">
                em {historico.dias.length} {historico.dias.length === 1 ? "dia" : "dias"} de escuta
                {" • "}
                capítulo {capituloAtual} de {totalDeCapitulos}
              </p>

              {/* Honestidade: o app semeia um histórico de demonstração para as
                  Estatísticas não nascerem vazias (ROTEIRO 4.14). Se tudo aqui
                  vem dele, dizer — número inventado apresentado como seu é pior
                  que tela vazia. */}
              {historico.soExemplo && (
                <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                  Estes dias vêm do histórico de demonstração que o app cria na primeira abertura.
                </p>
              )}
            </div>

            {/* A única linha que olha para a frente. Fica fora do cartão do
                total de propósito: passado e previsão são coisas diferentes, e
                misturar faria a estimativa parecer tão firme quanto o medido. */}
            {restanteSec >= 60 && (
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Faltam{" "}
                <span className="font-semibold text-white">{formatarDuracao(restanteSec)}</span>
                {diasParaTerminar !== null && (
                  <>
                    {" — no seu ritmo neste livro, cerca de "}
                    <span className="font-semibold text-white">
                      {prazoLegivel(diasParaTerminar)}
                    </span>
                    {" para terminar."}
                  </>
                )}
              </p>
            )}

            <ul className="mt-4 space-y-2.5">
              {historico.dias.map((dia) => (
                <li key={dia.dia} className="space-y-1" data-testid={`historico-${dia.dia}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-white/80">{rotuloDoDia(dia.dia, hoje)}</span>
                    <span className="shrink-0 tabular-nums text-white/50">
                      {formatarDuracao(dia.sec)}
                    </span>
                  </div>
                  {/* A barra é comparativa dentro do próprio livro: dá para ver
                      num relance em que dia a pessoa emendou horas. */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-[#f59e0b]"
                      style={{ width: `${maiorDia ? (dia.sec / maiorDia) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
