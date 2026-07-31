import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import QuemReagiu from "@/components/comunidade/QuemReagiu";
import {
  CURTIDAS_EVENT,
  alternarReacao,
  minhaReacao,
  quemReagiu,
  type OpcoesDeReacao,
  type Reacao,
} from "@/lib/curtidas";
import { initialOf, readProfile } from "@/lib/profile";

/**
 * Reagir a uma fala — **os dois lados, com a cara que o app já tinha**.
 *
 * ---
 *
 * **Duas correções do Matheus, em 31/07, e as duas eram sobre coerência:**
 *
 * 1. *"Não faz sentido ter um botão de coração para curtir e um botão de
 *    descurtir — ter dois critérios para a mesma coisa."* Certíssimo: coração e
 *    polegar são **duas metáforas diferentes** empilhadas no mesmo par. Se um lado
 *    é polegar, o outro é polegar.
 * 2. *"O botão azul também não harmoniza com nada no aplicativo."* Também: a
 *    paleta é laranja/âmbar sobre quase-preto, e eu tinha inventado um azul só
 *    para este botão.
 *
 * **A resposta já existia dentro do app**: a conversa do livro tem curtir e
 * descurtir desde 21/07, com `ThumbsUp`/`ThumbsDown`, **âmbar** no positivo e
 * **branco** no negativo (`CommentThread`). Copiar aquilo aqui não é falta de
 * ideia — é a régua da §4.67 aplicada de novo: **a mesma ação, com a mesma cara,
 * em todo lugar.**
 *
 * **Substitui o `BotaoDeCurtir`**, que espalhou pelo app a metade positiva de uma
 * decisão que o Matheus tinha tomado inteira. O registro do erro está no cabeçalho
 * de `lib/curtidas.ts`.
 */
export default function Reacoes({
  id,
  deOutraPessoa,
  autorSlug,
  escala = "fala",
  className = "",
}: {
  /** O id da fala — post, comentário, resposta de fórum, mensagem de mural. */
  id: string;
  /** Falso = você escreveu, e aí os contadores começam em zero. */
  deOutraPessoa: boolean;
  /** Para o autor não aparecer reagindo a si mesmo na lista. */
  autorSlug?: string;
  /**
   * `"post"` só desenha os polegares — quem conta e mostra **quem** reagiu é a
   * `LinhaDeRecepcao`, logo acima da barra. `"fala"` carrega o número no próprio
   * botão, porque num comentário não cabe uma linha inteira só para isso.
   */
  escala?: "post" | "fala";
  className?: string;
}) {
  const opcoes: OpcoesDeReacao = { deOutraPessoa, escala, autorSlug };
  const [minha, setMinha] = useState<Reacao | undefined>(() => minhaReacao(id));
  const [vendo, setVendo] = useState<Reacao | undefined>();

  /* A mesma fala pode estar em duas telas ao mesmo tempo (o fio e a página do
     post, por exemplo). Sem isto, reagir num lugar deixaria o outro mentindo. */
  useEffect(() => {
    const atualizar = () => setMinha(minhaReacao(id));
    window.addEventListener(CURTIDAS_EVENT, atualizar);
    return () => window.removeEventListener(CURTIDAS_EVENT, atualizar);
  }, [id]);

  const numero = (reacao: Reacao) =>
    quemReagiu(id, reacao, opcoes).length + (minha === reacao ? 1 : 0);

  const tamanho = escala === "post" ? "h-4 w-4" : "h-3.5 w-3.5";
  const texto = escala === "post" ? "text-[12px]" : "text-[11px]";

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`} data-testid={`reacoes-${id}`}>
        <BotaoDeReacao
          Icone={ThumbsUp}
          ativo={minha === "curtiu"}
          corAtiva="text-amber-500"
          rotulo={minha === "curtiu" ? "Desfazer" : "Curtir"}
          numero={escala === "fala" ? numero("curtiu") : undefined}
          onReagir={() => setMinha(alternarReacao(id, "curtiu"))}
          onVerLista={() => setVendo("curtiu")}
          tamanho={tamanho}
          texto={texto}
          testId={`curtir-${id}`}
        />
        <BotaoDeReacao
          Icone={ThumbsDown}
          ativo={minha === "descurtiu"}
          /* Branco, não uma cor nova: a paleta do app é laranja sobre quase-preto,
             e o negativo se distingue por **peso**, não por matiz. */
          corAtiva="text-white/85"
          rotulo={minha === "descurtiu" ? "Desfazer" : "Descurtir"}
          numero={escala === "fala" ? numero("descurtiu") : undefined}
          onReagir={() => setMinha(alternarReacao(id, "descurtiu"))}
          onVerLista={() => setVendo("descurtiu")}
          tamanho={tamanho}
          texto={texto}
          testId={`descurtir-${id}`}
        />
      </div>

      {vendo && (
        <QuemReagiu id={id} opcoes={opcoes} inicial={vendo} onFechar={() => setVendo(undefined)} />
      )}
    </>
  );
}

/**
 * Um lado do par.
 *
 * **O ícone reage; o número abre quem reagiu.** São duas intenções diferentes
 * ("eu acho isto bom" × "quem achou isto bom?"), e juntá-las num alvo só obrigaria
 * a inventar um gesto (toque longo) que ninguém descobre sozinho.
 *
 * **Os alvos são grandes** (`py-3 -my-3`): o padding faz os 44px que Apple e
 * Google pedem e a margem negativa devolve o espaço ao layout — a lição da §4.63.
 */
function BotaoDeReacao({
  Icone,
  ativo,
  corAtiva,
  rotulo,
  numero,
  onReagir,
  onVerLista,
  tamanho,
  texto,
  testId,
}: {
  Icone: typeof ThumbsUp;
  ativo: boolean;
  corAtiva: string;
  rotulo: string;
  numero?: number;
  onReagir: () => void;
  onVerLista: () => void;
  tamanho: string;
  texto: string;
  testId: string;
}) {
  const cor = ativo ? corAtiva : "text-white/40 hover:text-white/75";

  return (
    <span className="flex items-center">
      <button
        type="button"
        onClick={onReagir}
        className={`-my-3 flex items-center py-3 pl-1.5 pr-1 transition-colors ${cor}`}
        aria-pressed={ativo}
        aria-label={rotulo}
        data-testid={testId}
      >
        <Icone className={tamanho} strokeWidth={1.75} fill={ativo ? "currentColor" : "none"} />
      </button>
      {numero !== undefined && numero > 0 && (
        <button
          type="button"
          onClick={onVerLista}
          className={`-my-3 py-3 pr-1.5 font-semibold transition-colors ${texto} ${cor}`}
          aria-label={`Ver quem reagiu (${numero})`}
          data-testid={`ver-${testId}`}
        >
          {numero}
        </button>
      )}
    </span>
  );
}

/**
 * **A linha de recepção do post** — a peça que transforma dois números em gente.
 *
 * Nasceu de um pedido do Matheus em 31/07: *"sinto pouca audácia; você poderia ser
 * mais audacioso e mais criativo"*. Dois contadores ao lado de dois ícones são o
 * mínimo que qualquer app faz. Isto é o que a informação **queria** ser:
 *
 * - **Rostos, não só números.** A §4.53 diz que onze feeds falharam por serem
 *   *sobre pessoas* — texto sem corpo. Isto não é aquilo: as pessoas não são o
 *   conteúdo, são a **recepção** dele, em 20px. E é o que responde a pergunta que
 *   um número nunca responde: *quem?*
 * - **A barra só aparece quando houve discordância.** Post que só agradou não
 *   precisa de gráfico; post que **dividiu** ganha uma linha de duas cores, e aí
 *   ela significa alguma coisa. Elemento que só existe quando carrega informação
 *   é a régua da casa contra enfeite (§4.23).
 * - **A frase é escrita, não uma soma.** "Ana Paula e mais 3 gostaram · 1
 *   discordou" se lê de relance; "4 · 1" obriga a decifrar.
 *
 * Tocar em qualquer ponto abre a lista — o alvo é a linha inteira, não um número
 * de 12px.
 */
export function LinhaDeRecepcao({
  id,
  deOutraPessoa,
  autorSlug,
}: {
  id: string;
  deOutraPessoa: boolean;
  autorSlug?: string;
}) {
  const opcoes: OpcoesDeReacao = { deOutraPessoa, escala: "post", autorSlug };
  const [minha, setMinha] = useState<Reacao | undefined>(() => minhaReacao(id));
  const [vendo, setVendo] = useState<Reacao | undefined>();

  useEffect(() => {
    const atualizar = () => setMinha(minhaReacao(id));
    window.addEventListener(CURTIDAS_EVENT, atualizar);
    return () => window.removeEventListener(CURTIDAS_EVENT, atualizar);
  }, [id]);

  const perfil = readProfile();
  const curtiram = quemReagiu(id, "curtiu", opcoes);
  const descurtiram = quemReagiu(id, "descurtiu", opcoes);
  const totalCurtiu = curtiram.length + (minha === "curtiu" ? 1 : 0);
  const totalDescurtiu = descurtiram.length + (minha === "descurtiu" ? 1 : 0);

  if (totalCurtiu === 0 && totalDescurtiu === 0) return null;

  /* Você primeiro quando reagiu: é a confirmação do seu toque, no lugar onde ele
     produziu efeito. Depois os outros, na ordem estável da lib. */
  const rostos = [
    ...(minha === "curtiu" ? [{ slug: "voce", nome: perfil.name, cor: "from-primary to-orange-600" }] : []),
    ...curtiram.map((m) => ({ slug: m.slug, nome: m.name, cor: m.color })),
  ].slice(0, 3);

  const primeiro = minha === "curtiu" ? "Você" : curtiram[0]?.name;
  const restantes = totalCurtiu - 1;

  return (
    <>
      <div className="mt-2.5 flex items-center gap-2" data-testid={`recepcao-${id}`}>
        <button
          type="button"
          onClick={() => setVendo(totalCurtiu > 0 ? "curtiu" : "descurtiu")}
          className="-my-2 flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
          data-testid={`ver-recepcao-${id}`}
        >
          {rostos.length > 0 && (
            <span className="flex shrink-0 -space-x-2">
              {rostos.map((rosto) => (
                <span
                  key={rosto.slug}
                  className={`grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br ${rosto.cor} text-[9px] font-bold ring-2 ring-[#181818]`}
                >
                  {rosto.slug === "voce" ? initialOf(rosto.nome) : rosto.nome.charAt(0)}
                </span>
              ))}
            </span>
          )}

          <span className="min-w-0 flex-1 truncate text-[11.5px] text-white/45">
            {totalCurtiu > 0 && (
              <>
                <strong className="font-semibold text-white/70">{primeiro}</strong>
                {restantes > 0 && ` e mais ${restantes}`} {totalCurtiu === 1 ? "gostou" : "gostaram"}
              </>
            )}
            {totalCurtiu > 0 && totalDescurtiu > 0 && " · "}
            {totalDescurtiu > 0 && (
              <>
                {totalDescurtiu} {totalDescurtiu === 1 ? "discordou" : "discordaram"}
              </>
            )}
          </span>
        </button>

        {/* A barra da divisão — só quando houve os dois lados (ver o cabeçalho). */}
        {totalCurtiu > 0 && totalDescurtiu > 0 && (
          <span
            className="flex h-1 w-14 shrink-0 overflow-hidden rounded-full bg-white/10"
            aria-hidden
            data-testid={`barra-recepcao-${id}`}
          >
            <span
              className="h-full bg-amber-500"
              style={{ width: `${(totalCurtiu / (totalCurtiu + totalDescurtiu)) * 100}%` }}
            />
            <span className="h-full flex-1 bg-white/55" />
          </span>
        )}
      </div>

      {vendo && (
        <QuemReagiu id={id} opcoes={opcoes} inicial={vendo} onFechar={() => setVendo(undefined)} />
      )}
    </>
  );
}
