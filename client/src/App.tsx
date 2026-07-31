import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import AvisoDeConquista from "@/components/AvisoDeConquista";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Search from "@/pages/Search";
import Library from "@/pages/Library";
import Statistics from "@/pages/Statistics";
import Profile from "@/pages/Profile";
import ProfileEdit from "@/pages/ProfileEdit";
import RecommendationsEdit from "@/pages/RecommendationsEdit";
// Renomeado no import: `Switch` do wouter já ocupa o espaço dos nomes genéricos,
// e `Settings` seria confundido com o ícone de mesmo nome do lucide.
import SettingsPage from "@/pages/Settings";
import Community from "@/pages/Community";
import Perguntas from "@/pages/Perguntas";
import PostUnico from "@/pages/PostUnico";
import Grupo from "@/pages/Grupo";
import GerenciarForum from "@/pages/GerenciarForum";
import Comunidades from "@/pages/Comunidades";
import MembrosDoForum from "@/pages/MembrosDoForum";
import EnquetesDaComunidade from "@/pages/EnquetesDaComunidade";
import EventosDaComunidade from "@/pages/EventosDaComunidade";
import Topico from "@/pages/Topico";
import Clubes from "@/pages/Clubes";
import Clube from "@/pages/Clube";
import NovoClube from "@/pages/NovoClube";
import GerenciarClube from "@/pages/GerenciarClube";
import UserProfile from "@/pages/UserProfile";
import You from "@/pages/You";
import Achievements from "@/pages/Achievements";
import Bookmarks from "@/pages/Bookmarks";
import Trechos from "@/pages/Trechos";
import Seguidores from "@/pages/Seguidores";
import Acompanhando from "@/pages/Acompanhando";
import Privacidade from "@/pages/Privacidade";
import Downloads from "@/pages/Downloads";
import Notifications from "@/pages/Notifications";
import BookDetails from "@/pages/BookDetails";
import Conversa from "@/pages/Conversa";
import Recomendacoes from "@/pages/Recomendacoes";
import Comentarios from "@/pages/Comentarios";
import ClubesDaPessoa from "@/pages/ClubesDaPessoa";
import PersonProfile from "@/pages/PersonProfile";
import PublisherProfile from "@/pages/PublisherProfile";
import Studio from "@/pages/Studio";
import RequestBook from "@/pages/RequestBook";
import Help from "@/pages/Help";
import CategoryBooks from "@/pages/CategoryBooks";
import Collection from "@/pages/Collection";
import AudioPlayer from "@/pages/AudioPlayer";
import SalaAoVivo from "@/pages/SalaAoVivo";
import BarraDaSala from "@/components/sala/BarraDaSala";
import { minhaSalaAberta, SALA_AO_VIVO_EVENT } from "@/lib/salaAoVivo";
import { guardarTelaNavegavel } from "@/lib/navegacao";
import BottomNav from "@/components/layout/BottomNav";
import TopNav from "@/components/layout/TopNav";
import MiniPlayer from "@/components/layout/MiniPlayer";
import React from "react";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("React ErrorBoundary caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: "#fff", background: "#141414", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 style={{ marginBottom: 16 }}>Algo deu errado</h2>
          <p style={{ marginBottom: 24, opacity: 0.7 }}>{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ padding: "12px 24px", background: "#f59e0b", color: "#000", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer" }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  const [location] = useLocation();
  const isPlayerPage = location.startsWith('/player');
  /** Login é tela cheia como o player: sem menus, sem MiniPlayer. */
  const isLoginPage = location === '/login';
  /**
   * A sala de escuta ao vivo é tela cheia pelo mesmo motivo do player: quem está
   * numa sala está ouvindo com gente, e menu de app no meio disso é ruído
   * (ROTEIRO §4.81).
   */
  const isSalaPage = location.startsWith('/sala/');

  /**
   * Você está dentro de alguma sala? É isto que troca a barrinha do rodapé pela
   * da sala. Reavaliado a cada troca de rota e a cada aviso de sala — sem o
   * ouvinte, entrar numa sala e voltar para o app não mudava nada no rodapé.
   */
  const [naSala, setNaSala] = useState(() => Boolean(minhaSalaAberta()));
  useEffect(() => {
    const atualizar = () => setNaSala(Boolean(minhaSalaAberta()));
    atualizar();
    window.addEventListener(SALA_AO_VIVO_EVENT, atualizar);
    return () => window.removeEventListener(SALA_AO_VIVO_EVENT, atualizar);
  }, [location]);

  /*
   * Anota a última tela **com menu** por onde a pessoa passou. É daqui que as
   * telas cheias sabem para onde devolver — sem isto, sala e player ficavam se
   * empurrando um para o outro e nunca chegavam ao app (ver `lib/navegacao.ts`).
   */
  useEffect(() => {
    guardarTelaNavegavel(location);
  }, [location]);
  /*
   * **As comunidades voltaram a ter o cabeçalho e o menu do app** (31/07, fim do
   * dia). Elas ficaram brancas e azuis por algumas horas, quando a aba copiava o
   * Orkut inteiro (§4.74); o Matheus então pediu *"deixar essa página com a cara
   * do AllBook"* mantendo as funções. Sem a pele de fora, não há mais motivo para
   * esconder a navegação da casa.
   */
  const isBare = isPlayerPage || isLoginPage || isSalaPage;

  const isHomePage = location === '/';

  return (
    <div className={`min-h-screen bg-[#141414] ${isBare ? "" : "pb-20"}`}>
      {!isBare && <TopNav />}
      <div className={!isBare && !isHomePage ? "pt-14" : ""}>
        {/* Transição suave entre telas: a tela nova entra com um fade-in curto.
            Feito com classe CSS (`animate-in fade-in`, do tw-animate-css) e NÃO
            com framer/AnimatePresence de propósito — keyframe CSS não sofre o
            "throttle" de requestAnimationFrame quando a janela perde o foco, então
            a tela nunca fica presa num estado semitransparente; no pior caso ela
            só aparece direto, sem o fade. `key={location}` re-dispara o fade a
            cada troca de rota; `location` explícito no Switch casa a rota certa. */}
        <div key={location} className="animate-in fade-in duration-200">
          <Switch location={location}>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/search" component={Search} />
            <Route path="/library" component={Library} />
            <Route path="/statistics" component={Statistics} />
            <Route path="/profile/edit" component={ProfileEdit} />
            <Route path="/profile/recommendations" component={RecommendationsEdit} />
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={SettingsPage} />
            {/* Privacidade tem tela própria desde 29/07: no painel ela é uma
                linha como as outras (ROTEIRO 4.55). */}
            <Route path="/privacidade" component={Privacidade} />
            {/* As suas, sem slug — o mesmo componente das de cima. */}
            <Route path="/recomendacoes" component={Recomendacoes} />
            <Route path="/comentarios" component={Comentarios} />
            <Route path="/community" component={Community} />
            {/* O recorte só de perguntas, alcançado pelo selo de um post ou pela
                pílula do feed (30/07 — ver o cabeçalho de `Perguntas.tsx`). */}
            <Route path="/perguntas" component={Perguntas} />
            {/* Um post sozinho, com a conversa aberta — o destino do aviso
                "comentaram no seu post" (30/07). */}
            <Route path="/post/:id" component={PostUnico} />
            {/* Os Grupos (Orkut: comunidade → tópico → respostas).
                A mais específica primeiro, regra deste Switch. */}
            <Route path="/forum/:id/topico/:topicoId" component={Topico} />
            {/* Ordem importa: `/gerenciar` e `/membros` antes de `/forum/:id`,
                senão a rota curta captura as duas. */}
            <Route path="/forum/:id/gerenciar" component={GerenciarForum} />
            <Route path="/forum/:id/membros" component={MembrosDoForum} />
            <Route path="/forum/:id/enquetes" component={EnquetesDaComunidade} />
            <Route path="/forum/:id/eventos" component={EventosDaComunidade} />
            <Route path="/forum/:id" component={Grupo} />
            <Route path="/forum" component={Comunidades} />
            {/* `/clubes/novo` antes de `/clubes` e de `/clube/:id`: rota mais
                específica primeiro é a regra deste Switch (ver o cabeçalho). */}
            <Route path="/clubes/novo" component={NovoClube} />
            <Route path="/clubes" component={Clubes} />
            {/* `/clube/:id/gerenciar` antes de `/clube/:id` pela mesma razão:
                a rota mais curta capturaria a mais longa. */}
            <Route path="/clube/:id/gerenciar" component={GerenciarClube} />
            <Route path="/clube/:id" component={Clube} />
            {/* As três páginas que os ícones do topo do perfil abrem (§4.56,
                construídas em 30/07). **As de `/user/:slug/…` vêm antes de
                `/user/:slug`**, senão a rota mais curta captura as três — a
                mesma armadilha que o `/profile/edit` já tinha ensinado. */}
            <Route path="/user/:slug/recomendacoes" component={Recomendacoes} />
            <Route path="/user/:slug/comentarios" component={Comentarios} />
            <Route path="/user/:slug/clubes" component={ClubesDaPessoa} />
            <Route path="/user/:slug" component={UserProfile} />
            {/* O painel privado ("Você") e a grade de conquistas — a separação
                página pública × painel decidida em 28/07 (ROTEIRO 4.41). */}
            <Route path="/you" component={You} />
            <Route path="/achievements" component={Achievements} />
            <Route path="/downloads" component={Downloads} />
            {/* Quem te segue, com a fila de pedidos da conta privada
                (ROTEIRO 4.54). */}
            <Route path="/seguidores" component={Seguidores} />
            {/* Quem você segue no catálogo — autor, narrador, editora, Studio
                (§4.84). Separada de `/seguidores`, que é gente. */}
            <Route path="/acompanhando" component={Acompanhando} />
            <Route path="/bookmarks" component={Bookmarks} />
            {/* Os trechos de áudio têm endereço próprio, e não uma aba dentro
                das notas: a nota é privada e por livro, o trecho é para mostrar
                e circula solto (ROTEIRO 4.48). */}
            <Route path="/trechos" component={Trechos} />
            <Route path="/notifications" component={Notifications} />
            {/* A conversa do livro com endereço próprio (28/07): quem clica
                numa conversa cai NA conversa, não na ficha. Antes de /book/:id
                pela regra deste Switch — a rota mais curta capturaria esta. */}
            <Route path="/book/:id/conversa" component={Conversa} />
            <Route path="/book/:id" component={BookDetails} />
            <Route path="/person/:slug" component={PersonProfile} />
            <Route path="/publisher/:slug" component={PublisherProfile} />
            <Route path="/studio" component={Studio} />
            <Route path="/request" component={RequestBook} />
            <Route path="/help" component={Help} />
            <Route path="/category/:slug" component={CategoryBooks} />
            <Route path="/collection/:slug" component={Collection} />
            <Route path="/player/:id" component={AudioPlayer} />
            <Route path="/sala/:id" component={SalaAoVivo} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
      {/*
        **Uma barra só no rodapé, e a da sala ganha.**

        Estar numa sala é um estado do app, como estar ouvindo um livro — o
        Matheus cobrou isso testando (*"eu não consigo minimizar o player, fazer
        outras coisas dentro do aplicativo"*). Então a sala minimiza como o
        player minimiza, e a `BarraDaSala` é o que fica.

        Ela **substitui** o MiniPlayer enquanto dura: duas barrinhas empilhadas
        seriam duas transmissões disputando o mesmo rodapé, e a do livro está
        parada desde que você entrou na sala. Dentro da própria sala não aparece
        nenhuma das duas — você já está lá.
      */}
      {!isLoginPage && !isSalaPage && (naSala ? <BarraDaSala /> : <MiniPlayer />)}
      {!isBare && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          {/* Fica aqui, e não numa tela: a medalha pode acender ouvindo,
              salvando na lista ou curtindo um comentário. */}
          <AvisoDeConquista />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
