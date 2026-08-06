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
  focarQuando,
  linhas = 2,
  className,
}: {
  texto: string;
  mencoes: Mencao[];
  onMudar: (texto: string, mencoes: Mencao[]) => void;
  placeholder: string;
  autoFocus?: boolean;
  /**
   * **Foco por pedido de fora**: qualquer mudança neste número traz o cursor para
   * cá, no fim do texto.
   *
   * Existe por um bug pego na tela em 30/07: tocar "Responder" num comentário
   * enchia o campo com `@Fulano` e **deixava o foco no botão** — quem começava a
   * digitar em seguida escrevia no vazio e perdia a frase. `autoFocus` não
   * resolvia, porque ele só vale na montagem, e o campo já estava montado.
   */
  focarQuando?: number;
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

  useEffect(() => {
    /* Zero é o valor inicial e **não** pede foco: abrir a conversa para ler não
       deve subir o teclado do celular. Só os incrementos pedem. */
    if (!focarQuando) return;
    const el = campo.current;
    if (!el) return;
    el.focus();
    /* O cursor vai para o fim: o `@Fulano` acabou de ser posto na frente, e a
       pessoa vai continuar escrevendo depois dele. */
    const fim = el.value.length;
    el.setSelectionRange(fim, fim);
    setCursor(fim);
  }, [focarQuando]);

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

  /**
   * Quebra o texto em pedaços comuns e menções, para o espelho pintar.
   *
   * **Mesma regra do `TextoDoPost`**, que faz isto na hora de mostrar o post
   * publicado: casa o rótulo mais longo primeiro (senão *Helena* quebraria
   * *Helena Vasques* no meio), e o que não casa volta a ser texto comum. As duas
   * peças precisam concordar — o que você vê escrevendo tem de ser o que sai.
   */
  function pedacosGrifados(alvo: string, lista: Mencao[]): (string | Mencao)[] {
    if (lista.length === 0) return [alvo];
    const porTamanho = [...lista].sort((a, b) => b.rotulo.length - a.rotulo.length);
    const pedacos: (string | Mencao)[] = [];
    let sobra = "";
    let i = 0;

    while (i < alvo.length) {
      if (alvo[i] === "@") {
        const achada = porTamanho.find((m) => alvo.startsWith(`@${m.rotulo}`, i));
        if (achada) {
          if (sobra) {
            pedacos.push(sobra);
            sobra = "";
          }
          pedacos.push(achada);
          i += achada.rotulo.length + 1;
          continue;
        }
      }
      sobra += alvo[i];
      i += 1;
    }
    if (sobra) pedacos.push(sobra);
    return pedacos;
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

  /*
    As duas camadas usam **exatamente** a mesma tipografia e o mesmo espaçamento.
    Qualquer diferença desalinha o grifo do texto, e o efeito vira borrão.
  */
  const tipografia = `w-full resize-none whitespace-pre-wrap break-words leading-relaxed ${
    className ?? "max-h-64 text-[14px]"
  }`;

  return (
    <div className="relative min-w-0 flex-1">
      {/*
        **O grifo da menção, atrás do campo** — pedido do Matheus em 30/07:
        *"seria legal que ele ficasse grifado quando você marcasse, como acontece
        hoje nas redes sociais"*. Ele tem razão: hoje você marca e o nome fica
        igual ao resto, então não dá para saber se pegou.

        **Por que uma camada atrás, e não um campo rico.** Um `contenteditable`
        daria texto formatado de verdade, mas traz junto colagem com estilo,
        seleção quebrada, cursor perdido e comportamento diferente em cada
        navegador — muito risco para um grifo. A técnica daqui é a que as caixas de
        busca com destaque usam: **um espelho do texto, com os nomes marcados,
        exatamente atrás de um `textarea` de texto transparente**. O que se digita e
        o que se vê são o mesmo, e o cursor continua sendo o do navegador.

        `aria-hidden`: é pintura. Quem usa leitor de tela lê o `textarea`.
      */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden text-white ${tipografia}`}
      >
        {pedacosGrifados(texto, mencoes).map((pedaco, i) =>
          typeof pedaco === "string" ? (
            <span key={i}>{pedaco}</span>
          ) : (
            <span key={i} className="rounded bg-primary/15 font-semibold text-primary">
              @{pedaco.rotulo}
            </span>
          ),
        )}
      </div>

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
        /*
          **Quem se vê é o espelho; este campo fica invisível, menos o cursor.**
          `-webkit-text-fill-color: transparent` some com as letras sem mexer no
          `caret-color`, que continua branco — é o truque que faz a coisa toda
          funcionar.

          **Só quando há texto:** com o campo vazio, apagar as letras apagaria
          junto o texto de exemplo (o placeholder), e a caixa ficaria muda.
        */
        className={`relative bg-transparent caret-white text-white placeholder:text-white/30 focus:outline-none ${tipografia}`}
        style={{ WebkitTextFillColor: texto.length > 0 ? "transparent" : undefined }}
        data-testid="campo-com-mencao"
      />

      {candidatos.length > 0 && (
        /**
         * Fica **ancorada embaixo do campo**, não como folha: escolher uma menção
         * é parte de escrever a frase, e tirar a pessoa da tela no meio de uma
         * frase faz perder o fio.
         */
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-white/10 bg-card shadow-2xl"
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
