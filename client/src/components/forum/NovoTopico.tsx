import { useState } from "react";

import EscolherCapa from "@/components/forum/EscolherCapa";
import { BotaoDoForum, CAMPO } from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { MAX_TITULO, criarTopico, type CapaDeTopico } from "@/lib/grupos";

/**
 * **Criar um tópico — agora com capa** (ROTEIRO §4.91).
 *
 * **Por que virou componente próprio.** A caixa de criar morava dentro da lista
 * de tópicos, e passou a ser usada em dois lugares (o resumo da comunidade e a
 * página de todos). Duas cópias de um formulário é como as duas metades saem de
 * sincronia sem ninguém perceber.
 *
 * A escolha da capa em si mora em `EscolherCapa`, que é a mesma peça usada para
 * trocar a capa de um tópico que já existe.
 */
export default function NovoTopico({
  grupoId,
  emoji,
  onPronto,
  onCancelar,
}: {
  grupoId: string;
  /** O emoji da comunidade — a prévia da capa vazia usa ele. */
  emoji?: string;
  onPronto?: () => void;
  onCancelar?: () => void;
}) {
  const { toast } = useToast();
  const [titulo, setTitulo] = useState("");
  const [capa, setCapa] = useState<CapaDeTopico>({});

  function publicar() {
    if (!criarTopico(grupoId, titulo, capa)) return;
    setTitulo("");
    setCapa({});
    toast({ title: "Tópico criado" });
    onPronto?.();
  }

  return (
    <div
      className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
      data-testid="grupo-composer"
    >
      <p className="mb-1 text-[10.5px] text-white/40">assunto do tópico:</p>
      <input
        value={titulo}
        onChange={(evento) => setTitulo(evento.target.value.slice(0, MAX_TITULO))}
        autoFocus
        className={CAMPO}
        data-testid="grupo-topic-title"
      />

      <div className="mt-3">
        <EscolherCapa
          capa={capa}
          onMudar={setCapa}
          emoji={emoji}
          semente={titulo || grupoId}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <BotaoDoForum
          primario
          disabled={titulo.trim().length === 0}
          onClick={publicar}
          testid="grupo-topic-publish"
        >
          Criar tópico
        </BotaoDoForum>
        <BotaoDoForum onClick={onCancelar}>Cancelar</BotaoDoForum>
      </div>
    </div>
  );
}
