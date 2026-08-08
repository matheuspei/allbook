import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
  MIN_PASSWORD,
  isValidEmail,
  pedirRedefinicao,
  redefinirSenha,
  signIn,
  signUp,
} from "@/lib/auth";

/**
 * Entrar / Criar conta (`/login`).
 *
 * Tela cheia, sem os menus: quem está aqui ainda não escolheu para onde ir.
 *
 * **O app não é trancado atrás desta tela.** Dá para explorar o catálogo inteiro
 * sem conta — o botão "Explorar sem conta" existe para isso. Um muro de login na
 * porta de entrada é o que mais afasta gente num app de catálogo. Quando houver
 * áudio e cobrança, o muro passa a ser no player, não na entrada.
 *
 * **Mudou em 08/08 (§4.120): a senha passou a valer.** Antes, qualquer e-mail
 * entrava; agora o servidor confere de verdade, e por isso apareceram coisas que
 * a tela não tinha: espera enquanto a rede responde, erro vindo do servidor, e o
 * **"Esqueci minha senha"** — que tinha sido *removido* em 25/07 (§4.23) porque
 * não havia senha para recuperar. Ele volta agora que há.
 *
 * **A redefinição mora nesta mesma tela**, em `/login?token=…`, e não numa rota
 * nova: uma rota exigiria mexer no `App.tsx`, que é de outra janela do Claude —
 * e a tela de "escolher senha nova" é este mesmo formulário com um campo só.
 */

type Modo = "entrar" | "criar" | "esqueci" | "redefinir";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  /** O token do link de redefinição, quando a pessoa chega por ele. */
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") ?? "");

  const [modo, setModo] = useState<Modo>(token ? "redefinir" : "entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  /** Só mostra erro depois da primeira tentativa: não repreende quem ainda está digitando. */
  const [tried, setTried] = useState(false);
  const [enviando, setEnviando] = useState(false);
  /** O erro que veio do servidor ("E-mail ou senha não conferem"). */
  const [erroDoServidor, setErroDoServidor] = useState("");
  /** Enquanto não há envio de e-mail, o link de redefinição aparece aqui. */
  const [linkDeTeste, setLinkDeTeste] = useState("");

  const criando = modo === "criar";
  const esquecendo = modo === "esqueci";
  const redefinindo = modo === "redefinir";

  /* Cada modo pede campos diferentes — daí os erros serem condicionais. */
  const pedeNome = criando;
  const pedeEmail = !redefinindo;
  const pedeSenha = !esquecendo;

  const nameError = pedeNome && name.trim().length === 0 ? "Diga como quer ser chamado." : "";
  const emailError = pedeEmail && !isValidEmail(email) ? "Esse e-mail não parece completo." : "";
  const passwordError =
    pedeSenha && password.length < MIN_PASSWORD
      ? `A senha precisa de pelo menos ${MIN_PASSWORD} caracteres.`
      : "";
  const hasError = Boolean(nameError || emailError || passwordError);

  function trocarModo(proximo: Modo) {
    setModo(proximo);
    setTried(false);
    setPassword("");
    setErroDoServidor("");
    setLinkDeTeste("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    setErroDoServidor("");
    if (hasError || enviando) return;

    setEnviando(true);
    try {
      if (criando) {
        await signUp(name, email, password);
        toast({ title: "Conta criada", description: "Bem-vindo ao AllBook." });
        setLocation("/");
      } else if (esquecendo) {
        const { link } = await pedirRedefinicao(email);
        // A resposta é a mesma exista ou não a conta — de propósito, para esta
        // tela não virar um jeito de descobrir quem tem cadastro aqui.
        toast({
          title: "Pedido registrado",
          description: "Se existir uma conta com esse e-mail, o link de troca vale por 1 hora.",
        });
        if (link) setLinkDeTeste(link);
      } else if (redefinindo) {
        await redefinirSenha(token, password);
        toast({ title: "Senha trocada", description: "Agora é só entrar com ela." });
        trocarModo("entrar");
        // Tira o token da barra de endereço: ele já foi usado e não vale mais.
        window.history.replaceState(null, "", "/login");
      } else {
        await signIn(email, password);
        toast({ title: "Você entrou" });
        setLocation("/");
      }
    } catch (erro) {
      setErroDoServidor(erro instanceof Error ? erro.message : "Não consegui falar com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  const fieldClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-colors placeholder:text-white/25";
  const labelClass = "block text-xs font-semibold text-white/40 uppercase tracking-wider";

  const titulo = criando
    ? "Criar sua conta"
    : esquecendo
      ? "Esqueci minha senha"
      : redefinindo
        ? "Escolher uma senha nova"
        : "Entrar";

  const subtitulo = criando
    ? "Sua biblioteca e seu progresso ficam guardados."
    : esquecendo
      ? "Diga o e-mail da conta e mandamos o link de troca."
      : redefinindo
        ? "Digite a senha que você vai usar daqui para frente."
        : "Continue de onde você parou.";

  const rotuloDoBotao = criando
    ? "Criar conta"
    : esquecendo
      ? "Enviar link"
      : redefinindo
        ? "Trocar a senha"
        : "Entrar";

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
          <h1 className="text-2xl font-bold font-display tracking-tight mt-6">{titulo}</h1>
          <p className="text-sm text-white/40 mt-1.5">{subtitulo}</p>
        </header>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {pedeNome && (
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
              {tried && nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
          )}

          {pedeEmail && (
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
              {tried && emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
          )}

          {pedeSenha && (
            <div className="space-y-2">
              <label htmlFor="password" className={labelClass}>
                {redefinindo ? "Senha nova" : "Senha"}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={criando || redefinindo ? "new-password" : "current-password"}
                  placeholder={
                    criando || redefinindo ? `Pelo menos ${MIN_PASSWORD} caracteres` : "Sua senha"
                  }
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
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
              {tried && passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>
          )}

          {/*
            "Esqueci minha senha" VOLTOU (08/08, §4.120). Ele tinha sido removido
            em 25/07 porque não existia senha para recuperar — não estava "por
            construir", estaria mentindo sobre como o login funcionava. Agora há
            servidor de contas, e ele deixa de ser mentira.
          */}
          {modo === "entrar" && (
            <button
              type="button"
              onClick={() => trocarModo("esqueci")}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
              data-testid="button-forgot-password"
            >
              Esqueci minha senha
            </button>
          )}

          {erroDoServidor && (
            <p className="text-xs text-destructive" data-testid="text-login-error" role="alert">
              {erroDoServidor}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            data-testid="button-login-submit"
          >
            {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
            {rotuloDoBotao}
          </button>
        </form>

        {/*
          O link aparece na tela porque **ainda não há envio de e-mail**. Dizer
          isso é melhor do que um "enviamos um e-mail" que nunca chega — o mesmo
          princípio que tirou este link da tela em 25/07.
        */}
        {linkDeTeste && (
          <div
            className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4"
            data-testid="box-reset-link"
          >
            <p className="text-xs text-white/40 leading-relaxed">
              Ainda não existe envio de e-mail, então o link de troca vem aqui. Ele vale por 1 hora
              e só pode ser usado uma vez.
            </p>
            <Link
              href={linkDeTeste}
              className="mt-2 block text-xs font-semibold text-primary break-all hover:underline"
              data-testid="link-reset-password"
            >
              {linkDeTeste}
            </Link>
          </div>
        )}

        {(modo === "entrar" || criando) && (
          <p className="text-sm text-white/40 text-center mt-6">
            {criando ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
            <button
              onClick={() => trocarModo(criando ? "entrar" : "criar")}
              className="font-semibold text-primary hover:underline"
              data-testid="button-switch-mode"
            >
              {criando ? "Entrar" : "Criar agora"}
            </button>
          </p>
        )}

        {(esquecendo || redefinindo) && (
          <p className="text-sm text-white/40 text-center mt-6">
            <button
              onClick={() => trocarModo("entrar")}
              className="font-semibold text-primary hover:underline"
              data-testid="button-back-to-login"
            >
              Voltar para entrar
            </button>
          </p>
        )}

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

        {/*
          Este texto já mentiu uma vez: escrito na §4.120, ele prometia que a
          biblioteca subiria "na próxima etapa" — e ela subiu na §4.121, sem
          ninguém voltar aqui. Ficar de olho nele a cada mudança de camada.
        */}
        <p className="text-[11px] text-white/25 leading-relaxed text-center mt-8">
          Sua senha é guardada cifrada e nunca sai daqui em texto. Com conta, sua
          biblioteca, seu progresso, suas notas e seus trechos ficam guardados e voltam
          em qualquer aparelho.
        </p>
      </div>
    </div>
  );
}
