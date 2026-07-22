import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { openSearch } from "@/lib/search";

export default function TopNav() {
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);

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

  /**
   * A lupa é global, mas a busca mora na Início. Fora dela, volto para a Início
   * antes de abrir; o pedido fica guardado em `search.ts` e é consumido quando a
   * Início monta (ver o comentário lá).
   */
  const handleSearch = () => {
    if (!isHome) navigate("/");
    openSearch();
  };

  return (
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
        <Link href="/" data-testid="link-home-logo">
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-primary">All</span>
            <span className="text-foreground">Book</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSearch}
            data-testid="button-search"
            aria-label="Buscar"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <Link
            href="/notifications"
            data-testid="button-notifications"
            aria-label="Notificações"
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </Link>
          <Link
            href="/profile"
            data-testid="button-profile"
            aria-label="Perfil"
            className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
