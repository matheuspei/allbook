import { Link, useLocation } from "wouter";
import { Home, Bookmark, LayoutGrid, Users, Mic } from "lucide-react";
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
 *
 * **"Buscar" virou "Catálogo" (26/07, ideia do Matheus).** Três razões, e a
 * primeira é a mesma frase do parágrafo acima: **aba nomeia lugar, não ação** —
 * Início, Biblioteca e Perfil são lugares, e "Buscar" era o único verbo entre
 * eles. Segunda: desde a fusão com a Descobrir (4.32), a tela é campo de busca
 * **mais** porta do pedido, cartões de gênero e "Em alta" — "Buscar" nomeava um
 * quarto dela. Terceira: o app **já a chamava de catálogo** noutro lugar — o
 * item do menu do player que leva até ela é "Explorar o catálogo". O ícone
 * acompanhou: a lupa saiu (foi para o topo da Início, onde a busca começa) e
 * entrou a grade, que é o desenho de um catálogo.
 *
 * **"Perfil" saiu e "Comunidade" entrou (28/07, ROTEIRO 4.41).** A Comunidade
 * era alcançada só por dentro do Perfil — e é a fundação do clube: sem um lugar
 * onde se encontra gente, não há a quem convidar. O Perfil não sumiu: virou o
 * **avatar no topo** (`TopNav`), que é onde ele mora em todo app cujo perfil é
 * uma página pública. O Início continua limpo de social, como decidido em 21/07.
 *
 * **"Comunidade" virou "Feed" (05/08, §4.103).** Ele achou o defeito: o app
 * usava **a mesma palavra para duas telas diferentes** — esta aba (o feed de
 * posts) e as comunidades do Menu (os fóruns de `/forum`). *"Ele dá a entender
 * que é a mesma coisa, mas são coisas completamente diferentes."* Quem cedeu
 * foi a aba, por dois motivos: "comunidade" é **preciso** para um fórum
 * temático e **vago** para um feed; e a palavra está encravada em ~40 textos da
 * tela de fóruns, contra uma linha aqui.
 *
 * **O desenho mudou em 06/08 (§4.112), escolha dele na folha do redesenho.** A
 * aba em que você está passa a ter o **ícone preenchido** e o rótulo em negrito,
 * e nada mais: saíram o borrão colorido atrás do ícone e a sombra laranja sob a
 * pastilha do Pedir — o sotaque visual de 2019 que a folha apontou. É como o
 * iPhone e o Instagram marcam a aba atual, envelhece bem em qualquer paleta, e
 * deixa **uma só cor forte na barra**: a do Pedir, que é o que deve ser visto.
 *
 * **"Feed" foi escolha dele, na terceira tentativa** — as duas primeiras (minhas)
 * ele derrubou: achou "Feed" seco de início (*"talvez se fosse um feed de
 * notícia…"*) e depois recusou "Novidades" (*"não acho que isso remeta
 * exatamente o que isso é"*). Escolheu "Feed" sabendo do custo declarado: é o
 * **único anglicismo** do menu de baixo. Vale a exceção porque a palavra já é
 * corrente em português (Instagram, Facebook, LinkedIn) e não promete nada além
 * do que a tela entrega. A rota segue `/community`: mexer nela quebraria links
 * salvos.
 */
export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { name: "Início", path: "/", icon: Home },
    { name: "Biblioteca", path: "/library", icon: Bookmark },
    { name: "Pedir", path: "/request", icon: Mic, acao: true },
    { name: "Catálogo", path: "/search", icon: LayoutGrid },
    { name: "Feed", path: "/community", icon: Users },
  ];

  return (
    <div
      data-testid="bottom-nav"
      /* O degradê preto saiu com a troca de identidade (§4.112): era escrito à
         mão em `rgba(0,0,0,…)` e, no tema claro, seria uma faixa preta no pé de
         uma tela de papel. `bg-card` é um tom acima do fundo nos DOIS temas, que
         é o bastante para separar a barra do conteúdo. */
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-card"
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
                  /* A pastilha do Pedir perdeu o círculo e a sombra colorida
                     (§4.112): canto de 8px, como as capas e os cartões do resto
                     do app, e nenhum brilho. */
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary transition-transform duration-200 active:scale-95">
                    <Icon className="w-[18px] h-[18px] text-primary-foreground" strokeWidth={2.2} />
                  </span>
                ) : (
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      isActive && "fill-current",
                    )}
                    strokeWidth={isActive ? 2 : 1.8}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  ehAcao
                    ? "font-semibold text-white/90"
                    : isActive
                      ? "font-bold"
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
