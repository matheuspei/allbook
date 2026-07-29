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
import Grupo from "@/pages/Grupo";
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
import Downloads from "@/pages/Downloads";
import Notifications from "@/pages/Notifications";
import BookDetails from "@/pages/BookDetails";
import Conversa from "@/pages/Conversa";
import PersonProfile from "@/pages/PersonProfile";
import PublisherProfile from "@/pages/PublisherProfile";
import Studio from "@/pages/Studio";
import RequestBook from "@/pages/RequestBook";
import Help from "@/pages/Help";
import CategoryBooks from "@/pages/CategoryBooks";
import Collection from "@/pages/Collection";
import AudioPlayer from "@/pages/AudioPlayer";
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
  const isBare = isPlayerPage || isLoginPage;

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
            <Route path="/community" component={Community} />
            {/* Os Grupos (Orkut: comunidade → tópico → respostas).
                A mais específica primeiro, regra deste Switch. */}
            <Route path="/forum/:id/topico/:topicoId" component={Topico} />
            <Route path="/forum/:id" component={Grupo} />
            {/* `/clubes/novo` antes de `/clubes` e de `/clube/:id`: rota mais
                específica primeiro é a regra deste Switch (ver o cabeçalho). */}
            <Route path="/clubes/novo" component={NovoClube} />
            <Route path="/clubes" component={Clubes} />
            {/* `/clube/:id/gerenciar` antes de `/clube/:id` pela mesma razão:
                a rota mais curta capturaria a mais longa. */}
            <Route path="/clube/:id/gerenciar" component={GerenciarClube} />
            <Route path="/clube/:id" component={Clube} />
            <Route path="/user/:slug" component={UserProfile} />
            {/* O painel privado ("Você") e a grade de conquistas — a separação
                página pública × painel decidida em 28/07 (ROTEIRO 4.41). */}
            <Route path="/you" component={You} />
            <Route path="/achievements" component={Achievements} />
            <Route path="/downloads" component={Downloads} />
            {/* Quem te segue, com a fila de pedidos da conta privada
                (ROTEIRO 4.54). */}
            <Route path="/seguidores" component={Seguidores} />
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
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
      {!isLoginPage && <MiniPlayer />}
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
