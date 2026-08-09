import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { MarcaDaJanela, SeloDaJanela, useJanelaDaAba } from "@/components/DevJanela";
import { EH_A_MOLDURA } from "@/lib/dev-moldura";

/**
 * A prévia de celular do desenvolvimento — e por que ela virou um `<iframe>`.
 *
 * **O defeito que isto conserta (09/08).** Até aqui a moldura era uma `<div>` de
 * 430px com o app dentro. Uma div não é uma tela: as regras responsivas do
 * Tailwind (`sm:`, `md:`, `lg:`) olham a **largura da janela do navegador**, não
 * a da caixa em volta. Medido no Chrome do Matheus, janela de 1728px: `sm`, `md`
 * e `lg` todas ligadas — o que aparecia dentro do "telefone" era o layout de
 * **desktop** espremido num retângulo estreito. Nunca deu para conferir celular
 * ali, e por cima disso a moldura ainda encolhia tudo (scale 0.957) para caber
 * na altura da janela.
 *
 * Dentro de um iframe a viewport é o próprio iframe. As media queries passam a
 * enxergar 430x932 de verdade, `position: fixed` se ancora na tela do telefone,
 * e `window.scrollY` / `scrollTo` voltam a funcionar como no aparelho real.
 *
 * **Como os dois papéis se separam:** a mesma URL carrega duas vezes. Na página
 * de cima este componente desenha só a moldura e ignora os `children`; dentro do
 * iframe ele sai da frente e entrega o app. Quem decide é o `EH_A_MOLDURA`, que
 * mora em `lib/dev-moldura.ts` porque o `lib/auth.ts` também precisa dele.
 */

interface Aparelho {
  nome: string;
  largura: number;
  altura: number;
}

const APARELHOS: Aparelho[] = [
  { nome: "iPhone 16 Pro Max", largura: 430, altura: 932 },
  { nome: "iPhone 16", largura: 390, altura: 844 },
  { nome: "Samsung Galaxy S25 Ultra", largura: 412, altura: 892 },
  { nome: "Samsung Galaxy S25", largura: 360, altura: 780 },
  { nome: "Google Pixel 9 Pro", largura: 412, altura: 892 },
  { nome: "Google Pixel 9", largura: 393, altura: 852 },
  { nome: "OnePlus 13", largura: 412, altura: 917 },
  { nome: "Xiaomi 15 Pro", largura: 440, altura: 978 },
];

/**
 * A barra e a folga são finas de propósito, e o número saiu de medir a máquina
 * dele: janela de 902px de altura, 32 + 8x2 deixa 854px para o telefone — o
 * bastante para o iPhone 16 (844) aparecer inteiro em tamanho real, o que 36 +
 * 12x2 não dava por 2px. Cada pixel gasto aqui é um aparelho que deixa de caber.
 */
const BARRA_H = 32;
const FOLGA = 8;
const BORDA = 2;
const RAIO = 24;

/** A escolha do aparelho é por aba (as janelas A/B/C não brigam) e sobrevive a recarregar. */
const CHAVE_APARELHO = "allbook_dev_aparelho";
const CHAVE_AJUSTE = "allbook_dev_ajustar";

function lerGuardado(chave: string, padrao: number): number {
  try {
    const bruto = sessionStorage.getItem(chave);
    if (bruto === null) return padrao;
    const n = Number(bruto);
    return Number.isFinite(n) ? n : padrao;
  } catch {
    return padrao;
  }
}

function guardar(chave: string, valor: number | boolean) {
  try {
    sessionStorage.setItem(chave, String(Number(valor)));
  } catch {
    /* aba anônima com armazenamento bloqueado: a escolha só não persiste */
  }
}

export default function DevMobileWrapper({ children }: { children: ReactNode }) {
  // Dentro do iframe — e no app publicado — não existe moldura: o app roda solto.
  if (!EH_A_MOLDURA) return <>{children}</>;
  return <Moldura />;
}

function Moldura() {
  const janela = useJanelaDaAba();
  const [idx, setIdx] = useState(() => {
    const guardado = lerGuardado(CHAVE_APARELHO, 0);
    return guardado >= 0 && guardado < APARELHOS.length ? guardado : 0;
  });
  const [ajustar, setAjustar] = useState(() => lerGuardado(CHAVE_AJUSTE, 0) === 1);
  const [escalaQueCabe, setEscalaQueCabe] = useState(1);
  const [caminho, setCaminho] = useState("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const aparelho = APARELHOS[idx];

  /**
   * O endereço do app é fixado uma vez só. Se ele acompanhasse a navegação, o
   * `src` mudaria a cada tela e o iframe **recarregaria o app inteiro** a cada
   * clique. O `?janela=` fica de fora: a marca da janela é da moldura, e dentro
   * do iframe ela só apareceria duplicada.
   */
  const [enderecoInicial] = useState(() => {
    const busca = new URLSearchParams(window.location.search);
    busca.delete("janela");
    const q = busca.toString();
    return window.location.pathname + (q ? `?${q}` : "") + window.location.hash;
  });

  /**
   * A moldura ocupa exatamente as medidas do aparelho — a borda é `inset`, por
   * dentro —, então a conta não soma nada a elas. Somar os 2px de borda de cada
   * lado derrubava para 99% justamente o aparelho que cabia raspando.
   */
  const recalcular = useCallback(() => {
    const larguraLivre = window.innerWidth - FOLGA * 2;
    const alturaLivre = window.innerHeight - BARRA_H - FOLGA * 2;
    setEscalaQueCabe(Math.min(larguraLivre / aparelho.largura, alturaLivre / aparelho.altura, 1));
  }, [aparelho.largura, aparelho.altura]);

  useEffect(() => {
    recalcular();
    window.addEventListener("resize", recalcular);
    return () => window.removeEventListener("resize", recalcular);
  }, [recalcular]);

  /**
   * Em que tela o app está. A barra do Chrome não conta mais essa história — ela
   * mostra o endereço da moldura, que nunca muda —, e sem isso não dá para saber
   * onde a prévia parou. O wouter navega por `pushState`, que não emite evento
   * para quem está de fora; daí a espiada periódica em vez de um ouvinte.
   */
  useEffect(() => {
    const ler = () => {
      try {
        const dentro = iframeRef.current?.contentWindow;
        if (dentro) setCaminho(dentro.location.pathname + dentro.location.search);
      } catch {
        /* o iframe é da mesma origem; só aconteceria durante a troca de documento */
      }
    };
    ler();
    const id = window.setInterval(ler, 400);
    return () => window.clearInterval(id);
  }, []);

  const escala = ajustar ? escalaQueCabe : 1;
  const naoCabe = escalaQueCabe < 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        background: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: BARRA_H,
          background: "#111",
          borderBottom: "1px solid #2a2a2a",
          display: "flex",
          alignItems: "center",
          paddingInline: 10,
          flexShrink: 0,
        }}
      >
        {/* Só a lista de aparelhos rola. Antes a barra inteira tinha o
            `overflow-x`, e com oito aparelhos o que saía de vista era
            justamente a direita — o aviso de tamanho e o botão de ajuste. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flex: 1,
            minWidth: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {janela && <SeloDaJanela letra={janela} />}
          {janela && <span style={{ width: 8, flexShrink: 0 }} />}
          {APARELHOS.map((d, i) => (
            <button
              key={d.nome}
              onClick={() => {
                setIdx(i);
                guardar(CHAVE_APARELHO, i);
              }}
              style={{
                padding: "3px 9px",
                borderRadius: 6,
                border: "none",
                background: i === idx ? "#333" : "transparent",
                color: i === idx ? "#fff" : "#777",
                fontSize: 12,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "system-ui, sans-serif",
                flexShrink: 0,
              }}
            >
              {d.nome}
            </button>
          ))}
        </div>

        {/* O caminho da tela aberta lá dentro. */}
        <span
          style={{
            color: "#666",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            flexShrink: 0,
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingLeft: 10,
          }}
          title="Tela aberta na prévia"
        >
          {caminho}
        </span>

        {naoCabe && (
          <button
            onClick={() => {
              const novo = !ajustar;
              setAjustar(novo);
              guardar(CHAVE_AJUSTE, novo);
            }}
            style={{
              padding: "3px 9px",
              borderRadius: 6,
              border: `1px solid ${ajustar ? "#3b82f6" : "#3a3a3a"}`,
              background: ajustar ? "#3b82f622" : "transparent",
              color: ajustar ? "#7ab0ff" : "#999",
              fontSize: 11,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "system-ui, sans-serif",
              flexShrink: 0,
              marginLeft: 8,
            }}
            title={
              ajustar
                ? "Voltando ao tamanho real, a parte de baixo do telefone sai da janela"
                : "O aparelho é mais alto que a janela; encolhe a imagem para ele caber inteiro"
            }
          >
            {ajustar ? "Tamanho real" : "Caber na janela"}
          </button>
        )}

        <span
          style={{
            color: escala === 1 ? "#4ade80" : "#e0a03a",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            flexShrink: 0,
            paddingLeft: 8,
          }}
          title={escala === 1 ? "Tamanho real, 1 pixel do telefone = 1 pixel da tela" : "Imagem reduzida para caber"}
        >
          {aparelho.largura}x{aparelho.altura} · {Math.round(escala * 100)}%
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          padding: FOLGA,
          // Em tamanho real um aparelho alto pode passar da janela: aí a área
          // rola, em vez de o telefone encolher sem avisar.
          overflow: ajustar ? "hidden" : "auto",
          position: "relative",
        }}
      >
        {janela && <MarcaDaJanela letra={janela} />}
        {/* `margin: auto` centraliza sem cortar o topo quando o conteúdo é maior
            que a área — o que `alignItems: center` faria, deixando o começo do
            telefone inalcançável pela rolagem. */}
        <div
          style={{
            margin: "auto",
            transform: `scale(${escala})`,
            transformOrigin: "center center",
            position: "relative",
            zIndex: 1,
            width: aparelho.largura,
            height: aparelho.altura,
            // Borda por dentro: uma `border` somaria 4px à caixa e derrubaria da
            // janela justamente o aparelho que cabia por pouco.
            boxShadow: `inset 0 0 0 ${BORDA}px #333`,
            borderRadius: RAIO,
            overflow: "hidden",
            background: "#000",
            flexShrink: 0,
          }}
        >
          <iframe
            ref={iframeRef}
            src={enderecoInicial}
            title={`Prévia — ${aparelho.nome}`}
            style={{
              width: aparelho.largura,
              height: aparelho.altura,
              border: "none",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}
