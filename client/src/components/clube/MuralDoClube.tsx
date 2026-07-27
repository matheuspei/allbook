import { useEffect, useState } from "react";
import { EyeOff, Lock, Shield, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { EU, capituloCombinado, corDoMembro, meuCapitulo, souDono, type Clube } from "@/lib/clubes";
import {
  apagarMinhaMensagem,
  autorDaMensagem,
  desfazerModeracao,
  escondidasDoClube,
  esconderMensagem,
  marcarComoSpoiler,
  mensagensDoClube,
  MURAL_EVENT,
  MAX_MENSAGEM,
  publicarNoMural,
  type MensagemDoClube,
} from "@/lib/muralDoClube";

/**
 * O mural — a conversa da turma, com a trava do combinado.
 *
 * **A unidade aqui é o capítulo, não o segundo.** Na sala do livro cada
 * comentário se prende a um ponto do áudio; no clube existe um acordo do grupo
 * ("até o capítulo 6 esta semana"), e é ele que decide o que você lê. Mensagem
 * de capítulo à frente do seu chega **coberta com o número à mostra**: você
 * sabe que existe conversa lá adiante, sabe onde, e não é surpreendido.
 *
 * **O que o moderador pode fazer, e por quê.** Cobrir (marcar como spoiler) e
 * esconder. Cobrir é o poder do dia a dia: quase ninguém posta spoiler de
 * má-fé, posta distraído — apagar a pessoa seria desproporcional. Esconder fica
 * para o que não deveria estar ali, e tem volta.
 */
export default function MuralDoClube({ clube }: { clube: Clube }) {
  const { toast } = useToast();
  const [mensagens, setMensagens] = useState<MensagemDoClube[]>(() =>
    mensagensDoClube(clube.id),
  );
  const [escondidas, setEscondidas] = useState<MensagemDoClube[]>(() =>
    escondidasDoClube(clube.id),
  );
  const [texto, setTexto] = useState("");
  const [prender, setPrender] = useState(true);

  useEffect(() => {
    const atualizar = () => {
      setMensagens(mensagensDoClube(clube.id));
      setEscondidas(escondidasDoClube(clube.id));
    };
    atualizar();
    window.addEventListener(MURAL_EVENT, atualizar);
    return () => window.removeEventListener(MURAL_EVENT, atualizar);
  }, [clube.id]);

  const meu = meuCapitulo(clube);
  const combinado = capituloCombinado(clube);
  const souModerador = souDono(clube);

  function publicar() {
    const limpo = texto.trim();
    if (!limpo) return;
    publicarNoMural(clube.id, limpo, { capitulo: prender && meu > 0 ? meu : undefined });
    setTexto("");
    toast({
      title: "Publicado no mural",
      description:
        prender && meu > 0
          ? `Marcado como capítulo ${meu} — quem estiver atrás não vê o texto.`
          : undefined,
    });
  }

  return (
    <section className="space-y-3" data-testid="mural-do-clube">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">Mural</h2>
        <span className="text-xs text-white/35">
          {mensagens.length} {mensagens.length === 1 ? "mensagem" : "mensagens"}
        </span>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/5 p-4">
        <textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value.slice(0, MAX_MENSAGEM))}
          placeholder={`Escreva para a turma. Combinado: até o capítulo ${combinado}.`}
          rows={3}
          className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-white/25 focus:outline-none"
          data-testid="mural-input"
        />

        {meu > 0 && (
          <button
            type="button"
            onClick={() => setPrender((valor) => !valor)}
            aria-pressed={prender}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1 transition-colors ${
              prender
                ? "bg-primary/15 text-primary ring-primary/40"
                : "bg-white/[0.04] text-white/40 ring-white/10"
            }`}
            data-testid="mural-capitulo-toggle"
          >
            <Lock className="h-3 w-3" />
            {prender ? `Falo do capítulo ${meu}` : "Conversa geral"}
          </button>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-white/25">
            {texto.length}/{MAX_MENSAGEM}
          </span>
          <button
            onClick={publicar}
            disabled={texto.trim().length === 0}
            className="text-sm font-semibold text-primary transition-colors disabled:text-white/20"
            data-testid="mural-send"
          >
            Publicar
          </button>
        </div>
      </div>

      {mensagens.map((mensagem) => (
        <Mensagem
          key={mensagem.id}
          mensagem={mensagem}
          meuCapitulo={meu}
          souModerador={souModerador}
          onApagar={() => {
            apagarMinhaMensagem(mensagem.id);
            toast({ title: "Mensagem apagada" });
          }}
          onCobrir={() => {
            marcarComoSpoiler(mensagem.id);
            toast({
              title: "Coberta como spoiler",
              description: "Quem ainda não chegou lá vê só o aviso.",
            });
          }}
          onEsconder={() => {
            esconderMensagem(mensagem.id);
            toast({ title: "Escondida do mural", description: "Dá para devolver no fim da lista." });
          }}
        />
      ))}

      {mensagens.length === 0 && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-xs leading-relaxed text-white/45">
          Ninguém escreveu ainda. Uma pergunta simples costuma destravar: em que capítulo cada um
          está?
        </p>
      )}

      {escondidas.length > 0 && (
        <button
          type="button"
          onClick={() => escondidas.forEach((item) => desfazerModeracao(item.id))}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
          data-testid="mural-escondidas"
        >
          <span className="text-xs text-white/35">
            {escondidas.length} {escondidas.length === 1 ? "mensagem escondida" : "mensagens escondidas"}
          </span>
          <span className="text-xs font-semibold text-primary">Devolver</span>
        </button>
      )}
    </section>
  );
}

function Mensagem({
  mensagem,
  meuCapitulo: meu,
  souModerador,
  onApagar,
  onCobrir,
  onEsconder,
}: {
  mensagem: MensagemDoClube;
  meuCapitulo: number;
  souModerador: boolean;
  onApagar: () => void;
  onCobrir: () => void;
  onEsconder: () => void;
}) {
  const [revelado, setRevelado] = useState(false);
  const ehMinha = mensagem.autorSlug === EU;

  /*
   * Duas razões para uma mensagem chegar coberta, e a ordem importa: estar
   * **à frente** do seu capítulo cobre mesmo sem marcação — é o combinado do
   * grupo; a marcação manual cobre o resto. A sua própria mensagem nunca fica
   * coberta: você sabe o que escreveu.
   */
  const adiante = mensagem.capitulo !== undefined && mensagem.capitulo > meu && !ehMinha;
  const coberta = !revelado && !ehMinha && (adiante || mensagem.spoiler);

  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-4" data-testid="mural-mensagem">
      <div className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br ${corDoMembro(
            mensagem.autorSlug,
          )} font-display text-[11px] font-bold`}
        >
          {autorDaMensagem(mensagem).charAt(0)}
        </span>
        <span className="text-sm font-bold">{autorDaMensagem(mensagem)}</span>
        {mensagem.capitulo !== undefined && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/45">
            cap. {mensagem.capitulo}
          </span>
        )}

        {ehMinha && (
          <button
            onClick={onApagar}
            className="ml-auto p-1 text-white/25 transition-colors hover:text-white/60"
            aria-label="Apagar minha mensagem"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {coberta ? (
        <button
          type="button"
          onClick={() => setRevelado(true)}
          className="mt-2.5 flex w-full items-center gap-2.5 rounded-lg bg-white/[0.06] px-3 py-2.5 text-left transition-colors hover:bg-white/10"
          data-testid="mural-coberta"
        >
          <EyeOff className="h-4 w-4 shrink-0 text-[#f59e0b]" />
          <span className="text-xs text-white/50">
            {adiante ? (
              <>
                <span className="font-semibold text-[#f59e0b]">
                  Fala do capítulo {mensagem.capitulo}
                </span>{" "}
                — você está no {meu || 1}. Toque para ver assim mesmo.
              </>
            ) : (
              <>
                <span className="font-semibold text-[#f59e0b]">Marcada como spoiler</span> — toque
                para ver.
              </>
            )}
          </span>
        </button>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-white/75">{mensagem.texto}</p>
      )}

      {souModerador && !ehMinha && (
        <div className="mt-3 flex items-center gap-1 border-t border-white/5 pt-2.5 text-[11px]">
          <Shield className="h-3 w-3 text-white/25" />
          <span className="mr-auto text-white/25">moderação</span>
          {!mensagem.spoiler && (
            <button
              onClick={onCobrir}
              className="rounded-md px-2 py-1 font-semibold text-[#f59e0b] transition-colors hover:bg-white/10"
              data-testid="moderar-cobrir"
            >
              cobrir spoiler
            </button>
          )}
          <button
            onClick={onEsconder}
            className="rounded-md px-2 py-1 font-semibold text-white/50 transition-colors hover:bg-white/10"
            data-testid="moderar-esconder"
          >
            esconder
          </button>
        </div>
      )}
    </div>
  );
}
