import { Link } from "wouter";
import { Radio, Users } from "lucide-react";
import { avatarDeLeitor, findMember } from "@/lib/community";
import { salaDoLivro, situacaoDaSala } from "@/lib/salaAoVivo";

/**
 * **A sala deste livro, dentro do player.**
 *
 * Só aparece quando há uma sala **acontecendo agora** neste livro. Não existe
 * versão vazia disto: caixa dizendo "ninguém está ouvindo junto" é exatamente a
 * praga que a §4.40 tirou destas telas — quem quer abrir uma sala usa o botão
 * *Ouvir junto*, que fica no menu e não some nunca.
 */
export default function FaixaDaSalaNoPlayer({ bookId }: { bookId: number }) {
  const sala = salaDoLivro(bookId);
  if (!sala) return null;

  const anfitriao = findMember(sala.anfitriao);
  const situacao = situacaoDaSala(sala);

  return (
    <Link
      href={`/sala/${sala.id}`}
      className="flex w-full shrink-0 items-center gap-2.5 rounded-xl bg-red-500/[0.09] px-3.5 py-2.5 ring-1 ring-inset ring-red-500/25 transition-colors hover:bg-red-500/[0.14]"
      data-testid="faixa-sala-no-player"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-semibold leading-tight">
          {anfitriao?.name ?? "Alguém"} está ouvindo com {Math.max(0, sala.presentes.length - 1)}{" "}
          {sala.presentes.length - 1 === 1 ? "pessoa" : "pessoas"}
        </span>
        <span className="mt-0.5 block text-[10.5px] text-white/40">
          cap. {situacao.capitulo} · entrar te leva ao ponto deles
        </span>
      </span>

      <span className="flex shrink-0">
        {sala.presentes.slice(0, 3).map((slug, i) => {
          const membro = findMember(slug);
          return (
            <span
              key={slug}
              className={`flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 border-[#141414] bg-gradient-to-br text-[8px] font-bold text-black ${
                membro?.color ?? "from-primary to-amber-500"
              } ${i > 0 ? "-ml-1.5" : ""}`}
              {...avatarDeLeitor(slug)}
            >
              {(membro?.name ?? "?").charAt(0)}
            </span>
          );
        })}
      </span>
    </Link>
  );
}

/**
 * O item de menu que abre a folha das três portas. Mora no "…" do player porque
 * abrir sala é ação **ocasional** — o que é do momento (uma sala no ar) aparece
 * sozinho na faixa acima.
 */
export function ItemOuvirJunto({ onAbrir }: { onAbrir: () => void }) {
  return (
    <button
      onClick={onAbrir}
      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
      data-testid="menu-ouvir-junto"
    >
      <Users className="h-5 w-5 text-white/50 group-hover:text-white" />
      <span className="text-sm font-medium">Ouvir junto</span>
      <Radio className="ml-auto h-3.5 w-3.5 text-primary/70" />
    </button>
  );
}
