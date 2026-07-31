import { useEffect, useState } from "react";
import { avatarDeLeitor } from "@/lib/community";
import { MessageCircleQuestion, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { corDoMembro, souDono, type Clube } from "@/lib/clubes";
import {
  apagarMinhaResposta,
  encerrarRodada,
  janelaEmTexto,
  minhaResposta,
  nomeDoAutor,
  responderRodada,
  rodadaAberta,
  rodadasEncerradas,
  RODADAS_EVENT,
  respostasDaRodada,
  type Rodada,
} from "@/lib/rodadas";

/**
 * O encontro do clube — **sem hora marcada**.
 *
 * Quem ouve audiolivro ouve dirigindo, na academia, às 23h. Marcar "quinta às
 * 20h" excluiria exatamente o comportamento que o app cultiva, então o encontro
 * é uma **rodada**: uma pergunta aberta por dois ou três dias, e cada um
 * responde quando dá. No fim, as respostas ficam juntas como um capítulo do
 * clube — quem chegou atrasado lê tudo (ROTEIRO 4.39).
 *
 * Responder **em áudio** foi descartado, e o motivo está registrado: não é
 * custo (voz comprimida é uma gota perto de um audiolivro), é privacidade e
 * moderação.
 */
export default function RodadaDoClube({ clube }: { clube: Clube }) {
  const { toast } = useToast();
  const [aberta, setAberta] = useState<Rodada | undefined>(() => rodadaAberta(clube.id));
  const [encerradas, setEncerradas] = useState<Rodada[]>(() => rodadasEncerradas(clube.id));
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const atualizar = () => {
      setAberta(rodadaAberta(clube.id));
      setEncerradas(rodadasEncerradas(clube.id));
    };
    atualizar();
    window.addEventListener(RODADAS_EVENT, atualizar);
    return () => window.removeEventListener(RODADAS_EVENT, atualizar);
  }, [clube.id]);

  const jaRespondi = aberta ? minhaResposta(aberta.id) : undefined;

  /*
   * **Sem rodada aberta e sem histórico, a seção não aparece** (ROTEIRO 4.40).
   * Antes ela era permanente: quem moderava batia numa caixa de "abrir rodada"
   * **antes** de ver a conversa, e quem não moderava lia "nenhuma rodada aberta
   * agora" — um aviso sobre a ausência de algo. Era metade da queixa de layout.
   * Abrir rodada agora mora em `/clube/:id/gerenciar`, junto dos outros poderes.
   */
  if (!aberta && encerradas.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="rodada-do-clube">
      {/*
        "Encontro · sem hora marcada" saiu. Como cabeçalho ele lia como defeito
        ("ninguém marcou a hora") quando era a decisão de desenho — o encontro do
        AllBook é assíncrono de propósito. "A rodada" diz o que a coisa é, e a
        explicação de que não tem hora marcada está dentro do bloco.
      */}
      <h2 className="font-display text-lg font-bold">A rodada</h2>

      {aberta ? (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.07] p-4">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            <MessageCircleQuestion className="h-3.5 w-3.5" />
            Rodada aberta · {janelaEmTexto(aberta.fecha)}
          </p>
          <p className="mt-2 font-display text-base font-bold leading-snug">{aberta.pergunta}</p>

          {jaRespondi ? (
            <div className="mt-3 rounded-lg bg-black/25 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary">Sua resposta</span>
                <button
                  onClick={() => {
                    apagarMinhaResposta(aberta.id);
                    toast({ title: "Resposta apagada" });
                  }}
                  className="p-1 text-white/25 transition-colors hover:text-white/60"
                  aria-label="Apagar minha resposta"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{jaRespondi}</p>
            </div>
          ) : (
            <div className="mt-3">
              <textarea
                value={texto}
                onChange={(event) => setTexto(event.target.value.slice(0, 600))}
                placeholder="Responda quando der — a rodada espera."
                rows={3}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
                data-testid="rodada-input"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => {
                    responderRodada(aberta.id, texto);
                    setTexto("");
                    toast({ title: "Resposta enviada" });
                  }}
                  disabled={texto.trim().length === 0}
                  className="text-sm font-semibold text-primary transition-colors disabled:text-white/20"
                  data-testid="rodada-send"
                >
                  Responder
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-2.5 border-t border-white/10 pt-3">
            {respostasDaRodada(aberta).map((resposta, indice) => (
              <div key={`${resposta.autorSlug}-${indice}`} className="flex gap-2.5">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br ${corDoMembro(
                    resposta.autorSlug,
                  )} text-[10px] font-bold`} {...avatarDeLeitor(
                    resposta.autorSlug,
                  )}
                >
                  {nomeDoAutor(resposta.autorSlug).charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{nomeDoAutor(resposta.autorSlug)}</p>
                  <p className="text-xs leading-relaxed text-white/60">{resposta.texto}</p>
                </div>
              </div>
            ))}
            {respostasDaRodada(aberta).length === 0 && (
              <p className="text-xs text-white/35">Ninguém respondeu ainda. Comece você.</p>
            )}
          </div>

          {souDono(clube) && (
            <button
              onClick={() => {
                encerrarRodada(aberta.id);
                toast({ title: "Rodada encerrada", description: "Ela vira histórico do clube." });
              }}
              className="mt-3 w-full rounded-lg bg-white/[0.06] py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10"
              data-testid="encerrar-rodada"
            >
              Encerrar a rodada agora
            </button>
          )}
        </div>
      ) : null}

      {encerradas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
            Encontros anteriores
          </p>
          {encerradas.map((rodada) => (
            <details
              key={rodada.id}
              className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
            >
              <summary className="cursor-pointer text-xs font-semibold text-white/70">
                {rodada.pergunta}
              </summary>
              <div className="mt-2 space-y-2">
                {respostasDaRodada(rodada).map((resposta, indice) => (
                  <p key={indice} className="text-xs leading-relaxed text-white/50">
                    <span className="font-semibold text-white/70">
                      {nomeDoAutor(resposta.autorSlug)}:
                    </span>{" "}
                    {resposta.texto}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
