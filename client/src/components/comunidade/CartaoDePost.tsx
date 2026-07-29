import { Link } from "wouter";
import { CalendarClock, HelpCircle, Users } from "lucide-react";

import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import { catalog } from "@/lib/books";
import { clubePorId, vagasRestantes } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import { isFollowing, toggleFollow } from "@/lib/following";
import { initialOf, readProfile } from "@/lib/profile";
import { type Post } from "@/lib/posts";
import { useState } from "react";

/**
 * O cartão de um post — **a peça que decide se a Comunidade sai do cru**.
 *
 * Construído antes de qualquer tela, de propósito: se o cartão não impressiona
 * sozinho, nenhuma tela em volta salva (ROTEIRO §4.58, ordem de construção).
 *
 * **As quatro formas, e o que muda entre elas:**
 *
 * 1. **Com livro** — a capa ocupa a largura toda, alta, com o título por cima do
 *    escurecido. É a forma mais comum e a mais barata: a capa já existe, já é
 *    bonita, e já é porta para a ficha.
 * 2. **Com trecho** — o cartão de citação em tamanho grande (capa ao fundo, onda
 *    e play). É o que só o AllBook tem: 40 segundos que tocam e param no fim.
 * 3. **Com clube** — capa do livro da vez, prazo e vagas. É convite disfarçado
 *    de post: quem lê pode entrar dali.
 * 4. **Só texto** — sem objeto. Ganha **tratamento tipográfico** (corpo maior,
 *    entrelinha larga) para ter presença em vez de virar buraco entre dois
 *    cartões com capa. Permitido, nunca o padrão.
 *
 * **O que o cabeçalho mostra:** foto, nome, quando — e o "seguir" **só se você
 * ainda não segue**. O Matheus quis o botão no cartão e eu era contra por
 * poluição; o acordo foi ele sumir depois de cumprir a função, em vez de virar
 * "Seguindo ✓" ocupando espaço em todo post para sempre (§4.58).
 */
export default function CartaoDePost({ post }: { post: Post }) {
  const membro = post.autorSlug ? findMember(post.autorSlug) : undefined;
  const meuPerfil = readProfile();
  const ehMeu = post.autorSlug === undefined;
  const [seguindo, setSeguindo] = useState(() =>
    post.autorSlug ? isFollowing(post.autorSlug) : true,
  );

  const nome = ehMeu ? meuPerfil.name : (membro?.name ?? "Leitor");
  const href = ehMeu ? "/profile" : `/user/${post.autorSlug}`;

  return (
    <article
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5"
      data-testid={`post-${post.id}`}
    >
      <header className="flex items-center gap-2.5">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2.5">
          {ehMeu && meuPerfil.photo ? (
            <img src={meuPerfil.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${
                membro?.color ?? "from-primary to-orange-600"
              } font-display text-sm font-bold`}
            >
              {ehMeu ? initialOf(meuPerfil.name) : nome.charAt(0)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold">{nome}</span>
            <span className="block text-[11px] text-white/35">
              {quando(post.date)}
              {post.editadoEm && " · editado"}
            </span>
          </span>
        </Link>

        {/* Some assim que você segue: cumpriu a função, sai da frente. */}
        {!ehMeu && !seguindo && (
          <button
            onClick={() => {
              if (post.autorSlug) setSeguindo(toggleFollow(post.autorSlug));
            }}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-bold text-primary ring-1 ring-inset ring-primary/40 transition-colors hover:bg-primary/10"
            data-testid={`seguir-${post.autorSlug}`}
          >
            Seguir
          </button>
        )}
      </header>

      {/* A pergunta se anuncia antes do texto: quem passa os olhos sabe que ali
          cabe uma resposta dele. */}
      {post.pergunta && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f59e0b]">
          <HelpCircle className="h-3 w-3" />
          Perguntou
        </p>
      )}

      {post.texto && (
        <p
          className={
            post.objeto
              ? "mt-2 text-[14px] leading-relaxed text-white/85"
              : /* Sem objeto, o texto **é** o cartão: corpo maior e entrelinha
                   larga, para ter presença em vez de virar buraco. */
                "mt-2.5 font-display text-[19px] font-semibold leading-snug tracking-tight text-white/90"
          }
        >
          {post.texto}
        </p>
      )}

      {post.objeto?.tipo === "livro" && <CapaDoLivro bookId={post.objeto.bookId} />}
      {post.objeto?.tipo === "trecho" && (
        <div className="mt-3">
          <CitacaoDeAudio citacao={post.objeto.citacao} grande />
        </div>
      )}
      {post.objeto?.tipo === "clube" && <CartaoDoClube clubeId={post.objeto.clubeId} />}
    </article>
  );
}

/**
 * O livro citado, com a capa **grande**.
 *
 * A regra que veio das capturas de 29/07: *"você consegue ver o ícone maior da
 * capa; isso é bem mais interessante"*. Miniatura de 40px é informação; capa de
 * meia tela é presença — e presença é o que faltava ao feed.
 */
function CapaDoLivro({ bookId }: { bookId: number }) {
  const livro = catalog.find((item) => item.id === bookId);
  if (!livro) return null;

  return (
    <Link
      href={`/book/${livro.id}`}
      className="mt-3 block overflow-hidden rounded-xl"
      data-testid="post-livro"
    >
      <span className="relative block h-40">
        <img src={livro.cover} alt={livro.title} className="h-full w-full object-cover" />
        {/* O escurecido existe para o texto ser legível sobre qualquer arte —
            capa clara e capa escura têm de servir igual. */}
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block truncate font-display text-[15.5px] font-bold">{livro.title}</span>
          <span className="mt-0.5 block truncate text-[11.5px] text-white/60">
            {livro.author} · narra {livro.narrator}
          </span>
        </span>
      </span>
    </Link>
  );
}

/** O clube citado — capa do livro da vez, prazo e vagas. Convite, na prática. */
function CartaoDoClube({ clubeId }: { clubeId: string }) {
  const clube = clubePorId(clubeId);
  if (!clube) return null;
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  const vagas = vagasRestantes(clube);

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/[0.09]"
      data-testid="post-clube"
    >
      {livro && (
        <img src={livro.cover} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[14px] font-bold">{clube.nome}</span>
        {livro && (
          <span className="mt-0.5 block truncate text-[11.5px] text-white/45">{livro.title}</span>
        )}
        <span className="mt-1.5 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-white/45">
            <Users className="h-3 w-3" />
            {clube.membros.length}
          </span>
          {vagas !== undefined && vagas > 0 && (
            <span className="flex items-center gap-1 font-semibold text-primary">
              <CalendarClock className="h-3 w-3" />
              {vagas} {vagas === 1 ? "vaga" : "vagas"}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

/** "há 2 h", "ontem" — a mesma escala das notificações. */
function quando(iso: string): string {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return `há ${Math.floor(dias / 7)} sem`;
}
