import { useMemo } from "react";
import { Link } from "wouter";
import {
  BookmarkPlus,
  CheckCircle2,
  Headphones,
  Lock,
  MessageCircle,
  Star,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { apagarPost, type ItemDoMural } from "@/lib/mural";
import { initialOf, readProfile } from "@/lib/profile";

/**
 * A peça que desenha UM acontecimento do mural: post, recomendação, avaliação,
 * comentário, "está ouvindo" e "terminou".
 *
 * Ela é a sobrevivente do antigo `MuralDaComunidade` (o feed com caixa de
 * publicar, de 28/07): quando a Comunidade foi refeita (§4.58), aquele feed
 * saiu de cena, mas o perfil do leitor e a página de comentários continuam
 * desenhando a atividade com ESTA mesma peça — o mesmo acontecimento não pode
 * ter uma cara no feed e outra no perfil (régua da 4.20).
 */

/** "há 2 dias" para datas ISO completas — reaproveita a régua da comunidade. */
function quando(iso: string): string {
  return relativeDate(iso.slice(0, 10));
}

/**
 * O verbo, o ícone e a COR de cada tipo — o vocabulário fechado do mural.
 * Cor própria por verbo (28/07, da reformulação): verde para o vivo, a marca
 * para recomendação, âmbar para nota, azul para a sua voz, lilás para papo.
 */
function verboDoItem(item: ItemDoMural): {
  icone: React.ReactNode;
  verbo: string;
  cor: string;
} {
  switch (item.tipo) {
    case "disse":
      // Post no clube fala "no clube"; nos livros, "sobre" — desde que a
      // âncora deixou de ser só o que está tocando, "ouvindo" mentiria.
      return {
        icone: <MessageCircle className="h-3 w-3" />,
        verbo: item.clube ? "disse, no clube" : "disse, sobre",
        cor: "text-[#5b9dff]",
      };
    case "recomendou":
      return {
        icone: <BookmarkPlus className="h-3 w-3" />,
        verbo: "recomendou",
        cor: "text-primary/90",
      };
    case "comentou":
      return {
        icone: <MessageCircle className="h-3 w-3" />,
        verbo: "comentou em",
        cor: "text-[#c084fc]",
      };
    case "avaliou":
      return { icone: <Star className="h-3 w-3" />, verbo: "avaliou", cor: "text-[#f59e0b]" };
    case "ouvindo":
      return {
        icone: <Headphones className="h-3 w-3" />,
        verbo: "está ouvindo",
        cor: "text-green-400/90",
      };
    case "terminou":
      return {
        icone: <CheckCircle2 className="h-3 w-3" />,
        verbo: "terminou",
        cor: "text-green-400/90",
      };
  }
}

/**
 * Um acontecimento do mural, desenhado. Exportado porque o perfil de um
 * leitor mostra a atividade dele com ESTA mesma peça — o mesmo acontecimento
 * não pode ter uma cara no feed e outra no perfil (régua da 4.20).
 */
export function ItemDoFeed({ item }: { item: ItemDoMural }) {
  const { toast } = useToast();
  const { icone, verbo, cor } = verboDoItem(item);
  const perfil = useMemo(readProfile, []);

  const nome = item.autor.souEu ? "Você" : item.autor.nome;
  const linkDoAutor = item.autor.souEu ? "/profile" : `/user/${item.autor.slug}`;

  return (
    <article className="flex gap-3 border-b border-white/5 py-3.5 last:border-b-0" data-testid={`mural-item-${item.id}`}>
      <Link href={linkDoAutor} className="shrink-0 self-start" aria-label={`Ver ${nome}`}>
        {item.autor.souEu ? (
          <Avatar className="h-9 w-9">
            {perfil.photo && <AvatarImage src={perfil.photo} alt={nome} className="object-cover" />}
            <AvatarFallback className="bg-[#1e1e1e] text-xs font-bold text-white">
              {initialOf(perfil.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${item.autor.cor} text-xs font-bold`}
          >
            {item.autor.nome.charAt(0)}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <Link href={linkDoAutor} className="font-semibold transition-colors hover:text-primary">
            {nome}
          </Link>{" "}
          <span className={`inline-flex items-center gap-1 ${cor}`}>
            {icone}
            {verbo}
          </span>{" "}
          {item.tipo === "disse" && item.clube ? (
            <Link
              href={`/clube/${item.clube.id}`}
              className="font-medium transition-colors hover:text-primary"
            >
              {item.clube.nome}
            </Link>
          ) : (
            <Link
              href={`/book/${item.book.id}`}
              className="font-medium transition-colors hover:text-primary"
            >
              {item.book.title}
            </Link>
          )}
          {item.tipo === "ouvindo" && (
            <span className="text-white/35"> · cap. {item.chapter}</span>
          )}
          {item.tipo === "avaliou" && (
            <span className="ml-1 inline-flex items-center gap-0.5 align-[-1px] text-[#f59e0b]">
              {item.nota.toFixed(1)} <Star className="h-3 w-3 fill-[#f59e0b]" />
            </span>
          )}
        </p>

        {/* O corpo, quando há: post, motivo da recomendação, comentário. */}
        {item.tipo === "disse" && (
          <p className="mt-1 text-sm leading-relaxed text-white/75">{item.texto}</p>
        )}
        {item.tipo === "recomendou" && item.note && (
          <p className="mt-1 text-xs italic leading-relaxed text-white/55">“{item.note}”</p>
        )}
        {item.tipo === "avaliou" && item.texto && (
          <p className="mt-1 line-clamp-2 text-xs italic leading-relaxed text-white/55">
            “{item.texto}”
          </p>
        )}
        {item.tipo === "comentou" &&
          (item.estado === "livre" ? (
            <p className="mt-1 line-clamp-2 text-xs italic leading-relaxed text-white/55">
              “{item.texto}”
            </p>
          ) : (
            // A trava viaja com o comentário: nem no corredor o texto vaza.
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-white/30">
              <Lock className="h-3 w-3" />
              {item.estado === "adiante"
                ? "Num trecho à frente de onde você está — continue ouvindo para ler."
                : "Marcado como spoiler — abra a conversa do livro para revelar."}
            </p>
          ))}

        <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/25">
          <span>{item.tipo === "ouvindo" ? "agora" : quando(item.date)}</span>
          {item.tipo === "comentou" && (
            <Link
              href={`/book/${item.book.id}/conversa`}
              className="font-medium text-white/35 transition-colors hover:text-primary"
            >
              Abrir a conversa
            </Link>
          )}
          {item.tipo === "disse" && item.meuPostId && (
            <button
              onClick={() => {
                apagarPost(item.meuPostId!);
                toast({ title: "Post apagado" });
              }}
              className="flex items-center gap-1 text-white/25 transition-colors hover:text-white/60"
              aria-label="Apagar este post"
              data-testid={`mural-delete-${item.meuPostId}`}
            >
              <Trash2 className="h-3 w-3" />
              Apagar
            </button>
          )}
        </div>
      </div>

      {/* Post de clube: a capa é o livro da vez, mas a porta é o clube. */}
      <Link
        href={item.tipo === "disse" && item.clube ? `/clube/${item.clube.id}` : `/book/${item.book.id}`}
        className="shrink-0 self-start"
      >
        <img
          src={item.book.cover}
          alt={item.book.title}
          className="h-[52px] w-10 rounded object-cover"
        />
      </Link>
    </article>
  );
}
