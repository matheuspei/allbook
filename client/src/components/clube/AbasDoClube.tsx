import { meuVotoNaPauta, pautaAberta } from "@/lib/pautas";
import { meuVoto, minhaResposta, rodadaAberta, votacaoDoClube } from "@/lib/rodadas";
import { salasDoClube, euConfirmei, sessaoNoAr } from "@/lib/salaAoVivo";
import { type Clube } from "@/lib/clubes";

export type AbaDoClube = "agora" | "conversa" | "encontros" | "estante";

/**
 * **As abas do clube** (ROTEIRO §4.82) — a decisão que estava aberta desde a
 * §4.57 e que o Matheus bateu o martelo em 31/07: *"sim, ele vira a aba"*.
 *
 * ---
 *
 * **O que isto resolve.** A §4.57 mediu a tela do clube em **4,5 telas de
 * rolagem com cinco seções empilhadas** e chamou aquilo de *"o defeito de escala
 * mais grave, e piora sozinho com o uso"*. Depois da sala ao vivo, eram **sete
 * seções**. A conversa, que é o que mais cresce, ficava no meio da pilha — e era
 * só o mural estar curto que deixava votação e estante alcançáveis.
 *
 * **O preço, que a §4.57 já tinha registrado:** *"o que está atrás de aba deixa
 * de ser visto"*. A mitigação é o **ponto** — cada aba acende quando tem algo
 * esperando **por você**. Sem ele, a aba esconde a rodada aberta e o clube fica
 * parecendo morto.
 *
 * **A divisão, e o critério de cada uma:**
 *
 * - **Agora** — o que pede ação hoje: o ciclo, a sala no ar, a rodada, a pauta,
 *   a votação. É a aba que abre.
 * - **Conversa** — o mural e a discussão trecho a trecho, **juntos**. Eram duas
 *   seções respondendo à mesma pergunta ("onde a turma fala?") na mesma página.
 * - **Encontros** — a agenda e como marcar mais.
 * - **Estante** — a memória: o que a turma já leu, e o ritmo do ciclo.
 */
export default function AbasDoClube({
  clube,
  ativa,
  onTrocar,
}: {
  clube: Clube;
  ativa: AbaDoClube;
  onTrocar: (aba: AbaDoClube) => void;
}) {
  const pendencias = pendenciasDoClube(clube);

  const abas: { chave: AbaDoClube; nome: string }[] = [
    { chave: "agora", nome: "Agora" },
    { chave: "conversa", nome: "Conversa" },
    { chave: "encontros", nome: "Encontros" },
    { chave: "estante", nome: "Estante" },
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-testid="abas-do-clube"
    >
      {abas.map((aba) => {
        const ligada = ativa === aba.chave;
        return (
          <button
            key={aba.chave}
            onClick={() => onTrocar(aba.chave)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              ligada
                ? "bg-white text-black"
                : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            data-testid={`aba-clube-${aba.chave}`}
          >
            {aba.nome}
            {/* O ponto só aparece na aba **fechada**: na aberta a coisa já está
                à vista, e um alerta apontando para o que você está olhando é
                ruído. */}
            {pendencias[aba.chave] && !ligada && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * **O que espera por você em cada aba.**
 *
 * Só conta o que pede uma ação **sua** — rodada por responder, voto por dar,
 * sessão por confirmar, sala no ar. Contar "tem mensagem nova no mural" faria a
 * aba Conversa acender para sempre, e ponto que nunca apaga deixa de significar
 * qualquer coisa.
 */
function pendenciasDoClube(clube: Clube): Record<AbaDoClube, boolean> {
  const rodada = rodadaAberta(clube.id);
  const pauta = pautaAberta(clube.id);
  const votacao = votacaoDoClube(clube.id);
  const salas = salasDoClube(clube.id);

  const temSalaNoAr = salas.some((sala) => sessaoNoAr(sala) && !sala.encerradaEm);
  const sessaoPorConfirmar = salas.some(
    (sala) => sala.porta === "marcada" && !sessaoNoAr(sala) && !euConfirmei(sala),
  );

  return {
    agora:
      temSalaNoAr ||
      (rodada !== undefined && minhaResposta(rodada.id) === undefined) ||
      (pauta !== undefined && meuVotoNaPauta(pauta.id) === undefined) ||
      (votacao !== undefined && meuVoto(clube.id) === undefined),
    conversa: false,
    encontros: sessaoPorConfirmar,
    estante: false,
  };
}
