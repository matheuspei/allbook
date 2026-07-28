import { Link } from "wouter";
import { Headphones } from "lucide-react";

/**
 * A instrução de onde se corta um trecho — em um lugar só.
 *
 * Aparece em dois estados vazios: a folha de anexar (`AnexarTrecho`) e a tela
 * `/trechos`. Vivia duplicada nos dois; se o caminho mudar, mudaria num e
 * envelheceria no outro. Estado vazio que só diz "você não tem nada" é o tipo
 * de tela morta que a §4.23 mandou varrer — este ensina o caminho e leva até lá.
 */
export default function ComoCortarUmTrecho({ onNavegar }: { onNavegar?: () => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="flex items-start gap-2.5 text-xs leading-relaxed text-white/50">
        <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          Trecho se corta <b className="text-white/80">ouvindo</b>, não daqui — é ouvindo que você
          sabe onde a frase começa. No player, toque em{" "}
          <b className="text-white/80">Guardar trecho</b> para levar os últimos segundos, ou abra{" "}
          <b className="text-white/80">Conversa › Citar o trecho</b> para escolher o corte exato.
        </span>
      </p>
      <Link
        href="/library"
        onClick={onNavegar}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/[0.07] py-2.5 text-xs font-bold transition-colors hover:bg-white/12"
      >
        Ir para a sua biblioteca
      </Link>
    </div>
  );
}
