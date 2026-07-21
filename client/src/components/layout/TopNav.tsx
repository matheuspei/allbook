import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopNav() {
  const [location] = useLocation();
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

  const navLinks = [
    { name: "Início", path: "/" },
    { name: "Biblioteca", path: "/library" },
    { name: "Categorias", path: "/discover" },
    { name: "Estatísticas", path: "/statistics" },
  ];

  /**
   * O fundo transparente existe para o menu flutuar sobre a imagem grande da
   * Início. Nas outras telas não há imagem embaixo — ali ele só deixava o
   * conteúdo aparecer atravessando o menu ao rolar. Por isso: opaco sempre,
   * menos no topo da Início.
   */
  const isHome = location === "/";
  const opaque = scrolled || !isHome;

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

        <nav
          data-testid="nav-links"
          className="hidden sm:flex items-center gap-1 overflow-x-auto scrollbar-hide"
        >
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location === "/"
                : location.startsWith(link.path);
            return (
              <Link
                key={link.path}
                href={link.path}
                data-testid={`link-nav-${link.name.toLowerCase()}`}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "text-primary-foreground bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            data-testid="button-notifications"
            className="relative p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          <button
            data-testid="button-profile"
            className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="sm:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide"
        data-testid="nav-links-mobile"
      >
        {navLinks.map((link) => {
          const isActive =
            link.path === "/"
              ? location === "/"
              : location.startsWith(link.path);
          return (
            <Link
              key={link.path}
              href={link.path}
              data-testid={`link-nav-mobile-${link.name.toLowerCase()}`}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "text-primary-foreground bg-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
