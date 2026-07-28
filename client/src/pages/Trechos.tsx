import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import ComoCortarUmTrecho from "@/components/ComoCortarUmTrecho";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import {
  TRECHOS_EVENT,
  comoCitacao,
  esquecerTrecho,
  trechosGuardados,
  type TrechoGuardado,
} from "@/lib/trechosGuardados";

/**
 * Meus trechos (`/trechos`) — os pedaços de áudio que você cortou para mostrar.
 *
 * **Por que endereço próprio, e não uma aba de "Minhas notas"** (ROTEIRO 4.48).
 * Em 28/07 eu tinha posto os trechos como segunda aba das notas, com o argumento
 * de que nascem do mesmo gesto: ouvindo, você marca. O Matheus desconfiou —
 * *"acho que talvez os meus trechos deviam estar separados das minhas notas"* —
 * e estava certo. Três coisas separam os dois:
 *
 * 1. **O dono é outro.** A nota é privada: guarda um ponto para *você* voltar. O
 *    trecho é a única coisa que o app guarda **para os outros** — ele existe para
 *    ser anexado numa conversa.
 * 2. **A forma é outra.** As notas se organizam **por livro** (é ao livro que
 *    você volta); o trecho circula solto e chega no meio de assunto alheio, por
 *    isso o cartão carrega a própria capa. As duas abas não conseguiam nem
 *    compartilhar layout — sinal de que não compartilhavam natureza.
 * 3. **A palavra colidiu.** Para as duas caberem na mesma tela eu tive de trocar
 *    "trecho" por "marcação" *dentro* das notas. Renomear para caber é remendo
 *    num encaixe errado, não solução.
 *
 * **Ordem: o mais recente primeiro** — e não agrupado por livro. Aqui isto é uma
 * prancheta, não um arquivo: o que você acabou de cortar é o que vai anexar. É
 * também a mesma ordem da folha de anexar, de propósito — o que você vê aqui é
 * exatamente o que vai ver na hora de escolher.
 */
export default function Trechos() {
  const { toast } = useToast();
  const [trechos, setTrechos] = useState<TrechoGuardado[]>([]);

  useEffect(() => {
    const atualizar = () => setTrechos(trechosGuardados());
    atualizar();
    window.addEventListener(TRECHOS_EVENT, atualizar);
    return () => window.removeEventListener(TRECHOS_EVENT, atualizar);
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] pb-24 text-white" data-testid="trechos-page">
      <PageHeader title="Meus trechos" fallback="/you" />

      <main className="px-5 pt-4">
        {trechos.length === 0 ? (
          <div className="pt-10">
            <h2 className="text-center font-display text-lg font-bold tracking-tight">
              Você ainda não cortou nenhum trecho
            </h2>
            <p className="mx-auto mb-5 mt-2 max-w-[320px] text-center text-sm leading-relaxed text-white/45">
              Trecho é um pedaço de até 40 segundos do que você está ouvindo, para mostrar a alguém
              — no clube, no fórum ou na conversa do livro.
            </p>
            <ComoCortarUmTrecho />
          </div>
        ) : (
          <>
            <p className="text-sm text-white/45">
              {trechos.length} {trechos.length === 1 ? "trecho guardado" : "trechos guardados"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/35">
              Toque para ouvir só o pedaço. Para usar num clube, fórum ou conversa, abra o botão de
              clipe ao escrever e escolha daqui.
            </p>

            <div className="mt-4 space-y-2.5">
              {trechos.map((trecho) => (
                <div key={trecho.id} className="relative">
                  <CitacaoDeAudio citacao={comoCitacao(trecho)} />
                  {/*
                    Esquecer fica na base do cartão, não sobre a capa. Sobreposto
                    ele encostava na arte e ficava a 20% de branco, quase
                    invisível — alvo pequeno e escondido para uma ação que apaga.
                  */}
                  <button
                    onClick={() => {
                      esquecerTrecho(trecho.id);
                      toast({ title: "Trecho esquecido" });
                    }}
                    className="mt-1 flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold text-white/30 transition-colors hover:text-red-300"
                    data-testid={`esquecer-${trecho.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                    Esquecer
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
