import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Check, EyeOff, MessageSquare, Pin, Plus, Shield, Trash2, Undo2, UserPlus } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { useLocation } from "wouter";
import {
  MAX_TITULO,
  GRUPOS_EVENT,
  alternarParticipacao,
  alternarFixado,
  alternarTopicoEscondido,
  apagarMeuGrupo,
  apagarMeuTopico,
  criarTopico,
  participoDa,
  grupoPorId,
  escondidosDo,
  podeApagarGrupo,
  topicosDa,
  type TopicoNaTela,
} from "@/lib/grupos";

/**
 * A tela de um Grupo (`/grupo/:id`) — a "comunidade" do Orkut, por dentro.
 *
 * Cabeçalho com o assunto, botão de participar, e a lista de **tópicos** —
 * cada um com autor, contagem de respostas e última atividade. Criar tópico é
 * para quem entrou; quem toca em "Criar" sem ter entrado, entra junto (um
 * atrito a menos, e o gesto já diz a intenção).
 */
export default function Grupo() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const grupo = grupoPorId(params.id ?? "");

  const [topicos, setTopicos] = useState<TopicoNaTela[]>([]);
  const [dentro, setDentro] = useState(false);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [podeApagar, setPodeApagar] = useState(false);
  const [escondidos, setEscondidos] = useState<{ topicos: string[]; respostas: string[] }>({
    topicos: [],
    respostas: [],
  });

  useEffect(() => {
    const atualizar = () => {
      setTopicos(grupo ? topicosDa(grupo.id) : []);
      setPodeApagar(grupo ? podeApagarGrupo(grupo.id) : false);
      setEscondidos(grupo ? escondidosDo(grupo.id) : { topicos: [], respostas: [] });
      setDentro(grupo ? participoDa(grupo.id) : false);
    };
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [params.id]);

  if (!grupo) {
    return (
      <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="grupo-missing">
        <PageHeader title="Grupo" fallback="/community" />
        <div className="px-8 py-20 text-center space-y-4">
          <p className="text-sm text-white/50">Esso grupo não existe.</p>
          <Link href="/community" className="inline-block text-sm font-bold text-primary">
            Voltar à Comunidade
          </Link>
        </div>
      </div>
    );
  }

  function participar() {
    const agora = alternarParticipacao(grupo!.id);
    toast({
      title: agora ? `Você entrou em ${grupo!.nome}` : `Você saiu de ${grupo!.nome}`,
      description: agora ? "Agora pode criar tópicos e responder." : undefined,
    });
  }

  function publicarTopico() {
    if (!criando) {
      // Criar já diz a intenção: quem não entrou, entra junto.
      if (!dentro) alternarParticipacao(grupo!.id);
      setCriando(true);
      return;
    }
    const novo = criarTopico(grupo!.id, titulo);
    if (novo) {
      setTitulo("");
      setCriando(false);
      toast({ title: "Tópico criado", description: "Ele já está no topo da lista do grupo." });
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="grupo-page">
      <PageHeader title="Grupo" fallback="/community" />

      <header className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 text-3xl">
            {grupo.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold tracking-tight">{grupo.nome}</h1>
            <p className="mt-0.5 text-[11px] text-white/40">
              {grupo.membros.length + (dentro ? 1 : 0)} pessoas
              {dentro && " · você participa"}
            </p>
          </div>
        </div>

        <p className="mt-3.5 text-sm leading-relaxed text-white/55">{grupo.descricao}</p>

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={publicarTopico}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            data-testid="grupo-create-topic"
          >
            <Plus className="h-4 w-4" />
            Criar tópico
          </button>
          <button
            onClick={participar}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              dentro
                ? "border border-white/15 text-white/70 hover:bg-white/5"
                : "border border-primary/50 text-primary hover:bg-primary/10"
            }`}
            data-testid="grupo-join"
          >
            {dentro ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {dentro ? "Participando" : "Participar"}
          </button>
        </div>

        {/*
          **Apagar só enquanto o fórum for só seu** (ROTEIRO 4.44). Assim que
          outra pessoa abre um tópico aqui, a casa deixa de ser sua para
          demolir — apagá-la levaria junto o que ela escreveu. O que fica no
          lugar não é nada: é a moderação de conteúdo, logo abaixo de cada
          tópico, que é o poder que o Matheus pediu e que resolve o problema
          real (tirar o que não devia estar aqui).
        */}
        {grupo.meu && podeApagar && (
          <button
            onClick={() => {
              apagarMeuGrupo(grupo.id);
              toast({ title: `Grupo "${grupo.nome}" apagado` });
              setLocation("/community");
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-xs text-white/30 transition-colors hover:text-white/60"
            data-testid="grupo-delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Apagar este grupo
          </button>
        )}

        {grupo.meu && !podeApagar && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5 text-[11px] leading-relaxed text-white/40">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              <b className="text-white/70">Você modera aqui.</b> Dá para fixar e esconder tópicos e
              respostas. Apagar o grupo inteiro não — já tem conversa de outras pessoas dentro.
            </span>
          </p>
        )}

        {escondidos.topicos.length > 0 && (
          <div className="mt-3 rounded-lg bg-white/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
              Escondidos por você · {escondidos.topicos.length}
            </p>
            <div className="mt-2 space-y-1.5">
              {escondidos.topicos.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    alternarTopicoEscondido(grupo.id, id);
                    toast({ title: "Tópico devolvido ao grupo" });
                  }}
                  className="flex w-full items-center gap-1.5 text-left text-[11px] font-semibold text-primary"
                  data-testid={`devolver-topico-${id}`}
                >
                  <Undo2 className="h-3 w-3" />
                  Devolver um tópico
                </button>
              ))}
            </div>
          </div>
        )}

        {criando && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3" data-testid="grupo-composer">
            <input
              value={titulo}
              onChange={(event) => setTitulo(event.target.value.slice(0, MAX_TITULO))}
              placeholder="O título do seu tópico — uma pergunta funciona bem…"
              autoFocus
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              data-testid="grupo-topic-title"
            />
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-white/25">{titulo.length}/{MAX_TITULO}</span>
              <button
                onClick={publicarTopico}
                disabled={titulo.trim().length === 0}
                className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-black disabled:opacity-30"
                data-testid="grupo-topic-publish"
              >
                Publicar tópico
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="px-5 py-4">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Tópicos
        </h2>

        {topicos.map((topico) => (
          <div key={topico.id} className="group relative" data-testid={`topico-${topico.id}`}>
            <Link
              href={`/grupo/${grupo.id}/topico/${topico.id}`}
              className="block rounded-xl border border-white/5 bg-white/[0.03] p-3.5 mb-2.5 transition-colors hover:bg-white/[0.06]"
            >
              {/* A folga da direita tem de caber os DOIS botões de moderação
                  (fixar e esconder), não um: com `pr-6` o título passava por
                  baixo do alfinete. */}
              <p className={`text-sm font-semibold leading-snug ${grupo.meu && !topico.meu ? "pr-16" : "pr-6"}`}>
                {topico.fixado && (
                  <Pin className="mr-1.5 inline h-3.5 w-3.5 align-[-2px] text-primary" />
                )}
                {topico.titulo}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-white/35">
                <span className={topico.meu ? "text-primary/90 font-medium" : ""}>
                  {topico.meu ? "Você" : topico.autor?.name ?? "Alguém"}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {topico.totalRespostas}{" "}
                  {topico.totalRespostas === 1 ? "resposta" : "respostas"}
                </span>
                <span>·</span>
                <span>{relativeDate(topico.ultimaAtividade)}</span>
              </p>
            </Link>

            {/*
              Moderação do dono: fixar e esconder o que é dos outros.

              **Absoluto no canto do cartão**, e não em fluxo normal: em fluxo
              os botões caíam **entre** os cartões, sem dono visível — parecia
              que pertenciam ao tópico de baixo. O título já reserva o espaço
              (`pr-6`), e o `relative` do embrulho é o que ancora isto aqui.
            */}
            {grupo.meu && !topico.meu && (
              <div className="absolute right-2 top-2 flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const fixou = alternarFixado(grupo.id, topico.id);
                    toast({ title: fixou ? "Tópico fixado no topo" : "Tópico solto" });
                  }}
                  className={`rounded-md p-1.5 transition-colors ${
                    topico.fixado ? "text-primary" : "text-white/25 hover:text-white/70"
                  }`}
                  aria-label={topico.fixado ? "Soltar do topo" : "Fixar no topo"}
                  data-testid={`fixar-${topico.id}`}
                >
                  <Pin className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    alternarTopicoEscondido(grupo.id, topico.id);
                    toast({
                      title: "Tópico escondido",
                      description: "Some para todo mundo. Dá para devolver no topo da tela.",
                    });
                  }}
                  className="rounded-md p-1.5 text-white/25 transition-colors hover:text-red-300"
                  aria-label="Esconder este tópico"
                  data-testid={`esconder-${topico.id}`}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {topico.meu && (
              <button
                onClick={() => {
                  apagarMeuTopico(topico.id);
                  toast({ title: "Tópico apagado" });
                }}
                className="absolute right-3 top-3 p-1 text-white/20 transition-colors hover:text-white/60"
                aria-label="Apagar este tópico"
                data-testid={`topico-delete-${topico.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
