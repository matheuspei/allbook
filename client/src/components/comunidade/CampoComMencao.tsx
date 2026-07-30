import { useEffect, useMemo, useRef, useState } from "react";

import { MAX_POST, candidatosDeMencao, type CandidatoDeMencao, type Mencao } from "@/lib/posts";

/**
 * O campo de escrever um post — com a **lista que abre ao digitar `@`**.
 *
 * **Está separado do compositor de propósito: dois lugares escrevem post.** A
 * caixa nova (`Compositor`) e o **editar** de um post já publicado. Escrever duas
 * versões do mesmo campo é exatamente o erro que a §4.40 cobrou caro neste
 * projeto — o segundo sempre fica meio passo atrás do primeiro.
 *
 * ⚠️ **Por que existe um estado de cursor aqui.** A menção ativa é o `@` mais
 * próximo **antes do cursor** — não o último `@` do texto. Sem isso, voltar para
 * consertar uma vírgula no começo reabriria a lista de um `@` que já foi
 * resolvido, três frases adiante.
 *
 * **Nada de detecção automática de títulos** (§4.58): o catálogo tem *It: A
 * Coisa*, e "it" apareceria em qualquer frase. É o `@` que manda.
 */
export default function CampoComMencao({
  texto,
  mencoes,
  onMudar,
  placeholder,
  autoFocus,
  linhas = 2,
  className,
}: {
  texto: string;
  mencoes: Mencao[];
  onMudar: (texto: string, mencoes: Mencao[]) => void;
  placeholder: string;
  autoFocus?: boolean;
  linhas?: number;
  className?: string;
}) {
  const [cursor, setCursor] = useState(texto.length);
  const campo = useRef<HTMLTextAreaElement>(null);

  /* Cresce com o texto em vez de rolar por dentro: post é curto (280), e uma
     caixa que rola esconde o começo do que você acabou de escrever. */
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [texto]);

  useEffect(() => {
    if (autoFocus) campo.current?.focus();
  }, [autoFocus]);

  /**
   * A consulta ativa. **O `@` só conta no começo ou depois de um espaço** —
   * senão "fulano@gmail.com" abriria a lista de livros no meio de um e-mail.
   */
  const consulta = useMemo(() => {
    const antes = texto.slice(0, cursor);
    const at = antes.lastIndexOf("@");
    if (at === -1) return null;
    if (at > 0 && !/\s/.test(antes[at - 1])) return null;
    const termo = antes.slice(at + 1);
    if (termo.length === 0 || termo.length > 40 || termo.includes("\n")) return null;
    /*
      **Menção já resolvida não reabre a lista.** Bug pego olhando a tela em
      30/07: ao escolher *Hábitos Atômicos*, o campo passava a conter
      `@Hábitos Atômicos ` — e esse termo casa com o próprio livro, então a lista
      voltava a abrir mostrando o item que a pessoa acabou de escolher, e ficava
      pendurada até ela digitar a palavra seguinte. Se o termo **é** um rótulo já
      registrado, o trabalho está feito.
    */
    if (mencoes.some((mencao) => mencao.rotulo === termo.trimEnd())) return null;
    return { at, termo };
  }, [texto, cursor, mencoes]);

  /* Nada casou? A lista simplesmente não aparece — é o que faz escrever uma
     frase depois de um `@` solto não deixar um painel pendurado na tela. */
  const candidatos = useMemo(
    () => (consulta ? candidatosDeMencao(consulta.termo) : []),
    [consulta],
  );

  function guardarCursor(el: HTMLTextAreaElement) {
    setCursor(el.selectionStart ?? el.value.length);
  }

  /** Troca o `@termo` pelo nome inteiro e registra a menção. */
  function escolher(candidato: CandidatoDeMencao) {
    if (!consulta) return;
    const depois = texto.slice(cursor);
    const novo = `${texto.slice(0, consulta.at)}@${candidato.rotulo} ${depois}`.slice(0, MAX_POST);
    onMudar(novo, [
      ...mencoes.filter((m) => m.rotulo !== candidato.rotulo),
      { rotulo: candidato.rotulo, alvo: candidato.alvo },
    ]);

    /* Devolve o cursor para **depois do nome** — senão ele salta para o fim do
       texto, e continuar uma frase que estava no meio fica impossível. */
    const posicao = consulta.at + candidato.rotulo.length + 2;
    requestAnimationFrame(() => {
      const el = campo.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(posicao, posicao);
      setCursor(posicao);
    });
  }

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={campo}
        value={texto}
        onChange={(evento) => {
          onMudar(evento.target.value.slice(0, MAX_POST), mencoes);
          guardarCursor(evento.target);
        }}
        onKeyUp={(evento) => guardarCursor(evento.currentTarget)}
        onClick={(evento) => guardarCursor(evento.currentTarget)}
        placeholder={placeholder}
        rows={linhas}
        className={`w-full resize-none bg-transparent leading-relaxed text-white placeholder:text-white/30 focus:outline-none ${
          className ?? "max-h-64 text-[14px]"
        }`}
        data-testid="campo-com-mencao"
      />

      {candidatos.length > 0 && (
        /**
         * Fica **ancorada embaixo do campo**, não como folha: escolher uma menção
         * é parte de escrever a frase, e tirar a pessoa da tela no meio de uma
         * frase faz perder o fio.
         */
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#1c1c1c] shadow-2xl"
          data-testid="lista-de-mencoes"
        >
          {candidatos.map((candidato) => (
            <button
              key={`${candidato.alvo.tipo}-${candidato.rotulo}`}
              type="button"
              /* `onMouseDown` em vez de `onClick`: o clique tira o foco do
                 textarea antes de o `onClick` disparar, e aí o cursor guardado
                 já mudou — a menção entraria no lugar errado. */
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(candidato);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/[0.07]"
              data-testid={`mencao-candidata-${candidato.rotulo}`}
            >
              {candidato.capa ? (
                <img
                  src={candidato.capa}
                  alt=""
                  className="h-9 w-6 shrink-0 rounded-[3px] object-cover"
                />
              ) : (
                <span className="grid h-9 w-6 shrink-0 place-items-center rounded-[3px] bg-white/[0.07] text-[10px] font-bold text-white/40">
                  {candidato.rotulo.charAt(0)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold">
                  {candidato.rotulo}
                </span>
                <span className="block truncate text-[10.5px] text-white/35">
                  {candidato.detalhe}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
