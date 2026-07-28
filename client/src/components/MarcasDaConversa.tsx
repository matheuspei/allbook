import { useMemo } from "react";
import { MessageSquare } from "lucide-react";

import { commentsForBook } from "@/lib/comments";
import { myCommentsFor } from "@/lib/myComments";

/**
 * O trilho da conversa: **onde tem gente falando** neste capítulo.
 *
 * É a peça mais visível do que a sala do livro tem de diferente (ROTEIRO 4.39).
 * Ouvindo, você vê que alguém parou para dizer algo no minuto 12 — e toca ali
 * para ouvir o trecho e ler o que disseram. Num app de leitura isso não existe:
 * a página não tem um relógio para pendurar a conversa.
 *
 * **Duas marcas, e a diferença é a regra da sala:**
 * - **Laranja, clicável:** você já passou por ali; o comentário está liberado.
 * - **Apagada, sem clique:** está adiante. Mostra que **existe** conversa mais
 *   à frente, nunca o que ela diz — a mesma escolha da ficha do livro, que
 *   conta as mensagens presas sem revelar nenhuma.
 *
 * **A marca da turma é a mesma laranja, com um anel — e não uma cor nova**
 * (ROTEIRO 4.40). A maquete tinha um verde só para o clube; foi descartado por
 * duas razões: a barra já tem dois tipos de marca, e um terceiro **tom** em
 * pontinhos pequenos não se distingue de verdade — vira cor decorativa, que
 * este app corta. Um anel se lê num relance e não inventa vocabulário de cor.
 *
 * ---
 *
 * **Por que isto virou um trilho próprio, fora da barra (28/07, ROTEIRO 4.52).**
 *
 * Antes as marcas ficavam **sobre** a barra de progresso. O comentário deste
 * arquivo garantia que ficavam "acima da trilha, para não roubar o arraste" — e
 * a medição no navegador desmentiu: a marca tinha **5×5 px em y=267** e a alça
 * do slider **17×17 px em y=266**. Estavam na mesma faixa, com a marca dentro
 * da área de arraste. Um dedo cobre ~34px: sete vezes o alvo.
 *
 * O defeito que isso causava é o que o Matheus descreveu: *"é muito fácil, em
 * vez de ela clicar no trecho, ela acabar clicando e voltar o player… e ela não
 * sabe onde ela está"*. Errar a marca não é errar para o vazio — é **mover o
 * áudio**, perdendo o lugar onde se estava.
 *
 * A regra que ficou: **um pixel, um dono.** Nada que se toca pode morar em cima
 * de um controle de arrastar. Agora o trilho é uma faixa só sua, com alvo de
 * 44×28 px, e marcas que ficariam a menos disso uma da outra **viram um alvo
 * só, com o número** — porque duas bolinhas grudadas o dedo não separa mesmo.
 */

/**
 * Distância mínima entre dois alvos, em % da largura da faixa.
 *
 * 12% de uma faixa de ~312px dá ~37px, o que garante que dois alvos vizinhos
 * não se sobreponham (cada um tem 44px de área, centrada). Mais perto que isso,
 * eles viram um grupo.
 */
const DISTANCIA_MINIMA_PCT = 12;

interface Grupo {
  /** Onde o alvo fica na faixa, em % — a média do grupo. */
  posicaoPct: number;
  /** O segundo que o toque abre: sempre o primeiro do grupo. */
  sec: number;
  quantas: number;
  turma: boolean;
}

/** Junta marcas coladas num alvo só. Recebe já ordenado por segundo. */
function agrupar(itens: { sec: number; turma: boolean; pct: number }[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const item of itens) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && item.pct - ultimo.posicaoPct < DISTANCIA_MINIMA_PCT) {
      /* A posição do grupo continua sendo a da primeira marca: assim o alvo não
         "anda" enquanto novas falas entram, e o toque cai onde a conversa
         começa. */
      ultimo.quantas += 1;
      ultimo.turma = ultimo.turma || item.turma;
      continue;
    }
    grupos.push({ posicaoPct: item.pct, sec: item.sec, quantas: 1, turma: item.turma });
  }
  return grupos;
}

export default function MarcasDaConversa({
  bookId,
  chapterStart,
  chapterDuration,
  currentTime,
  onAbrir,
  slugsDaTurma,
}: {
  bookId: number;
  /** Segundo do livro em que o capítulo mostrado começa. */
  chapterStart: number;
  chapterDuration: number;
  currentTime: number;
  /** Tocar numa marca liberada: leva o áudio até lá e abre a conversa. */
  onAbrir: (posicaoSec: number) => void;
  /**
   * Quem é do seu clube neste livro. Vazio (ou ausente) = você não está em
   * clube nenhum aqui, e nenhuma marca ganha anel.
   */
  slugsDaTurma?: string[];
}) {
  /*
   * Só as âncoras **deste capítulo** — a barra é do capítulo, não do livro
   * inteiro (ver o comentário sobre a barra em `AudioPlayer`). Recalcular
   * depende só do capítulo, então trocar de capítulo refaz a lista e ouvir não.
   */
  const daTurma = slugsDaTurma?.join(",") ?? "";
  const ancoras = useMemo(() => {
    const fim = chapterStart + chapterDuration;
    const turma = new Set(daTurma ? daTurma.split(",") : []);

    const dosOutros = commentsForBook(bookId)
      .filter((item) => item.positionSec !== undefined)
      .map((item) => ({ sec: item.positionSec as number, turma: turma.has(item.authorSlug) }));
    /* As suas contam como da turma: você é membro dela. */
    const meus = myCommentsFor({ bookId })
      .filter((item) => item.positionSec !== undefined)
      .map((item) => ({ sec: item.positionSec as number, turma: turma.size > 0 }));

    return [...dosOutros, ...meus]
      .filter((item) => item.sec >= chapterStart && item.sec <= fim)
      .sort((a, b) => a.sec - b.sec);
  }, [bookId, chapterStart, chapterDuration, daTurma]);

  /*
   * Liberadas e adiante são agrupadas **em separado**: um alvo misto teria de
   * decidir se abre ou não, e o que ele mostra ("3") mentiria sobre quanta
   * conversa você pode ler agora.
   */
  const { liberados, adiante } = useMemo(() => {
    const emPct = (sec: number) => ((sec - chapterStart) / chapterDuration) * 100;
    const liberadas = ancoras
      .filter((item) => item.sec <= currentTime + 1)
      .map((item) => ({ ...item, pct: emPct(item.sec) }));
    const naFrente = ancoras
      .filter((item) => item.sec > currentTime + 1)
      .map((item) => ({ ...item, pct: emPct(item.sec) }));
    return { liberados: agrupar(liberadas), adiante: agrupar(naFrente) };
  }, [ancoras, chapterStart, chapterDuration, currentTime]);

  if (ancoras.length === 0) return null;

  return (
    /* `mt-4` não é respiro estético: a alça do slider tem 20px e transborda 8px
       para baixo do trilho dele, encostando na área de toque daqui. Medido: com
       o `space-y-2` do player (8px) a folga real era **zero**, e o defeito da
       §4.52 voltaria pela borda de cima. 16px menos os 8 do transbordo deixam
       8px livres entre um alvo e o outro. */
    <div className="relative mt-4 h-7" data-testid="marcas-conversa">
      {/* A linha fininha liga os alvos e diz que a faixa é uma régua de tempo,
          e não uma fileira de botões soltos. */}
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/[0.07]" aria-hidden />

      {adiante.map((grupo) => (
        <span
          key={`adiante-${grupo.sec}`}
          style={{ left: `${grupo.posicaoPct}%` }}
          className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
          aria-label="Há conversa mais adiante"
          data-testid="marca-adiante"
        />
      ))}

      {liberados.map((grupo) => (
        <button
          key={`liberada-${grupo.sec}`}
          type="button"
          onClick={() => onAbrir(grupo.sec)}
          style={{ left: `${grupo.posicaoPct}%` }}
          /* 44×28: o alvo é a caixa inteira, invisível; o pontinho é só o
             desenho. Nada mais disputa esta faixa, então área generosa aqui não
             atrapalha ninguém. */
          className="group absolute top-1/2 flex h-7 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          aria-label={
            grupo.quantas > 1
              ? `Abrir ${grupo.quantas} falas deste ponto`
              : grupo.turma
                ? "Abrir a conversa deste ponto (alguém da sua turma)"
                : "Abrir a conversa deste ponto"
          }
          data-testid={grupo.turma ? "marca-turma" : "marca-liberada"}
        >
          {grupo.quantas > 1 ? (
            <span
              className={`flex h-4 items-center gap-0.5 rounded-full bg-primary px-1.5 text-[9px] font-bold leading-none text-black shadow-[0_0_8px_rgba(255,106,0,0.55)] transition-transform group-hover:scale-110 ${
                grupo.turma ? "ring-2 ring-white/70" : ""
              }`}
            >
              <MessageSquare className="h-2 w-2" strokeWidth={3} />
              {grupo.quantas}
            </span>
          ) : (
            <span
              className={`h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,106,0,0.7)] transition-transform group-hover:scale-125 ${
                grupo.turma ? "ring-2 ring-white/70" : ""
              }`}
            />
          )}
        </button>
      ))}
    </div>
  );
}
