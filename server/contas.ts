import connectPgSimple from "connect-pg-simple";
import { eq, sql } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import { ajustes, assinaturas, contas, redefinicoesDeSenha, type Conta } from "@shared/schema";
import { db, pool } from "./db";
import { cifrar, conferir, novoToken, resumoDeToken } from "./senha";

/**
 * CONTAS DE VERDADE — cadastrar, entrar, sair e redefinir senha.
 *
 * Etapa 2 do banco (08/08, §4.120), na ordem do `docs/BANCO-DE-DADOS.md`.
 *
 * **O que muda de verdade:** até aqui `lib/auth.ts` deixava **qualquer e-mail
 * entrar** e nunca guardava senha — não havia com o que conferir. Agora há.
 *
 * ⚠️ **O app continua NÃO sendo trancado atrás do login.** "Explorar sem conta"
 * segue valendo, e quem nunca entrou não perde nada: um muro na porta de entrada
 * é o que mais afasta gente num app de catálogo. Quando houver áudio e cobrança,
 * o muro passa a ser no player.
 */

/**
 * Diz ao TypeScript que `req.user` é uma `Conta`.
 *
 * Sem isto, o Passport tipa `req.user` como um objeto vazio e cada leitura de
 * `req.user.nome` precisaria de um `as` — que é justamente o tipo de conversão
 * que esconde erro de verdade quando o formato mudar.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends Conta {}
  }
}

/* -------------------------------------------------------------------------- */
/* Sessão                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A sessão fica **no banco**, não na memória do processo.
 *
 * `memorystore` está instalado, mas guardaria as sessões dentro do Node — e o
 * servidor deste projeto reinicia a cada mexida em `server/` (é um serviço do
 * launchd). Com sessão em memória, **todo reinício derrubaria todo mundo**, que
 * é a mesma classe de problema do `MemStorage` que acabou de morrer.
 */
function sessaoMiddleware() {
  const PgSession = connectPgSimple(session);
  const segredo = process.env.SESSION_SECRET;

  if (!segredo) {
    throw new Error(
      "Falta o SESSION_SECRET no `.env`. Gere um com: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }

  return session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: false }),
    secret: segredo,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JavaScript da página não lê o cookie — trava o roubo por XSS
      sameSite: "lax", // o cookie não viaja em pedido vindo de outro site
      secure: process.env.NODE_ENV === "production", // só por HTTPS quando publicado
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    },
  });
}

/* -------------------------------------------------------------------------- */
/* O endereço público (@username) — armadilha 2.9                              */
/* -------------------------------------------------------------------------- */

/**
 * "Maria Souza" → "maria-souza". **A mesma regra do `meuSlug()`** de
 * `lib/profile.ts`, de propósito: quem já tinha um link compartilhado continua
 * com o mesmo endereço depois de criar conta.
 */
function slugDoNome(nome: string): string {
  return (
    nome
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "leitor"
  );
}

/**
 * Um `username` livre, a partir do nome.
 *
 * ⚠️ **Ele é escolhido uma vez e CONGELA** (armadilha 2.9). Hoje o endereço é
 * recalculado do nome a cada leitura — a pessoa troca o nome e **todo link que
 * ela já mandou morre em silêncio**. Aqui ele vira coluna: nasce daqui e não
 * muda sozinho nunca mais.
 *
 * Empate resolve com número (`matheus`, `matheus-2`, `matheus-3`): duas pessoas
 * chamadas Matheus não podem dividir `/user/matheus`, e sem contas essa disputa
 * simplesmente não existia.
 */
async function usernameLivre(nome: string): Promise<string> {
  const base = slugDoNome(nome);
  for (let tentativa = 1; tentativa <= 200; tentativa++) {
    const candidato = tentativa === 1 ? base : `${base}-${tentativa}`;
    const [ocupado] = await db
      .select({ id: contas.id })
      .from(contas)
      .where(eq(contas.username, candidato))
      .limit(1);
    if (!ocupado) return candidato;
  }
  // 200 Matheus é improvável; ainda assim, melhor um sufixo feio que um erro.
  return `${base}-${Date.now()}`;
}

/* -------------------------------------------------------------------------- */
/* O que o front recebe                                                        */
/* -------------------------------------------------------------------------- */

/** ⚠️ **Nunca devolver `senhaHash`.** Este é o único formato que sai daqui. */
function paraOFront(conta: Conta) {
  return {
    id: conta.id,
    nome: conta.nome,
    email: conta.email,
    username: conta.username,
    foto: conta.foto,
    bio: conta.bio,
    desde: conta.criadoEm,
  };
}

/* -------------------------------------------------------------------------- */
/* Criar a conta                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Cria a conta **e as duas linhas que andam com ela**, numa transação só:
 * `ajustes` (as preferências, com os padrões do `lib/settings.ts`) e
 * `assinaturas` (plano nenhum, zero crédito).
 *
 * ⚠️ **A transação importa.** Se a conta entrasse e os ajustes falhassem, a
 * pessoa existiria sem preferências — e cada tela que lesse `ajustes` receberia
 * vazio, sem erro nenhum, escolhendo o padrão errado em silêncio.
 *
 * ⚠️ **`boasVindas` nasce `nao`, e é de propósito** (§4.118): o pedido de
 * boas-vindas só aparece quando a **assinatura** entra, nunca no cadastro —
 * senão dá para abusar criando contas.
 */
async function criarConta(nome: string, email: string, senha: string): Promise<Conta> {
  const username = await usernameLivre(nome);
  const senhaHash = await cifrar(senha);

  return db.transaction(async (tx) => {
    const [conta] = await tx
      .insert(contas)
      .values({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senhaHash,
        username,
        entrouEm: new Date(),
      })
      .returning();

    await tx.insert(ajustes).values({ contaId: conta.id });
    await tx.insert(assinaturas).values({ contaId: conta.id });

    return conta;
  });
}

/* -------------------------------------------------------------------------- */
/* Passport                                                                    */
/* -------------------------------------------------------------------------- */

function configurarPassport() {
  passport.use(
    new LocalStrategy({ usernameField: "email", passwordField: "senha" }, async (email, senha, pronto) => {
      try {
        const [conta] = await db
          .select()
          .from(contas)
          .where(eq(contas.email, String(email).trim().toLowerCase()))
          .limit(1);

        /*
         * ⚠️ **A mesma mensagem para e-mail que não existe e para senha errada.**
         * Distinguir os dois transformaria a tela de login numa forma de
         * descobrir quem tem conta no AllBook — basta digitar e-mails e ler a
         * resposta.
         */
        if (!conta) return pronto(null, false);
        if (!(await conferir(senha, conta.senhaHash))) return pronto(null, false);

        await db.update(contas).set({ entrouEm: new Date() }).where(eq(contas.id, conta.id));
        return pronto(null, conta);
      } catch (erro) {
        return pronto(erro as Error);
      }
    }),
  );

  // Na sessão vai só o id; o resto é relido do banco a cada pedido. Guardar a
  // conta inteira no cookie faria o nome antigo sobreviver a uma troca de nome.
  passport.serializeUser((conta: any, pronto) => pronto(null, (conta as Conta).id));

  passport.deserializeUser(async (id: string, pronto) => {
    try {
      const [conta] = await db.select().from(contas).where(eq(contas.id, id)).limit(1);
      return pronto(null, conta ?? false);
    } catch (erro) {
      return pronto(erro as Error);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* As rotas                                                                    */
/* -------------------------------------------------------------------------- */

const MIN_SENHA = 6;

function emailValido(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function registrarContas(app: Express) {
  app.use(sessaoMiddleware());
  configurarPassport();
  app.use(passport.initialize());
  app.use(passport.session());

  /** Quem está logado neste navegador? `conta: null` quando ninguém. */
  app.get("/api/contas/eu", (req: Request, res: Response) => {
    const conta = req.user as Conta | undefined;
    return res.json({ conta: conta ? paraOFront(conta) : null });
  });

  app.post("/api/contas/cadastrar", async (req: Request, res: Response, next) => {
    const { nome, email, senha } = req.body ?? {};

    if (typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({ erro: "Diga como quer ser chamado." });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ erro: "Esse e-mail não parece completo." });
    }
    if (typeof senha !== "string" || senha.length < MIN_SENHA) {
      return res.status(400).json({ erro: `A senha precisa de pelo menos ${MIN_SENHA} caracteres.` });
    }

    try {
      const [jaExiste] = await db
        .select({ id: contas.id })
        .from(contas)
        .where(eq(contas.email, email.trim().toLowerCase()))
        .limit(1);

      if (jaExiste) {
        /*
         * Aqui **dizer a verdade é o certo**, ao contrário do login: a pessoa
         * está tentando criar uma conta e precisa saber que já tem uma, senão
         * fica presa tentando de novo. (O vazamento é o mesmo, mas o dano de
         * esconder é maior que o de contar — e todo app faz assim.)
         */
        return res.status(409).json({ erro: "Já existe uma conta com esse e-mail. Tente entrar." });
      }

      const conta = await criarConta(nome, email, senha);

      // `req.login` é do Passport: cria a sessão para a pessoa já entrar
      // cadastrada, em vez de digitar tudo de novo na tela seguinte.
      req.login(conta, (erro) => {
        if (erro) return next(erro);
        return res.status(201).json({ conta: paraOFront(conta) });
      });
    } catch (erro) {
      return next(erro);
    }
  });

  app.post("/api/contas/entrar", (req: Request, res: Response, next) => {
    passport.authenticate("local", (erro: unknown, conta: Conta | false) => {
      if (erro) return next(erro);
      if (!conta) return res.status(401).json({ erro: "E-mail ou senha não conferem." });

      req.login(conta, (falha) => {
        if (falha) return next(falha);
        return res.json({ conta: paraOFront(conta) });
      });
    })(req, res, next);
  });

  app.post("/api/contas/sair", (req: Request, res: Response, next) => {
    req.logout((erro) => {
      if (erro) return next(erro);
      // Destruir a sessão além de deslogar: sem isso a linha continua no banco
      // até expirar, guardando o rastro de quem estava ali.
      req.session.destroy(() => res.json({ ok: true }));
    });
  });

  /* ---- Esqueci minha senha (armadilha 2.3) ---- */

  /**
   * ⚠️ **Este link foi REMOVIDO da tela em 25/07** (§4.23) porque não existia
   * senha para recuperar — não era item de lista de espera, era o app não
   * mentir. Com esta rota ele deixa de ser mentira e **volta ao `Login.tsx`**.
   *
   * ⚠️ **Ainda não há envio de e-mail**, e isso está dito na cara da tela: em
   * desenvolvimento o link volta **na própria resposta**. Quando houver serviço
   * de e-mail, é só parar de devolver o campo `link` e mandar a mensagem — o
   * resto (token de uso único, resumo no banco, prazo de 1 hora) já está pronto.
   */
  app.post("/api/contas/esqueci", async (req: Request, res: Response, next) => {
    const { email } = req.body ?? {};
    if (!emailValido(email)) return res.status(400).json({ erro: "Esse e-mail não parece completo." });

    try {
      const [conta] = await db
        .select()
        .from(contas)
        .where(eq(contas.email, email.trim().toLowerCase()))
        .limit(1);

      /*
       * ⚠️ **Responde igual exista ou não a conta.** Se a resposta mudasse, esta
       * rota viraria um verificador de e-mails cadastrados — e nem exige senha
       * para ser usada.
       */
      if (!conta) return res.json({ ok: true });

      const { token, hash } = novoToken();
      const umaHora = new Date(Date.now() + 60 * 60 * 1000);

      await db.insert(redefinicoesDeSenha).values({
        contaId: conta.id,
        tokenHash: hash,
        expiraEm: umaHora,
      });

      const emDesenvolvimento = process.env.NODE_ENV !== "production";
      return res.json({
        ok: true,
        // Some sozinho em produção: lá o link vai por e-mail.
        ...(emDesenvolvimento ? { link: `/login?token=${token}` } : {}),
      });
    } catch (erro) {
      return next(erro);
    }
  });

  app.post("/api/contas/redefinir", async (req: Request, res: Response, next) => {
    const { token, senha } = req.body ?? {};

    if (typeof token !== "string" || !token) {
      return res.status(400).json({ erro: "Link inválido." });
    }
    if (typeof senha !== "string" || senha.length < MIN_SENHA) {
      return res.status(400).json({ erro: `A senha precisa de pelo menos ${MIN_SENHA} caracteres.` });
    }

    try {
      const [pedido] = await db
        .select()
        .from(redefinicoesDeSenha)
        .where(eq(redefinicoesDeSenha.tokenHash, resumoDeToken(token)))
        .limit(1);

      // As três recusas dão a MESMA mensagem: dizer "expirou" ou "já foi usado"
      // conta a quem tem o link que ele já valeu alguma coisa.
      const invalido = !pedido || pedido.usadoEm || pedido.expiraEm.getTime() < Date.now();
      if (invalido) {
        return res.status(400).json({ erro: "Esse link não vale mais. Peça outro." });
      }

      const senhaHash = await cifrar(senha);

      await db.transaction(async (tx) => {
        await tx.update(contas).set({ senhaHash }).where(eq(contas.id, pedido.contaId));
        await tx
          .update(redefinicoesDeSenha)
          .set({ usadoEm: new Date() })
          .where(eq(redefinicoesDeSenha.id, pedido.id));

        /*
         * ⚠️ **Os outros pedidos em aberto dessa conta morrem junto.** Sem isso,
         * um link antigo — que pode estar na caixa de entrada de quem invadiu o
         * e-mail — continuaria trocando a senha depois de a pessoa já ter
         * recuperado a conta.
         */
        await tx
          .update(redefinicoesDeSenha)
          .set({ usadoEm: new Date() })
          .where(
            sql`${redefinicoesDeSenha.contaId} = ${pedido.contaId} and ${redefinicoesDeSenha.usadoEm} is null`,
          );
      });

      return res.json({ ok: true });
    } catch (erro) {
      return next(erro);
    }
  });
}
