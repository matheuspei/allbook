import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { Ban, EyeOff, Send, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AnexarTrecho from "@/components/AnexarTrecho";
import BotaoDeCurtir from "@/components/comunidade/BotaoDeCurtir";
import CitacaoDeAudio from "@/components/CitacaoDeAudio";
import PageHeader from "@/components/PageHeader";
import { type Citacao } from "@/lib/citacoes";
import { useToast } from "@/hooks/use-toast";
import { relativeDate } from "@/lib/activity";
import { initialOf, readProfile } from "@/lib/profile";
import {
  MAX_RESPOSTA,
  GRUPOS_EVENT,
  alternarRespostaEscondida,
  alternarSpoiler,
  apagarMinhaResposta,
  fioDo,
  souDonoDo,
  responder,
  grupoPorId,
  tituloDoTopico,
  type RespostaNaTela,
} from "@/lib/grupos";

/**
 * O fio de um tópico (`/forum/:id/topico/:topicoId`) — as respostas em
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
  /* O fórum a que este tópico pertence — a moderação é de quem criou o fórum. */
  const grupoId = topico?.grupoId ?? params.id ?? "";
  const souDono = souDonoDo(grupoId);
  /* Revelar é por sessão e por resposta: fechar a tela cobre tudo de novo. */
  const [revelados, setRevelados] = useState<string[]>([]);
  const [trecho, setTrecho] = useState<Citacao | undefined>(undefined);

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
    const nova = responder(topico!.id, texto, trecho);
    if (nova) {
      setTexto("");
      setTrecho(undefined);
      toast({ title: "Resposta publicada" });
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="topico-page">
      <PageHeader title={grupo.nome} fallback={`/forum/${grupo.id}`} />

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

                {/*
                  Moderação do dono do fórum (ROTEIRO 4.44). **Cobrir vem antes
                  de esconder** na ordem dos botões porque é o que ele mais vai
                  usar: quase ninguém posta spoiler de má-fé, posta distraído —
                  e esconder a mensagem inteira por isso seria desproporcional.
                */}
                {souDono && !resposta.minha && (
                  <span className="ml-auto flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        const cobriu = alternarSpoiler(grupoId, resposta.id);
                        toast({
                          title: cobriu ? "Coberto como spoiler" : "Descoberto",
                        });
                      }}
                      className={`p-1 transition-colors ${
                        resposta.spoiler ? "text-[#f59e0b]" : "text-white/20 hover:text-white/60"
                      }`}
                      aria-label="Cobrir como spoiler"
                      data-testid={`spoiler-${resposta.id}`}
                    >
                      <EyeOff className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        alternarRespostaEscondida(grupoId, resposta.id);
                        toast({
                          title: "Resposta escondida",
                          description: "Some do fio. Dá para devolver tocando de novo no olho.",
                        });
                      }}
                      className="p-1 text-white/20 transition-colors hover:text-red-300"
                      aria-label="Esconder esta resposta"
                      data-testid={`esconder-resposta-${resposta.id}`}
                    >
                      <Ban className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </p>

              {resposta.spoiler && !revelados.includes(resposta.id) ? (
                <button
                  onClick={() => setRevelados((atual) => [...atual, resposta.id])}
                  className="mt-1.5 flex w-full items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-left text-[11.5px] text-white/45 transition-colors hover:bg-white/10"
                  data-testid={`revelar-${resposta.id}`}
                >
                  <EyeOff className="h-3 w-3 shrink-0 text-[#f59e0b]" />
                  Marcada como spoiler — toque para ler assim mesmo.
                </button>
              ) : (
                <>
                  {resposta.texto && (
                    <p className="mt-1 text-sm leading-relaxed text-white/80">{resposta.texto}</p>
                  )}
                  {resposta.citacao && <CitacaoDeAudio citacao={resposta.citacao} />}

                  {/* **Curtir chegou ao fórum** (30/07): a §4.58 tinha medido que
                      a ação existia só na conversa do livro e no feed. Resposta de
                      fórum é fala como qualquer outra — quem concorda precisa
                      poder dizer sem escrever "concordo". */}
                  <div className="mt-2">
                    <BotaoDeCurtir id={resposta.id} deOutraPessoa={!resposta.minha} />
                  </div>
                </>
              )}
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
          className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5"
          data-testid="topico-composer"
        >
          <div className="flex items-end gap-2">
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
              disabled={texto.trim().length === 0 && !trecho}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-black transition-opacity disabled:opacity-30"
              data-testid="topico-publish"
            >
              <Send className="h-3 w-3" />
              Responder
            </button>
          </div>

          {/* Anexar um trecho que você guardou ouvindo (ROTEIRO 4.45). */}
          <div className="mt-2 px-1.5">
            <AnexarTrecho citacao={trecho} onEscolher={setTrecho} />
          </div>
        </div>
      </main>
    </div>
  );
}
