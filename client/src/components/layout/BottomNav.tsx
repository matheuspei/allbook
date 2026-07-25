import { Link, useLocation } from "wouter";
import { Home, Bookmark, Search, User, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O menu de baixo — quatro abas de navegação e **um botão de ação no meio**.
 *
 * **Por que "Pedir" mora aqui (26/07, ver ROTEIRO 4.18).** Pedir um livro que
 * ainda não existe em áudio é o diferencial do AllBook, e a porta vivia
 * escondida: primeiro só na busca sem resultado, depois numa faixa logo abaixo
 * do billboard da Início. A faixa resolvia a visibilidade e criava outro
 * problema — ela cortava o degradê do destaque e a cor brigava com a capa da
 * vez. Aqui a porta fica visível em **toda tela do app**, sem encostar em
 * imagem nenhuma.
 *
 * **Ele é botão, não aba, e o desenho diz isso.** As quatro abas são lugares
 * onde você fica; "Pedir" é uma coisa que você faz. Por isso pastilha laranja
 * sólida, sempre acesa, sem o realce de "aba atual" — o mesmo gesto do botão
 * central de criar do Instagram e do TikTok. Fica no meio porque é o ponto que
 * o polegar alcança mais fácil no celular.
 */
export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { name: "Início", path: "/", icon: Home },
    { name: "Biblioteca", path: "/library", icon: Bookmark },
    { name: "Pedir", path: "/request", icon: Mic, acao: true },
    { name: "Buscar", path: "/search", icon: Search },
    { name: "Perfil", path: "/profile", icon: User },
  ];

  return (
    <div
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85))' }}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          const ehAcao = "acao" in item && item.acao;

          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.path.replace("/", "") || "home"}`}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                ehAcao
                  ? "text-white"
                  : isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white/70"
              )}
            >
              {/*
                Altura fixa nos dois casos para os rótulos ficarem na mesma
                linha — a pastilha do "Pedir" é mais alta que um ícone solto e,
                sem isto, empurrava o texto dela alguns pixels para baixo.
              */}
              <div className="relative flex h-8 items-center justify-center">
                {ehAcao ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary shadow-[0_2px_12px_hsl(var(--primary)/0.45)] transition-transform duration-200 active:scale-95">
                    <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
                  </span>
                ) : (
                  <>
                    {isActive && (
                      <div className="absolute -inset-1.5 rounded-full bg-primary/20 blur-sm" />
                    )}
                    <Icon
                      className={cn(
                        "w-5 h-5 relative z-10 transition-all duration-200",
                        isActive && "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                      )}
                      strokeWidth={isActive ? 2.5 : 1.8}
                    />
                  </>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  ehAcao
                    ? "font-semibold text-white/90"
                    : isActive
                      ? "font-semibold text-primary"
                      : "font-medium"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
