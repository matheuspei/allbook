import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronRight,
  Download,
  Headphones,
  HelpCircle,
  LogIn,
  Medal,
  Scissors,
  Settings,
  Share2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { readSession, signOut, type Session } from "@/lib/auth";
import { initialOf, readProfile, type Profile } from "@/lib/profile";
import { totalBookmarks } from "@/lib/bookmarks";
import { TRECHOS_EVENT, trechosGuardados } from "@/lib/trechosGuardados";
import { readDownloads } from "@/lib/library";
import { achievements, unlockedCountFor } from "@/lib/achievements";
import { readSettings, saveSettings, type Settings as AppSettings } from "@/lib/settings";
import { lerDadosDeConquista, lerResumo } from "@/lib/stats";

/**
 * "Você" (`/you`) — o painel privado, atrás da engrenagem do Perfil.
 *
 * Nasceu da separação decidida em 28/07 (ROTEIRO 4.41): o Perfil era vitrine e
 * menu ao mesmo tempo — "Minhas notas" e "Configurações" dividiam a tela com o
 * que era para os outros verem. A regra que ficou é **separar por dono**: a
 * página pública (`/profile`) é para quem te visita; este painel é o que só
 * interessa a você. Nada foi apagado na mudança — os itens do antigo menu do
 * Perfil moram todos aqui.
 *
 * Segue a sobriedade das listas do app (uma cor de ícone, divisórias finas) —
 * a regra "evitar a cara de IA" do ROTEIRO.
 */

interface LinhaDoPainel {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  /** Ação executada aqui mesmo, para o que não é uma tela. */
  onSelect?: () => void;
}

function GrupoDoPainel({ titulo, items }: { titulo: string; items: LinhaDoPainel[] }) {
  return (
    <section className="px-5" data-testid={`you-group-${titulo.toLowerCase().replace(/ /g, "-")}`}>
      <h2 className="pt-5 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        {titulo}
      </h2>
      <div className="border-b border-white/10">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <div className="w-9 h-9 rounded-lg bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-[18px] h-[18px] text-white/80" strokeWidth={1.8} />
              </div>
              <span className="text-sm flex-1">{item.label}</span>
              {item.hint && <span className="text-sm text-white/30">{item.hint}</span>}
              <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
            </>
          );

          const className =
            "w-full flex items-center gap-4 py-3.5 text-left hover:text-white/70 transition-colors";
          const testId = `you-item-${item.label.toLowerCase().replace(/ /g, "-")}`;

          return item.href ? (
            <Link key={item.label} href={item.href} className={className} data-testid={testId}>
              {content}
            </Link>
          ) : (
            <button key={item.label} onClick={item.onSelect} className={className} data-testid={testId}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function You() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>(readProfile);
  const [session, setSession] = useState<Session | null>(readSession);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [bookmarkTotal, setBookmarkTotal] = useState(0);
  const [totalTrechos, setTotalTrechos] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [ganhas, setGanhas] = useState(0);
  const [ajustes, setAjustes] = useState<AppSettings>(readSettings);

  /**
   * Os interruptores da vitrine: a página só mostra o que você deixar.
   * Parte do que está gravado (e não do estado da tela): dois toques no
   * mesmo instante com base no estado antigo faziam o segundo desfazer o
   * primeiro — apareceu no teste automatizado, que clica mais rápido que dedo.
   */
  function alternarPrivacidade(chave: "mostrarOuvindoAgora" | "mostrarMeusClubes", ligado: boolean) {
    const next = { ...readSettings(), [chave]: ligado };
    setAjustes(next);
    saveSettings(next);
  }

  useEffect(() => {
    // Relê ao voltar da edição — e as contagens, que mudam em uso.
    setProfile(readProfile());
    setSession(readSession());
    setBookmarkTotal(totalBookmarks());
    setDownloadCount(readDownloads().length);
    setGanhas(unlockedCountFor(lerDadosDeConquista(lerResumo())));
  }, []);

  /* Os trechos mudam com o app aberto (cortar acontece no player), então este
     ouve o evento em vez de contar uma vez só na montagem. */
  useEffect(() => {
    const atualizar = () => setTotalTrechos(trechosGuardados().length);
    atualizar();
    window.addEventListener(TRECHOS_EVENT, atualizar);
    return () => window.removeEventListener(TRECHOS_EVENT, atualizar);
  }, []);

  /**
   * Convidar alguém para o AllBook — funciona de verdade, sem servidor: quem
   * compartilha é o próprio aparelho (folha nativa; sem ela, copia o texto).
   * Veio do antigo menu do Perfil, intacto.
   */
  async function convidarAmigos() {
    const convite =
      "Estou ouvindo audiolivros em português no AllBook — dá até para pedir um livro que ainda não existe em áudio.";
    const url = window.location.origin;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AllBook", text: convite, url });
        return;
      } catch {
        // Fechar a folha de compartilhamento não é erro.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${convite} ${url}`);
      toast({ title: "Convite copiado", description: "Cole onde quiser para chamar alguém." });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "Seu navegador bloqueou a área de transferência.",
      });
    }
  }

  /** Sair de verdade. Só a sessão cai — lista, downloads e recomendações ficam. */
  function handleSignOut() {
    signOut();
    setSession(null);
    setProfile(readProfile());
    setConfirmSignOut(false);
    toast({
      title: "Você saiu da conta",
      description: "Sua lista e seus downloads continuam neste aparelho.",
    });
  }

  const conteudo: LinhaDoPainel[] = [
    {
      icon: Bookmark,
      label: "Minhas notas",
      hint: bookmarkTotal > 0 ? String(bookmarkTotal) : undefined,
      href: "/bookmarks",
    },
    /*
      Logo abaixo das notas, e não junto delas (ROTEIRO 4.48): são vizinhos —
      os dois nascem ouvindo — mas não são a mesma coisa. A nota guarda um ponto
      para você; o trecho guarda um pedaço para mostrar aos outros. Só aparece
      quando existe algum: linha "Meus trechos" a zero seria o beco sem saída
      que a §4.23 mandou varrer.
    */
    ...(totalTrechos > 0
      ? [
          {
            icon: Scissors,
            label: "Meus trechos",
            hint: String(totalTrechos),
            href: "/trechos",
          },
        ]
      : []),
    {
      icon: Download,
      label: "Downloads",
      hint: downloadCount > 0 ? String(downloadCount) : undefined,
      href: "/downloads",
    },
    { icon: BarChart3, label: "Estatísticas", href: "/statistics" },
    {
      icon: Medal,
      label: "Conquistas",
      hint: `${ganhas} de ${achievements.length}`,
      href: "/achievements",
    },
  ];

  const conta: LinhaDoPainel[] = [
    { icon: Bell, label: "Notificações", href: "/notifications" },
    { icon: Settings, label: "Reprodução e download", href: "/settings" },
    { icon: Share2, label: "Convidar amigos", onSelect: convidarAmigos },
    { icon: HelpCircle, label: "Ajuda e suporte", href: "/help" },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="you-page">
      <PageHeader title="Você" fallback="/profile" />

      {/* Quem você é — e a porta para editar. O e-mail mora aqui, não na página
          pública: é cadastro, não conteúdo. */}
      <section className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center gap-4">
        <Avatar className="w-12 h-12">
          {profile.photo && (
            <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
          )}
          <AvatarFallback className="bg-[#1e1e1e] text-white font-display font-semibold">
            {initialOf(profile.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold font-display tracking-tight truncate" data-testid="you-name">
            {profile.name}
          </p>
          <p className="text-xs text-white/40 truncate mt-0.5">{profile.email}</p>
        </div>
        <Link
          href="/profile/edit"
          className="shrink-0 text-xs font-semibold text-white/70 border border-white/15 rounded-full px-3.5 py-1.5 hover:bg-white/5 transition-colors"
          data-testid="you-edit-profile"
        >
          Editar
        </Link>
      </section>

      <GrupoDoPainel titulo="Seu conteúdo" items={conteudo} />

      {/*
        Privacidade — pedido do Matheus (28/07): o que a sua página pública
        mostra tem que ser escolha sua. "Ouvindo agora" governa o bloco E o
        fundo do topo (a capa desfocada também entrega o que está tocando);
        "meus clubes" esconde só a vitrine — dentro do clube a turma continua
        te vendo, que é outro contrato.
      */}
      <section className="px-5" data-testid="you-group-privacidade">
        <h2 className="pt-5 pb-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
          Privacidade
        </h2>
        <div className="border-b border-white/10">
          <div className="flex items-center gap-4 py-3.5">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0">
              <Headphones className="w-[18px] h-[18px] text-white/80" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">Mostrar o que estou ouvindo</p>
              <p className="text-[11px] text-white/35 mt-0.5">
                Aparece na sua página, para quem te visita.
              </p>
            </div>
            <Switch
              checked={ajustes.mostrarOuvindoAgora}
              onCheckedChange={(ligado) => alternarPrivacidade("mostrarOuvindoAgora", ligado)}
              aria-label="Mostrar o que estou ouvindo"
              data-testid="switch-ouvindo-agora"
            />
          </div>

          <div className="flex items-center gap-4 py-3.5">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] ring-1 ring-white/10 flex items-center justify-center shrink-0">
              <UsersRound className="w-[18px] h-[18px] text-white/80" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">Mostrar meus clubes</p>
              <p className="text-[11px] text-white/35 mt-0.5">
                A lista de clubes na sua página. Dentro deles, a turma sempre te vê.
              </p>
            </div>
            <Switch
              checked={ajustes.mostrarMeusClubes}
              onCheckedChange={(ligado) => alternarPrivacidade("mostrarMeusClubes", ligado)}
              aria-label="Mostrar meus clubes"
              data-testid="switch-meus-clubes"
            />
          </div>
        </div>
      </section>

      <GrupoDoPainel titulo="Conta" items={conta} />

      <div className="px-5">
        {session ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="w-full text-left py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="you-logout"
          >
            Sair da conta
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-4 py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="you-login"
          >
            <LogIn className="w-4 h-4" />
            Entrar ou criar conta
          </Link>
        )}
      </div>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent className="max-w-sm bg-[#1c1c1c] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua lista, seus downloads e suas recomendações continuam salvos neste aparelho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-signout">Ficar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} data-testid="confirm-signout">
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
