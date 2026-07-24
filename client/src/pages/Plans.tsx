import {
  BookOpen,
  Headphones,
  Bookmark,
  Download,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { readProfile } from "@/lib/profile";

/**
 * "Meu acesso" — a tela do item "Meu acesso" do Perfil (o slot que a rota antiga
 * chamaria de "Planos").
 *
 * DECISÃO (24/07, com o Matheus): esta tela **não** fala de preço, de plano pago
 * nem dá a entender que o app "vai virar pago". Ele não quer expor a estratégia da
 * empresa nem criar ansiedade de cobrança futura. Então ela só celebra, no
 * presente, tudo o que a pessoa já tem no AllBook. O modelo de negócio (função de
 * livro sob demanda por IA, freemium) está registrado em `docs/ROTEIRO.md` e fica
 * **fora da interface** até haver decisão fechada.
 */

const incluido: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: BookOpen, title: "Catálogo completo", desc: "Todos os audiolivros, sem bloqueio." },
  { icon: Headphones, title: "Player completo", desc: "Velocidade, capítulos, temporizador e modo carro." },
  { icon: Bookmark, title: "Minha lista", desc: "Salve e organize o que você quer ouvir." },
  { icon: Download, title: "Downloads", desc: "Baixe e ouça sem internet." },
  { icon: Users, title: "Comunidade", desc: "Recomende e acompanhe quem você segue." },
  { icon: Sparkles, title: "Sem anúncios", desc: "Nada interrompe a sua escuta." },
];

export default function Plans() {
  const profile = readProfile();
  const primeiroNome = profile.name?.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="min-h-screen pb-24 bg-[#141414] text-white" data-testid="plans-page">
      <PageHeader title="Meu acesso" fallback="/profile" />

      <header className="relative px-5 pt-8 pb-6 overflow-hidden">
        {/* Brilho sutil da marca, no mesmo espírito do Perfil — premium sem pesar. */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 via-primary/[0.04] to-transparent pointer-events-none" />
        <div className="relative">
          <h2 className="text-2xl font-bold font-display tracking-tight" data-testid="text-access-title">
            {primeiroNome ? `Tudo liberado, ${primeiroNome}.` : "Está tudo liberado."}
          </h2>
          <p className="text-sm text-white/55 leading-relaxed mt-2">
            Você tem o AllBook inteiro nas mãos. É só ouvir.
          </p>
        </div>
      </header>

      <main className="px-5">
        <div className="rounded-xl bg-white/5 border border-white/10 divide-y divide-white/5">
          {incluido.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-center gap-4 p-4"
                data-testid={`access-${item.title.toLowerCase().replace(/ /g, "-")}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-xs text-white/45 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-white/30 mt-6 px-6 leading-relaxed">
          Aproveite à vontade.
        </p>
      </main>
    </div>
  );
}
