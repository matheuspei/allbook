import { useMemo } from "react";

import { commentsForBook } from "@/lib/comments";
import { myCommentsFor } from "@/lib/myComments";

/**
 * Os pontinhos sobre a barra do player: **onde tem gente falando**.
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
 * pontinhos de 8px não se distingue de verdade — vira cor decorativa, que este
 * app corta. Um anel se lê num relance e não inventa vocabulário de cor.
 *
 * Ficam **acima** da trilha, e não sobre ela, para não roubar o arraste do
 * dedo: no celular a barra inteira é área de toque para buscar no áudio.
 */
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

  if (ancoras.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 -top-1.5 h-2" data-testid="marcas-conversa">
      {ancoras.map(({ sec, turma }) => {
        const liberada = sec <= currentTime + 1;
        const esquerda = ((sec - chapterStart) / chapterDuration) * 100;

        return liberada ? (
          <button
            key={`${sec}-${turma}`}
            type="button"
            onClick={() => onAbrir(sec)}
            style={{ left: `${esquerda}%` }}
            className={`pointer-events-auto absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_6px_rgba(255,106,0,0.7)] transition-transform hover:scale-150 ${
              turma ? "ring-2 ring-white/70" : ""
            }`}
            aria-label={
              turma ? "Abrir a conversa deste ponto (alguém da sua turma)" : "Abrir a conversa deste ponto"
            }
            data-testid={turma ? "marca-turma" : "marca-liberada"}
          />
        ) : (
          <span
            key={`${sec}-${turma}`}
            style={{ left: `${esquerda}%` }}
            className="absolute top-[3px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/25"
            aria-label="Há conversa mais adiante"
            data-testid="marca-adiante"
          />
        );
      })}
    </div>
  );
}
