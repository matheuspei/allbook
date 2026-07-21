import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Discover from "@/pages/Discover";
import Library from "@/pages/Library";
import Statistics from "@/pages/Statistics";
import Profile from "@/pages/Profile";
import ProfileEdit from "@/pages/ProfileEdit";
import RecommendationsEdit from "@/pages/RecommendationsEdit";
import Downloads from "@/pages/Downloads";
import Notifications from "@/pages/Notifications";
import BookDetails from "@/pages/BookDetails";
import PersonProfile from "@/pages/PersonProfile";
import CategoryBooks from "@/pages/CategoryBooks";
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

  const isHomePage = location === '/';

  return (
    <div className="min-h-screen bg-[#141414] pb-20">
      {!isPlayerPage && <TopNav />}
      <div className={!isPlayerPage && !isHomePage ? "pt-14" : ""}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/discover" component={Discover} />
          <Route path="/library" component={Library} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/profile/edit" component={ProfileEdit} />
          <Route path="/profile/recommendations" component={RecommendationsEdit} />
          <Route path="/profile" component={Profile} />
          <Route path="/downloads" component={Downloads} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/book/:id" component={BookDetails} />
          <Route path="/person/:slug" component={PersonProfile} />
          <Route path="/category/:slug" component={CategoryBooks} />
          <Route path="/player/:id" component={AudioPlayer} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <MiniPlayer />
      {!isPlayerPage && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
