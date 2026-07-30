import { Link } from "wouter";
import { ArrowRight, Flame, MessageSquare, Sparkles } from "lucide-react";

import { CartaoDoClube } from "@/components/comunidade/CartaoDePost";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import { relativeDate } from "@/lib/activity";
import { findMember } from "@/lib/community";
import { type TrechoQuente } from "@/lib/trechosQuentes";
import { estreiaEmTexto, type Clube } from "@/lib/clubes";
import { type Grupo, type TopicoNaTela } from "@/lib/grupos";

/**
 * Os dois cartões que **não são posts** e ainda assim moram no feed: um clube e
 * uma conversa de fórum.
 *
 * **De onde isto vem.** A §4.57 registrou a decisão contra enterrar clube e fórum
 * numa gaveta ("o menu da Comunidade"), e a §4.58 a transformou em regra (item 7
 * do quadro): *eles aparecem como cartões no feed*. O argumento é o mesmo dos
 * onze fracassos da §4.53 — o que não passa na frente dos olhos não existe, e
 * gaveta é onde as coisas vão para não passar.
 *
 * **A linha de cima é obrigatória, e não é enfeite.** Um cartão de clube no meio
 * de posts, sem explicação, lê como anúncio: a pessoa não sabe por que aquilo
 * está ali e passa a desconfiar do resto da lista. A linha diz **por que este
 * item apareceu** — e é ela que separa "convite" de "propaganda".
 */

/** A etiqueta de cima: por que este item está no meio dos posts. */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
      {children}
    </p>
  );
}

/**
 * Um clube aberto — **o cartão é o mesmo do post**, de propósito.
 *
 * Reusa `CartaoDoClube` em vez de desenhar outro: o clube tem uma forma só no
 * app (capa da vez, prazo, vagas, entrar), e dar a ele duas caras conforme o
 * lugar seria a pessoa aprender duas vezes a mesma coisa. O que muda é só a
 * etiqueta de cima.
 */
export function ConviteDeClube({ clube, comecando }: { clube: Clube; comecando: boolean }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 pt-3"
      data-testid={`feed-clube-${clube.id}`}
    >
      <Etiqueta>
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {/* Curto de propósito: a etiqueta é uma legenda, e legenda que vira duas
            linhas compete com o título do cartão que ela deveria apresentar. */}
        {comecando ? `${estreiaEmTexto(clube)} — dá para entrar do começo` : "Um clube com vaga"}
      </Etiqueta>

      {/* `-mt-3` porque o cartão do post já vem com `mt-3` embutido: sem isto
          sobrariam dois espaçamentos empilhados debaixo da etiqueta. */}
      <div className="-mt-3">
        <CartaoDoClube clubeId={clube.id} />
      </div>
    </section>
  );
}

/**
 * Uma conversa de fórum — **o título e o tamanho da conversa, nada mais**.
 *
 * O fórum é o item menos visual do feed: não tem capa. Tentar dar corpo a ele
 * com prévia de respostas encheria o cartão de texto pequeno e ele passaria a
 * competir com os posts, que é o contrário do que se quer — aqui ele é uma porta,
 * e uma porta só precisa dizer para onde vai e se tem gente do outro lado.
 */
export function ConviteDeForum({ grupo, topico }: { grupo: Grupo; topico: TopicoNaTela }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 pt-3"
      data-testid={`feed-forum-${topico.id}`}
    >
      <Etiqueta>
        <MessageSquare className="h-3.5 w-3.5 text-primary" />
        Conversa no fórum
      </Etiqueta>

      <Link
        href={`/forum/${grupo.id}/topico/${topico.id}`}
        className="flex items-start gap-3 rounded-xl p-2.5 -mx-2.5 transition-colors hover:bg-white/[0.05]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xl ring-1 ring-white/10">
          {grupo.emoji}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-[14.5px] font-bold leading-snug">
            {topico.titulo}
          </span>
          <span className="mt-1 block text-[11.5px] text-white/40">
            {grupo.nome} · {topico.totalRespostas}{" "}
            {topico.totalRespostas === 1 ? "resposta" : "respostas"}
            {topico.ultimaAtividade && ` · ${relativeDate(topico.ultimaAtividade)}`}
          </span>
        </span>

        <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-white/25" />
      </Link>
    </section>
  );
}

/**
 * **Trechos quentes** — os pedaços de áudio que estão circulando (§4.58, item 8).
 *
 * É o cartão mais "AllBook" do feed: nenhum outro app pode mostrar isto, porque
 * em nenhum outro o conteúdo é voz. Por isso ele **toca ali mesmo** — mandar a
 * pessoa para outra tela para ouvir 40 segundos seria perder o gesto.
 *
 * **Rola de lado quando há mais de um.** Empilhar três players verticalmente
 * daria uma parede de ondas sonoras iguais; deitado, cada um é uma escolha.
 *
 * **A frase de quem cortou vem junto**, porque é ela que dá motivo ao play: um
 * player solto no meio do feed é um botão sem promessa.
 */
export function TrechosQuentes({ trechos }: { trechos: TrechoQuente[] }) {
  return (
    <section
      className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5 pt-3"
      data-testid="feed-trechos-quentes"
    >
      <Etiqueta>
        <Flame className="h-3.5 w-3.5 text-primary" />
        Trechos que estão circulando
      </Etiqueta>

      <div className="-mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-1 scrollbar-hide">
        {trechos.map((item) => {
          const quem = item.autorSlug ? findMember(item.autorSlug)?.name : "Você";
          return (
            <div
              key={`${item.citacao.bookId}-${item.citacao.inicioSec}`}
              className={`shrink-0 snap-start ${trechos.length > 1 ? "w-[87%]" : "w-full"}`}
            >
              <CitacaoDeAudio citacao={item.citacao} grande />
              {item.frase && (
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-white/50">
                  <span className="font-semibold text-white/70">{quem}:</span> “{item.frase}”
                </p>
              )}
              {item.vozes > 1 && (
                <p className="mt-1 text-[11px] text-primary/70">
                  {item.vozes} pessoas cortaram este mesmo pedaço
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
