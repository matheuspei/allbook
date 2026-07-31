import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight } from "lucide-react";

import { Enquetes, Eventos } from "@/components/forum/ConteudoDaComunidade";
import {
  AvatarDoForum,
  Bloco,
  BotaoDoForum,
  CAMPO,
  Campo,
  CapaDaComunidade,
  LinkDoForum,
  PaginaDoForum,
} from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { EU } from "@/lib/clubes";
import { findMember } from "@/lib/community";
import {
  capaDaComunidade,
  categoriaDe,
  configDo,
  criadaEm,
  desistirDoPedido,
  donoDo,
  filaDe,
  foiExcluido,
  forumNaTela,
  membrosDo,
  pedirEntrada,
  porExtenso,
  possoCriar,
  possoLer,
  situacaoDe,
  souModerador,
} from "@/lib/forum";
import {
  MAX_TITULO,
  GRUPOS_EVENT,
  alternarParticipacao,
  alternarFixado,
  alternarTopicoEscondido,
  apagarMeuTopico,
  criarTopico,
  topicosDa,
  type TopicoNaTela,
} from "@/lib/grupos";

/**
 * A página de uma **comunidade** (`/forum/:id`).
 *
 * ---
 *
 * ⚠️ **Leia isto antes de mexer no layout.** A estrutura desta tela é a das
 * comunidades do Orkut, e ela é **decisão do Matheus, não estilo** (§4.74). Em
 * 31/07 ele pediu para trocar só a *pele* — cores, fontes, cantos — e eu, ao
 * converter, mexi na estrutura sem perceber: a ficha perdeu campos, os links de
 * ação viraram um botão e um ícone, a grade de membros virou fita rolável e a
 * tabela de tópicos virou lista. Ele viu na hora: *"eu peguei apenas para você
 * mudar o layout, e você simplesmente mudou tudo"*. Refeita em §4.77.
 *
 * **A estrutura, e ela é para ficar:**
 *
 * 1. **A ficha**, com imagem à esquerda e os campos **todos**, nesta ordem:
 *    categoria · criada em · dono · moderadores · tipo · idioma · membros.
 * 2. **Os links de ação em lista**, um por linha: participar · denunciar abuso ·
 *    editar comunidade. Não é botão: no Orkut era lista, e é ela que faz "editar
 *    comunidade" ter o mesmo peso das outras ações em vez de virar engrenagem.
 * 3. **As regras**, quando o dono escreveu.
 * 4. **A grade de membros** (não uma fita que rola), com "ver todos".
 * 5. **A tabela de tópicos**, com a coluna de mensagens à direita.
 * 6. **Enquetes** e **eventos**, nesta ordem.
 *
 * O que muda em relação a lá é só como isso é pintado: cartão escuro, laranja no
 * que é ação, avatar redondo.
 */
export default function Grupo() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const id = params.id ?? "";

  const [grupo, setGrupo] = useState(() => forumNaTela(id));
  const [topicos, setTopicos] = useState<TopicoNaTela[]>([]);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  /* Só para redesenhar quando algo muda por fora do React (ver o comentário
     junto ao `<div>` do corpo). O número em si não é lido. */
  const [, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      setGrupo(forumNaTela(id));
      setTopicos(topicosDa(id));
      setVersao((n) => n + 1);
    };
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [id]);

  if (!grupo || foiExcluido(id)) {
    return (
      <PaginaDoForum titulo="Comunidade" voltarPara="/forum" testid="grupo-missing">
        <div className="px-5 pt-4">
          <Bloco titulo="Comunidade">
            <p className="text-[13px] leading-relaxed text-white/55">
              Esta comunidade não existe mais — ela pode ter sido excluída pelo dono.
            </p>
            <div className="mt-3">
              <LinkDoForum href="/forum">Ver todas as comunidades</LinkDoForum>
            </div>
          </Bloco>
        </div>
      </PaginaDoForum>
    );
  }

  const config = configDo(id);
  const situacao = situacaoDe(id);
  const dentro = situacao === "dentro";
  const membros = membrosDo(id);
  const moderadores = membros.filter((m) => m.papel === "moderador");
  const dono = donoDo(id);
  const fila = souModerador(id) ? filaDe(id) : [];
  const podeLer = possoLer(id);

  function entrar() {
    if (situacao === "livre") {
      alternarParticipacao(id);
      toast({ title: `Você entrou em ${grupo!.nome}` });
    } else if (situacao === "pedir") {
      pedirEntrada(id);
      toast({ title: "Pedido enviado", description: "Um moderador precisa aprovar." });
    } else if (situacao === "esperando") {
      desistirDoPedido(id);
      toast({ title: "Pedido cancelado" });
    } else if (situacao === "dentro") {
      alternarParticipacao(id);
      toast({ title: `Você saiu de ${grupo!.nome}` });
    }
  }

  /** O texto do link de entrada, um para cada situação (o mesmo de lá). */
  const rotuloDeEntrada: Record<typeof situacao, string> = {
    dentro: "sair da comunidade",
    livre: "participar desta comunidade",
    pedir: "pedir para entrar",
    esperando: "cancelar meu pedido",
    "so-convidado": "esta comunidade é fechada",
    banido: "você foi banido desta comunidade",
  };
  const bloqueado = situacao === "banido" || situacao === "so-convidado";

  return (
    <PaginaDoForum titulo={grupo.nome} voltarPara="/forum" testid="grupo-page">
      {/*
        ⚠️ **Não volte a pôr `key={versao}` aqui.** Ele remontava a página
        inteira a cada `GRUPOS_EVENT` — e remontar **apaga o estado dos filhos**:
        a caixa de convidar aberta, o formulário de tópico meio digitado, a
        enquete pela metade. Pego na tela em 31/07 ao convidar alguém para um
        evento: a lista fechava sozinha depois de cada convite.
        O `versao` no estado já basta para redesenhar — os dados são lidos do
        `localStorage` no corpo de cada componente, não no mount.
      */}
      <div className="px-5 pt-4">
        {/* ---------------- 1. a ficha ---------------- */}
        <Bloco titulo="Comunidade" testid="ficha-da-comunidade">
          <div className="flex gap-3.5">
            <CapaDaComunidade
              semente={id}
              imagem={config.imagem}
              foto={capaDaComunidade(id)}
              emoji={grupo.emoji}
              lado={96}
              testid="imagem-da-comunidade"
            />

            <div className="min-w-0 flex-1">
              <h1
                className="font-display text-[17px] font-bold leading-tight tracking-tight"
                data-testid="nome-da-comunidade"
              >
                {grupo.nome}
              </h1>
              <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">{grupo.descricao}</p>

              {/* Os campos da ficha — **todos**, e nesta ordem. */}
              <div className="mt-2">
                {categoriaDe(id) && <Campo rotulo="categoria">{categoriaDe(id)}</Campo>}
                <Campo rotulo="criada em">{porExtenso(criadaEm(id))}</Campo>
                <Campo rotulo="dono">
                  <Link
                    href={dono === EU ? "/profile" : `/user/${dono}`}
                    className="text-primary"
                  >
                    {dono === EU ? "Você" : (findMember(dono)?.name ?? "Alguém")}
                  </Link>
                </Campo>
                {moderadores.length > 0 && (
                  <Campo rotulo="moderadores">
                    {moderadores.map((m, i) => (
                      <span key={m.slug}>
                        {i > 0 && ", "}
                        <Link
                          href={m.slug === EU ? "/profile" : `/user/${m.slug}`}
                          className="text-primary"
                        >
                          {m.slug === EU ? "Você" : (findMember(m.slug)?.name ?? "Alguém")}
                        </Link>
                      </span>
                    ))}
                  </Campo>
                )}
                <Campo rotulo="tipo">
                  {config.entrada === "aberta"
                    ? "aberta a todos"
                    : config.entrada === "moderada"
                      ? "entrada moderada"
                      : "fechada (só por convite)"}
                  {config.visibilidade === "privada" && " · privada"}
                </Campo>
                <Campo rotulo="idioma">{config.idioma ?? "Português (Brasil)"}</Campo>
                <Campo rotulo="membros">{membros.length}</Campo>
              </div>
            </div>
          </div>

          {/* ---------------- 2. os links de ação, um por linha ---------------- */}
          <div className="mt-3 space-y-1.5 border-t border-white/[0.07] pt-3">
            {!bloqueado && (
              <p>
                <LinkDoForum onClick={entrar} testid="grupo-join">
                  » {rotuloDeEntrada[situacao]}
                </LinkDoForum>
              </p>
            )}
            {bloqueado && (
              <p className="text-[11.5px] font-semibold text-red-300/80" data-testid="grupo-bloqueado">
                {rotuloDeEntrada[situacao]}
              </p>
            )}
            <p>
              <LinkDoForum
                onClick={() =>
                  toast({
                    title: "Denúncia enviada",
                    description: "Ninguém é avisado de que foi você.",
                  })
                }
                testid="grupo-denunciar"
              >
                » denunciar abuso
              </LinkDoForum>
            </p>
            {souModerador(id) && (
              <p>
                <LinkDoForum href={`/forum/${id}/gerenciar`} testid="grupo-gerenciar">
                  » editar comunidade
                  {fila.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary px-1.5 py-px text-[9.5px] font-bold text-black">
                      {fila.length}
                    </span>
                  )}
                </LinkDoForum>
              </p>
            )}
          </div>

          {/* ---------------- 3. as regras ---------------- */}
          {config.regras && (
            <div
              className="mt-3 border-t border-white/[0.07] pt-3"
              data-testid="regras-da-comunidade"
            >
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/40">
                Regras da comunidade
              </p>
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-white/60">
                {config.regras}
              </p>
            </div>
          )}
        </Bloco>

        {!podeLer ? (
          <Bloco titulo="Conteúdo" testid="grupo-privado">
            <p className="text-[13px] leading-relaxed text-white/55">
              Esta comunidade é <b className="font-semibold text-white/80">privada</b>. Só quem
              participa vê os tópicos daqui.
            </p>
          </Bloco>
        ) : (
          <>
            {/* ---------------- 4. a grade de membros ---------------- */}
            <Bloco
              titulo={`Membros (${membros.length})`}
              testid="grupo-membros"
              acao={
                <LinkDoForum href={`/forum/${id}/membros`} testid="ver-todos-membros">
                  ver todos »
                </LinkDoForum>
              }
            >
              {/* **Grade, não fita que rola.** No Orkut os rostos ficavam todos à
                  vista de uma vez — é o que faz a comunidade parecer habitada. */}
              <div className="flex flex-wrap gap-2.5">
                {membros.slice(0, 8).map(({ slug, papel }) => {
                  const membro = slug === EU ? undefined : findMember(slug);
                  const nome = slug === EU ? "Você" : (membro?.name ?? "Alguém");
                  return (
                    <Link
                      key={slug}
                      href={slug === EU ? "/profile" : `/user/${slug}`}
                      className="w-[56px] text-center"
                      data-testid={`membro-${slug}`}
                    >
                      <AvatarDoForum nome={nome} slug={slug} cor={membro?.color} tamanho={56} />
                      <span className="mt-1 block truncate text-[10.5px] text-white/55">
                        {nome.split(" ")[0]}
                      </span>
                      {papel !== "membro" && (
                        <span className="block text-[9px] font-semibold uppercase tracking-wide text-primary/80">
                          {papel === "dono" ? "dono" : "modera"}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </Bloco>

            {/* ---------------- 5. a tabela de tópicos ---------------- */}
            <Bloco
              titulo="Fóruns"
              testid="grupo-topicos"
              acao={
                possoCriar(id, "topicos") ? (
                  <LinkDoForum onClick={() => setCriando((v) => !v)} testid="grupo-create-topic">
                    criar tópico »
                  </LinkDoForum>
                ) : dentro ? (
                  <span className="text-[10.5px] text-white/30">só moderadores criam</span>
                ) : undefined
              }
            >
              {criando && (
                <div
                  className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                  data-testid="grupo-composer"
                >
                  <p className="mb-1 text-[10.5px] text-white/40">assunto do tópico:</p>
                  <input
                    value={titulo}
                    onChange={(evento) => setTitulo(evento.target.value.slice(0, MAX_TITULO))}
                    autoFocus
                    className={CAMPO}
                    data-testid="grupo-topic-title"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <BotaoDoForum
                      primario
                      disabled={titulo.trim().length === 0}
                      onClick={() => {
                        if (criarTopico(id, titulo)) {
                          setTitulo("");
                          setCriando(false);
                          toast({ title: "Tópico criado" });
                        }
                      }}
                      testid="grupo-topic-publish"
                    >
                      Criar tópico
                    </BotaoDoForum>
                    <BotaoDoForum onClick={() => setCriando(false)}>Cancelar</BotaoDoForum>
                  </div>
                </div>
              )}

              {topicos.length === 0 ? (
                <p className="text-[13px] text-white/40">Nenhum tópico ainda.</p>
              ) : (
                /* **Tabela com a coluna de mensagens**, como no fórum de lá: o
                   número à direita é o que diz onde a conversa está acontecendo. */
                <table className="w-full border-collapse" data-testid="tabela-de-topicos">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-left">
                      <th className="pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                        tópico
                      </th>
                      <th className="pb-1.5 pl-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/35">
                        msgs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicos.map((topico) => (
                      <tr
                        key={topico.id}
                        className="border-b border-white/[0.05] align-top last:border-0"
                        data-testid={`topico-${topico.id}`}
                      >
                        <td className="py-2 pr-2">
                          <Link
                            href={`/forum/${id}/topico/${topico.id}`}
                            className="text-[13.5px] font-semibold leading-snug text-white hover:text-primary"
                          >
                            {topico.fixado && <span className="mr-1">📌</span>}
                            {topico.titulo}
                          </Link>
                          <span className="mt-0.5 block text-[11px] text-white/35">
                            por {topico.meu ? "Você" : (topico.autor?.name ?? "Alguém")} ·{" "}
                            {new Date(topico.ultimaAtividade).toLocaleDateString("pt-BR")}
                          </span>
                          {(souModerador(id) || topico.meu) && (
                            <span className="mt-1 flex gap-3">
                              {souModerador(id) && !topico.meu && (
                                <>
                                  <LinkDoForum
                                    onClick={() => {
                                      const fixou = alternarFixado(id, topico.id);
                                      toast({ title: fixou ? "Tópico fixado" : "Tópico solto" });
                                    }}
                                    className="text-[10.5px] text-white/35 hover:text-white/70"
                                    testid={`fixar-${topico.id}`}
                                  >
                                    {topico.fixado ? "soltar" : "fixar"}
                                  </LinkDoForum>
                                  <LinkDoForum
                                    onClick={() => {
                                      alternarTopicoEscondido(id, topico.id);
                                      toast({ title: "Tópico removido do fórum" });
                                    }}
                                    className="text-[10.5px] text-white/35 hover:text-red-300"
                                    testid={`esconder-${topico.id}`}
                                  >
                                    remover
                                  </LinkDoForum>
                                </>
                              )}
                              {topico.meu && (
                                <LinkDoForum
                                  onClick={() => {
                                    apagarMeuTopico(topico.id);
                                    toast({ title: "Tópico apagado" });
                                  }}
                                  className="text-[10.5px] text-white/35 hover:text-red-300"
                                  testid={`topico-delete-${topico.id}`}
                                >
                                  apagar
                                </LinkDoForum>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pl-2 text-right text-[13px] text-white/45">
                          {topico.totalRespostas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Bloco>

            {/* ---------------- 6. enquetes e eventos ---------------- */}
            <Enquetes grupoId={id} />
            <Eventos grupoId={id} />
          </>
        )}

        <p className="mt-3 text-center">
          <LinkDoForum href="/forum" testid="voltar-comunidades">
            « todas as comunidades
          </LinkDoForum>
        </p>
      </div>
    </PaginaDoForum>
  );
}

/* Importado e não usado na marcação: o chevron saiu junto com a lista de tópicos
   que substituíra a tabela. Fica fora para não sugerir que a linha é clicável
   inteira — na tabela, quem leva ao tópico é o título. */
void ChevronRight;
