import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { MIN_PASSWORD, isValidEmail, signIn, signUp } from "@/lib/auth";

/**
 * Entrar / Criar conta (`/login`).
 *
 * Tela cheia, sem os menus: quem está aqui ainda não escolheu para onde ir.
 *
 * **O app não é trancado atrás desta tela.** Dá para explorar o catálogo inteiro
 * sem conta — o botão "Explorar sem conta" existe para isso. Um muro de login na
 * porta de entrada é o que mais afasta gente num app de catálogo, e como ainda
 * não há nada de verdade para proteger (sem servidor, sem áudio, sem cobrança),
 * ele só atrapalharia. Quando houver assinatura, o muro passa a ser no player,
 * não na entrada.
 *
 * Visual sóbrio de propósito, na linha do Perfil: sem cartão colorido, sem
 * ícone com gradiente, laranja só no botão principal.
 */

type Mode = "entrar" | "criar";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  /** Só mostra erro depois da primeira tentativa: não repreende quem ainda está digitando. */
  const [tried, setTried] = useState(false);

  const creating = mode === "criar";

  const nameError = creating && name.trim().length === 0 ? "Diga como quer ser chamado." : "";
  const emailError = !isValidEmail(email) ? "Esse e-mail não parece completo." : "";
  const passwordError =
    password.length < MIN_PASSWORD ? `A senha precisa de pelo menos ${MIN_PASSWORD} caracteres.` : "";
  const hasError = Boolean(nameError || emailError || passwordError);

  function switchMode(next: Mode) {
    setMode(next);
    setTried(false);
    setPassword("");
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    if (hasError) return;

    if (creating) {
      signUp(name, email);
      toast({ title: "Conta criada", description: "Bem-vindo ao AllBook." });
    } else {
      signIn(email);
      toast({ title: "Você entrou" });
    }

    setLocation("/");
  }

  const fieldClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-white/25";
  const labelClass = "block text-xs font-semibold text-white/40 uppercase tracking-wider";

  return (
    <div
      className="min-h-screen bg-background text-white flex flex-col justify-center px-6 py-12"
      data-testid="login-page"
    >
      <div className="w-full max-w-sm mx-auto">
        <header className="mb-9">
          <span className="font-display text-2xl font-bold tracking-tight">
            <span className="text-primary">All</span>Book
          </span>
          <h1 className="text-2xl font-bold font-display tracking-tight mt-6">
            {creating ? "Criar sua conta" : "Entrar"}
          </h1>
          <p className="text-sm text-white/40 mt-1.5">
            {creating
              ? "Sua biblioteca e seu progresso ficam guardados."
              : "Continue de onde você parou."}
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {creating && (
            <div className="space-y-2">
              <label htmlFor="name" className={labelClass}>
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                autoComplete="name"
                placeholder="Como quer ser chamado"
                className={fieldClass}
                data-testid="input-login-name"
              />
              {tried && nameError && <p className="text-xs text-red-400">{nameError}</p>}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className={labelClass}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className={fieldClass}
              data-testid="input-login-email"
            />
            {tried && emailError && <p className="text-xs text-red-400">{emailError}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className={labelClass}>
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={creating ? "new-password" : "current-password"}
                placeholder={creating ? `Pelo menos ${MIN_PASSWORD} caracteres` : "Sua senha"}
                className={`${fieldClass} pr-12`}
                data-testid="input-login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/70 transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
            {tried && passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
          </div>

          {/*
            "Esqueci minha senha" saiu daqui (ROTEIRO 4.23), e não é um item de
            lista de espera: **não há senha para recuperar**. `auth.ts` decidiu
            deliberadamente não guardar senha nenhuma no navegador, então
            qualquer senha válida entra. Um link de recuperação neste modelo não
            estaria "por construir" — estaria mentindo sobre como o login
            funciona. Ele volta junto com o servidor de contas, que é quem
            passará a ter uma senha de verdade para redefinir.
          */}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all"
            data-testid="button-login-submit"
          >
            {creating ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-white/40 text-center mt-6">
          {creating ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button
            onClick={() => switchMode(creating ? "entrar" : "criar")}
            className="font-semibold text-primary hover:underline"
            data-testid="button-switch-mode"
          >
            {creating ? "Entrar" : "Criar agora"}
          </button>
        </p>

        <div className="flex items-center gap-4 my-7">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] text-white/25">ou</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Link
          href="/"
          className="block w-full rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-white/80 hover:bg-white/5 hover:text-white transition-colors"
          data-testid="button-explore-without-account"
        >
          Explorar sem conta
        </Link>

        <p className="text-[11px] text-white/25 leading-relaxed text-center mt-8">
          Ainda não existe servidor de contas: qualquer e-mail entra, e nada é
          enviado para fora deste navegador. A senha não é guardada.
        </p>
      </div>
    </div>
  );
}
