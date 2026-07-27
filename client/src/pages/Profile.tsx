import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Flame,
  HelpCircle,
  LogIn,
  Plus,
  Settings,
  Share2,
  Users,
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
import AvatarAmpliavel from "@/components/AvatarAmpliavel";
import StatSpotlight, { type StatKey } from "@/components/StatSpotlight";
import { useToast } from "@/hooks/use-toast";
import { readSession, signOut, type Session } from "@/lib/auth";
import { initialOf, readProfile, type Profile as UserProfile } from "@/lib/profile";
import { readRecommendations } from "@/lib/recommendations";
import { totalBookmarks } from "@/lib/bookmarks";
import { readDownloads } from "@/lib/library";
import { meusClubes } from "@/lib/clubes";
import { formatarDuracao } from "@/lib/listening";
import { lerDadosDeConquista, lerResumo, type ResumoDeAudicao } from "@/lib/stats";
import AchievementSpotlight from "@/components/AchievementSpotlight";
import {
  CATEGORIAS,
  TIERS,
  achievements,
  achievementsFor,
  type Achievement,
} from "@/lib/achievements";
import type { Book } from "@/lib/books";

/**
 * Perfil ("Minha AllBook") — a tela do 4º item do menu inferior.
 *
 * Propositalmente sóbria, no espírito do Audible/Storytel: lista corrida em vez
 * de cartões soltos e ícone de uma cor só em vez de um gradiente por item.
 *
 * As conquistas fogem dessa sobriedade de propósito: eram quatro e discretas,
 * viraram uma grade de medalhas (fonte em `lib/achievements.ts`), com as
 * desbloqueadas na cor da marca — o Matheus quis troféus de verdade, para
 * engajar (ver ROTEIRO). Tocar numa medalha mostra a dica da meta.
 *
 * Os números de audição e as medalhas são os mesmos de `Statistics.tsx` porque
 * saem da mesma fonte (`lib/stats.ts`), calculada do uso real — antes cada tela
 * trazia a própria lista fixa, e as duas discordavam.
 */

/**
 * A fileira de números do topo — **calculada**, não escrita.
 *
 * Era fixa ("47h · 5 · 3 sem. · 2") e não batia com nada: a pessoa podia ter
 * zero livros começados e mesmo assim ver 47 horas ouvidas. Agora sai da mesma
 * fonte das Estatísticas (`lib/stats.ts`), então os dois lugares concordam.
 */
function numerosDoPerfil(
  resumo: ResumoDeAudicao
): { value: string; label: string; key: StatKey; icon: LucideIcon }[] {
  return [
    { value: formatarDuracao(resumo.segundos), label: "ouvidas", key: "horas", icon: Clock },
    { value: String(resumo.titulosComecados), label: "títulos", key: "titulos", icon: BookOpen },
    {
      value: resumo.sequenciaDias > 0 ? `${resumo.sequenciaDias} d` : "—",
      label: "sequência",
      key: "sequencia",
      icon: Flame,
    },
    { value: String(resumo.concluidos), label: "concluídos", key: "concluidos", icon: CheckCircle2 },
  ];
}

/**
 * Uma medalha na grade do Perfil.
 *
 * Ganha: o círculo cheio na cor da faixa (a lendária ainda ganha um brilho
 * contido). Bloqueada: círculo apagado **com um anel de progresso em volta** —
 * é ele que transforma a grade de uma lista de "não" num caminho, agora que os
 * dados existem para medir.
 */
function MedalhaDoPerfil({ item, onOpen }: { item: Achievement; onOpen: () => void }) {
  const tier = TIERS[item.tier];
  const Icon = item.icon;
  const raio = 20;
  const volta = 2 * Math.PI * raio;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col items-center gap-2"
      data-testid={`achievement-${item.id}`}
    >
      <div className="relative h-11 w-11">
        {!item.unlocked && item.progresso > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
            <circle cx="22" cy="22" r={raio} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            <circle
              cx="22"
              cy="22"
              r={raio}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={volta}
              strokeDashoffset={volta * (1 - item.progresso)}
            />
          </svg>
        )}

        <div
          className={`flex h-full w-full items-center justify-center rounded-full transition-all ${
            item.unlocked
              ? `${tier.fundo} ${tier.brilho} group-hover:scale-105`
              : "bg-white/[0.05] group-hover:bg-white/[0.08]"
          }`}
        >
          <Icon
            className={`h-[18px] w-[18px] ${item.unlocked ? tier.icone : "text-white/25"}`}
            strokeWidth={item.unlocked ? 2 : 1.75}
          />
        </div>
      </div>

      <span
        className={`text-center text-[10px] leading-tight ${
          item.unlocked ? "text-white/60" : "text-white/25"
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}

/** Um item da lista de atalhos do Perfil. */
interface AtalhoDoPerfil {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  /** Ação executada aqui mesmo, para o que não é uma tela. */
  onSelect?: () => void;
}

/**
 * Um grupo da lista de atalhos.
 *
 * Virou componente para os dois grupos poderem morar em **lugares diferentes**
 * da página: o de conteúdo (lista, notas, estatísticas, downloads) sobe para
 * logo abaixo dos números, e o de conta fica no fim. O motivo é concreto — o
 * Matheus não achou "Minhas notas" porque o bloco inteiro vinha **depois** da
 * foto, dos quatro números, das três recomendações e de dezesseis medalhas em
 * quatro categorias. Navegação antes de vitrine.
 */
function GrupoDeAtalhos({ items, indice }: { items: AtalhoDoPerfil[]; indice: number }) {
  return (
    <div className="py-2 border-b border-white/10" data-testid={`profile-section-${indice}`}>
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
        const testId = `profile-item-${item.label.toLowerCase().replace(/ /g, "-")}`;

        /*
          Todo item leva a algum lugar ou faz alguma coisa — os dois que só
          mostravam "em breve" saíram (ROTEIRO 4.23). O `onSelect` existe para o
          que resolve aqui mesmo, como o convite, sem precisar de uma tela.
        */
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
  );
}

export default function Profile() {
  const { toast } = useToast();
  const [downloadCount, setDownloadCount] = useState(0);
  const [bookmarkTotal, setBookmarkTotal] = useState(0);
  const [totalDeClubes, setTotalDeClubes] = useState(0);
  const [openStat, setOpenStat] = useState<StatKey | null>(null);
  const [profile, setProfile] = useState<UserProfile>(readProfile);
  const [recommendations, setRecommendations] = useState<{ book: Book; note: string }[]>(readRecommendations);
  const [session, setSession] = useState<Session | null>(readSession);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [resumo, setResumo] = useState<ResumoDeAudicao | null>(null);
  const [medalhaAberta, setMedalhaAberta] = useState<Achievement | null>(null);

  /**
   * As medalhas agora são **julgadas pelos seus números** (ver
   * `lib/achievements.ts`): antes o `unlocked` vinha marcado à mão e o perfil
   * exibia seis troféus mesmo para quem nunca tinha aberto um livro.
   */
  const medalhas = resumo ? achievementsFor(lerDadosDeConquista(resumo)) : [];
  const conquistadas = medalhas.filter((item) => item.unlocked);

  useEffect(() => {
    // Relê ao voltar das telas de edição.
    setProfile(readProfile());
    setRecommendations(readRecommendations());
    setSession(readSession());

    // `libraryCount` saiu junto com o item "Minha lista": sem o item, era leitura
    // do storage a cada abertura do Perfil para um número que ninguém via.
    setDownloadCount(readDownloads().length);
    setTotalDeClubes(meusClubes().length);
    setBookmarkTotal(totalBookmarks());

    // Os números do topo saem daqui — a mesma conta das Estatísticas.
    setResumo(lerResumo());
  }, []);

  /**
   * Convidar alguém para o AllBook — **funciona de verdade, sem servidor**.
   *
   * Era um dos dois itens que só mostravam "em breve". Convite não depende de
   * banco de dados: quem compartilha é o próprio aparelho. Usa a folha de
   * compartilhamento nativa (WhatsApp, Mensagens, o que a pessoa tiver) e, onde
   * ela não existe — desktop, navegador antigo —, copia o convite para a área de
   * transferência. Nos dois caminhos a pessoa sai com algo na mão.
   *
   * Quando houver servidor, o que muda é só o link: um endereço de convite com
   * código de indicação no lugar do endereço do site.
   */
  async function convidarAmigos() {
    const convite =
      "Estou ouvindo audiolivros em português no AllBook — dá até para pedir um livro que ainda não existe em áudio.";
    const url = window.location.origin;

    // `navigator.share` só existe em contexto seguro (https ou localhost) e em
    // navegador que a implemente; o `catch` cobre também quem abre a folha e
    // desiste, que dispara rejeição e não é erro nenhum.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AllBook", text: convite, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${convite} ${url}`);
      toast({
        title: "Convite copiado",
        description: "Cole onde quiser para chamar alguém.",
      });
    } catch {
      toast({
        title: "Não deu para copiar",
        description: "Seu navegador bloqueou a área de transferência.",
      });
    }
  }

  /**
   * Sair de verdade. Só a sessão cai: biblioteca, downloads e recomendações
   * ficam onde estão (ver o comentário de `signOut`). O perfil volta ao padrão,
   * por isso relemos os dois logo em seguida.
   */
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

  /*
   * Tocar numa medalha abria um toast no rodapé — o mesmo componente do "link
   * copiado", que some antes de a pessoa ler. Virou o painel
   * `AchievementSpotlight`, com a medalha grande, a raridade, o progresso e a
   * data em que foi ganha.
   */

  // Uma lista só, em duas partes: o que é conteúdo e o que é conta.
  // Lista sóbria, no espírito Audible/Apple: um único tom neutro para todos os
  // ícones, em vez de um gradiente de cor diferente por item (o "arco-íris" que
  // dava cara de template). A cor da marca fica reservada para o que merece
  // destaque de verdade — os troféus e o brilho do topo.
  const sections: {
    icon: typeof Bell;
    label: string;
    hint?: string;
    href?: string;
    /** Ação executada aqui mesmo, para o que não é uma tela. */
    onSelect?: () => void;
  }[][] = [
    [
      /*
       * "Minhas notas", e não "Minhas marcações": o Matheus não encontrou o item
       * procurando por *anotações* — a palavra que ele usa. E ela ficou correta
       * depois de "Marcar" passar a abrir a caixa de nota: o que se guarda aqui é
       * o que a pessoa escreveu, com o ponto do áudio anexado.
       *
       * **"Minha lista" saía daqui e saiu** (26/07, ideia dele): ia para
       * `/library`, exatamente onde o ícone fixo de Biblioteca da barra de baixo
       * já leva — atalho duplicado ocupando a primeira linha da lista. O ícone
       * dele, o marcador de página, ficou para as notas: é o mesmo símbolo que o
       * tocador usa para marcar trecho, então o desenho passa a ser o mesmo nos
       * dois lugares.
       */
      { icon: Bookmark, label: "Minhas notas", hint: bookmarkTotal > 0 ? String(bookmarkTotal) : undefined, href: "/bookmarks" },
      { icon: BarChart3, label: "Estatísticas", href: "/statistics" },
      { icon: Download, label: "Downloads", hint: downloadCount > 0 ? String(downloadCount) : undefined, href: "/downloads" },
      { icon: Users, label: "Comunidade", href: "/community" },
      /*
       * Clubes ganha linha própria em vez de ficar só dentro da Comunidade: é
       * onde há **compromisso** (prazo, encontro, gente esperando), e o que tem
       * prazo precisa estar a um toque — não a dois (ROTEIRO 4.39). A contagem
       * mostra em quantos você está; sem nenhum, o item continua valendo como
       * porta para descobrir.
       */
      {
        icon: UsersRound,
        label: "Clubes de leitura",
        hint: totalDeClubes > 0 ? String(totalDeClubes) : undefined,
        href: "/clubes",
      },
    ],
    [
      // "Meu acesso" morava aqui e **saiu** em 26/07, por decisão do Matheus (ver
      // ROTEIRO 4.31). A tela dizia o óbvio; a versão que mostrava o uso real de
      // cada recurso também não convenceu. O slot volta a existir quando houver
      // plano e crédito de verdade para mostrar.
      { icon: Bell, label: "Notificações", href: "/notifications" },
      { icon: Settings, label: "Configurações", href: "/settings" },
      { icon: Share2, label: "Convidar amigos", onSelect: convidarAmigos },
      { icon: HelpCircle, label: "Ajuda e suporte", href: "/help" },
    ],
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="profile-page">
      <header className="relative px-5 pt-8 pb-7 overflow-hidden">
        {/* Brilho da cor da marca no topo — dá o ar "premium" sem pesar. */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-primary/25 via-primary/[0.06] to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-4">
          {/* Anel em degradê da marca ao redor do avatar. Tocar na foto amplia
              (mesmo gesto do Instagram) — quem quer trocar a foto usa o
              "Editar perfil" logo abaixo. */}
          <AvatarAmpliavel
            nome={profile.name}
            foto={profile.photo || undefined}
            inicial={initialOf(profile.name)}
            legenda="você"
            fundoClasse="bg-[#1e1e1e]"
            className="p-[2.5px] bg-gradient-to-br from-primary to-amber-400 shrink-0"
          >
            <Avatar className="w-16 h-16 border-2 border-[#141414]">
              {profile.photo && (
                <AvatarImage src={profile.photo} alt={profile.name} className="object-cover" />
              )}
              <AvatarFallback className="bg-[#1e1e1e] text-white font-display font-semibold text-xl">
                {initialOf(profile.name)}
              </AvatarFallback>
            </Avatar>
          </AvatarAmpliavel>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold font-display tracking-tight truncate" data-testid="text-profile-name">
              {profile.name}
            </h1>
            <p className="text-sm text-white/40 truncate mt-0.5">{profile.email}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="relative text-sm text-white/60 leading-relaxed mt-4" data-testid="text-profile-bio">
            {profile.bio}
          </p>
        )}

        {/*
          Aqui ficava uma fileira dos troféus conquistados, ao lado do nome.
          **Saiu em 25/07:** eram círculos idênticos, todos no mesmo degradê
          laranja e sem rótulo — pareciam botões de ação, não medalhas, e
          disputavam atenção com a foto e o nome. O placar completo, agora com
          raridade e progresso, está na seção "Conquistas" mais abaixo.
        */}

        <Link
          href="/profile/edit"
          className="relative mt-5 w-full flex items-center justify-center py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white transition-colors"
          data-testid="button-edit-profile"
        >
          Editar perfil
        </Link>
      </header>

      <section className="px-5 mt-1" data-testid="section-profile-summary">
        <div className="grid grid-cols-4 gap-2">
          {(resumo ? numerosDoPerfil(resumo) : []).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => setOpenStat(item.key)}
                className="flex flex-col items-center gap-1 rounded-xl bg-white/5 border border-white/10 py-3 transition-colors hover:bg-white/10 active:scale-95 duration-150"
                data-testid={`profile-summary-${item.label}`}
              >
                <Icon className="w-4 h-4 text-primary/80" strokeWidth={2} />
                <p className="text-base font-bold font-display leading-none mt-0.5">{item.value}</p>
                <p className="text-[10px] text-white/40">{item.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/*
        Os atalhos de conteúdo vêm **aqui**, colados nos números, e não no fim da
        página: é navegação, e navegação não pode ficar atrás de vitrine.
      */}
      <div className="px-5">
        <GrupoDeAtalhos items={sections[0]} indice={0} />
      </div>

      {resumo && <StatSpotlight stat={openStat} onClose={() => setOpenStat(null)} resumo={resumo} />}

      <AchievementSpotlight item={medalhaAberta} onClose={() => setMedalhaAberta(null)} />

      <section className="px-5 py-5 border-b border-white/10" data-testid="section-profile-recommendations">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
              Recomendo
            </h2>
            <p className="text-[11px] text-white/25 mt-0.5">Visível para a comunidade</p>
          </div>
          <Link
            href="/profile/recommendations"
            className="text-xs font-medium text-primary shrink-0"
            data-testid="link-edit-recommendations"
          >
            {recommendations.length > 0 ? "Editar" : "Montar lista"}
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <Link
            href="/profile/recommendations"
            className="flex items-center gap-3 py-3 text-left"
            data-testid="empty-recommendations"
          >
            <div className="w-11 h-[59px] rounded border border-dashed border-white/15 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 text-white/25" />
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Escolha os livros que você indicaria para alguém.
              <br />
              Eles aparecem no seu perfil, junto do seu nome.
            </p>
          </Link>
        ) : (
          <div className="space-y-3" data-testid="recommendations-row">
            {recommendations.map(({ book, note }) => (
              <Link
                key={book.id}
                href={`/book/${book.id}`}
                className="flex gap-3 group"
                data-testid={`recommendation-${book.id}`}
              >
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-11 h-[59px] rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{book.author}</p>
                  {note && (
                    <p className="text-[11px] text-white/55 leading-snug mt-1 italic">
                      “{note}”
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="px-5 py-5 border-b border-white/10" data-testid="section-profile-achievements">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
            Conquistas
          </h2>
          <span className="text-[11px] text-white/30">
            {conquistadas.length} de {achievements.length}
          </span>
        </div>

        {/*
          Separadas por categoria: as 16 juntas pareciam lista aleatória. E cada
          uma na cor da sua faixa de raridade — antes todas usavam o mesmo
          degradê laranja, então a que se ganha em cinco minutos parecia igual à
          de 500 horas.
        */}
        <div className="mt-5 space-y-6">
          {CATEGORIAS.map((categoria) => {
            const doGrupo = medalhas.filter((item) => item.category === categoria.key);
            if (doGrupo.length === 0) return null;
            const ganhasNoGrupo = doGrupo.filter((item) => item.unlocked).length;

            return (
              <div key={categoria.key} data-testid={`achievement-group-${categoria.key}`}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-[11px] font-medium text-white/50">{categoria.label}</h3>
                  <span className="text-[10px] text-white/25">
                    {ganhasNoGrupo}/{doGrupo.length}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-x-2 gap-y-4">
                  {doGrupo.map((item) => (
                    <MedalhaDoPerfil
                      key={item.id}
                      item={item}
                      onOpen={() => setMedalhaAberta(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <main className="px-5">
        {/* O grupo de conteúdo subiu para antes de "Recomendo" (ver
            `GrupoDeAtalhos`); aqui fica só o da conta. */}
        <GrupoDeAtalhos items={sections[1]} indice={1} />

        {/*
          Quem não tem sessão não vê "Sair" — vê o convite para entrar. O app
          continua aberto sem conta de propósito (decisão registrada no roteiro);
          este é só o caminho para quem quiser entrar.
        */}
        {session ? (
          <button
            onClick={() => setConfirmSignOut(true)}
            className="w-full text-left py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="button-profile-logout"
          >
            Sair da conta
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center gap-4 py-5 text-sm text-white/40 hover:text-white/70 transition-colors"
            data-testid="button-profile-login"
          >
            <LogIn className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
            <span className="flex-1">Entrar ou criar conta</span>
            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
          </Link>
        )}
      </main>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent className="bg-[#1c1c1c] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Sair da conta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Sua lista, seus downloads e suas recomendações continuam salvos neste aparelho.
              Só o perfil volta ao padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/15 text-white/80 hover:bg-white/5 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-primary text-black hover:bg-primary/90"
              data-testid="button-confirm-logout"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
