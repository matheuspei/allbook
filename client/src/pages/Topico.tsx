import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Send, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { initialOf, readProfile } from "@/lib/profile";
import {
  MAX_RESPOSTA,
  GRUPOS_EVENT,
  apagarMinhaResposta,
  fioDo,
  responder,
  grupoPorId,
  tituloDoTopico,
  type RespostaNaTela,
} from "@/lib/grupos";

/**
 * O fio de um tópico (`/grupo/:id/topico/:topicoId`) — as respostas em
 * sequência, como no Orkut. A caixa de responder fica no fim, onde a leitura
 * termina; resposta sua tem lixeira.
 */
export default function Topico() {
  const params = useParams<{ id: string; topicoId: string }>();
  const { toast } = useToast();
  const perfil = useMemo(readProfile, []);

  const grupo = grupoPorId(params.id ?? "");
  const [fio, setFio] = useState<RespostaNaTela[]>([]);
  const [texto, setTexto] = useState("");

  const topico = tituloDoTopico(params.topicoId ?? "");

  useEffect(() => {
    const atualizar = () => setFio(fioDo(params.topicoId ?? ""));
    atualizar();
    window.addEventListener(GRUPOS_EVENT, atualizar);
    return () => window.removeEventListener(GRUPOS_EVENT, atualizar);
  }, [params.topicoId]);

  if (!grupo || !topico) {
    return (
      <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="topico-missing">
        <PageHeader title="Tópico" fallback="/community" />
        <div className="px-8 py-20 text-center space-y-4">
          <p className="text-sm text-white/50">Esse tópico não existe mais.</p>
          <Link href="/community" className="inline-block text-sm font-bold text-primary">
            Voltar à Comunidade
          </Link>
        </div>
      </div>
    );
  }

  function publicar() {
    const nova = responder(topico!.id, texto);
    if (nova) {
      setTexto("");
      toast({ title: "Resposta publicada" });
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="topico-page">
      <PageHeader title={grupo.nome} fallback={`/grupo/${grupo.id}`} />

      <header className="px-5 pt-5 pb-4 border-b border-white/10">
        <h1 className="font-display text-lg font-bold leading-snug tracking-tight">
          {topico.titulo}
        </h1>
        <p className="mt-1.5 text-[11px] text-white/40">
          por {topico.meu ? "você" : topico.autor?.name ?? "alguém"} · em {grupo.emoji} {grupo.nome}{" "}
          · {fio.length} {fio.length === 1 ? "resposta" : "respostas"}
        </p>
      </header>

      <main className="px-5 py-4 space-y-3.5">
        {fio.map((resposta) => (
          <div key={resposta.id} className="flex gap-2.5" data-testid={`resposta-${resposta.id}`}>
            {resposta.minha ? (
              <Avatar className="h-8 w-8 shrink-0 self-start">
                {perfil.photo && (
                  <AvatarImage src={perfil.photo} alt={perfil.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-[#1e1e1e] text-xs font-bold text-white">
                  {initialOf(perfil.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Link
                href={`/user/${resposta.autor?.slug ?? ""}`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full bg-gradient-to-br ${
                  resposta.autor?.color ?? "from-zinc-600 to-zinc-700"
                } text-xs font-bold`}
              >
                {(resposta.autor?.name ?? "?").charAt(0)}
              </Link>
            )}

            <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/[0.035] px-3.5 py-2.5">
              <p className="flex items-center gap-2 text-xs">
                <span className="font-bold">
                  {resposta.minha ? "Você" : resposta.autor?.name ?? "Alguém"}
                </span>
                <span className="text-[10px] text-white/30">{relativeDate(resposta.date)}</span>
                {resposta.minha && (
                  <button
                    onClick={() => {
                      apagarMinhaResposta(resposta.id);
                      toast({ title: "Resposta apagada" });
                    }}
                    className="ml-auto p-0.5 text-white/20 transition-colors hover:text-white/60"
                    aria-label="Apagar esta resposta"
                    data-testid={`resposta-delete-${resposta.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/80">{resposta.texto}</p>
            </div>
          </div>
        ))}

        {fio.length === 0 && (
          <p className="py-6 text-sm text-white/35">
            Ninguém respondeu ainda — seja a primeira voz.
          </p>
        )}

        {/* A caixa no fim, onde a leitura termina. */}
        <div
          className="mt-2 flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
          data-testid="topico-composer"
        >
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value.slice(0, MAX_RESPOSTA))}
            placeholder="Responder ao tópico…"
            rows={2}
            className="min-h-[40px] w-full resize-none bg-transparent px-1.5 text-sm leading-relaxed text-white placeholder:text-white/30 focus:outline-none"
            data-testid="topico-input"
          />
          <button
            onClick={publicar}
            disabled={texto.trim().length === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-black transition-opacity disabled:opacity-30"
            data-testid="topico-publish"
          >
            <Send className="h-3 w-3" />
            Responder
          </button>
        </div>
      </main>
    </div>
  );
}
