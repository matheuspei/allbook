import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, MessageSquare, Plus, Search, Sparkles, Users, X } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { catalog, type Book } from "@/lib/books";
import { getChapters } from "@/lib/chapters";
import {
  CLUBES_EVENT,
  capituloDaRoda,
  clubesComecando,
  buscarClubes,
  clubesParaDescobrir,
  corDoMembro,
  dataCurta,
  estreiaEmTexto,
  meuCapitulo,
  meusClubes,
  nomeDoMembro,
  prazoEmTexto,
  todosOsClubes,
  topicosDeClube,
  type Clube,
} from "@/lib/clubes";
import { MURAL_EVENT, totalDoMural } from "@/lib/muralDoClube";

/**
 * A tela dos clubes.
 *
 * **Reorganizada em 28/07 para escala** (ROTEIRO 4.42). Ela tinha duas gavetas —
 * "seus clubes" e "clubes em andamento" — e o Matheus viu o problema antes de ele
 * chegar: *"imagina que a gente vai ter uma tela que tenha centenas de clubes de
 * livros; da forma como está estruturada hoje não está muito legal"*. Uma lista
 * corrida de trezentos clubes não se lê.
 *
 * **O que faz a tela aguentar quantidade são três coisas, e nenhuma é enfeite:**
 * 1. **Carrossel de estreias** (pedido dele) — estreia é conteúdo que caduca e
 *    tem muitos ao mesmo tempo; em pé, ocuparia a tela inteira por uma semana.
 * 2. **Busca por nome, livro e autor** — a pergunta real de quem procura clube é
 *    "tem alguém lendo Duna?", não o nome que a turma deu a si mesma.
 * 3. **Tópicos** (sugestão dele: *"talvez colocar por tópicos"*) — pastilhas de
 *    gênero montadas a partir dos clubes que existem, nunca do catálogo, para
 *    não haver filtro que devolve zero.
 *
 * **O que dá vida continua não sendo enfeite**: capas grandes (a arte é o que o
 * app tem de mais bonito e já está pronta), hierarquia e informação que muda
 * ("estreia em 4 dias", "você no capítulo 3, a roda no 6"). Nada de cor
 * decorativa nem número supérfluo.
 *
 * A ordem responde à pergunta de quem chega: **onde eu já estou**, **o que está
 * para começar** (é onde dá para entrar sem chegar atrasado), **o que mais
 * existe** — agora buscável —, e **como faço o meu**.
 */
export default function Clubes() {
  const [meus, setMeus] = useState<Clube[]>(() => meusClubes());
  const [estreias, setEstreias] = useState<Clube[]>(() => clubesComecando());
  const [descobrir, setDescobrir] = useState<Clube[]>(() => clubesParaDescobrir());
  const [topicos, setTopicos] = useState(() => topicosDeClube());

  const [busca, setBusca] = useState("");
  const [topico, setTopico] = useState<string | undefined>(undefined);
  const [todosOsMeus, setTodosOsMeus] = useState(false);

  useEffect(() => {
    const atualizar = () => {
      setMeus(meusClubes());
      setEstreias(clubesComecando());
      setDescobrir(clubesParaDescobrir());
      setTopicos(topicosDeClube());
    };
    atualizar();
    window.addEventListener(CLUBES_EVENT, atualizar);
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => {
      window.removeEventListener(CLUBES_EVENT, atualizar);
      window.removeEventListener(MURAL_EVENT, atualizar);
    };
  }, []);

  /* Encontro mais próximo primeiro: é o clube que precisa de você agora. */
  const meusOrdenados = [...meus].sort((a, b) =>
    a.ciclo.encontro.localeCompare(b.ciclo.encontro),
  );

  const procurando = busca.trim().length > 0 || topico !== undefined;
  /*
   * Procurando, a busca varre **tudo** — inclusive estreias e os seus clubes.
   * Quem digita "Duna" quer o clube de Duna, não quer saber em que gaveta ele
   * estava; devolver só os "em andamento" seria devolver vazio com o clube ali.
   */
  const resultados = buscarClubes(procurando ? todosOsClubes() : descobrir, busca, topico);

  return (
    <div className="min-h-screen bg-[#141414] pb-28 text-white" data-testid="clubes-page">
      <PageHeader title="Clubes" fallback="/community" />

      <div className="space-y-8 pt-4">
        {/*
          Procurando, tudo o que é vitrine sai da frente: destaque, seus clubes e
          o carrossel de estreias viram ruído entre a pergunta e a resposta.
        */}
        {!procurando && (
          <>
            {meus.length > 0 && (
              <Secao
                titulo={`Seus clubes · ${meus.length}`}
                icone={<Users className="h-3 w-3" />}
              >
                <div className="space-y-3 px-5">
                  {(todosOsMeus ? meusOrdenados : meusOrdenados.slice(0, 3)).map((clube) => (
                    <CartaoDoSeuClube key={clube.id} clube={clube} />
                  ))}

                  {/*
                    **Três, e o resto atrás de um toque.** Estando em oito clubes,
                    a lista inteira empurrava o carrossel e a busca para fora da
                    tela — e quem abre esta tela raramente quer o oitavo clube,
                    quer o que tem prazo chegando. Por isso a ordem é por
                    **encontro mais próximo**, e não por ordem de entrada.
                  */}
                  {meus.length > 3 && (
                    <button
                      onClick={() => setTodosOsMeus(!todosOsMeus)}
                      className="w-full rounded-xl border border-white/8 py-2.5 text-xs font-semibold text-white/45 transition-colors hover:bg-white/5 hover:text-white/80"
                      data-testid="ver-todos-meus-clubes"
                    >
                      {todosOsMeus
                        ? "Mostrar menos"
                        : `Ver os outros ${meus.length - 3} que são seus`}
                    </button>
                  )}
                </div>
              </Secao>
            )}

            {/*
              **O carrossel de estreias** (pedido do Matheus, 28/07). Antes havia
              um destaque grande fixo mais uma fileira; com muitos clubes
              estreando, o destaque escolhia um por você e escondia os outros.
              Aqui o primeiro cartão é o maior — a estreia mais próxima —, e os
              demais seguem ao lado, todos alcançáveis com o polegar.
            */}
            {estreias.length > 0 && (
              <Secao
                titulo={`Estreiam em breve · ${estreias.length}`}
                icone={<Sparkles className="h-3 w-3 text-[#f59e0b]" />}
              >
                <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
                  {estreias.map((clube, indice) => (
                    <CartaoDeEstreia key={clube.id} clube={clube} grande={indice === 0} />
                  ))}
                </div>
              </Secao>
            )}
          </>
        )}

        {/* ---- A parte que aguenta quantidade ---- */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-1.5 px-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
            <Search className="h-3 w-3" />
            Encontre um clube
          </h2>

          <div className="px-5">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3.5 py-2.5 ring-1 ring-inset ring-white/8 focus-within:ring-primary/40">
              <Search className="h-4 w-4 shrink-0 text-white/30" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome do clube, livro ou autor"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/25"
                data-testid="busca-clubes"
              />
              {busca.length > 0 && (
                <button
                  onClick={() => setBusca("")}
                  className="shrink-0 rounded-full p-0.5 text-white/30 transition-colors hover:text-white/70"
                  aria-label="Limpar a busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Pastilhas de assunto. Vêm dos clubes que existem — nunca do
              catálogo —, para não haver filtro que devolve zero. */}
          {topicos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-hide">
              <Pastilha ligada={topico === undefined} onClick={() => setTopico(undefined)}>
                Todos
              </Pastilha>
              {topicos.map((item) => (
                <Pastilha
                  key={item.genero}
                  ligada={topico === item.genero}
                  onClick={() => setTopico(topico === item.genero ? undefined : item.genero)}
                >
                  {item.genero} · {item.total}
                </Pastilha>
              ))}
            </div>
          )}

          <div className="space-y-3 px-5">
            {resultados.length === 0 ? (
              <p className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-5 text-center text-xs leading-relaxed text-white/45">
                {procurando ? (
                  <>
                    Nenhum clube para <b className="text-white/75">{busca.trim() || topico}</b>.
                    <br />
                    Ninguém está lendo isso junto ainda — dá para você começar.
                  </>
                ) : (
                  <>Você já está em todos os clubes que existem. Que tal criar o seu?</>
                )}
              </p>
            ) : (
              <>
                {procurando && (
                  <p className="text-[11px] text-white/35" data-testid="contagem-resultados">
                    {resultados.length} {resultados.length === 1 ? "clube" : "clubes"}
                  </p>
                )}
                {resultados.map((clube) => (
                  <CartaoParaDescobrir key={clube.id} clube={clube} />
                ))}
              </>
            )}
          </div>
        </section>

        <div className="px-5">
          <ConviteParaCriar temClube={meus.length > 0} />
        </div>
      </div>
    </div>
  );
}

/** Pastilha de assunto — laranja da marca quando ligada, sem cor nova. */
function Pastilha({
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
/**
 * Um cartão do carrossel de estreias.
 *
 * **O primeiro é maior**, e não por estética: no carrossel a primeira posição é a
 * estreia **mais próxima** — a que ainda dá tempo de pegar e a que some antes.
 * Dar-lhe mais área é dizer isso sem precisar de um rótulo. Os demais ficam no
 * tamanho de sempre, e todos são alcançáveis com o polegar, que era o que o
 * destaque fixo anterior impedia quando havia muitas estreias ao mesmo tempo.
 */
function CartaoDeEstreia({ clube, grande }: { clube: Clube; grande?: boolean }) {
  const livro = catalog.find((item) => item.id === clube.ciclo.bookId);
  if (!livro) return null;

  const lado = grande ? 200 : 148;

  return (
    <Link
      href={`/clube/${clube.id}`}
      className="shrink-0"
      style={{ width: lado }}
      data-testid={`clube-estreia-${clube.id}`}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={livro.cover}
          alt={livro.title}
          className="w-full object-cover"
          style={{ height: lado }}
        />
        {/*
          **A data virou uma etiqueta no canto, e não uma tarja sobre a arte.**
          A tarja com degradê cobria o rodapé da capa — e capa de livro tem texto
          lá embaixo (título, autor, frase de crítica), então o resultado era
          letra sobre letra. Uma etiqueta pequena no alto tapa o mínimo e se lê
          num relance, que é tudo o que ela precisa fazer.
        */}
        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#f59e0b] backdrop-blur-sm">
          {estreiaEmTexto(clube)}
        </span>
      </div>

      <p className={`mt-2 line-clamp-2 font-bold leading-tight ${grande ? "text-sm" : "text-xs"}`}>
        {clube.nome}
      </p>
      <p className="mt-0.5 truncate text-[10.5px] text-white/45">{livro.title}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-white/30">
        {clube.membros.length} {clube.membros.length === 1 ? "inscrito" : "inscritos"} ·{" "}
        {dataCurta(clube.ciclo.inicio)}
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
