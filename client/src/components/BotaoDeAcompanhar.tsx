import { useEffect, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
  ACOMPANHANDO_EVENT,
  acompanho,
  alternarAcompanhar,
  novidadesDe,
  type TipoDeAlvo,
} from "@/lib/acompanhando";

/**
 * **Seguir um autor, um narrador, uma editora ou o Studio.**
 *
 * O gesto que o Matheus pediu em 31/07: *"ser notificado quando tiver alguma
 * novidade, e ter um acesso mais rápido àquilo"*. O verbo continua sendo
 * **seguir** — é o que todo app usa para isso —, mas o botão **nunca aparece
 * sozinho**: junto dele vai sempre a frase que diz o que você vai receber. É a
 * diferença entre um botão que promete e um botão que enfeita.
 *
 * Depois de seguir, a frase muda de promessa para **prestação de contas**:
 * quantas novidades existem agora e onde vê-las.
 */
export default function BotaoDeAcompanhar({
  tipo,
  slug,
  nome,
  className = "",
}: {
  tipo: TipoDeAlvo;
  slug: string;
  /** Só para o texto ("avisamos quando houver novidade de Robin Sharma"). */
  nome: string;
  className?: string;
}) {
  const { toast } = useToast();
  const [segue, setSegue] = useState(() => acompanho(tipo, slug));

  /* Outra tela pode ter mudado isto (a lista em `/acompanhando`, por exemplo). */
  useEffect(() => {
    const atualizar = () => setSegue(acompanho(tipo, slug));
    atualizar();
    window.addEventListener(ACOMPANHANDO_EVENT, atualizar);
    return () => window.removeEventListener(ACOMPANHANDO_EVENT, atualizar);
  }, [tipo, slug]);

  const novidades = novidadesDe({ tipo, slug });
  const primeiroNome = nome.split(" ")[0];

  return (
    <div className={className} data-testid={`acompanhar-${tipo}-${slug}`}>
      <button
        type="button"
        onClick={() => {
          const agora = alternarAcompanhar(tipo, slug);
          setSegue(agora);
          toast(
            agora
              ? {
                  title: `Seguindo ${nome}`,
                  description:
                    novidades.length > 0
                      ? `Já há ${novidades.length} ${novidades.length === 1 ? "novidade" : "novidades"} em «Seguindo».`
                      : "Você é avisado quando houver novidade.",
                }
              : { title: `Você deixou de seguir ${primeiroNome}` },
          );
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors ${
          segue
            ? "bg-white/[0.08] text-white hover:bg-white/15"
            : "bg-primary text-black hover:bg-primary/90"
        }`}
        data-testid={`button-seguir-${slug}`}
      >
        {segue ? (
          <>
            <Check className="h-4 w-4" />
            Seguindo
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" />
            Seguir
          </>
        )}
      </button>

      {/* A promessa — o que o botão faz, em uma linha. Sem ela, "seguir" é um
          verbo solto: ninguém sabe o que ganha em troca. */}
      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-white/35">
        <BellRing className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
        {segue ? (
          <span>
            Você recebe os avisos {tipo === "studio" ? "do" : tipo === "editora" ? "da" : "de"}{" "}
            {primeiroNome}
            {novidades.length > 0 && (
              <>
                {" — "}
                <b className="font-semibold text-white/60">
                  {novidades.length} {novidades.length === 1 ? "novidade" : "novidades"}
                </b>{" "}
                em «Seguindo»
              </>
            )}
            .
          </span>
        ) : (
          <span>
            Seguindo, você é avisado quando houver livro ou narração
            {tipo === "editora" || tipo === "studio" ? " nova" : " nova"} de {primeiroNome}.
          </span>
        )}
      </p>
    </div>
  );
}
