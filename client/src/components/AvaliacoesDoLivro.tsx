import { useState } from "react";
import { Link } from "wouter";
import { avatarDeLeitor } from "@/lib/community";
import { MessageSquare } from "lucide-react";

import { NotaDoComentario } from "@/components/CommentThread";
import { relativeDate } from "@/lib/activity";
import {
  authorOf,
  avaliacoesDoLivro,
  repliesTo,
  type Comment,
} from "@/lib/comments";

/**
 * As avaliações escritas de um livro — a metade "resenha" da separação de
 * 28/07 (ROTEIRO 4.41): **nota = avaliação; âncora = conversa**.
 *
 * Antes, estas falas moravam dentro da sala, com estrelas no meio do papo — e
 * o Matheus apontou que não dava para saber o que era conversa e o que era
 * comentário. Agora a resenha vive aqui, colada na nota média e na sua
 * avaliação, no formato que toda livraria usa; a sala ficou só com a conversa.
 *
 * **Sem caixa de escrever e sem botão de responder, de propósito** — os
 * formulários não se cruzam: a sua nota é o `AvaliarLivro` logo acima, e quem
 * quer conversar conversa na sala. As respostas que os leitores fictícios já
 * tinham deixado em resenhas continuam legíveis ("N respostas"), porque
 * apagar fala existente para arrumar a casa seria jogar conteúdo fora.
 */
export default function AvaliacoesDoLivro({ bookId }: { bookId: number }) {
  const avaliacoes = avaliacoesDoLivro(bookId);

  if (avaliacoes.length === 0) {
    return (
      <p className="text-sm text-white/35 py-2" data-testid="avaliacoes-empty">
        Ainda não há avaliações escritas deste livro.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="avaliacoes-do-livro">
      {avaliacoes.map((item) => (
        <Avaliacao key={item.id} item={item} />
      ))}
    </div>
  );
}

function Avaliacao({ item }: { item: Comment }) {
  const autor = authorOf(item);
  const respostas = repliesTo(item.id);
  const [mostrarRespostas, setMostrarRespostas] = useState(false);
  const [revelado, setRevelado] = useState(false);
  const uteis = item.likes;

  return (
    <article
      className="rounded-xl border border-white/5 bg-white/5 p-4"
      data-testid={`avaliacao-${item.id}`}
    >
      {/*
        **A foto e o nome levam ao perfil de quem avaliou** — conserto de 31/07.
        O Matheus abriu a ficha de "O clube das 5 da manhã" e não conseguiu
        clicar na Luciana: aqui o autor era texto puro, enquanto em todo o resto
        do app (feed, fórum, mural, sala) tocar num leitor abre a página dele.
        Regra da casa: **nome de leitor na tela é sempre porta para o perfil.**
      */}
      <Link
        href={autor ? `/user/${autor.slug}` : "/profile"}
        className="flex items-center gap-2.5"
        data-testid={`avaliacao-autor-${item.id}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
            autor?.color ?? "from-zinc-600 to-zinc-700"
          } text-xs font-bold`} {...avatarDeLeitor(autor?.slug)}
        >
          {(autor?.name ?? "?").charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold transition-colors hover:text-primary">
            {autor?.name ?? "Você"}
          </span>
          <span className="block text-[10px] text-white/30">{relativeDate(item.date)}</span>
        </span>
      </Link>

      {item.rating !== undefined && <NotaDoComentario nota={item.rating} />}

      {item.spoiler && !revelado ? (
        <button
          onClick={() => setRevelado(true)}
          className="mt-2 w-full rounded-lg border border-dashed border-white/15 py-2.5 text-xs text-white/40 transition-colors hover:text-white/70"
          data-testid={`avaliacao-spoiler-${item.id}`}
        >
          Esta avaliação contém spoiler — toque para ler
        </button>
      ) : (
        <p className="mt-1 text-sm italic leading-relaxed text-white/70">"{item.text}"</p>
      )}

      <div className="mt-3 flex items-center gap-4 text-[11px] text-white/30">
        {uteis > 0 && (
          <span>
            {uteis} {uteis === 1 ? "pessoa achou" : "pessoas acharam"} útil
          </span>
        )}
        {respostas.length > 0 && (
          <button
            onClick={() => setMostrarRespostas((v) => !v)}
            className="flex items-center gap-1 font-medium text-white/40 transition-colors hover:text-white/70"
            data-testid={`avaliacao-respostas-${item.id}`}
          >
            <MessageSquare className="h-3 w-3" />
            {mostrarRespostas
              ? "Esconder respostas"
              : `${respostas.length} ${respostas.length === 1 ? "resposta" : "respostas"}`}
          </button>
        )}
      </div>

      {mostrarRespostas && respostas.length > 0 && (
        <div className="mt-3 space-y-2.5 border-l-2 border-white/10 pl-3">
          {respostas.map((resposta) => {
            const quem = authorOf(resposta);
            return (
              <div key={resposta.id} data-testid={`avaliacao-resposta-${resposta.id}`}>
                <p className="text-xs leading-relaxed text-white/55">
                  {/* Quem responde também é gente: o nome leva ao perfil. */}
                  <Link
                    href={quem ? `/user/${quem.slug}` : "/profile"}
                    className="font-semibold text-white/75 transition-colors hover:text-primary"
                  >
                    {quem?.name ?? "Você"}
                  </Link>
                  {": "}
                  {resposta.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
