import { useEffect, useState } from "react";
import { MessageCircleQuestion, Sparkles, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { corDoMembro, souDono, type Clube } from "@/lib/clubes";
import {
  abrirRodada,
  apagarMinhaResposta,
  encerrarRodada,
  janelaEmTexto,
  minhaResposta,
  nomeDoAutor,
  PERGUNTAS_SUGERIDAS,
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
  const [novaPergunta, setNovaPergunta] = useState("");

  useEffect(() => {
    const atualizar = () => {
      setAberta(rodadaAberta(clube.id));
      setEncerradas(rodadasEncerradas(clube.id));
    };
    atualizar();
    window.addEventListener(RODADAS_EVENT, atualizar);
    return () => window.removeEventListener(RODADAS_EVENT, atualizar);
  }, [clube.id]);

  const souModerador = souDono(clube);
  const jaRespondi = aberta ? minhaResposta(aberta.id) : undefined;

  return (
    <section className="space-y-3" data-testid="rodada-do-clube">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Encontro</h2>
        <span className="text-xs text-white/35">sem hora marcada</span>
      </div>

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
                  )} text-[10px] font-bold`}
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

          {souModerador && (
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
      ) : souModerador ? (
        <AbrirRodada
          valor={novaPergunta}
          onChange={setNovaPergunta}
          onAbrir={() => {
            abrirRodada(clube.id, novaPergunta);
            setNovaPergunta("");
            toast({ title: "Rodada aberta", description: "A turma tem 3 dias para responder." });
          }}
        />
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs leading-relaxed text-white/45">
          Nenhuma rodada aberta agora. Quem modera o clube abre a próxima pergunta.
        </p>
      )}

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

/**
 * A caixa de abrir rodada, com sugestões.
 *
 * As sugestões não são enfeite: puxar conversa é a parte difícil de moderar um
 * clube, e quem trava na pergunta acaba não abrindo rodada nenhuma. Todas as
 * sugestões funcionam em qualquer ponto do livro — nenhuma depende do final.
 */
function AbrirRodada({
  valor,
  onChange,
  onAbrir,
}: {
  valor: string;
  onChange: (texto: string) => void;
  onAbrir: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4" data-testid="abrir-rodada">
      <p className="text-sm font-semibold">Abrir a próxima rodada</p>
      <p className="mt-1 text-xs text-white/45">
        Uma pergunta, três dias para responder. Cada um responde quando puder.
      </p>

      <textarea
        value={valor}
        onChange={(event) => onChange(event.target.value.slice(0, 200))}
        placeholder="Qual é a pergunta desta rodada?"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
        data-testid="rodada-pergunta"
      />

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PERGUNTAS_SUGERIDAS.slice(0, 3).map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            onClick={() => onChange(sugestao)}
            className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10.5px] text-white/50 transition-colors hover:text-white/80"
          >
            <Sparkles className="h-2.5 w-2.5" />
            {sugestao.length > 34 ? `${sugestao.slice(0, 34)}…` : sugestao}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onAbrir}
          disabled={valor.trim().length === 0}
          className="text-sm font-semibold text-primary transition-colors disabled:text-white/20"
          data-testid="abrir-rodada-send"
        >
          Abrir rodada
        </button>
      </div>
    </div>
  );
}
