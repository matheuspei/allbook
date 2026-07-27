/**
 * Qual janela do Claude Code abriu esta aba.
 *
 * **O problema que isto resolve.** O Matheus trabalha com duas ou três janelas
 * do Claude Code ao mesmo tempo, e cada uma abre o app no Chrome para conferir o
 * que fez. Todas as abas se chamavam "localhost" e mostravam a mesma tela — não
 * havia como saber qual janela tinha aberto qual aba, nem qual estava mostrando
 * o trabalho de quem. Renomear a aba por fora (injetando JavaScript) funcionava
 * até a primeira recarga, e aí o nome sumia.
 *
 * **Como usar:** a janela abre o app com `?janela=A` (ou B, ou C) uma vez só. A
 * letra fica guardada no `sessionStorage`, que é **por aba** — sobrevive a
 * recarregar e a navegar pelo app, e não contamina as outras abas.
 *
 * A partir daí a aba mostra três marcas: o nome na **guia** do navegador, uma
 * **pastilha** na barra de desenvolvimento e uma **marca d'água** no fundo, ao
 * lado da moldura do telefone. Nenhuma delas encosta no app: vivem todas na
 * área de desenvolvimento em volta.
 *
 * Só existe em desenvolvimento (`import.meta.env.DEV`) — no app publicado nada
 * disto aparece, mesmo que alguém ponha `?janela=` na URL.
 */

import { useEffect, useState } from "react";

const CHAVE = "allbook_dev_janela";

/** Uma cor por janela, para reconhecer de longe sem ler. */
const CORES: Record<string, string> = {
  A: "#22c55e", // verde
  B: "#3b82f6", // azul
  C: "#a855f7", // roxo
};

/** Bolinha da mesma cor, para o nome da guia (que não aceita cor). */
const BOLINHAS: Record<string, string> = { A: "🟢", B: "🔵", C: "🟣" };

/**
 * A letra desta aba, ou `null` se ninguém se identificou.
 *
 * Lê o `?janela=` da URL na primeira vez e guarda; nas vezes seguintes vem do
 * guardado, porque a navegação do app troca a URL e levaria o parâmetro embora.
 */
export function janelaDaAba(): string | null {
  try {
    const daUrl = new URLSearchParams(window.location.search).get("janela");
    const letra = (daUrl || sessionStorage.getItem(CHAVE) || "").trim().toUpperCase();
    if (!letra || !CORES[letra]) return null;
    if (daUrl) sessionStorage.setItem(CHAVE, letra);
    return letra;
  } catch {
    return null;
  }
}

/**
 * Mantém o nome da guia com a letra da janela.
 *
 * O app não mexia em `document.title` em lugar nenhum, então basta escrever uma
 * vez — e de novo a cada troca de tela, porque o wouter não recarrega a página
 * mas alguma coisa futura pode querer mudar o título.
 */
export function useNomeDaGuia(letra: string | null) {
  useEffect(() => {
    if (!letra) return;
    const nome = `${BOLINHAS[letra] ?? ""} JANELA ${letra} — AllBook`;
    document.title = nome;
    const observador = new MutationObserver(() => {
      if (document.title !== nome) document.title = nome;
    });
    const alvo = document.querySelector("title");
    if (alvo) observador.observe(alvo, { childList: true, characterData: true, subtree: true });
    return () => observador.disconnect();
  }, [letra]);
}

/** A pastilha da barra de desenvolvimento, no alto. */
export function SeloDaJanela({ letra }: { letra: string }) {
  const cor = CORES[letra];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        background: `${cor}22`,
        border: `1px solid ${cor}66`,
        color: cor,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        fontFamily: "system-ui, sans-serif",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      title="Janela do Claude Code que abriu esta aba"
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: cor }} />
      JANELA {letra}
    </span>
  );
}

/**
 * A marca d'água no fundo, ao lado da moldura do telefone.
 *
 * Fica **atrás** e fora do celular de propósito: precisa se ver de longe, com o
 * canto do olho, sem cobrir nada do que está sendo revisado. Por isso o texto
 * grande, translúcido e sem eventos de mouse.
 */
export function MarcaDaJanela({ letra }: { letra: string }) {
  const cor = CORES[letra];
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 24,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        zIndex: 0,
      }}
    >
      <span
        style={{
          fontSize: 96,
          lineHeight: 1,
          fontWeight: 800,
          color: cor,
          opacity: 0.14,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {letra}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2,
          color: cor,
          opacity: 0.35,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        JANELA {letra}
      </span>
    </div>
  );
}

/** Junta tudo para quem só quer saber a letra e já ligar o nome da guia. */
export function useJanelaDaAba(): string | null {
  const [letra] = useState<string | null>(() => janelaDaAba());
  useNomeDaGuia(letra);
  return letra;
}
