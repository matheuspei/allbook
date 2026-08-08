import { Link } from "wouter";
import { CalendarDays, MessageSquare, Plus, Users } from "lucide-react";

import { catalog, type Book } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import {
  capituloDaRoda,
  diasAte,
  estaComecando,
  estreiaEmTexto,
  meuCapitulo,
  prazoEmTexto,
  type Clube,
  type ClubeComMotivo,
} from "@/lib/clubes";
import { totalDoMural } from "@/lib/muralDoClube";

/**
 * Os cartões da tela de clubes — **num arquivo próprio desde a §4.99**.
 *
 * Moravam dentro de `pages/Clubes.tsx`, que era a única tela. Com a reforma
 * escolhida pelo Matheus (as portas com número, cada uma abrindo página), os
 * mesmos cartões passaram a servir a quatro páginas — e duas cópias divergem,
 * como a régua da §4.41 já mediu no perfil.
 */

/** Pastilha de assunto — laranja da marca quando ligada, sem cor nova. */
export function Pastilha({
  ligada,
  onClick,
  children,
}: {
  ligada: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
        ligada
          ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
          : "bg-white/[0.06] text-white/55 ring-1 ring-inset ring-white/8 hover:text-white/85"
      }`}
      data-testid={`topico-${children}`}
    >
      {children}
    </button>
  );
}

/** Título de seção — pequeno, em caixa alta. Sem ícone: ele vetou as figurinhas (04/08). */
export function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/**
 * Uma linha fina de agenda — o desenho da proposta B da folha `_clubes-B.html`,
 * que o Matheus resgatou em 04/08: *"uma fileirinha dos próximos encontros…
 * eles estavam separados, o dia estava bem mais bonito"*. A capa é miniatura,
 * e a data vive sozinha à direita, com o quê (encontro ou estreia) em cima.
 * Linha fina em vez de cartão gordo é o que deixa caber 5 numa dobra.
 */
export function LinhaDeAgenda({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  const estreia = estaComecando(clube);
  const data = estreia ? clube.ciclo.inicio : clube.ciclo.encontro;
  const cor = estreia
    ? "text-primary"
    : diasAte(data) <= 7
      ? "text-primary"
      : "text-white/55";

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.07]"
      data-testid={`encontro-${clube.id}`}
    >
      {livro && (
        <img
          src={livro.cover}
          alt={livro.title}
          className="h-9 w-9 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{clube.nome}</p>
        <p className="truncate text-[10.5px] text-white/40">{livro?.title}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/30">
          {estreia ? "estreia" : "encontro"}
        </p>
        <p className={`text-xs font-bold ${cor}`}>{prazoEmTexto(data)}</p>
      </div>
    </Link>
  );
}

/**
 * Um clube seu — o que ele mostra é **o seu estado nele**: onde você está
 * contra a roda, e qual é o próximo prazo. É a informação que faz voltar.
 *
 * **Clube seu que ainda vai estrear ganha a etiqueta laranja** no lugar da
 * régua (§4.99) — foi a escolha do Matheus na folha: a estreia sua mora aqui,
 * entre os seus, e não na vitrine de descoberta. Régua de progresso num clube
 * em que ninguém começou seria uma barra vazia fingindo informação.
 */
export function CartaoDoSeuClube({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  const totalCapitulos = getChapters(clube.ciclo.bookId).length;
  const estreia = estaComecando(clube);
  const seu = meuCapitulo(clube);
  const roda = capituloDaRoda(clube);
  const mensagens = totalDoMural(clube.id);
  const pct = (valor: number) => `${Math.min(100, (valor / totalCapitulos) * 100)}%`;

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="block rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
      data-testid={`clube-card-${clube.id}`}
    >
      <div className="flex gap-3.5">
        {livro && (
          <img
            src={livro.cover}
            alt={livro.title}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold">{clube.nome}</p>
          <p className="truncate text-[11px] text-white/45">
            {livro ? livro.title : "Sem livro no ciclo"}
          </p>

          {estreia ? (
            <p className="mt-2.5">
              <span className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                {estreiaEmTexto(clube)}
              </span>
              <span className="ml-2 text-[11px] text-white/45">
                {clube.membros.length} {clube.membros.length === 1 ? "inscrito" : "inscritos"}
              </span>
            </p>
          ) : (
            <div className="mt-2.5">
              <div className="relative h-1.5 rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: pct(seu) }}
                />
                <span
                  className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  style={{ left: pct(roda) }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-white/45">
                {seu === 0 && roda === 0
                  ? "Ninguém começou ainda — o clube é novo"
                  : seu === 0
                    ? `Você ainda não começou · a roda está no capítulo ${roda}`
                    : seu >= roda
                      ? `Capítulo ${seu} — no ritmo da roda`
                      : `Capítulo ${seu} · a roda está no ${roda}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-3 text-[11px] text-white/35">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3" />
          Encontro {prazoEmTexto(clube.ciclo.encontro)}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          {mensagens} no mural
        </span>
      </div>
    </Link>
  );
}

/**
 * Um cartão da grade de estreias — **na proporção da biblioteca** (04/08).
 *
 * O Matheus mediu de olho: *"só tem dois livros um do lado do outro… onde tinha
 * biblioteca e catálogo são três livros"*. Então o cartão é fluido e a página o
 * põe na mesma grade da estante (`grid-cols-3`), com a capa em 3:4 como lá. A
 * data é uma etiqueta no canto, e não uma tarja sobre a arte, porque capa de
 * livro tem texto no rodapé — tarja ali era letra sobre letra.
 */
export function CartaoDeEstreia({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  if (!livro) return null;

  return (
    <Link href={`/clube/${clube.id}`} className="block" data-testid={`clube-estreia-${clube.id}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 shadow-lg shadow-black/40">
        <img src={livro.cover} alt={livro.title} className="h-full w-full object-cover" />
        {/* Forma curta ("amanhã", "em 4 dias"): o título da página já diz que é
            estreia, e "começa em…" quebrava em duas linhas na capa estreita. */}
        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-primary backdrop-blur-sm">
          {prazoEmTexto(clube.ciclo.inicio)}
        </span>
      </div>

      <h3 className="mt-2 text-[13px] font-medium leading-snug line-clamp-2">{clube.nome}</h3>
      <p className="truncate text-[11px] text-white/40">
        {clube.membros.length} {clube.membros.length === 1 ? "inscrito" : "inscritos"}
      </p>
    </Link>
  );
}

/** Clube que já está rolando — mostra o que se ganha ao entrar. */
export function CartaoParaDescobrir({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId) as Book | undefined;
  const mensagens = totalDoMural(clube.id);

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="relative block overflow-hidden rounded-2xl border border-white/[0.07]"
      data-testid={`clube-card-${clube.id}`}
    >
      {livro && (
        <img
          src={livro.cover}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
        />
      )}
      <div className="absolute inset-0 bg-background/75" />

      <div className="relative flex gap-3.5 p-4">
        {livro && (
          <img
            src={livro.cover}
            alt={livro.title}
            className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-lg"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold">{clube.nome}</p>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-white/45">
            {clube.descricao}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-white/35">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {clube.membros.length}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {mensagens}
            </span>
            <span className="truncate">
              lendo {livro?.title} · cap. {capituloDaRoda(clube)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Um clube sugerido com o **porquê escrito** — a seção "Para você" (§4.99).
 *
 * O motivo em laranja é o que separa isto de vitrine genérica: "porque você
 * está no Não durmo mais" responde na hora por que este clube está na sua
 * frente. Pedido do Matheus na folha dos clubes.
 */
export function CartaoComMotivo({ sugestao }: { sugestao: ClubeComMotivo }) {
  const { clube, motivo } = sugestao;
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]"
      data-testid={`clube-para-voce-${clube.id}`}
    >
      {livro && (
        <img
          src={livro.cover}
          alt={livro.title}
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold font-display">{clube.nome}</p>
        <p className="truncate text-[11px] text-primary/90">{motivo}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-white/35">
          {clube.membros.length} membros
          {estaComecando(clube)
            ? ` · ${estreiaEmTexto(clube)}`
            : ` · lendo ${livro?.title ?? "—"}`}
        </p>
      </div>
    </Link>
  );
}

/**
 * O convite para criar — um cartão com o mesmo peso dos outros, e não a linha
 * tracejada de "área vazia": criar é uma ação que a gente quer que aconteça.
 */
export function ConviteParaCriar({ temClube }: { temClube: boolean }) {
  return (
    <Link
      href="/clubes/novo"
      className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/[0.07] p-4 transition-colors hover:bg-primary/[0.12]"
      data-testid="button-novo-clube"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <Plus className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold">
          {temClube ? "Criar outro clube" : "Criar o seu clube"}
        </span>
        <span className="block text-[11px] leading-relaxed text-white/50">
          Escolha o livro, o ritmo das semanas e a data de estreia. Depois é só chamar gente pelo
          link.
        </span>
      </span>
    </Link>
  );
}
