import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { CURTIDAS_EVENT, alternarCurtida, curtidasDoPost, euCurti } from "@/lib/curtidas";

/**
 * Curtir uma fala — **a mesma ação em todo lugar do app**.
 *
 * ---
 *
 * **Por que este componente existe.** A §4.58 registra uma desconfiança do
 * Matheus que foi medida e confirmada: o curtir existia **pela metade**. Estava
 * na conversa do livro e no feed, e faltava no mural do clube e no fórum — e
 * quando a mesma ação existe em metade dos lugares, a pessoa não sabe onde pode
 * reagir sem tentar. Ter um componente só é o que impede a metade de voltar.
 *
 * **O alvo de toque é grande de propósito** (`py-3 -my-3`): o padding cria a área
 * de 44px que Apple e Google pedem, e a margem negativa devolve o espaço ao
 * layout. É a lição da §4.63, onde o Matheus disse que "o curtir não está
 * funcionando" e o que não funcionava era o dedo acertar um botão de 19×14.
 *
 * **O contador dos outros é simulado e estável** (semente pelo id), como no feed;
 * o que **você** faz é real e fica gravado. Quando o servidor existir — e ele vai
 * existir na segunda etapa —, o que muda é a fonte do número: nada nesta tela.
 */
export default function BotaoDeCurtir({
  id,
  deOutraPessoa,
  className = "",
}: {
  /** O id da fala — post, resposta de fórum, mensagem de mural. */
  id: string;
  /** Falso = você escreveu, e aí o contador começa em zero. */
  deOutraPessoa: boolean;
  className?: string;
}) {
  const [curtido, setCurtido] = useState(() => euCurti(id));

  /* A mesma fala pode estar em duas telas ao mesmo tempo (o fio e a página do
     post, por exemplo). Sem isto, curtir num lugar deixaria o outro mentindo. */
  useEffect(() => {
    const atualizar = () => setCurtido(euCurti(id));
    window.addEventListener(CURTIDAS_EVENT, atualizar);
    return () => window.removeEventListener(CURTIDAS_EVENT, atualizar);
  }, [id]);

  const total = curtidasDoPost(id, { deOutraPessoa, escala: "fala" }) + (curtido ? 1 : 0);

  return (
    <button
      onClick={() => setCurtido(alternarCurtida(id))}
      className={`-my-3 flex items-center gap-1.5 py-3 text-[11px] font-semibold transition-colors ${
        curtido ? "text-primary" : "text-white/35 hover:text-white/70"
      } ${className}`}
      aria-pressed={curtido}
      aria-label={curtido ? "Descurtir" : "Curtir"}
      data-testid={`curtir-fala-${id}`}
    >
      <Heart className={`h-3.5 w-3.5 ${curtido ? "fill-current" : ""}`} />
      {total > 0 && total}
    </button>
  );
}
