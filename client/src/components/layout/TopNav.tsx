import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import BuscaSobreposta from "@/components/BuscaSobreposta";
import PainelDaComunidade, { BotaoDoPainel } from "@/components/comunidade/PainelDaComunidade";
import { NOTIFICATIONS_EVENT, unreadNotificationCount } from "@/lib/notifications";
import { avisosDeCurtida } from "@/lib/avisosDeCurtida";
import { SEGUIDORES_EVENT, pedidosPendentes } from "@/lib/seguidores";
import { CONVITES_EVENT, convitesParaMim } from "@/lib/convites";
import { readSettings } from "@/lib/settings";
import { initialOf, readProfile } from "@/lib/profile";

export default function TopNav() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [buscando, setBuscando] = useState(false);
  // O painel da Comunidade (§4.100): o quadradinho ao lado da logo o abre, e
  // ele desliza da esquerda. Estado aqui em cima porque a gaveta precisa ser
  // desenhada FORA do <header> — dentro dele, o z-50 cria um contexto de
  // empilhamento e ela não cobriria o menu de baixo (mesma armadilha da busca).
  const [painelAberto, setPainelAberto] = useState(false);
  // Quantos avisos ainda não lidos: respostas "responderam você" + avisos de
  // sistema + **pedidos para te seguir** (ROTEIRO 4.55) + **convites de clube**
  // (§4.58, item 5) + **curtidas agrupadas** (§4.92). É o que acende e conta a
  // marca do sino. Zero = sino limpo.
  //
  // O pedido é somado **aqui**, e não dentro de `unreadNotificationCount()`,
  // para não criar import circular: `seguidores.ts` e `notifications.ts` ficam
  // sem saber uma da outra, e quem junta é a tela.
  const [unread, setUnread] = useState(0);
  // A sua cara no topo — desde que o Perfil saiu do menu de baixo (28/07,
  // ROTEIRO 4.41), o avatar é a porta da sua página. Relido a cada troca de
  // rota: quem salva uma foto nova em /profile/edit a vê aqui na volta.
  const [perfil, setPerfil] = useState(readProfile);

  useEffect(() => {
    setPerfil(readProfile());
    // Trocou de rota com a gaveta aberta (menu de baixo, por exemplo)? Fecha.
    setPainelAberto(false);
  }, [location]);

  useEffect(() => {
    const refresh = () =>
      setUnread(
        unreadNotificationCount() +
          pedidosPendentes(readSettings().contaPrivada).length +
          convitesParaMim().length +
          // Curtidas agrupadas (§4.92): **um por post**, não um por curtida —
          // senão a marca do sino contaria dez onde a tela mostra um aviso.
          avisosDeCurtida().filter((aviso) => !aviso.lido).length,
      );
    refresh();
    // O evento cobre a mesma aba (você respondeu → chegou aviso; abriu a tela e
    // leu → some). O `storage` cobre a outra aba: o localStorage é compartilhado,
    // então ler numa aba apaga a marca na outra.
    window.addEventListener(NOTIFICATIONS_EVENT, refresh);
    window.addEventListener(SEGUIDORES_EVENT, refresh);
    window.addEventListener(CONVITES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, refresh);
      window.removeEventListener(SEGUIDORES_EVENT, refresh);
      window.removeEventListener(CONVITES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    /**
     * O ouvinte fica no `document` em fase de captura porque o evento `scroll`
     * não borbulha. Assim vale tanto quando quem rola é a janela (o app de
     * verdade) quanto quando é um contêiner interno — o caso do
     * `DevMobileWrapper`, cuja moldura de celular tem o próprio `overflow`.
     * Escutando só a janela, na prévia o menu nunca ficava opaco.
     */
    const handleScroll = (event: Event) => {
      const target = event.target;
      const top =
        target instanceof HTMLElement && target !== document.documentElement
          ? target.scrollTop
          : window.scrollY;
      setScrolled(top > 20);
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  /**
   * O fundo transparente existe para o menu flutuar sobre a imagem grande da
   * Início. Nas outras telas não há imagem embaixo — ali ele só deixava o
   * conteúdo aparecer atravessando o menu ao rolar. Por isso: opaco sempre,
   * menos no topo da Início.
   */
  const isHome = location === "/";
  const opaque = scrolled || !isHome;

  return (
    <>
    <header
      data-testid="top-nav"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        opaque
          ? "bg-background/95 backdrop-blur-md shadow-lg"
          : "bg-gradient-to-b from-black/80 to-transparent"
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center">
          {/* O botão do painel da Comunidade (§4.100) — só nela, no canto, ao
              lado da logo: pedido do Matheus, com o menu do Facebook como
              referência ("do lado do nome… mas mais no canto ainda"). */}
          {location === "/community" && (
            <BotaoDoPainel onClick={() => setPainelAberto(true)} />
          )}
          <Link href="/" data-testid="link-home-logo">
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">All</span>
              <span className="text-foreground">Book</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/*
            A lupa aqui é a ideia do Matheus (26/07): a busca começa **de onde a
            pessoa já está**, sem trocar de aba — ela abre por cima e devolve
            você ao mesmo ponto. Foi o que permitiu a aba virar "Catálogo" e
            perder o teclado automático.

            **Menos na própria aba Catálogo**, onde o campo de busca é a
            primeira coisa da tela: dois caminhos para a mesma coisa, um do lado
            do outro, é a redundância que o app vem cortando.
          */}
          {location !== "/search" && (
            <button
              onClick={() => setBuscando(true)}
              data-testid="button-search"
              aria-label="Buscar"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <Link
            href="/notifications"
            data-testid="button-notifications"
            aria-label="Notificações"
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white leading-none"
                data-testid="notifications-badge"
                aria-label={`${unread} não lidas`}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/profile"
            data-testid="button-profile"
            aria-label="Sua página"
            className="w-8 h-8 rounded-full overflow-hidden border border-primary/40 flex items-center justify-center bg-[#1e1e1e] hover:border-primary transition-colors"
          >
            {perfil.photo ? (
              <img src={perfil.photo} alt={perfil.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold font-display text-primary">
                {initialOf(perfil.name)}
              </span>
            )}
          </Link>
        </div>
      </div>

    </header>

    {/*
      A busca fica **fora** do `<header>` de propósito. Dentro dele, o `z-50`
      do cabeçalho cria um contexto de empilhamento próprio, e o painel — mesmo
      com z maior — não conseguia passar por cima do menu de baixo, que
      continuava aparecendo e navegável por trás da busca. Aqui fora, ele cobre
      a tela inteira, como um modo, e o "Cancelar" devolve você ao lugar exato.
    */}
    {buscando && <BuscaSobreposta onFechar={() => setBuscando(false)} />}

    {/* A gaveta da Comunidade, fora do <header> pelo mesmo motivo da busca. */}
    {painelAberto && <PainelDaComunidade onFechar={() => setPainelAberto(false)} />}
    </>
  );
}
