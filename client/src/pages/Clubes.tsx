import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, MessageSquare, Plus, Sparkles, Users } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog, type Book } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import {
  CLUBES_EVENT,
  capituloDaRoda,
  clubesComecando,
  clubesParaDescobrir,
  corDoMembro,
  dataCurta,
  estreiaEmTexto,
  meuCapitulo,
  meusClubes,
  nomeDoMembro,
  prazoEmTexto,
  type Clube,
} from "@/lib/clubes";
import { MURAL_EVENT, totalDoMural } from "@/lib/muralDoClube";

/**
 * A tela dos clubes.
 *
 * **Por que ela foi redesenhada (28/07).** A primeira versão era uma lista de
 * cartõezinhos com capa de 56px — o Matheus disse, com razão, que estava
 * "seca". Numa tela cujo trabalho é **convencer alguém a entrar num
 * compromisso**, texto cinza em fileira não convence ninguém.
 *
 * O que dá vida aqui **não é enfeite**: são as capas grandes (a arte é o que o
 * app tem de mais bonito e já está pronta), a hierarquia — um destaque em cima,
 * o resto abaixo — e a informação que muda ("estreia em 4 dias", "você está no
 * capítulo 3, a roda no 6"). Nada de cor decorativa nem número supérfluo, que é
 * a régua que este app segue desde sempre.
 *
 * A ordem responde à pergunta de quem chega: **o que está para começar** (é onde
 * dá para entrar sem chegar atrasado), **onde eu já estou**, **o que mais
 * existe**, e **como faço o meu**.
 */
export default function Clubes() {
  const [meus, setMeus] = useState<Clube[]>(() => meusClubes());
  const [estreias, setEstreias] = useState<Clube[]>(() => clubesComecando());
  const [descobrir, setDescobrir] = useState<Clube[]>(() => clubesParaDescobrir());

  useEffect(() => {
    const atualizar = () => {
      setMeus(meusClubes());
      setEstreias(clubesComecando());
      setDescobrir(clubesParaDescobrir());
    };
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(CLUBES_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, []);

  /*
   * O destaque é a **estreia mais próxima**; sem nenhuma, o seu clube com o
   * prazo mais perto. A regra vem do uso: quem abre esta tela ou quer entrar em
   * algo (e estreia é a melhor porta) ou quer voltar ao que já é seu.
   */
  const destaque = estreias[0] ?? meus[0];
  const outrasEstreias = estreias.filter((clube) => clube.id !== destaque?.id);

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="clubes-page">
      <PageHeader title="Clubes" fallback="/community" />

      <div className="space-y-8 pt-4">
        {destaque && <Destaque clube={destaque} ehEstreia={estreias.length > 0} />}

        {meus.length > 0 && (
          <Secao titulo="Seus clubes" icone={<Users className="h-3 w-3" />}>
            <div className="space-y-3 px-5">
              {meus.map((clube) => (
                <CartaoDoSeuClube key={clube.id} clube={clube} />
              ))}
            </div>
          </Secao>
        )}

        {outrasEstreias.length > 0 && (
          <Secao
            titulo="Também estreando"
            icone={<Sparkles className="h-3 w-3 text-[#f59e0b]" />}
          >
            <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
              {outrasEstreias.map((clube) => (
                <CartaoDeEstreia key={clube.id} clube={clube} />
              ))}
            </div>
          </Secao>
        )}

        {descobrir.length > 0 && (
          <Secao titulo="Clubes em andamento" icone={<MessageSquare className="h-3 w-3" />}>
            <div className="space-y-3 px-5">
              {descobrir.map((clube) => (
                <CartaoParaDescobrir key={clube.id} clube={clube} />
              ))}
            </div>
          </Secao>
        )}

        <div className="px-5">
          <ConviteParaCriar temClube={meus.length > 0} />
        </div>
      </div>
    </div>
  );
}

/** Título de seção — pequeno, em caixa alta, com um ícone que dá o assunto. */
function Secao({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-1.5 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {icone}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/**
 * O destaque do topo.
 *
 * A capa do livro entra **duas vezes**: desfocada no fundo, dando a cor da
 * arte à tela inteira, e nítida na frente. É o mesmo recurso do topo do player
 * e da ficha — reconhecer a arte é mais rápido do que ler o nome do clube.
 */
function Destaque({ clube, ehEstreia }: { clube: Clube; ehEstreia: boolean }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  if (!livro) return null;

  return (
    <Link href={`/clube/${clube.id}`} className="block px-5" data-testid="clube-destaque">
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <img
          src={livro.cover}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#141414]" />

        <div className="relative p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f59e0b]">
            <Sparkles className="h-3 w-3" />
            {ehEstreia ? `Estreia ${estreiaEmTexto(clube)}` : "Seu clube"}
          </p>

          <div className="mt-3 flex gap-4">
            <img
              src={livro.cover}
              alt={livro.title}
              className="h-28 w-28 shrink-0 rounded-xl object-cover shadow-2xl shadow-black/60"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-xl font-bold leading-tight">{clube.nome}</h2>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">
                {clube.descricao}
              </p>
              <p className="mt-2 truncate text-[11px] text-white/40">
                {livro.title} · {getChapters(livro.id).length} capítulos
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Avatares clube={clube} />
            {/* "Ver a estreia", e não "Entrar": este cartão **leva** à página do
                clube, onde o entrar acontece de verdade. Dois botões "entrar"
                com efeitos diferentes seria promessa quebrada. */}
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-black">
              {ehEstreia ? "Ver a estreia" : "Abrir"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Avatares empilhados + contagem — quem já está lá dentro. */
function Avatares({ clube }: { clube: Clube }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex shrink-0">
        {clube.membros.slice(0, 4).map((slug, indice) => (
          <span
            key={slug}
            className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${corDoMembro(
              slug,
            )} font-display text-[11px] font-bold ring-2 ring-black/40 ${indice > 0 ? "-ml-2.5" : ""}`}
          >
            {nomeDoMembro(slug).charAt(0)}
          </span>
        ))}
      </span>
      <span className="truncate text-[11px] text-white/45">
        {clube.membros.length} {clube.membros.length === 1 ? "pessoa" : "pessoas"}
      </span>
    </span>
  );
}

/**
 * Um clube seu — e o que ele mostra é **o seu estado nele**: onde você está
 * contra a roda, e qual é o próximo prazo. É a informação que faz voltar.
 */
function CartaoDoSeuClube({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  const totalCapitulos = getChapters(clube.ciclo.bookId).length;
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

          <div className="mt-2.5">
            <div className="relative h-1.5 rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: pct(seu) }} />
              <span
                className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-[#f59e0b]"
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

/** Cartão vertical de estreia, para o carrossel. */
function CartaoDeEstreia({ clube }: { clube: Clube }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  if (!livro) return null;

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="w-[150px] shrink-0"
      data-testid={`clube-estreia-${clube.id}`}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img src={livro.cover} alt={livro.title} className="h-[150px] w-[150px] object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-8">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#f59e0b]">
            {estreiaEmTexto(clube)}
          </p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight">{clube.nome}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-white/35">
        {clube.membros.length} inscritos · {dataCurta(clube.ciclo.inicio)}
      </p>
    </Link>
  );
}

/** Clube que já está rolando — mostra o que se ganha ao entrar. */
function CartaoParaDescobrir({ clube }: { clube: Clube }) {
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
      <div className="absolute inset-0 bg-[#141414]/75" />

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
 * O convite para criar.
 *
 * Era uma linha tracejada cinza — o desenho que se usa para "área vazia", não
 * para uma ação que a gente quer que aconteça. Agora é um cartão com o mesmo
 * peso dos outros, e o texto diz o que a pessoa vai ter de decidir (livro,
 * ritmo, quem chamar), em vez de só nomear a ação.
 */
function ConviteParaCriar({ temClube }: { temClube: boolean }) {
  return (
    <Link
      href="/clubes/novo"
      className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/[0.07] p-4 transition-colors hover:bg-primary/[0.12]"
      data-testid="button-novo-clube"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-black">
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
