import { useEffect, useState } from "react";
import { BookOpen, Headphones, Star, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { PLAYBACK_EVENT } from "@/lib/playback";
import {
  faltaParaAvaliar,
  myRatingOf,
  percentOuvido,
  podeAvaliar,
  removeMyRating,
  saveMyRating,
  PERCENT_PARA_AVALIAR,
  RATINGS_EVENT,
  type MinhaAvaliacao,
} from "@/lib/ratings";

/**
 * "Sua avaliação" na ficha do livro — as duas notas que você pode dar, e o que
 * aparece antes de você poder dar.
 *
 * **O bloco existe sempre, mas antes dos 20% ouvidos ele é informação, não
 * botão.** Essa é a decisão de desenho (ROTEIRO 4.15), e as duas alternativas
 * óbvias foram rejeitadas por motivo:
 *
 * - **Botão desabilitado:** beco sem saída — controle que existe e não funciona
 *   é justamente o que a faxina premium (4.9) tirou do app.
 * - **O bloco só nascer aos 20%:** o recurso fica invisível, ninguém descobre
 *   que pode avaliar, e aparecer do nada mais tarde parece defeito.
 *
 * O que faz a diferença entre as duas coisas é a tela dizer **o motivo** e
 * **quanto falta** — daí a barra com a marca dos 20%.
 */
export default function AvaliarLivro({ bookId }: { bookId: number }) {
  const { toast } = useToast();
  const [minha, setMinha] = useState<MinhaAvaliacao | null>(() => myRatingOf(bookId));
  const [percent, setPercent] = useState(() => percentOuvido(bookId));

  // O progresso pode mudar enquanto esta tela está aberta (a barrinha do player
  // continua tocando), e a nota pode ser mexida em outra aba.
  useEffect(() => {
    function atualizar() {
      setMinha(myRatingOf(bookId));
      setPercent(percentOuvido(bookId));
    }
    atualizar();
    window.addEventListener(PLAYBACK_EVENT, atualizar);
    window.addEventListener(RATINGS_EVENT, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.removeEventListener(PLAYBACK_EVENT, atualizar);
      window.removeEventListener(RATINGS_EVENT, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, [bookId]);

  const liberado = podeAvaliar(bookId);

  function avaliar(dimensao: "historia" | "narracao", nota: number) {
    // Tocar de novo na mesma estrela tira a nota daquela dimensão — é como se
    // desfaz sem precisar de um botão a mais.
    const atual = dimensao === "historia" ? minha?.historia : minha?.narracao;
    saveMyRating(bookId, { [dimensao]: atual === nota ? null : nota });
    setMinha(myRatingOf(bookId));
  }

  function apagar() {
    removeMyRating(bookId);
    setMinha(null);
    toast({ title: "Sua avaliação foi apagada" });
  }

  return (
    <section
      className="bg-white/5 p-4 rounded-xl border border-white/5"
      data-testid="rating-block"
    >
      <h3 className="font-display font-bold tracking-tight">
        {minha ? "Sua avaliação" : "O que você achou?"}
      </h3>

      {liberado ? (
        <>
          <div className="mt-3 space-y-2">
            <LinhaDeNota
              icone={BookOpen}
              rotulo="História"
              ajuda="a obra, o texto"
              nota={minha?.historia}
              onNota={(nota) => avaliar("historia", nota)}
            />
            <LinhaDeNota
              icone={Headphones}
              rotulo="Narração"
              ajuda="a leitura desta edição"
              nota={minha?.narracao}
              onNota={(nota) => avaliar("narracao", nota)}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-white/30">
              {minha
                ? "Dá para mudar quando quiser."
                : "Pode avaliar só uma das duas, se preferir."}
            </p>
            {minha && (
              <button
                type="button"
                onClick={apagar}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/70 transition-colors"
                data-testid="button-delete-rating"
              >
                <Trash2 className="w-3 h-3" />
                Apagar
              </button>
            )}
          </div>
        </>
      ) : (
        <Bloqueado bookId={bookId} percent={percent} />
      )}
    </section>
  );
}

/**
 * O estado "ainda não dá". Diz **por que** e **quanto falta** — sem isso vira
 * recusa seca, e a pessoa não sabe o que fazer para destravar.
 */
function Bloqueado({ bookId, percent }: { bookId: number; percent: number }) {
  const falta = faltaParaAvaliar(bookId);
  const comecou = percent > 0;

  return (
    <div data-testid="rating-locked">
      <p className="text-sm text-white/50 leading-relaxed mt-1">
        {comecou ? (
          <>
            Você ouviu <span className="text-white/80 font-semibold">{Math.round(percent)}%</span>{" "}
            deste livro. A partir de {PERCENT_PARA_AVALIAR}% você pode avaliar — faltam{" "}
            {Math.ceil(falta)}%.
          </>
        ) : (
          <>
            Ouça {PERCENT_PARA_AVALIAR}% deste livro para poder avaliar. A nota é de quem
            ouviu — é o que a mantém confiável.
          </>
        )}
      </p>

      {/* A barra é o livro inteiro, com uma marca no ponto que libera a nota.
          Fazer a barra ir de 0 ao portão pareceria progresso maior do que é. */}
      <div className="relative h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-white/40"
          style={{ left: `${PERCENT_PARA_AVALIAR}%` }}
        />
      </div>
      <p className="text-[10px] text-white/25 mt-1.5">
        A marca é o ponto em que a avaliação libera.
      </p>
    </div>
  );
}

/** Uma dimensão: rótulo à esquerda, cinco estrelas à direita. */
function LinhaDeNota({
  icone: Icone,
  rotulo,
  ajuda,
  nota,
  onNota,
}: {
  icone: typeof BookOpen;
  rotulo: string;
  ajuda: string;
  nota: number | undefined;
  onNota: (nota: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Icone className="w-3.5 h-3.5 text-white/40" strokeWidth={1.75} />
          {rotulo}
        </span>
        <span className="block text-[10px] text-white/25 mt-0.5">{ajuda}</span>
      </span>

      <span className="flex items-center gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((valor) => {
          const cheia = nota !== undefined && valor <= nota;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => onNota(valor)}
              aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"} para ${rotulo.toLowerCase()}`}
              aria-pressed={cheia}
              className="p-1 rounded-md transition-transform active:scale-90"
              data-testid={`star-${rotulo.toLowerCase()}-${valor}`}
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  cheia ? "text-primary" : "text-white/20"
                }`}
                strokeWidth={1.75}
                fill={cheia ? "currentColor" : "none"}
              />
            </button>
          );
        })}
      </span>
    </div>
  );
}
