import { and, eq, notInArray, sql } from "drizzle-orm";
import type { Express, NextFunction, Request, Response } from "express";

import {
  audicaoDia,
  audicaoPorHora,
  audicaoPorLivro,
  avaliacoes,
  biblioteca,
  livros,
  marcacoes,
  progresso,
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

      const [itens, progressos, notas, marcas, trechos, dias, horas, porLivro] = await Promise.all([
        db.select().from(biblioteca).where(eq(biblioteca.contaId, conta)),
        db.select().from(progresso).where(eq(progresso.contaId, conta)),
        db.select().from(avaliacoes).where(eq(avaliacoes.contaId, conta)),
        db.select().from(marcacoes).where(eq(marcacoes.contaId, conta)),
        db.select().from(trechosGuardados).where(eq(trechosGuardados.contaId, conta)),
        db.select().from(audicaoDia).where(eq(audicaoDia.contaId, conta)),
        db.select().from(audicaoPorHora).where(eq(audicaoPorHora.contaId, conta)),
        db.select().from(audicaoPorLivro).where(eq(audicaoPorLivro.contaId, conta)),
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
              dias.push({ contaId: conta, dia, segundos, exemplo: valorDoDia?.exemplo === true });

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

        default:
          return res.status(400).json({ erro: `Não sei guardar "${chave}".` });
      }

      return res.json({ ok: true });
    } catch (erro) {
      return next(erro);
    }
  });
}

/**
 * As chaves que esta camada sincroniza — a lista que o front também usa.
 *
 * ⚠️ **`allbook_downloads` NÃO está aqui, e a ausência é a decisão** (seção 1 do
 * checklist): baixado é **do aparelho**, não da conta — o arquivo está *naquele*
 * celular. Sincronizar faria o tablet de alguém anunciar como baixado um arquivo
 * que só existe no telefone.
 *
 * Também ficam de fora, por serem estado de tela: `allbook_miniplayer`,
 * `allbook_playing`, `allbook_library_view` e `allbook_library_sort`.
 */
export const CHAVES_SINCRONIZADAS = [
  "allbook_library",
  "allbook_playback",
  "allbook_finished",
  "allbook_listening",
  "allbook_ratings",
  "allbook_bookmarks",
  "allbook_trechos_guardados",
] as const;
