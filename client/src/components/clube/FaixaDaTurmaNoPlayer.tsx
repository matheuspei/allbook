import { ChevronRight, Users } from "lucide-react";
import { avatarDeLeitor } from "@/lib/community";
import { Link } from "wouter";

import {
  capituloCombinado,
  capituloDaRoda,
  corDoMembro,
  meuCapitulo,
  nomeDoMembro,
  type Clube,
} from "@/lib/clubes";

/**
 * O clube dentro do player — uma linha, enquanto o livro toca.
 *
 * **Por que ela existe** (ROTEIRO 4.40): o clube estava ausente do `AudioPlayer`
 * e do `MiniPlayer`. A pessoa passava as dez horas de audiolivro sem o clube
 * existir ali, e ia procurá-lo em outra tela — daí a sensação de invisível. O
 * clube não é um lugar aonde se vai: é uma companhia enquanto se ouve.
 *
 * **Ela mostra ritmo, não contagem de falas — e isso é de propósito.** A barra de
 * ações já tem o botão "Conversa" com o contador do trecho; repetir o número aqui
 * seria a redundância que este app corta. O que só esta linha pode dizer é a
 * coisa útil de se saber ouvindo: *estou no ritmo da turma?*
 *
 * **O aviso de passar do combinado é o mais importante dos dois.** Quem passou do
 * capítulo combinado é justamente quem pode estragar a escuta dos outros ao
 * comentar — e é o único momento em que vale interromper a audição com um
 * lembrete. Quem está em dia lê a linha calma e segue.
 */
export default function FaixaDaTurmaNoPlayer({ clube }: { clube: Clube }) {
  const meu = meuCapitulo(clube);
  const combinado = capituloCombinado(clube);
  const roda = capituloDaRoda(clube);
  const passou = meu > combinado;

  /* Quatro avatares no máximo: a partir daí viram borrão e comem a linha. */
  const mostrados = clube.membros.slice(0, 4);

  return (
    <Link
      href={`/clube/${clube.id}`}
      className={`flex w-full shrink-0 items-center gap-2.5 rounded-full py-1.5 pl-2 pr-3 text-left transition-colors ${
        passou
          ? "bg-primary/12 hover:bg-primary/20"
          : "bg-white/[0.06] hover:bg-white/10"
      }`}
      data-testid="faixa-turma-player"
    >
      <span className="flex shrink-0">
        {mostrados.map((slug, i) => (
          <span
            key={slug}
            className={`grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br text-[8.5px] font-bold text-black ring-2 ring-background ${corDoMembro(slug)}`} {...avatarDeLeitor(slug)}
            style={{ marginLeft: i === 0 ? 0 : -7 }}
            aria-hidden
          >
            {nomeDoMembro(slug).charAt(0)}
          </span>
        ))}
      </span>

      <span className="min-w-0 flex-1 truncate text-[11.5px] leading-tight">
        <span className="font-semibold">{clube.nome}</span>
        <span className="text-white/45">
          {" · "}
          {passou ? (
            <span className="text-primary">
              você passou do combinado (cap. {combinado})
            </span>
          ) : meu === 0 ? (
            <>a roda está no cap. {roda}</>
          ) : (
            <>
              você no cap. {meu} · a roda no {roda}
            </>
          )}
        </span>
      </span>

      {passou ? (
        <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/25" />
      )}
    </Link>
  );
}
