import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { fotoDoMembro } from "@/lib/community";
import { cn } from "@/lib/utils";

/**
 * Avatar que abre em tamanho grande quando você toca nele — o mesmo gesto do
 * Instagram: toca na bolinha da foto e ela cresce no meio da tela, sobre um
 * fundo escuro; toca de novo (ou em qualquer lugar) e ela volta.
 *
 * **Envolve o avatar que a tela já desenha**, em vez de substituí-lo: cada
 * tela tem o seu (gradiente da comunidade, iniciais, foto do perfil), e
 * unificar todos num só era mexer em coisa que já está boa. O que este
 * componente precisa saber é apenas como redesenhar aquele mesmo avatar
 * **grande** — daí as props `foto`, `fundoClasse` e `fundoStyle`.
 *
 * **Sem foto, o que amplia é a bolinha colorida com a letra** — é o caso de quem
 * não tem retrato.
 *
 * ⚠️ **Passe `slug` quando o avatar for de um leitor da comunidade.** Em 31/07 o
 * Matheus reclamou: *"você colocou a foto das pessoas, mas quando você clica na
 * foto dentro do perfil, ela não expande"*. E não expandia mesmo: as fotos
 * chegaram como **fundo** do avatar pequeno (`avatarDeLeitor`), enquanto este
 * componente só sabia da prop `foto` — então ampliava a inicial de quem tinha
 * retrato. Agora ele **procura a foto sozinho pelo slug**, que é o conserto de
 * raiz: nenhuma tela precisa lembrar de repassar a imagem duas vezes.
 *
 * **Sobe por portal até a raiz do app (`#root`), e isso não é detalhe.** Duas
 * armadilhas encontradas testando, nesta ordem:
 *
 * 1. Desenhada ali mesmo, dentro do comentário, a camada aparecia *atrás* do
 *    texto. O miolo das telas fica dentro de um elemento com `z-10`, e isso
 *    cria uma "caixa" de empilhamento: o `z-60` daqui só valia lá dentro,
 *    enquanto os menus (`z-50`) estavam no nível de fora e passavam por cima.
 * 2. Mandada para o `<body>`, ela ficou por cima — mas **parou de responder a
 *    clique e a tecla**. O React não escuta evento em cada elemento: escuta num
 *    ponto só, o `#root`. O que nasce fora dali não chega até ele.
 *
 * `#root` resolve as duas: está fora da caixa de empilhamento e dentro do
 * alcance dos eventos.
 *
 * Efeito colateral **só na prévia de desenvolvimento**: como o portal sai da
 * moldura de celular, a foto ampliada cobre a janela inteira do navegador em
 * vez do retângulo do telefone. No app real, onde não há moldura, é
 * exatamente o comportamento certo.
 */
export default function AvatarAmpliavel({
  nome,
  foto,
  slug,
  inicial,
  legenda,
  fundoClasse,
  fundoStyle,
  className,
  children,
}: {
  /** Nome de quem é o avatar. Vai no rótulo de acessibilidade e embaixo da foto. */
  nome: string;
  /** URL (ou data URL) da foto, quando existe. Sem ela, amplia a inicial. */
  foto?: string;
  /** Slug do leitor da comunidade — daqui sai a foto quando `foto` não vier. */
  slug?: string;
  /** Letra do meio da bolinha. Sem isto, usa a primeira letra do nome. */
  inicial?: string;
  /** Linha discreta embaixo do nome, ex.: "Autor", "Narrador", "você". */
  legenda?: string;
  /** Classes do fundo quando não há foto, ex.: "bg-gradient-to-br from-rose-500 to-pink-600". */
  fundoClasse?: string;
  /** Fundo por estilo, para quem monta o degradê em tempo de execução (PersonAvatar). */
  fundoStyle?: CSSProperties;
  /** Classes do botão que envolve o avatar pequeno — repasse o que o layout exigia (`shrink-0` etc.). */
  className?: string;
  /** O avatar pequeno, exatamente como a tela já o desenha. */
  children: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const semAnimacao = useReducedMotion();
  const botaoRef = useRef<HTMLButtonElement>(null);

  /**
   * Fecha e **devolve o foco ao avatar**. Sem isso, quem navega por teclado ou
   * leitor de tela fecha a foto e o foco volta para o começo da página — some
   * do lugar onde a pessoa estava lendo.
   */
  function fechar() {
    setAberto(false);
    botaoRef.current?.focus();
  }

  const letra = inicial ?? nome.charAt(0).toUpperCase();
  /* A foto dada ganha da procurada: quem passa `foto` sabe de qual imagem se
     trata (o seu perfil, o retrato do autor). */
  const retrato = foto ?? (slug ? fotoDoMembro(slug) : undefined);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Ver a foto de ${nome} em tamanho grande`}
        aria-haspopup="dialog"
        className={cn(
          "rounded-full shrink-0 transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
          className,
        )}
        data-testid={`avatar-expand-${nome}`}
      >
        {children}
      </button>

      {createPortal(
        <AnimatePresence>
          {aberto && (
            <motion.div
              key="fundo"
              role="dialog"
              aria-modal="true"
              aria-label={`Foto de ${nome}`}
              // Ao abrir, a camada **toma o foco** (senão ele fica no avatar,
              // atrás dela — quem usa teclado ou leitor de tela se perde) e
              // passa a ouvir o Esc. O ouvinte é registrado aqui, no `ref`, e
              // não num `useEffect` nem no `onKeyDown` do React: as duas
              // primeiras tentativas por esses caminhos não fecharam com Esc no
              // teste. Um ouvinte comum na janela, criado junto com o elemento e
              // desfeito com ele, é o que funciona — e ainda pega o Esc mesmo
              // que o foco tenha escapado para outro canto.
              tabIndex={-1}
              ref={(elemento) => {
                if (!elemento) return;
                elemento.focus();
                const aoTeclar = (evento: KeyboardEvent) => {
                  if (evento.key === "Escape") fechar();
                };
                window.addEventListener("keydown", aoTeclar);
                return () => window.removeEventListener("keydown", aoTeclar);
              }}
              onClick={fechar}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-sm px-6 text-white outline-none"
              data-testid="avatar-overlay"
            >
              {/* O X é redundante — tocar em qualquer lugar fecha —, mas quem não
                  sabe disso precisa ver uma saída óbvia na tela. */}
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar"
                className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                data-testid="avatar-overlay-close"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={semAnimacao ? { opacity: 0 } : { scale: 0.82, opacity: 0 }}
                animate={semAnimacao ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={semAnimacao ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                // Para o clique na foto não fechar por engano: quem quer fechar
                // toca fora, no X, ou dá Esc.
                onClick={(evento) => evento.stopPropagation()}
                className={cn(
                  "relative w-[72vw] max-w-[17rem] aspect-square rounded-full overflow-hidden ring-1 ring-white/15 shadow-2xl shadow-black/60 flex items-center justify-center",
                  !retrato && (fundoClasse ?? "bg-gradient-to-br from-primary to-primary/60"),
                )}
                style={!retrato ? fundoStyle : undefined}
              >
                {retrato ? (
                  <img src={retrato} alt={nome} className="h-full w-full object-cover" />
                ) : (
                  <>
                    {/* Mesmo brilho no alto do PersonAvatar, para a bolinha grande
                        não virar um disco chapado. */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    <span
                      aria-hidden="true"
                      className="relative font-display font-bold tracking-tight text-white text-7xl"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.45)" }}
                    >
                      {letra}
                    </span>
                  </>
                )}
              </motion.div>

              <div className="text-center" onClick={(evento) => evento.stopPropagation()}>
                <p className="font-display font-bold tracking-tight text-lg">{nome}</p>
                {legenda && <p className="text-xs text-white/40 mt-0.5">{legenda}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.getElementById("root") ?? document.body,
      )}
    </>
  );
}
