import { and, eq, notInArray, sql } from "drizzle-orm";
import type { Express, NextFunction, Request, Response } from "express";

import {
  ajustes,
  assinaturas,
  audicaoDia,
  audicaoPorHora,
  audicaoPorLivro,
  avaliacoes,
  biblioteca,
  conquistas,
  contas,
  livros,
  marcacoes,
  pedidos,
  progresso,
  recomendacoes,
  trechosGuardados,
  type Conta,
} from "@shared/schema";
import { db } from "./db";

/**
 * OS DADOS DA PESSOA — a biblioteca, o progresso, o diário, as notas, as
 * marcações e os trechos guardados.
 *
 * Etapa 3 do banco (08/08, §4.121). É a camada que o `docs/BANCO-DE-DADOS.md`
 * chama de "a que mais dói se sumir", e por isso vem antes do resto.
 *
 * ---
 *
 * ## O formato que entra e sai daqui é o DO NAVEGADOR
 *
 * Cada rota fala exatamente o formato das chaves `allbook_*`
 * (`[{ id, addedAt }]`, `{ [id]: ISO }`, `{ dia: { sec, horas, livros } }`…), e
 * a conversão para as tabelas acontece **aqui dentro**.
 *
 * É de propósito: assim o front continua sendo um espelho burro do que já
 * existe, e **nenhuma das 22 telas que leem `playback.ts` precisa mudar**. Se a
 * conversão morasse no navegador, cada tela teria de conhecer o formato do banco
 * — e a migração viraria uma reescrita do app inteiro.
 *
 * ⚠️ **Limite conhecido desta etapa: quem escreve por último ganha.** Cada
 * assunto é gravado inteiro, não item a item. Com dois aparelhos abertos ao
 * mesmo tempo, o segundo a salvar pode desfazer o que o primeiro fez. O app
 * baixa antes de subir, o que fecha quase toda a janela — mas ela existe, e o
 * conserto de verdade (gravar por item, com carimbo) fica para quando houver
 * gente usando em dois aparelhos ao mesmo tempo.
 */

/** Recusa quem não está logado. Dado de pessoa não sai sem sessão. */
function exigirConta(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ erro: "Entre na sua conta." });
  return next();
}

function contaDe(req: Request): string {
  return (req.user as Conta).id;
}

/**
 * Os ids de livro que existem no catálogo.
 *
 * ⚠️ **Filtrar por isto não é paranoia.** As tabelas têm chave estrangeira para
 * `livros`, então um id que não existe faria a gravação inteira falhar — e o
 * navegador de quem testou o app carrega ids de livros que já saíram do
 * catálogo. Sem o filtro, uma biblioteca antiga impediria a pessoa de salvar
 * qualquer coisa, para sempre, sem explicação nenhuma na tela.
 */
async function idsValidos(): Promise<Set<number>> {
  const linhas = await db.select({ id: livros.id }).from(livros);
  return new Set(linhas.map((l) => l.id));
}

function comoTexto(valor: unknown, reserva: string): string {
  return typeof valor === "string" && valor ? valor : reserva;
}

function comoData(valor: unknown): Date {
  const data = new Date(comoTexto(valor, ""));
  return Number.isNaN(data.getTime()) ? new Date() : data;
}

/* -------------------------------------------------------------------------- */

export function registrarDados(app: Express) {
  /**
   * Tudo de uma vez, **no formato do navegador**.
   *
   * Uma chamada só, e não seis: é o que roda quando a pessoa entra, e seis
   * idas à rede em sequência atrasariam a tela de forma visível.
   */
  app.get("/api/dados", exigirConta, async (req, res, next) => {
    try {
      const conta = contaDe(req);

      const [
        itens,
        progressos,
        notas,
        marcas,
        trechos,
        dias,
        horas,
        porLivro,
        trofeus,
        recomendados,
        pedidosDela,
        [assinatura],
        [preferencias],
      ] = await Promise.all([
        db.select().from(biblioteca).where(eq(biblioteca.contaId, conta)),
        db.select().from(progresso).where(eq(progresso.contaId, conta)),
        db.select().from(avaliacoes).where(eq(avaliacoes.contaId, conta)),
        db.select().from(marcacoes).where(eq(marcacoes.contaId, conta)),
        db.select().from(trechosGuardados).where(eq(trechosGuardados.contaId, conta)),
        db.select().from(audicaoDia).where(eq(audicaoDia.contaId, conta)),
        db.select().from(audicaoPorHora).where(eq(audicaoPorHora.contaId, conta)),
        db.select().from(audicaoPorLivro).where(eq(audicaoPorLivro.contaId, conta)),
        db.select().from(conquistas).where(eq(conquistas.contaId, conta)),
        db.select().from(recomendacoes).where(eq(recomendacoes.contaId, conta)),
        db.select().from(pedidos).where(eq(pedidos.contaId, conta)),
        db.select().from(assinaturas).where(eq(assinaturas.contaId, conta)).limit(1),
        db.select().from(ajustes).where(eq(ajustes.contaId, conta)).limit(1),
      ]);

      /* O diário volta a ser o JSON aninhado que `listening.ts` espera. */
      const diario: Record<string, any> = {};
      for (const d of dias) {
        diario[d.dia] = { sec: d.segundos, horas: {}, livros: {}, exemplo: d.exemplo };
      }
      for (const h of horas) {
        if (diario[h.dia]) diario[h.dia].horas[h.hora] = h.segundos;
      }
      for (const l of porLivro) {
        if (diario[l.dia]) diario[l.dia].livros[l.livroId] = l.segundos;
      }

      /* Concluídos é um mapa `{ id: ISO }` à parte do progresso, como no front. */
      const concluidos: Record<string, string> = {};
      for (const p of progressos) {
        if (p.concluidoEm) concluidos[p.livroId] = p.concluidoEm.toISOString();
      }

      return res.json({
        allbook_library: itens.map((i) => ({ id: i.livroId, addedAt: i.adicionadoEm.toISOString() })),
        allbook_playback: progressos
          /*
           * ⚠️ **Só entra quem tem progresso de verdade.** As duas chaves
           * (`playback` e `finished`) dividem a tabela, então marcar um livro
           * como concluído cria a linha mesmo sem nunca ter tocado o player —
           * e sem este filtro ele apareceria em "Continuar ouvindo" com 0%,
           * convidando a pessoa a retomar um livro que ela terminou.
           */
          .filter((p) => p.duracaoSegundos > 0 || p.posicaoSegundos > 0)
          .map((p) => ({
            bookId: p.livroId,
            chapter: p.capitulo,
            positionSec: p.posicaoSegundos,
            durationSec: p.duracaoSegundos,
            updatedAt: p.atualizadoEm.toISOString(),
          }))
          // A lista do front é do mais recente para o mais antigo.
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        allbook_finished: concluidos,
        allbook_listening: diario,
        allbook_ratings: notas.map((n) => ({
          bookId: n.livroId,
          historia: n.historia ?? undefined,
          narracao: n.narracao ?? undefined,
          updatedAt: n.atualizadoEm.toISOString(),
        })),
        allbook_bookmarks: marcas.map((m) => ({
          // O id do navegador vence: é ele que mantém a identidade dos dois lados.
          id: m.idLocal ?? m.id,
          bookId: m.livroId,
          positionSec: m.posicaoSegundos,
          chapter: m.capitulo,
          note: m.nota,
          createdAt: m.criadoEm.toISOString(),
        })),
        allbook_trechos_guardados: trechos.map((t) => ({
          id: t.idLocal ?? t.id,
          bookId: t.livroId,
          inicioSec: t.inicioSegundos,
          duracaoSec: t.duracaoSegundos,
          nota: t.nota ?? undefined,
          guardadoEm: t.guardadoEm.toISOString(),
        })),

        /* ---- §4.122: quem a pessoa é, e o que é só dela ---- */

        /**
         * ⚠️ **O e-mail NÃO vai aqui, de propósito.** Ele é o login, e mora em
         * `contas`. Se ele viajasse por esta rota, editar o perfil num aparelho
         * poderia trocar o e-mail de acesso da pessoa sem ela perceber.
         */
        allbook_profile: {
          name: (req.user as Conta).nome,
          photo: (req.user as Conta).foto ?? "",
          bio: (req.user as Conta).bio ?? "",
        },

        allbook_settings: preferencias
          ? {
              speed: preferencias.velocidade,
              mostrarOuvindoAgora: preferencias.mostrarOuvindoAgora,
              mostrarMeusClubes: preferencias.mostrarMeusClubes,
              contaPrivada: preferencias.contaPrivada,
              mostrarMeusComentarios: preferencias.mostrarMeusComentarios,
              mostrarMeuCapitulo: preferencias.mostrarMeuCapitulo,
              mostrarQuemAcompanho: preferencias.mostrarQuemAcompanho,
              avisarCurtidas: preferencias.avisarCurtidas,
              avisarComentarios: preferencias.avisarComentarios,
            }
          : null,

        allbook_weekly_goal: preferencias?.metaSemanalMinutos ?? null,

        allbook_achievements_won: Object.fromEntries(
          trofeus.map((t) => [t.chave, t.ganhoEm.toISOString()]),
        ),

        allbook_recommendations: recomendados.map((r) => ({
          id: r.livroId,
          note: r.nota,
          date: r.recomendadoEm.toISOString(),
        })),

        allbook_book_requests: pedidosDela.map((p) => ({
          // O id do navegador vence — sem isto, cada sincronização duplica o pedido.
          id: p.idLocal ?? p.id,
          title: p.titulo,
          author: p.autor ?? undefined,
          note: p.observacao ?? undefined,
          voiceSlug: p.vozSlug ?? undefined,
          date: p.criadoEm.toISOString(),
          status: p.situacao,
        })),

        allbook_assinatura: assinatura
          ? {
              plano: assinatura.plano,
              creditos: assinatura.creditos,
              boasVindas: assinatura.boasVindas === "sim",
              boasVindasUsado: assinatura.boasVindasUsado === "sim",
              ultimaRecarga: assinatura.ultimaRecarga,
            }
          : null,
      });
    } catch (erro) {
      return next(erro);
    }
  });

  /**
   * Grava um assunto inteiro. O corpo é `{ chave, valor }`, com a **chave do
   * navegador** — o front manda o que ele já tem, sem traduzir nada.
   */
  app.put("/api/dados", exigirConta, async (req, res, next) => {
    const { chave, valor } = req.body ?? {};
    if (typeof chave !== "string") return res.status(400).json({ erro: "Falta a chave." });

    try {
      const conta = contaDe(req);
      const validos = await idsValidos();

      switch (chave) {
        case "allbook_library": {
          const itens = (Array.isArray(valor) ? valor : [])
            .map((i: any) => ({
              contaId: conta,
              livroId: Number(i?.id),
              adicionadoEm: comoData(i?.addedAt),
            }))
            .filter((i) => validos.has(i.livroId));

          await db.transaction(async (tx) => {
            await tx.delete(biblioteca).where(eq(biblioteca.contaId, conta));
            if (itens.length) await tx.insert(biblioteca).values(itens);
          });
          break;
        }

        case "allbook_playback":
        case "allbook_finished": {
          /*
           * ⚠️ **As duas chaves gravam na MESMA tabela**, e por isso não podem
           * apagar uma à outra: `allbook_playback` traz posição e capítulo,
           * `allbook_finished` traz só a data de conclusão. Um `delete` antes de
           * gravar zeraria metade da linha a cada salvamento — o livro
           * concluído voltaria a "em andamento" sozinho.
           */
          if (chave === "allbook_playback") {
            const lista = (Array.isArray(valor) ? valor : [])
              .map((p: any) => ({
                contaId: conta,
                livroId: Number(p?.bookId),
                posicaoSegundos: Math.max(0, Math.round(Number(p?.positionSec) || 0)),
                capitulo: Math.max(1, Math.round(Number(p?.chapter) || 1)),
                duracaoSegundos: Math.max(0, Math.round(Number(p?.durationSec) || 0)),
                atualizadoEm: comoData(p?.updatedAt),
              }))
              .filter((p) => validos.has(p.livroId));

            for (const p of lista) {
              await db
                .insert(progresso)
                .values(p)
                .onConflictDoUpdate({
                  target: [progresso.contaId, progresso.livroId],
                  set: {
                    posicaoSegundos: p.posicaoSegundos,
                    capitulo: p.capitulo,
                    duracaoSegundos: p.duracaoSegundos,
                    atualizadoEm: p.atualizadoEm,
                  },
                });
            }

            // O que saiu da lista do navegador (a pessoa removeu do "Continuar
            // ouvindo") sai daqui também — mas só se não estiver concluído, que
            // é informação de outra chave.
            //
            // (`notInArray` do Drizzle, e não um `sql` cru com `<> all(...)`: o
            // template não expande array em lista de parâmetros, e a consulta
            // falhava com "delete from progresso where livro_id <> all(($2))".)
            const idsQueFicam = lista.map((p) => p.livroId);
            await db
              .delete(progresso)
              .where(
                and(
                  eq(progresso.contaId, conta),
                  sql`${progresso.concluidoEm} is null`,
                  idsQueFicam.length ? notInArray(progresso.livroId, idsQueFicam) : undefined,
                ),
              );
          } else {
            const mapa = valor && typeof valor === "object" ? (valor as Record<string, string>) : {};
            for (const [id, quando] of Object.entries(mapa)) {
              const livroId = Number(id);
              if (!validos.has(livroId)) continue;
              await db
                .insert(progresso)
                .values({ contaId: conta, livroId, concluidoEm: comoData(quando) })
                .onConflictDoUpdate({
                  target: [progresso.contaId, progresso.livroId],
                  set: { concluidoEm: comoData(quando) },
                });
            }
          }
          break;
        }

        case "allbook_listening": {
          const diario = valor && typeof valor === "object" ? (valor as Record<string, any>) : {};

          await db.transaction(async (tx) => {
            await tx.delete(audicaoDia).where(eq(audicaoDia.contaId, conta));
            await tx.delete(audicaoPorHora).where(eq(audicaoPorHora.contaId, conta));
            await tx.delete(audicaoPorLivro).where(eq(audicaoPorLivro.contaId, conta));

            const dias: any[] = [];
            const horas: any[] = [];
            const porLivro: any[] = [];

            for (const [dia, valorDoDia] of Object.entries(diario)) {
              const segundos = Math.max(0, Math.round(Number(valorDoDia?.sec) || 0));
              if (!segundos) continue;

              /*
               * ⚠️ **O histórico de DEMONSTRAÇÃO não entra na conta** (08/08,
               * §4.122). O app semeia 42 dias de audição falsa para as
               * Estatísticas não nascerem vazias (`allbook_listening_seeded`), e
               * cada um vem marcado com `exemplo: true`. Isso é uma peça de
               * vitrine local; deixá-la subir gravaria no servidor um histórico
               * que a pessoa nunca viveu — e, pior, ele passaria a atravessar
               * aparelhos, ficando indistinguível do real.
               *
               * O checklist já mandava: *"semeadura tem de morrer em
               * produção"*. Aqui ela para na porta do banco.
               */
              if (valorDoDia?.exemplo === true) continue;

              dias.push({ contaId: conta, dia, segundos, exemplo: false });

              // (os dois recortes abaixo só existem para dias reais — o `continue`
              //  acima já barrou os de exemplo antes de chegar aqui)
              for (const [hora, seg] of Object.entries(valorDoDia?.horas ?? {})) {
                const h = Number(hora);
                if (h < 0 || h > 23) continue;
                horas.push({ contaId: conta, dia, hora: h, segundos: Math.round(Number(seg) || 0) });
              }
              for (const [id, seg] of Object.entries(valorDoDia?.livros ?? {})) {
                const livroId = Number(id);
                if (!validos.has(livroId)) continue;
                porLivro.push({
                  contaId: conta,
                  dia,
                  livroId,
                  segundos: Math.round(Number(seg) || 0),
                });
              }
            }

            if (dias.length) await tx.insert(audicaoDia).values(dias);
            if (horas.length) await tx.insert(audicaoPorHora).values(horas);
            if (porLivro.length) await tx.insert(audicaoPorLivro).values(porLivro);
          });
          break;
        }

        case "allbook_ratings": {
          const notas = (Array.isArray(valor) ? valor : [])
            .map((n: any) => ({
              contaId: conta,
              livroId: Number(n?.bookId),
              historia: n?.historia == null ? null : Number(n.historia),
              narracao: n?.narracao == null ? null : Number(n.narracao),
              atualizadoEm: comoData(n?.updatedAt),
            }))
            .filter((n) => validos.has(n.livroId));

          await db.transaction(async (tx) => {
            await tx.delete(avaliacoes).where(eq(avaliacoes.contaId, conta));
            if (notas.length) await tx.insert(avaliacoes).values(notas);
          });
          break;
        }

        case "allbook_bookmarks": {
          /* ⚠️ Texto escrito pela pessoa: perder uma nota é perder trabalho dela. */
          const marcas = (Array.isArray(valor) ? valor : [])
            .map((m: any) => ({
              contaId: conta,
              livroId: Number(m?.bookId),
              posicaoSegundos: Math.max(0, Math.round(Number(m?.positionSec) || 0)),
              capitulo: Math.max(1, Math.round(Number(m?.chapter) || 1)),
              nota: comoTexto(m?.note, ""),
              idLocal: comoTexto(m?.id, "") || null,
              criadoEm: comoData(m?.createdAt),
            }))
            .filter((m) => validos.has(m.livroId));

          await db.transaction(async (tx) => {
            await tx.delete(marcacoes).where(eq(marcacoes.contaId, conta));
            if (marcas.length) await tx.insert(marcacoes).values(marcas);
          });
          break;
        }

        case "allbook_trechos_guardados": {
          /* ⚠️ Também texto da pessoa — e a `nota` daqui é PRIVADA por regra. */
          const trechos = (Array.isArray(valor) ? valor : [])
            .map((t: any) => ({
              contaId: conta,
              livroId: Number(t?.bookId),
              inicioSegundos: Math.max(0, Math.round(Number(t?.inicioSec) || 0)),
              duracaoSegundos: Math.max(0, Math.round(Number(t?.duracaoSec) || 0)),
              nota: typeof t?.nota === "string" ? t.nota : null,
              idLocal: comoTexto(t?.id, "") || null,
              guardadoEm: comoData(t?.guardadoEm),
            }))
            .filter((t) => validos.has(t.livroId));

          await db.transaction(async (tx) => {
            await tx.delete(trechosGuardados).where(eq(trechosGuardados.contaId, conta));
            if (trechos.length) await tx.insert(trechosGuardados).values(trechos);
          });
          break;
        }

        /* ---- §4.122 ---- */

        case "allbook_profile": {
          const p = (valor ?? {}) as Record<string, unknown>;
          const mudanca: Record<string, unknown> = {};
          if (typeof p.name === "string" && p.name.trim()) mudanca.nome = p.name.trim();
          if (typeof p.photo === "string") mudanca.foto = p.photo || null;
          if (typeof p.bio === "string") mudanca.bio = p.bio.slice(0, 300);
          /*
           * ⚠️ **`email` é ignorado de propósito.** Ele é o login. Trocá-lo é
           * uma operação de conta (confirmação por e-mail, checar duplicidade),
           * não um efeito colateral de salvar o perfil.
           *
           * ⚠️ **`foto` ainda é uma `data:` URL** — uns 40 KB de base64 dentro
           * da linha, carregados em toda leitura de perfil. Funciona e mantém a
           * foto atravessando aparelhos, que é o que importa agora; vira upload
           * de arquivo quando houver onde subir (anotado no esquema).
           */
          if (Object.keys(mudanca).length) {
            await db.update(contas).set(mudanca).where(eq(contas.id, conta));
          }
          break;
        }

        case "allbook_settings": {
          const s = (valor ?? {}) as Record<string, unknown>;
          const bool = (v: unknown, campo: string) =>
            typeof v === "boolean" ? { [campo]: v } : {};
          const mudanca = {
            ...(typeof s.speed === "number" ? { velocidade: s.speed } : {}),
            ...bool(s.mostrarOuvindoAgora, "mostrarOuvindoAgora"),
            ...bool(s.mostrarMeusClubes, "mostrarMeusClubes"),
            ...bool(s.contaPrivada, "contaPrivada"),
            ...bool(s.mostrarMeusComentarios, "mostrarMeusComentarios"),
            ...bool(s.mostrarMeuCapitulo, "mostrarMeuCapitulo"),
            ...bool(s.mostrarQuemAcompanho, "mostrarQuemAcompanho"),
            ...bool(s.avisarCurtidas, "avisarCurtidas"),
            ...bool(s.avisarComentarios, "avisarComentarios"),
          };
          if (Object.keys(mudanca).length) {
            await db.update(ajustes).set(mudanca).where(eq(ajustes.contaId, conta));
          }
          break;
        }

        case "allbook_weekly_goal": {
          const minutos = Math.round(Number(valor));
          if (Number.isFinite(minutos) && minutos > 0) {
            await db
              .update(ajustes)
              .set({ metaSemanalMinutos: minutos })
              .where(eq(ajustes.contaId, conta));
          }
          break;
        }

        case "allbook_achievements_won": {
          const mapa = valor && typeof valor === "object" ? (valor as Record<string, string>) : {};
          const linhas = Object.entries(mapa).map(([ch, quando]) => ({
            contaId: conta,
            chave: ch,
            ganhoEm: comoData(quando),
          }));
          await db.transaction(async (tx) => {
            await tx.delete(conquistas).where(eq(conquistas.contaId, conta));
            if (linhas.length) await tx.insert(conquistas).values(linhas);
          });
          break;
        }

        case "allbook_recommendations": {
          const linhas = (Array.isArray(valor) ? valor : [])
            .map((r: any) => ({
              contaId: conta,
              livroId: Number(r?.id),
              nota: comoTexto(r?.note, ""),
              recomendadoEm: comoData(r?.date),
            }))
            .filter((r) => validos.has(r.livroId));

          await db.transaction(async (tx) => {
            await tx.delete(recomendacoes).where(eq(recomendacoes.contaId, conta));
            if (linhas.length) await tx.insert(recomendacoes).values(linhas);
          });
          break;
        }

        case "allbook_book_requests": {
          /*
           * ⚠️ **A `situacao` que vem do navegador é ignorada.** Hoje o pedido
           * nasce e permanece em `recebido` porque não há fila (armadilha 2.6);
           * quando o estúdio existir, quem move o pedido é **ele**, e aceitar a
           * etapa vinda do navegador deixaria qualquer um se declarar "pronto".
           * Pedido que já está no banco não é rebaixado.
           */
          const linhas = (Array.isArray(valor) ? valor : [])
            .map((p: any) => ({
              titulo: comoTexto(p?.title, "").slice(0, 120),
              autor: comoTexto(p?.author, "") || null,
              observacao: comoTexto(p?.note, "").slice(0, 300) || null,
              vozSlug: comoTexto(p?.voiceSlug, "") || null,
              idLocal: comoTexto(p?.id, "") || null,
              criadoEm: comoData(p?.date),
            }))
            .filter((p) => p.titulo);

          await db.transaction(async (tx) => {
            // Só os que ainda não saíram da fila: o que o estúdio já mexeu fica.
            await tx
              .delete(pedidos)
              .where(and(eq(pedidos.contaId, conta), eq(pedidos.situacao, "recebido")));
            if (linhas.length) {
              await tx.insert(pedidos).values(linhas.map((p) => ({ ...p, contaId: conta })));
            }
          });
          break;
        }

        case "allbook_assinatura": {
          const a = (valor ?? {}) as Record<string, unknown>;
          const planos = ["nenhum", "ouvir", "pedir", "pedirMais"];
          const mudanca = {
            ...(typeof a.plano === "string" && planos.includes(a.plano)
              ? { plano: a.plano as "nenhum" | "ouvir" | "pedir" | "pedirMais" }
              : {}),
            ...(Number.isFinite(Number(a.creditos))
              ? { creditos: Math.max(0, Math.round(Number(a.creditos))) }
              : {}),
            ...(typeof a.boasVindas === "boolean"
              ? { boasVindas: (a.boasVindas ? "sim" : "nao") as "sim" | "nao" }
              : {}),
            ...(typeof a.boasVindasUsado === "boolean"
              ? { boasVindasUsado: (a.boasVindasUsado ? "sim" : "nao") as "sim" | "nao" }
              : {}),
            ...(typeof a.ultimaRecarga === "string" ? { ultimaRecarga: a.ultimaRecarga } : {}),
            atualizadoEm: new Date(),
          };
          await db.update(assinaturas).set(mudanca).where(eq(assinaturas.contaId, conta));
          break;
        }

        default:
          return res.status(400).json({ erro: `Não sei guardar "${chave}".` });
      }

      return res.json({ ok: true });
    } catch (erro) {
      return next(erro);
    }
  });
}
