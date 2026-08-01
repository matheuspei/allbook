import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ChevronRight } from "lucide-react";

import { Enquetes, Eventos } from "@/components/forum/ConteudoDaComunidade";
import Topicos from "@/components/forum/TopicosDoForum";
import {
  AvatarDoForum,
  Bloco,
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
  possoLer,
  situacaoDe,
  souModerador,
} from "@/lib/forum";
import { GRUPOS_EVENT, alternarParticipacao } from "@/lib/grupos";

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
  /* Só para redesenhar quando algo muda por fora do React (ver o comentário
     junto ao `<div>` do corpo). O número em si não é lido. */
  const [, setVersao] = useState(0);

  useEffect(() => {
    const atualizar = () => {
      setGrupo(forumNaTela(id));
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
                  » gerenciar comunidade
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

            {/* ---------------- 5. os tópicos ---------------- */}
            {/*
              **Resumo aqui, lista completa em `/forum/:id/topicos`** (§4.90).
              A tabela inteira ficava solta nesta página: vinte tópicos viravam
              vinte linhas e empurravam enquetes, eventos e membros para baixo —
              o oposto do que a §4.78 já tinha corrigido nas enquetes. O
              componente mora em `components/forum/TopicosDoForum.tsx`.
            */}
            <Topicos grupoId={id} />

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
