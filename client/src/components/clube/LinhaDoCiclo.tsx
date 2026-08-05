import { getChapters } from "@/lib/chapters";
import {
  EU,
  dataCurta,
  estaComecando,
  hojeIso,
  meuCapitulo,
  progressoDosMembros,
  type Clube,
} from "@/lib/clubes";

/**
 * **A linha do ciclo** — o resumo do momento da turma, escolhido pelo Matheus
 * na folha `_linha-do-ciclo-C.html` (§4.101): *posição A, no topo da aba
 * "Agora"*, do jeito da maquete.
 *
 * A escala é a dos **capítulos do livro do ciclo**: o preenchimento é até onde
 * VOCÊ ouviu (com a etiqueta "você · cap. N" na ponta), as bolinhas são os
 * **marcos do combinado** (acesas quando o prazo já passou), e as pontas dizem
 * as datas de início e encontro. A frase de baixo situa a turma inteira — a
 * faixa entre o mais atrasado e o mais adiantado, e quantos já passaram de
 * você.
 *
 * **Ela substituiu a régua você×roda do `CartaoDoCiclo`** — duas barras de
 * progresso na mesma tela seria a redundância que a casa veta. A regra da
 * §4.39 continua respeitada: a frase agrega ("3 já passaram"), **não nomeia
 * ninguém** — apontar "Fulano está no 9" é a pressão que leva a mentir
 * progresso, e progresso mentido quebra a trava de spoiler.
 *
 * Some no clube que ainda vai estrear: com ninguém começado, a linha seria uma
 * barra vazia fingindo informação (a lição da §4.99), e o aviso de estreia do
 * cartão já conta o que importa.
 */
export function LinhaDoCiclo({ clube }: { clube: Clube }) {
  if (estaComecando(clube)) return null;

  const total = getChapters(clube.ciclo.bookId).length;
  if (total === 0) return null;

  const meu = meuCapitulo(clube);
  const hoje = hojeIso();
  const pctMeu = Math.min(100, (meu / total) * 100);

  return (
    <div data-testid="linha-do-ciclo">
      {/* A trilha. As margens laterais dão respiro para as bolinhas das
          pontas; a de cima abre espaço para a etiqueta "você". */}
      <div className="relative mx-1 mb-7 mt-7 h-1.5 rounded-full bg-white/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#f59e0b] to-primary"
          style={{ width: `${pctMeu}%` }}
        />

        {/* As pontas e os marcos do combinado, na posição do capítulo de cada um. */}
        <Bolinha pct={0} acesa rotulo={`início · ${dataCurta(clube.ciclo.inicio)}`} lado="esquerda" />
        {clube.ciclo.marcos.map((marco) => (
          <Bolinha
            key={marco.id}
            pct={(marco.chapter / total) * 100}
            acesa={marco.prazo < hoje}
          />
        ))}
        <Bolinha
          pct={100}
          acesa={clube.ciclo.encontro < hoje}
          rotulo={`encontro · ${dataCurta(clube.ciclo.encontro)}`}
          lado="direita"
        />

        {/* Você, na ponta do preenchido — só quando começou: etiqueta em cima
            de barra zerada apontaria para lugar nenhum. */}
        {meu > 0 && (
          <span
            className="absolute -top-[22px] -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-1.5 py-px text-[8.5px] font-bold text-black"
            style={{ left: `${Math.min(92, Math.max(8, pctMeu))}%` }}
            data-testid="linha-do-ciclo-voce"
          >
            você · cap. {meu}
          </span>
        )}
      </div>

      {faixaDaTurma(clube) && (
        <p className="pb-0.5 text-center text-white/40">
          <FraseDaTurma clube={clube} comVoce />
        </p>
      )}
    </div>
  );
}

/**
 * **A versão compacta, para a aba Conversa** — parte da escolha dele na folha:
 * a linha inteira mora na Agora, e aqui vai *"uma versão de uma linha só, sem
 * a régua inteira"*, situando a turma junto das falas.
 */
export function LinhaCompactaDoCiclo({ clube }: { clube: Clube }) {
  /* `faixaDaTurma` e não o componente: elemento JSX é sempre verdadeiro,
     mesmo quando renderiza nada — testá-lo deixaria a caixinha vazia de pé. */
  if (estaComecando(clube) || !faixaDaTurma(clube)) return null;

  return (
    <p
      className="-mb-2 rounded-lg bg-white/[0.03] px-3 py-2 text-center text-[10.5px] text-white/45"
      data-testid="linha-compacta-do-ciclo"
    >
      <FraseDaTurma clube={clube} />
    </p>
  );
}

function Bolinha({
  pct,
  acesa,
  rotulo,
  lado,
}: {
  pct: number;
  acesa: boolean;
  rotulo?: string;
  lado?: "esquerda" | "direita";
}) {
  return (
    <span
      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pct}%` }}
    >
      <span
        className={`block h-3 w-3 rounded-full border-[3px] border-[#1d1712] ${
          acesa ? "bg-primary" : "bg-white/25"
        }`}
      />
      {rotulo && (
        <span
          className={`absolute top-[14px] whitespace-nowrap text-[8.5px] text-white/40 ${
            lado === "direita" ? "right-0" : "left-0"
          }`}
        >
          {rotulo}
        </span>
      )}
    </span>
  );
}

/**
 * A faixa da turma sem você: onde está o mais atrasado e o mais adiantado, e
 * quantos já passaram de você. Os números saem de `progressoDosMembros`, os
 * mesmos da roda — nada inventado (§4.92). `undefined` quando você está
 * sozinho no clube (não há turma a situar).
 */
function faixaDaTurma(clube: Clube) {
  const meu = meuCapitulo(clube);
  const outros = progressoDosMembros(clube)
    .filter((membro) => membro.slug !== EU)
    .map((membro) => membro.capitulo)
    .filter((capitulo) => capitulo > 0);
  if (outros.length === 0) return undefined;

  return {
    meu,
    menor: Math.min(...outros),
    maior: Math.max(...outros),
    passaram: outros.filter((capitulo) => capitulo > meu).length,
  };
}

/** "A turma está entre o cap. 10 e o 14 · 3 já passaram de você" (a maquete). */
function FraseDaTurma({ clube, comVoce }: { clube: Clube; comVoce?: boolean }) {
  const faixa = faixaDaTurma(clube);
  if (!faixa) return null;
  const { meu, menor, maior, passaram } = faixa;

  return (
    <span className="text-[10.5px] leading-relaxed" data-testid="frase-da-turma">
      A turma está{" "}
      {menor === maior ? (
        <>
          no <b className="text-white/85">cap. {menor}</b>
        </>
      ) : (
        <>
          entre o <b className="text-white/85">cap. {menor} e o {maior}</b>
        </>
      )}
      {comVoce &&
        (meu === 0
          ? " · você ainda não começou"
          : passaram > 0
            ? ` · ${passaram} já ${passaram === 1 ? "passou" : "passaram"} de você`
            : "")}
    </span>
  );
}
