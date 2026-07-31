import { useState } from "react";
import { Link } from "wouter";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { quemReagiu, minhaReacao, type OpcoesDeReacao, type Reacao } from "@/lib/curtidas";
import { initialOf, readProfile } from "@/lib/profile";

/**
 * **Quem curtiu e quem descurtiu** — a folha que abre ao tocar no número.
 *
 * Pedido do Matheus em 31/07, junto com a cobrança do descurtir: *"ver as pessoas
 * que curtiram e as pessoas que não curtiram; isso também tinha que ser feito"*.
 *
 * **Por que ela precisa existir, e não é enfeite:** o número sozinho é a régua da
 * §4.59 sendo quebrada — *rótulo que nomeia um conjunto e não leva até ele morre
 * na tela*. "12" é um conjunto de doze pessoas que o app conhece, que têm página
 * e que você pode passar a seguir. Sem a lista, o número é decoração; com ela,
 * vira porta.
 *
 * **As duas listas ficam na mesma folha, em abas** — e não em duas folhas
 * diferentes. Quem abre quer saber *como a fala foi recebida*, e isso é a
 * comparação entre os dois lados; separar obrigaria a abrir duas vezes para ter
 * uma resposta só.
 *
 * **Você aparece em primeiro lugar quando reagiu**, marcado como "Você" — é a
 * confirmação de que o seu toque valeu, no mesmo lugar onde ele produz efeito.
 */
export default function QuemReagiu({
  id,
  opcoes,
  inicial,
  onFechar,
}: {
  id: string;
  opcoes?: OpcoesDeReacao;
  /** Qual aba abre primeiro — a do número que a pessoa tocou. */
  inicial: Reacao;
  onFechar: () => void;
}) {
  const [aba, setAba] = useState<Reacao>(inicial);
  const minha = minhaReacao(id);
  const perfil = readProfile();

  const listas: Record<Reacao, ReturnType<typeof quemReagiu>> = {
    curtiu: quemReagiu(id, "curtiu", opcoes),
    descurtiu: quemReagiu(id, "descurtiu", opcoes),
  };
  const total = (reacao: Reacao) => listas[reacao].length + (minha === reacao ? 1 : 0);

  /* **Os mesmos dois polegares dos botões** — a folha é o que o número abre, e
     trocar de metáfora no caminho faria a pessoa duvidar se chegou no lugar
     certo. (Aqui havia um coração de um lado e um polegar do outro; foi o
     Matheus quem viu: *"dois critérios para a mesma coisa"*.) */
  const ABAS: { key: Reacao; label: string; Icone: typeof ThumbsUp }[] = [
    { key: "curtiu", label: "Curtiram", Icone: ThumbsUp },
    { key: "descurtiu", label: "Descurtiram", Icone: ThumbsDown },
  ];

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end bg-black/55 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onFechar}
      data-testid={`quem-reagiu-${id}`}
    >
      <div
        className="max-h-[75vh] w-full overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#1a1a1a] p-5 pb-9 animate-in slide-in-from-bottom duration-300"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-12 rounded-full bg-white/15" />

        {/* As duas abas, com o número em cada uma: dá para ver a proporção sem
            trocar de aba, que é metade do que a pessoa veio saber. */}
        <div className="flex gap-2">
          {ABAS.map(({ key, label, Icone }) => (
            <button
              key={key}
              onClick={() => setAba(key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                aba === key
                  ? "bg-white text-black"
                  : "border border-white/15 text-white/50 hover:text-white/80"
              }`}
              data-testid={`aba-${key}`}
            >
              <Icone className="h-3.5 w-3.5" />
              {label}
              <span className={aba === key ? "text-black/55" : "text-white/30"}>{total(key)}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-1">
          {minha === aba && (
            <div
              className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-2 py-2"
              data-testid="reagiu-voce"
            >
              {perfil.photo ? (
                <img src={perfil.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-600 font-display text-sm font-bold">
                  {initialOf(perfil.name)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {perfil.name}
                  <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    você
                  </span>
                </span>
              </span>
            </div>
          )}

          {listas[aba].map((membro) => (
            <Link
              key={membro.slug}
              href={`/user/${membro.slug}`}
              onClick={onFechar}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.06]"
              data-testid={`reagiu-${membro.slug}`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${membro.color} font-display text-sm font-bold`}
              >
                {membro.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{membro.name}</span>
                {membro.bio && (
                  <span className="block truncate text-[11px] text-white/35">{membro.bio}</span>
                )}
              </span>
            </Link>
          ))}

          {/* Estado vazio com conteúdo, não sumiço: a aba existe e está vazia, e
              dizer isso é diferente de esconder a aba (§4.72). */}
          {total(aba) === 0 && (
            <p className="px-2 py-6 text-center text-[13px] text-white/40">
              {aba === "curtiu"
                ? "Ninguém curtiu isto ainda."
                : "Ninguém descurtiu isto — o que é um bom sinal."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
