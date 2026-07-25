import { useEffect, useState } from "react";
import { AudioLines, Check, ChevronDown } from "lucide-react";

import PersonAvatar from "@/components/PersonAvatar";
import { findPerson } from "@/lib/people";
import { findVoice } from "@/lib/studio";
import {
  NARRATIONS_EVENT,
  chooseNarration,
  chosenNarration,
  narrationsOf,
  type LivroComNarrador,
  type Narration,
} from "@/lib/narrations";

/**
 * Trocar quem narra o livro — quando há mais de uma narração da mesma obra.
 *
 * **Ideia do Matheus (26/07, ver ROTEIRO 4.30):** *"não subir os dois livros, a
 * gente meio que colocar um botãozinho onde a pessoa possa trocar quem é a
 * pessoa que está narrando"*. Dois cartões do mesmo título no catálogo dividiriam
 * busca, biblioteca, notas e comentários de uma obra só. Um livro, várias vozes.
 *
 * **Só aparece quando há escolha.** Livro com uma narração não mostra nada — nem
 * o botão desabilitado, nem "1 narração". Botão que não leva a lugar nenhum é
 * exatamente o que o ROTEIRO 4.23 mandou varrer do app.
 *
 * **Fechado por padrão, e discreto.** A voz certa é a que já está tocando para
 * quase todo mundo; quem quer trocar é a exceção. Por isso o seletor é uma linha
 * fina abaixo de "Narrado por", e não um cartão grande competindo com o botão de
 * reproduzir.
 */
export default function SeletorDeNarracao({ book }: { book: LivroComNarrador }) {
  const opcoes = narrationsOf(book);
  const [atual, setAtual] = useState(() => chosenNarration(book));
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    // O evento cobre a mesma aba (trocar aqui e ver o nome mudar acima); o
    // `storage` cobre a outra aba, porque a escolha é compartilhada.
    const sincronizar = () => setAtual(chosenNarration(book));
    sincronizar();
    window.addEventListener(NARRATIONS_EVENT, sincronizar);
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(NARRATIONS_EVENT, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, [book]);

  if (opcoes.length < 2) return null;

  function escolher(narracao: Narration) {
    chooseNarration(book.id, narracao.id);
    setAberto(false);
  }

  return (
    <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/5" data-testid="narration-picker">
      <button
        type="button"
        onClick={() => setAberto((estava) => !estava)}
        aria-expanded={aberto}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
        data-testid="button-toggle-narration"
      >
        <AudioLines className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 text-[12px] leading-snug text-white/55">
          Este livro tem <span className="font-semibold text-white/80">{opcoes.length} narrações</span>
          . Você está com a de {atual.name}.
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/35 transition-transform duration-200 ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && (
        <div className="space-y-1 border-t border-white/5 p-2" role="radiogroup">
          {opcoes.map((narracao) => (
            <OpcaoDeNarracao
              key={narracao.id}
              narracao={narracao}
              selecionada={narracao.id === atual.id}
              aoEscolher={() => escolher(narracao)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OpcaoDeNarracao({
  narracao,
  selecionada,
  aoEscolher,
}: {
  narracao: Narration;
  selecionada: boolean;
  aoEscolher: () => void;
}) {
  // O timbre da voz é o que faz a escolha ser informada, e não uma aposta entre
  // dois nomes desconhecidos. Mesma frase que aparece no perfil da voz.
  const timbre = findVoice(narracao.slug)?.timbre;

  return (
    <button
      type="button"
      onClick={aoEscolher}
      role="radio"
      aria-checked={selecionada}
      className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors ${
        selecionada ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-white/5"
      }`}
      data-testid={`option-narration-${narracao.slug}`}
    >
      <PersonAvatar name={narracao.name} photo={findPerson(narracao.slug)?.photo} size="sm" />

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={`truncate text-[13px] font-semibold ${
              selecionada ? "text-white" : "text-white/80"
            }`}
          >
            {narracao.name}
          </span>
          <span className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-white/45">
            {narracao.origem === "principal" ? "Narração original" : "Produzida a pedido"}
          </span>
        </span>
        {timbre && (
          <span className="mt-0.5 block text-[11px] leading-snug text-white/40">{timbre}</span>
        )}
      </span>

      {selecionada && <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}
