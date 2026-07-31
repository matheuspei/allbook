import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { catalog } from "@/lib/books";
import { findMember } from "@/lib/community";
import {
  minhaSalaAberta,
  sairDaSala,
  SALA_AO_VIVO_EVENT,
  situacaoDaSala,
  souAnfitriao,
} from "@/lib/salaAoVivo";

/**
 * **A barrinha da sala** — você continua na sala andando pelo app.
 *
 * ---
 *
 * **Por que ela existe.** A sala nasceu como tela cheia, e o Matheus achou o
 * beco no primeiro uso: *"eu não consigo minimizar o player, fazer outras coisas
 * dentro do aplicativo"*. Entrar numa sala prendia a pessoa lá até ela sair —
 * quando o app inteiro já sabe fazer o contrário com o livro, pela barrinha do
 * player.
 *
 * A correção é a mesma gramática: **minimizar não é sair**. Você fecha a tela,
 * continua dentro da sala, e esta barra é a prova disso — mostra em que capítulo
 * a turma está e devolve para lá com um toque.
 *
 * **Ela substitui o MiniPlayer enquanto dura.** Duas barras empilhadas, uma com
 * o seu livro e outra com o da sala, seriam duas transmissões disputando o mesmo
 * rodapé — e a sua ficou pausada no instante em que você entrou na sala.
 *
 * O `X` **sai da sala de verdade**, e é a única saída definitiva daqui: sem ele
 * a barra viraria uma coisa impossível de tirar da tela.
 */
export default function BarraDaSala() {
  const [, navigate] = useLocation();
  const [sala, setSala] = useState(minhaSalaAberta);

  useEffect(() => {
    const atualizar = () => setSala(minhaSalaAberta());
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    /* Um tique lento (5s) só para o capítulo na barra não ficar velho — ela não
       precisa da precisão de segundo que a tela da sala tem. */
    const relogio = window.setInterval(atualizar, 5000);
    return () => {
      window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
      window.clearInterval(relogio);
    };
  }, []);

  if (!sala) return null;

  const book = catalog.find((item) => item.id === sala.bookId);
  const anfitriao = findMember(sala.anfitriao);
  const situacao = situacaoDaSala(sala);
  const euMando = souAnfitriao(sala);

  return (
    <div
      className="fixed bottom-[72px] left-0 right-0 z-40 px-3"
      data-testid="barra-da-sala"
    >
      <div className="flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-[#1c1414]/95 p-2 pr-1 shadow-2xl backdrop-blur-sm">
        <button
          onClick={() => navigate(`/sala/${sala.id}`)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          data-testid="button-voltar-para-sala"
        >
          {book && (
            <img src={book.cover} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[9.5px] font-extrabold tracking-[0.12em] text-red-300">
                AO VIVO
              </span>
              <span className="truncate text-[10.5px] text-white/35">
                {sala.presentes.length} ouvindo
              </span>
            </span>
            <span className="mt-0.5 block truncate text-[12px] font-semibold leading-tight">
              {euMando ? "Sua sala" : `Sala de ${anfitriao?.name ?? "alguém"}`} · cap.{" "}
              {situacao.capitulo}
            </span>
          </span>
        </button>

        <button
          onClick={() => sairDaSala(sala.id)}
          className="shrink-0 rounded-full p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Sair da sala"
          data-testid="button-sair-pela-barra"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
