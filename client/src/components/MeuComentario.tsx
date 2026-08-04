import { EyeOff, Headphones, Star, Trash2 } from "lucide-react";

import { initialOf, readProfile } from "@/lib/profile";
import { type MyComment } from "@/lib/myComments";
import { type MinhaAvaliacao } from "@/lib/ratings";
import { rotuloDaAncora } from "@/lib/sala";

/**
 * **O cartão de um comentário seu**, para poder aparecer fora da caixa de
 * escrever.
 *
 * ---
 *
 * **Por que virou componente (04/08, ROTEIRO §4.87).** Este cartão morava dentro
 * do `CommentComposer`, e por isso os seus comentários só sabiam existir num
 * lugar: **empilhados logo abaixo da caixa**, antes de toda a conversa. Na sala
 * do livro isso produziu o defeito que o Matheus viu ao abrir "A Paciente
 * Silenciosa" — *"aparece um monte de coisa que eu tinha escrito"*. Não era
 * filtro errado (os comentários estavam no livro certo): era a **ordem**, que
 * punha a sua voz inteira na frente da de todo mundo e quebrava a sequência do
 * áudio.
 *
 * Agora a sala mistura os seus com os dos outros na ordem do livro, e usa este
 * cartão para desenhar os seus. **O que ele mostra a menos que o dos outros:**
 * curtir e responder — reagir a si mesmo não faz sentido. **O que mostra a
 * mais:** o botão de apagar e o estado do comentário (onde ficou preso, se está
 * marcado como spoiler), porque isso é o que você não consegue ver de fora.
 *
 * **O seu texto nunca fica coberto por spoiler** — você já sabe o que escreveu.
 */
export default function MeuComentario({
  comment,
  nota,
  onApagar,
}: {
  comment: MyComment;
  /** A sua nota atual do livro, quando houver — some em perfil de pessoa. */
  nota?: MinhaAvaliacao | null;
  onApagar: (id: string) => void;
}) {
  const perfil = readProfile();

  return (
    <div
      className="rounded-xl border border-white/5 bg-white/5 p-4"
      data-testid={`my-comment-${comment.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
            {initialOf(perfil.name)}
          </span>
          <span className="text-sm font-bold">
            {perfil.name} <span className="font-normal text-white/30">· você</span>
          </span>
        </div>
        <button
          onClick={() => onApagar(comment.id)}
          className="p-1 text-white/25 transition-colors hover:text-white/60"
          aria-label="Apagar meu comentário"
          data-testid={`delete-comment-${comment.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <MinhasEstrelas nota={nota ?? null} />

      {(comment.positionSec !== undefined || comment.spoiler) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {comment.positionSec !== undefined && comment.bookId !== undefined && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
              data-testid="my-comment-anchor"
            >
              <Headphones className="h-3 w-3" />
              {rotuloDaAncora(comment.bookId, comment.positionSec)}
            </span>
          )}
          {comment.spoiler && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f59e0b]/10 px-2.5 py-1 text-[11px] font-semibold text-[#f59e0b]">
              <EyeOff className="h-3 w-3" />
              Marcado como spoiler
            </span>
          )}
        </div>
      )}

      <p className="mt-1 text-sm italic leading-relaxed text-white/70">"{comment.text}"</p>
    </div>
  );
}

/** As suas estrelas dentro do seu comentário — história e narração, separadas. */
function MinhasEstrelas({ nota }: { nota: MinhaAvaliacao | null }) {
  if (!nota || (nota.historia === undefined && nota.narracao === undefined)) return null;

  const linhas = [
    { rotulo: "História", valor: nota.historia },
    { rotulo: "Narração", valor: nota.narracao },
  ].filter((linha): linha is { rotulo: string; valor: number } => linha.valor !== undefined);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="my-comment-rating">
      {linhas.map((linha) => (
        <span
          key={linha.rotulo}
          className="flex items-center gap-1"
          aria-label={`${linha.rotulo}: ${linha.valor} de 5 estrelas`}
        >
          {[1, 2, 3, 4, 5].map((valor) => (
            <Star
              key={valor}
              className={`h-3.5 w-3.5 ${
                valor <= linha.valor ? "fill-[#f59e0b] text-[#f59e0b]" : "text-white/15"
              }`}
            />
          ))}
          <span className="ml-0.5 text-[10px] uppercase tracking-wider text-white/35">
            {linha.rotulo}
          </span>
        </span>
      ))}
    </div>
  );
}
