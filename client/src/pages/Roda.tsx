import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Check, MessageSquare, Pin, Plus, Trash2, UserPlus } from "lucide-react";

import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import {
  MAX_TITULO,
  RODAS_EVENT,
  alternarParticipacao,
  apagarMeuTopico,
  criarTopico,
  participoDa,
  rodaPorId,
  topicosDa,
  type TopicoNaTela,
} from "@/lib/rodasDeConversa";

/**
 * A tela de uma Roda (`/roda/:id`) — a "comunidade" do Orkut, por dentro.
 *
 * Cabeçalho com o assunto, botão de participar, e a lista de **tópicos** —
 * cada um com autor, contagem de respostas e última atividade. Criar tópico é
 * para quem entrou; quem toca em "Criar" sem ter entrado, entra junto (um
 * atrito a menos, e o gesto já diz a intenção).
 */
export default function Roda() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const roda = rodaPorId(params.id ?? "");

  const [topicos, setTopicos] = useState<TopicoNaTela[]>([]);
  const [dentro, setDentro] = useState(false);
  const [criando, setCriando] = useState(false);
  const [titulo, setTitulo] = useState("");

  useEffect(() => {
    const atualizar = () => {
      setTopicos(roda ? topicosDa(roda.id) : []);
      setDentro(roda ? participoDa(roda.id) : false);
    };
    atualizar();
    window.addEventListener(RODAS_EVENT, atualizar);
    return () => window.removeEventListener(RODAS_EVENT, atualizar);
  }, [params.id]);

  if (!roda) {
    return (
      <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="roda-missing">
        <PageHeader title="Roda" fallback="/community" />
        <div className="px-8 py-20 text-center space-y-4">
          <p className="text-sm text-white/50">Essa roda não existe.</p>
          <Link href="/community" className="inline-block text-sm font-bold text-primary">
            Voltar à Comunidade
          </Link>
        </div>
      </div>
    );
  }

  function participar() {
    const agora = alternarParticipacao(roda!.id);
    toast({
      title: agora ? `Você entrou em ${roda!.nome}` : `Você saiu de ${roda!.nome}`,
      description: agora ? "Agora pode criar tópicos e responder." : undefined,
    });
  }

  function publicarTopico() {
    if (!criando) {
      // Criar já diz a intenção: quem não entrou, entra junto.
      if (!dentro) alternarParticipacao(roda!.id);
      setCriando(true);
      return;
    }
    const novo = criarTopico(roda!.id, titulo);
    if (novo) {
      setTitulo("");
      setCriando(false);
      toast({ title: "Tópico criado", description: "Ele já está no topo da lista da roda." });
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="roda-page">
      <PageHeader title="Roda" fallback="/community" />

      <header className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 text-3xl">
            {roda.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold tracking-tight">{roda.nome}</h1>
            <p className="mt-0.5 text-[11px] text-white/40">
              {roda.membros.length + (dentro ? 1 : 0)} pessoas
              {dentro && " · você participa"}
            </p>
          </div>
        </div>

        <p className="mt-3.5 text-sm leading-relaxed text-white/55">{roda.descricao}</p>

        <div className="mt-4 flex gap-2.5">
          <button
            onClick={publicarTopico}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            data-testid="roda-create-topic"
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
            data-testid="roda-join"
          >
            {dentro ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {dentro ? "Participando" : "Participar"}
          </button>
        </div>

        {criando && (
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3" data-testid="roda-composer">
            <input
              value={titulo}
              onChange={(event) => setTitulo(event.target.value.slice(0, MAX_TITULO))}
              placeholder="O título do seu tópico — uma pergunta funciona bem…"
              autoFocus
              className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              data-testid="roda-topic-title"
            />
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-white/25">{titulo.length}/{MAX_TITULO}</span>
              <button
                onClick={publicarTopico}
                disabled={titulo.trim().length === 0}
                className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-black disabled:opacity-30"
                data-testid="roda-topic-publish"
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
              href={`/roda/${roda.id}/topico/${topico.id}`}
              className="block rounded-xl border border-white/5 bg-white/[0.03] p-3.5 mb-2.5 transition-colors hover:bg-white/[0.06]"
            >
              <p className="pr-6 text-sm font-semibold leading-snug">
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
