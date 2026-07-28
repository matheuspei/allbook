import { useEffect, useState } from "react";
import { Paperclip, Trash2, X } from "lucide-react";

import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import ComoCortarUmTrecho from "@/components/ComoCortarUmTrecho";
import { useToast } from "@/hooks/use-toast";
import { type Citacao } from "@/lib/citacoes";
import {
  TRECHOS_EVENT,
  comoCitacao,
  esquecerTrecho,
  trechosGuardados,
  type TrechoGuardado,
} from "@/lib/trechosGuardados";

/**
 * Anexar um trecho ao que você está escrevendo — em qualquer campo.
 *
 * **A metade "escrevendo" da decisão** (ROTEIRO 4.45): cortar acontece no
 * player, ouvindo; anexar acontece aqui, depois, longe dali. Este botão não
 * corta nada — ele abre o que você já guardou. É a diferença entre uma
 * ferramenta e um chute: escolher um trecho de uma lista que você mesmo cortou
 * é seguro; escolher um minuto de memória, dentro de uma caixa de texto, não.
 *
 * **Uma peça, muitos campos.** O mesmo componente serve o mural do clube, a
 * resposta do fórum e o comentário da sala. Quando a Comunidade tiver feed, serve
 * ele também — a citação é a peça que circula (§4.43).
 *
 * **O estado vazio não é beco sem saída:** quem nunca guardou nada recebe a
 * instrução de onde se corta, com o caminho até lá. Um "você não tem trechos"
 * seco seria o tipo de tela morta que a 4.23 mandou varrer.
 */
export default function AnexarTrecho({
  citacao,
  onEscolher,
  compacto,
}: {
  /** O trecho já anexado, se houver. */
  citacao?: Citacao;
  onEscolher: (citacao: Citacao | undefined) => void;
  /** Dentro da ficha do próprio livro a capa é redundante. */
  compacto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  if (citacao) {
    return (
      <div className="relative">
        <CitacaoDeAudio citacao={citacao} compacto={compacto} />
        <button
          type="button"
          onClick={() => onEscolher(undefined)}
          className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#2a2a2a] text-white/60 ring-1 ring-white/15 transition-colors hover:text-white"
          aria-label="Tirar o trecho"
          data-testid="tirar-trecho"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-semibold text-white/55 ring-1 ring-inset ring-white/8 transition-colors hover:text-white/85"
        data-testid="anexar-trecho"
      >
        <Paperclip className="h-3 w-3" />
        Trecho
      </button>

      {aberto && (
        <FolhaDeTrechos
          onFechar={() => setAberto(false)}
          onEscolher={(escolhida) => {
            onEscolher(escolhida);
            setAberto(false);
          }}
        />
      )}
    </>
  );
}

function FolhaDeTrechos({
  onFechar,
  onEscolher,
}: {
  onFechar: () => void;
  onEscolher: (citacao: Citacao) => void;
}) {
  const { toast } = useToast();
  const [lista, setLista] = useState<TrechoGuardado[]>(() => trechosGuardados());

  useEffect(() => {
    const atualizar = () => setLista(trechosGuardados());
    window.addEventListener(TRECHOS_EVENT, atualizar);
    return () => window.removeEventListener(TRECHOS_EVENT, atualizar);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid="folha-de-trechos"
    >
      <div
        className="max-h-[80vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold">Seus trechos</h2>
            <p className="mt-0.5 text-xs text-white/40">
              {lista.length === 0
                ? "Nenhum guardado ainda"
                : `${lista.length} guardado${lista.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lista.length === 0 ? (
          <ComoCortarUmTrecho onNavegar={onFechar} />
        ) : (
          <div className="space-y-2.5">
            {lista.map((trecho) => (
              <div key={trecho.id} className="relative">
                <button
                  type="button"
                  onClick={() => onEscolher(comoCitacao(trecho))}
                  className="block w-full text-left"
                  data-testid={`escolher-trecho-${trecho.id}`}
                >
                  {/* O cartão é o mesmo que aparece publicado: o que você vê
                      escolhendo é exatamente o que os outros vão ver. */}
                  <span className="pointer-events-none block">
                    <CitacaoDeAudio citacao={comoCitacao(trecho)} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    esquecerTrecho(trecho.id);
                    toast({ title: "Trecho esquecido" });
                  }}
                  className="absolute right-1.5 top-1.5 rounded-full p-1.5 text-white/20 transition-colors hover:bg-white/10 hover:text-red-300"
                  aria-label="Esquecer este trecho"
                  data-testid={`esquecer-trecho-${trecho.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
