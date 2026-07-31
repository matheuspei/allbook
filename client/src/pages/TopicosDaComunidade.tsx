import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Lock, MessageSquare, Search, X } from "lucide-react";

import NovoTopico from "@/components/forum/NovoTopico";
import { LinhaDeTopico } from "@/components/forum/TopicosDoForum";
import {
  AvatarDoForum,
  Bloco,
  BotaoDoForum,
  CAMPO,
  CapaDaComunidade,
  CartazDoTopico,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { catalog } from "@/lib/books";
import { capaDaComunidade, configDo, forumNaTela, possoCriar, possoLer } from "@/lib/forum";
import { haQuantoTempo, movimentoDe } from "@/lib/forumVitrine";
import { GRUPOS_EVENT, topicosDa, type TopicoNaTela } from "@/lib/grupos";

/** Quantos por página. Quinze é o que cabe sem a rolagem virar expedição. */
const POR_PAGINA = 15;

/** Abaixo disto, destacar dois tópicos deixaria quase nada na lista. */
const MINIMO_PARA_DESTACAR = 4;

type Ordem = "recentes" | "falados" | "sem-resposta" | "meus";

const ORDENS: { chave: Ordem; nome: string }[] = [
  { chave: "recentes", nome: "Recentes" },
  { chave: "falados", nome: "Mais falados" },
  { chave: "sem-resposta", nome: "Sem resposta" },
  { chave: "meus", nome: "Os meus" },
];

/**
 * **Todos os tópicos de uma comunidade** (`/forum/:id/topicos`) — ROTEIRO §4.91.
 *
 * ---
 *
 * **Esta é a segunda versão, e a primeira foi reprovada com razão.** Em 31/07 eu
 * entreguei uma página que era o mesmo componente da comunidade com mais linhas,
 * e o Matheus respondeu: *"da forma como tá, ele só expande, e não faz sentido.
 * A gente teria que criar uma página completamente diferente, com mais conteúdo e
 * mais informações, coisa que a gente não tem hoje."*
 *
 * **O que uma página de tópicos tem que a lista da comunidade não tem:**
 *
 * - **Destaques** no topo — o fixado e o mais falado, com a capa grande. É onde
 *   a capa que ele pediu ganha tamanho sem custar a varredura das outras.
 * - **Busca** dentro dos tópicos, por título e por livro.
 * - **Quatro maneiras de ordenar**, sendo duas delas filtros de verdade
 *   (*sem resposta* é o que salva tópico abandonado; *os meus* é o que ninguém
 *   consegue achar numa comunidade grande).
 * - **A régua da comunidade** no cabeçalho: quantos tópicos, quantas mensagens,
 *   quantas conversas se mexeram esta semana.
 *
 * **O que ela deliberadamente NÃO faz:** transformar cada tópico num cartão
 * grande com capa. Fórum é uma lista para varrer com o olho — quinze cartões de
 * capa grande são quinze telas de rolagem para ler quinze títulos. A capa entra
 * como miniatura de 52px na lista, e grande só nos dois destaques.
 */
export default function TopicosDaComunidade() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const grupo = forumNaTela(id);

  const [topicos, setTopicos] = useState<TopicoNaTela[]>([]);
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(0);
  const [criando, setCriando] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => setTopicos(topicosDa(id));
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [id, versao]);

  /* Trocar de filtro com a página 3 aberta cai num vazio: volta para a primeira. */
  useEffect(() => setPagina(0), [ordem, busca]);

  const movimento = useMemo(() => (grupo ? movimentoDe(id) : undefined), [grupo, id, topicos]);

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    let lista = topicos;

    if (termo) {
      lista = lista.filter((topico) => {
        const livro = topico.bookId
          ? catalog.find((item) => item.id === topico.bookId)
          : undefined;
        return (
          topico.titulo.toLowerCase().includes(termo) ||
          (livro?.title.toLowerCase().includes(termo) ?? false) ||
          (topico.ultimaFala?.texto.toLowerCase().includes(termo) ?? false)
        );
      });
    }

    if (ordem === "sem-resposta") lista = lista.filter((topico) => topico.totalRespostas === 0);
    if (ordem === "meus") lista = lista.filter((topico) => topico.meu);
    if (ordem === "falados") {
      lista = [...lista].sort((a, b) => b.totalRespostas - a.totalRespostas);
    }
    /* "recentes" já é a ordem que `topicosDa` devolve (fixado, depois atividade). */

    return lista;
  }, [topicos, termo, ordem]);

  /*
   * **Os destaques** — e eles saem da lista de baixo, senão o destaque vira
   * repetição. Só existem na visão limpa: quem buscou ou filtrou pediu uma lista,
   * não uma vitrine.
   */
  const limpo = !termo && ordem === "recentes";
  const destaques = useMemo(() => {
    if (!limpo || topicos.length < MINIMO_PARA_DESTACAR) return [];
    const escolhidos: TopicoNaTela[] = [];
    const fixado = topicos.find((topico) => topico.fixado);
    if (fixado) escolhidos.push(fixado);
    const maisFalado = [...topicos]
      .filter((topico) => !escolhidos.includes(topico) && topico.totalRespostas > 0)
      .sort((a, b) => b.totalRespostas - a.totalRespostas)[0];
    if (maisFalado) escolhidos.push(maisFalado);
    return escolhidos;
  }, [topicos, limpo]);

  const naLista = filtrados.filter((topico) => !destaques.includes(topico));
  const paginas = Math.max(1, Math.ceil(naLista.length / POR_PAGINA));
  const atual = Math.min(pagina, paginas - 1);
  const visiveis = naLista.slice(atual * POR_PAGINA, atual * POR_PAGINA + POR_PAGINA);

  if (!grupo) {
    return (
      <PaginaDoForum titulo="Tópicos" voltarPara="/forum" testid="topicos-missing">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade">
            <p className="text-[13px] text-white/55">Esta comunidade não existe mais.</p>
            <div className="mt-3">
              <LinkDoForum href="/forum">« todas as comunidades</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  if (!possoLer(id)) {
    return (
      <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="topicos-privados">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade privada">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/55">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Só quem participa desta comunidade vê os tópicos dela.
            </p>
            <div className="mt-3">
              <LinkDoForum href={`/forum/${id}`}>« ver a comunidade</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  const podeCriar = possoCriar(id, "topicos");

  return (
    <PaginaDoForum titulo={grupo.nome} voltarPara={`/forum/${id}`} testid="topicos-page">
      <div className="px-5 pt-4">
        {/* A trilha do Orkut: comunidade › seção. */}
        <p className="mb-2 text-[11px] text-white/35">
          <Link href={`/forum/${id}`} className="text-primary">
            {grupo.nome}
          </Link>
          {" › "}
          <span>Tópicos</span>
        </p>

        {/* — o cabeçalho: quem é a comunidade e qual é o tamanho da conversa — */}
        <div className="mb-3 flex items-center gap-3">
          <Link href={`/forum/${id}`}>
            <CapaDaComunidade
              imagem={configDo(id).imagem}
              foto={capaDaComunidade(id)}
              emoji={grupo.emoji}
              semente={id}
              lado={54}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[17px] font-bold leading-tight">
              {grupo.nome}
            </h1>
            {movimento && (
              <>
                <p className="mt-0.5 text-[11.5px] text-white/40">
                  {movimento.topicos} {movimento.topicos === 1 ? "tópico" : "tópicos"} ·{" "}
                  {movimento.mensagens} {movimento.mensagens === 1 ? "mensagem" : "mensagens"}
                </p>
                {/* Só quando houve movimento: "0 esta semana" é a forma educada
                    de dizer que a comunidade está parada, e ninguém precisa. */}
                {movimento.conversasDaSemana > 0 && (
                  <p className="text-[11.5px] text-primary/80">
                    {movimento.conversasDaSemana} se{" "}
                    {movimento.conversasDaSemana === 1 ? "mexeu" : "mexeram"} esta semana
                  </p>
                )}
              </>
            )}
          </div>
          {podeCriar && !criando && (
            <BotaoDoForum primario onClick={() => setCriando(true)} testid="abrir-novo-topico">
              Criar
            </BotaoDoForum>
          )}
        </div>

        {criando && (
          <NovoTopico
            grupoId={id}
            emoji={grupo.emoji}
            onPronto={() => setCriando(false)}
            onCancelar={() => setCriando(false)}
          />
        )}

        {/* — busca e ordenação — */}
        <div className="mb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="buscar nos tópicos"
              className={`${CAMPO} pl-8 ${busca ? "pr-8" : ""}`}
              data-testid="buscar-topicos"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                aria-label="limpar busca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ORDENS.map((item) => (
              <button
                key={item.chave}
                onClick={() => setOrdem(item.chave)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  ordem === item.chave
                    ? "bg-white text-black"
                    : "bg-white/[0.06] text-white/55 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`ordem-${item.chave}`}
              >
                {item.nome}
              </button>
            ))}
          </div>
        </div>

        {/* — os destaques, com a capa em tamanho grande — */}
        {destaques.length > 0 && (
          <Bloco titulo="Em destaque" testid="topicos-em-destaque">
            <div className="space-y-2.5">
              {destaques.map((topico) => (
                <CartaoDeDestaque key={topico.id} topico={topico} emoji={grupo.emoji} />
              ))}
            </div>
          </Bloco>
        )}

        {/* — a lista — */}
        <Bloco
          titulo={limpo ? "Todos os tópicos" : `${naLista.length} ${naLista.length === 1 ? "tópico" : "tópicos"}`}
          testid="todos-os-topicos"
        >
          {visiveis.length === 0 ? (
            <div className="text-[13px] leading-relaxed text-white/40">
              {termo ? (
                <>
                  <p>Nenhum tópico com “{busca.trim()}”.</p>
                  {/*
                    **A busca vazia tem que confessar o filtro.** Com "Sem
                    resposta" ligado, dizer só "nenhum tópico com paciente" é
                    mentir por omissão — existe um, e foi o filtro que o tirou.
                  */}
                  {ordem !== "recentes" && (
                    <p className="mt-1.5">
                      Você está vendo só{" "}
                      <b className="text-white/60">
                        {ORDENS.find((item) => item.chave === ordem)?.nome.toLowerCase()}
                      </b>
                      .{" "}
                      <LinkDoForum onClick={() => setOrdem("recentes")} testid="buscar-em-todos">
                        buscar em todos »
                      </LinkDoForum>
                    </p>
                  )}
                </>
              ) : ordem === "sem-resposta" ? (
                <p>Todos os tópicos daqui já têm resposta.</p>
              ) : ordem === "meus" ? (
                <p>Você ainda não criou tópico nesta comunidade.</p>
              ) : (
                <p>Nenhum tópico ainda.</p>
              )}
            </div>
          ) : (
            <div>
              {visiveis.map((topico) => (
                <LinhaDeTopico
                  key={topico.id}
                  topico={topico}
                  emoji={grupo.emoji}
                  onMudar={() => setVersao((v) => v + 1)}
                />
              ))}
            </div>
          )}

          {paginas > 1 && (
            <p className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
              <span className="text-[10.5px] text-white/35">páginas:</span>
              {Array.from({ length: paginas }, (_, n) => (
                <button
                  key={n}
                  onClick={() => setPagina(n)}
                  className={`text-[11.5px] font-semibold transition-colors ${
                    n === atual ? "text-white" : "text-primary hover:opacity-80"
                  }`}
                  data-testid={`pagina-${n + 1}`}
                >
                  {n + 1}
                </button>
              ))}
            </p>
          )}
        </Bloco>

        <p className="mt-3 text-center">
          <LinkDoForum href={`/forum/${id}`}>« voltar para a comunidade</LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}

/**
 * **O tópico em destaque** — a capa grande, o título por cima e a última fala
 * embaixo.
 *
 * É aqui que a capa que o Matheus pediu vira imagem de verdade. São no máximo
 * dois por página, de propósito: o que dá destaque é ser exceção.
 */
function CartaoDeDestaque({ topico, emoji }: { topico: TopicoNaTela; emoji?: string }) {
  const livro = topico.bookId ? catalog.find((item) => item.id === topico.bookId) : undefined;

  return (
    <Link
      href={`/forum/${topico.grupoId}/topico/${topico.id}`}
      className="block overflow-hidden rounded-xl ring-1 ring-white/10 transition-opacity hover:opacity-90"
      data-testid={`destaque-${topico.id}`}
    >
      <CartazDoTopico
        imagem={topico.imagem}
        capaDoLivro={livro?.cover}
        emoji={emoji}
        semente={topico.id}
      >
        {topico.fixado && (
          <span className="mb-1 inline-block rounded-full bg-primary px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-black">
            📌 fixado
          </span>
        )}
        <p className="font-display text-[14.5px] font-bold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
          {topico.titulo}
        </p>
        {livro && (
          <p className="mt-0.5 truncate text-[10.5px] text-white/50">
            sobre {livro.title}, de {livro.author}
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-2 text-[10.5px] text-white/70">
          <span className="flex shrink-0">
            {topico.participantes.slice(0, 3).map((pessoa, i) => (
              <span key={pessoa?.slug ?? "voce"} className={i > 0 ? "-ml-1.5" : ""}>
                <AvatarDoForum
                  nome={pessoa?.name ?? "Você"}
                  slug={pessoa?.slug}
                  cor={pessoa?.color}
                  tamanho={17}
                />
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {topico.totalRespostas}
          </span>
          <span>·</span>
          <span>{haQuantoTempo(topico.ultimaAtividade)}</span>
        </p>
      </CartazDoTopico>

      {topico.ultimaFala && (
        <p className="truncate bg-white/[0.04] px-3 py-2 text-[11.5px] text-white/50">
          <span className="text-white/70">{topico.ultimaFala.autor?.name ?? "Você"}:</span>{" "}
          {topico.ultimaFala.texto}
        </p>
      )}
    </Link>
  );
}
