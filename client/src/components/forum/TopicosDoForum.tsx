import { useEffect, useState } from "react";
import { Link } from "wouter";
import { MessageSquare } from "lucide-react";

import NovoTopico from "@/components/forum/NovoTopico";
import { AvatarDoForum, Bloco, CapaDoTopico, LinkDoForum } from "@/components/forum/Pecas";
import { useToast } from "@/hooks/use-toast";
import { catalog } from "@/lib/books";
import { haQuantoTempo } from "@/lib/forumVitrine";
import { forumNaTela, possoCriar, souModerador } from "@/lib/forum";
import {
  GRUPOS_EVENT,
  alternarFixado,
  alternarTopicoEscondido,
  apagarMeuTopico,
  topicosDa,
  type TopicoNaTela,
} from "@/lib/grupos";

/** Quantos tópicos a página da comunidade mostra antes do "ver todos". */
const RESUMO = 5;

/**
 * **O resumo dos tópicos, na página da comunidade** (ROTEIRO §4.90 e §4.91).
 *
 * A lista completa mora em `/forum/:id/topicos`, que **não é este componente com
 * mais linhas** — é uma tela própria, com busca, ordenação e destaques. Essa
 * distinção é a correção de 31/07: o Matheus abriu a primeira versão e disse
 * *"da forma como tá, ele só expande, e não faz sentido"*, e estava certo — a
 * página repetia a tabela e não acrescentava nada.
 *
 * Aqui ficou o **resumo**, e ele também mudou: cada linha agora mostra a capa, a
 * última coisa que alguém disse e quem está na conversa. Título e um número não
 * dizem se vale entrar.
 */
export default function Topicos({ grupoId }: { grupoId: string }) {
  const [criando, setCriando] = useState(false);
  const [topicos, setTopicos] = useState<TopicoNaTela[]>(() => topicosDa(grupoId));

  useEffect(() => {
    const atualizar = () => setTopicos(topicosDa(grupoId));
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [grupoId]);

  const emoji = forumNaTela(grupoId)?.emoji;
  const dentro = possoCriar(grupoId, "topicos");
  const visiveis = topicos.slice(0, RESUMO);
  const escondidos = topicos.length - visiveis.length;

  return (
    <Bloco
      titulo="Fóruns"
      testid="grupo-topicos"
      acao={
        dentro ? (
          <LinkDoForum onClick={() => setCriando((v) => !v)} testid="grupo-create-topic">
            criar tópico »
          </LinkDoForum>
        ) : undefined
      }
    >
      {criando && (
        <NovoTopico
          grupoId={grupoId}
          emoji={emoji}
          onPronto={() => setCriando(false)}
          onCancelar={() => setCriando(false)}
        />
      )}

      {topicos.length === 0 ? (
        <p className="text-[13px] text-white/40">Nenhum tópico ainda.</p>
      ) : (
        <div data-testid="lista-de-topicos">
          {visiveis.map((topico) => (
            <LinhaDeTopico key={topico.id} topico={topico} emoji={emoji} />
          ))}
        </div>
      )}

      {/*
        A porta para a página dos tópicos.
        **Ela aparece mesmo quando tudo coube aqui**, e isso mudou em §4.91: antes
        a página era esta lista com mais linhas, e mandar para lá sem nada de novo
        era um toque desperdiçado. Agora lá tem busca, filtros e destaques — coisas
        que o resumo não tem —, então vale a visita com três tópicos ou com
        trezentos. O texto muda para não prometer "mais" quando não há mais.
      */}
      {topicos.length > 0 && (
        <p className="mt-2.5 border-t border-white/[0.06] pt-2.5">
          <LinkDoForum href={`/forum/${grupoId}/topicos`} testid="ver-todos-os-topicos">
            {escondidos > 0
              ? `ver todos os tópicos (${topicos.length}) »`
              : "abrir a página dos tópicos »"}
          </LinkDoForum>
        </p>
      )}
    </Bloco>
  );
}

/**
 * **Uma linha da lista de tópicos** — a mesma no resumo e na página de todos.
 *
 * Duas cópias desta linha seriam duas listas que envelhecem em direções
 * diferentes; é exportada por isso.
 */
export function LinhaDeTopico({
  topico,
  emoji,
  onMudar,
}: {
  topico: TopicoNaTela;
  emoji?: string;
  /** Avisa quem desenhou que algo mudou (fixar, remover, apagar). */
  onMudar?: () => void;
}) {
  const { toast } = useToast();
  const livro = topico.bookId ? catalog.find((item) => item.id === topico.bookId) : undefined;
  const modero = souModerador(topico.grupoId);
  const ultima = topico.ultimaFala;

  return (
    <div
      className="flex gap-3 border-b border-white/[0.05] py-2.5 last:border-0"
      data-testid={`topico-${topico.id}`}
    >
      <Link href={`/forum/${topico.grupoId}/topico/${topico.id}`} className="shrink-0">
        <CapaDoTopico
          imagem={topico.imagem}
          capaDoLivro={livro?.cover}
          emoji={emoji}
          semente={topico.id}
          lado={40}
          retrato
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/forum/${topico.grupoId}/topico/${topico.id}`}
          className="block text-[13.5px] font-semibold leading-snug text-white hover:text-primary"
        >
          {topico.fixado && <span className="mr-1.5 inline-block">📌</span>}
          {topico.titulo}
        </Link>

        {/* **A última fala é o que faz entrar.** Sem ela a lista é um índice; com
            ela é uma conversa acontecendo. */}
        {ultima ? (
          <p className="mt-0.5 truncate text-[11.5px] text-white/45">
            <span className="text-white/60">{ultima.autor?.name ?? "Você"}:</span> {ultima.texto}
          </p>
        ) : (
          <p className="mt-0.5 text-[11.5px] text-white/30">
            ninguém respondeu ainda — {topico.meu ? "é seu" : `de ${topico.autor?.name ?? "alguém"}`}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2">
          {/* Os rostos de quem está na conversa, sobrepostos como no resto do app. */}
          <span className="flex shrink-0">
            {topico.participantes.slice(0, 3).map((pessoa, i) => (
              <span key={pessoa?.slug ?? "voce"} className={i > 0 ? "-ml-1.5" : ""}>
                <AvatarDoForum
                  nome={pessoa?.name ?? "Você"}
                  slug={pessoa?.slug}
                  cor={pessoa?.color}
                  tamanho={18}
                />
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1 text-[10.5px] text-white/35">
            <MessageSquare className="h-3 w-3" />
            {topico.totalRespostas}
          </span>
          <span className="text-[10.5px] text-white/25">·</span>
          <span className="text-[10.5px] text-white/35">
            {haQuantoTempo(topico.ultimaAtividade)}
          </span>
          {livro && (
            <>
              <span className="text-[10.5px] text-white/25">·</span>
              <Link
                href={`/book/${livro.id}`}
                className="min-w-0 truncate text-[10.5px] text-primary/70 hover:text-primary"
              >
                {livro.title}
              </Link>
            </>
          )}
        </div>

        {(modero || topico.meu) && (
          <p className="mt-1 flex gap-3">
            {modero && !topico.meu && (
              <>
                <LinkDoForum
                  onClick={() => {
                    const fixou = alternarFixado(topico.grupoId, topico.id);
                    toast({ title: fixou ? "Tópico fixado" : "Tópico solto" });
                    onMudar?.();
                  }}
                  className="text-[10.5px] text-white/30 hover:text-white/70"
                  testid={`fixar-${topico.id}`}
                >
                  {topico.fixado ? "soltar" : "fixar"}
                </LinkDoForum>
                <LinkDoForum
                  onClick={() => {
                    alternarTopicoEscondido(topico.grupoId, topico.id);
                    toast({ title: "Tópico removido do fórum" });
                    onMudar?.();
                  }}
                  className="text-[10.5px] text-white/30 hover:text-red-300"
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
                  onMudar?.();
                }}
                className="text-[10.5px] text-white/30 hover:text-red-300"
                testid={`topico-delete-${topico.id}`}
              >
                apagar
              </LinkDoForum>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
