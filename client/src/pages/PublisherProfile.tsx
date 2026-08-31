import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Library, PenLine, Mic, Building2, ChevronRight } from "lucide-react";

import BotaoDeAcompanhar from "@/components/BotaoDeAcompanhar";
import PageHeader from "@/components/PageHeader";
import PublisherMark from "@/components/PublisherMark";
import PersonAvatar, { hueDoNome } from "@/components/PersonAvatar";
import BookGrid from "@/components/BookGrid";
import ProfileComments from "@/components/ProfileComments";
import { findPublisher, otherPublishers, personSlugOf } from "@/lib/publishers";
import type { Book } from "@/lib/books";
import { findPerson } from "@/lib/people";
import { commentsForPublisher } from "@/lib/comments";

/**
 * Perfil de uma editora — quem publica os livros do catálogo.
 *
 * **Por que existe.** Autor e narrador já tinham perfil; a editora, que é a
 * terceira assinatura de todo audiolivro, não tinha nenhuma — o nome dela nem
 * aparecia na tela do livro. Quem gosta do trabalho de uma casa (a tradução dos
 * clássicos, a escolha de quem narra) não tinha onde ver o resto do catálogo
 * dela nem onde dizer o que achou.
 *
 * A tela é irmã de `PersonProfile`: mesmo cabeçalho tingido, mesmas estatísticas
 * e o mesmo bloco de comentários (`ProfileComments`, compartilhado). O que muda
 * é o miolo — além dos livros, ela lista **as pessoas** que a editora publica e
 * grava, cada uma levando ao perfil próprio.
 *
 * ⚠️ **Ela foi escrita para dez editoras de meia dúzia de títulos e agora atende
 * 692 do acervo real** (31/08, §4.148). A maior tem **1.448 livros** e centenas
 * de autores; despejar tudo de uma vez são 1.448 capas montadas na abertura da
 * tela, e o celular trava antes de a primeira aparecer. Daí os dois tetos daqui:
 * a grade abre com um punhado e cresce a pedido, e as fileiras de pessoas
 * mostram as mais publicadas, com a contagem inteira no cabeçalho da seção —
 * quem tem 300 autores continua vendo "300 autores", só não vê 300 fotos.
 */

/**
 * O número com o ponto de milhar do português.
 *
 * Não é preciosismo: a maior editora do acervo tem 1.447 títulos, e "1447
 * títulos" numa frase de apresentação parece código, não texto.
 */
function emNumero(n: number): string {
  return n.toLocaleString("pt-BR");
}

/** Quantos livros a grade mostra de saída, e quantos ela acrescenta por vez. */
const LIVROS_POR_VEZ = 24;

/**
 * Quantas pessoas cabem numa fileira que rola de lado.
 *
 * Não é limite de tela: é limite de sentido. Ninguém arrasta uma fileira
 * horizontal cem vezes — e a maior editora do acervo tem **663 autores**
 * (Editora Dialética) e outra tem **228 narradores** (Storyside). Passado este
 * número, a lista muda de forma: vira grade, que se percorre de cima para
 * baixo, que é a rolagem natural do celular.
 */
const PESSOAS_NA_FILEIRA = 24;

/**
 * Quantas pessoas a grade aberta mostra de saída.
 *
 * Maior que o punhado de livros (24) porque um avatar com nome custa muito
 * menos que um cartão com capa: cabe mais gente na tela antes de o desenho
 * pesar.
 */
const PESSOAS_POR_VEZ = 60;

/**
 * O próximo tamanho da lista: **dobra o que já está à vista**, sem passar de
 * `teto` itens novos de uma vez.
 *
 * ⚠️ Passo fixo não escala. Com +48 por toque, os 1.447 títulos da MK Editora
 * exigiriam **30 toques**, e os 663 autores da Dialética, 11 — chegar ao fim
 * virava trabalho. Dobrando, os mesmos 1.447 saem em 9 toques e os 663 em 4.
 *
 * O `teto` existe porque as duas listas custam coisas diferentes: uma capa é
 * uma imagem que o navegador vai buscar (240 delas já levam mais de um
 * segundo), enquanto um avatar é o nome desenhado em CSS. Daí livro ter teto e
 * pessoa não precisar.
 */
function proximoLote(atual: number, teto = Infinity): number {
  return atual + Math.min(atual, teto);
}

/** Quantas capas a mais, no máximo, um toque pode mandar montar de uma vez. */
const TETO_DE_CAPAS_POR_TOQUE = 240;
export default function PublisherProfile({ params }: { params: { slug: string } }) {
  const publisher = findPublisher(params.slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  if (!publisher) {
    return (
      <>
        <PageHeader title="Editora" />
        <div className="px-6 py-20 text-center">
          <p className="font-display text-lg font-bold text-white">Editora não encontrada</p>
          <p className="mt-2 text-sm text-white/50">
            Não há nenhuma editora com este endereço no catálogo do AllBook.
          </p>
        </div>
      </>
    );
  }

  const hue = hueDoNome(publisher.name);
  const comentarios = commentsForPublisher(publisher.slug);
  const outras = otherPublishers(publisher.slug);

  /**
   * A apresentação da editora.
   *
   * A `linha` curada vence quando existe — mas hoje ela não existe para
   * nenhuma: eram dez frases escritas à mão para dez editoras, e são 692 (ver
   * `lib/publishers.ts`). Na falta dela a tela **não inventa nada sobre a
   * empresa**: monta uma frase com o que o próprio catálogo do AllBook sabe.
   */
  const apresentacao =
    publisher.linha ??
    [
      `${emNumero(publisher.titles)} ${publisher.titles === 1 ? "título" : "títulos"} no AllBook`,
      publisher.genres.length > 0
        ? `, sobretudo em ${publisher.genres.slice(0, 2).join(" e ")}`
        : "",
      ".",
    ].join("");

  return (
    <div className="pb-10" data-testid="publisher-profile">
      <PageHeader title="Editora" />

      {/* Capa: a mesma lavagem de cor do perfil de pessoa, derivada do nome. */}
      <header className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-45"
          style={{
            background: `radial-gradient(115% 75% at 50% 0%, hsl(${hue} 70% 42%) 0%, transparent 68%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
        />

        <div className="relative flex flex-col items-center px-4 pb-6 pt-8 text-center">
          <PublisherMark name={publisher.name} size="xl" />

          <h1
            className="mt-4 font-display text-2xl font-bold tracking-tight text-white"
            data-testid="text-publisher-name"
          >
            {publisher.name}
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">{apresentacao}</p>

          {/* Seguir a editora — §4.84. */}
          <BotaoDeAcompanhar
            tipo="editora"
            slug={publisher.slug}
            nome={publisher.name}
            className="mt-5 w-full max-w-xs text-left"
          />

          <dl className="mt-6 grid w-full grid-cols-3 gap-2">
            <Estatistica
              rotulo={publisher.titles === 1 ? "Título" : "Títulos"}
              valor={emNumero(publisher.titles)}
            />
            <Estatistica rotulo="Nota média" valor={publisher.rating?.toFixed(1) ?? "—"} />
            <Estatistica
              rotulo={publisher.authors.length === 1 ? "Autor" : "Autores"}
              valor={String(publisher.authors.length)}
            />
          </dl>

          {publisher.genres.length > 0 && (
            /* Os seis gêneros mais frequentes, não todos: uma editora grande
               cobre vinte, e vinte pastilhas empurram a tela inteira para
               baixo antes de aparecer um livro sequer. */
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {publisher.genres.slice(0, 6).map((genero) => (
                <span
                  key={genero}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/60 ring-1 ring-white/10"
                >
                  {genero}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <Secao
        icone={<Library className="h-4 w-4 text-primary" />}
        titulo="No catálogo"
        contagem={`${emNumero(publisher.titles)} ${publisher.titles === 1 ? "título" : "títulos"}`}
        testid="section-publisher-books"
      >
        <GradeQueCresce key={publisher.slug} books={publisher.books} />
      </Secao>

      <Secao
        icone={<PenLine className="h-4 w-4 text-primary" />}
        titulo="Quem ela publica"
        contagem={`${publisher.authors.length} ${publisher.authors.length === 1 ? "autor" : "autores"}`}
        testid="section-publisher-authors"
      >
        <PessoasDaEditora
          key={`${publisher.slug}:autores`}
          nomes={publisher.authors}
          rotulo={publisher.authors.length === 1 ? "autor" : "autores"}
        />
      </Secao>

      <Secao
        icone={<Mic className="h-4 w-4 text-primary" />}
        titulo="Quem narra para ela"
        contagem={`${publisher.narrators.length} ${
          publisher.narrators.length === 1 ? "narrador" : "narradores"
        }`}
        testid="section-publisher-narrators"
      >
        <PessoasDaEditora
          key={`${publisher.slug}:narradores`}
          nomes={publisher.narrators}
          rotulo={publisher.narrators.length === 1 ? "narrador" : "narradores"}
        />
      </Secao>

      <ProfileComments
        comentarios={comentarios}
        alvo={{ publisherSlug: publisher.slug }}
        placeholder={`O que você acha do trabalho da ${publisher.name}?`}
        vazio={`Ninguém comentou sobre a ${publisher.name} ainda. Seja o primeiro.`}
        testid="section-publisher-comments"
      />

      {outras.length > 0 && (
        <Secao
          icone={<Building2 className="h-4 w-4 text-primary" />}
          titulo="Outras editoras"
          contagem={`${outras.length}`}
          testid="section-other-publishers"
        >
          <div className="space-y-2">
            {outras.map((editora) => (
              <Link
                key={editora.slug}
                href={`/publisher/${editora.slug}`}
                className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5 transition-colors hover:bg-white/10"
                data-testid={`link-publisher-${editora.slug}`}
              >
                <PublisherMark name={editora.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {editora.name}
                  </span>
                  <span className="block truncate text-[11px] text-white/40">
                    {editora.titles} {editora.titles === 1 ? "título" : "títulos"} ·{" "}
                    {editora.genres[0]}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
              </Link>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}

/**
 * O botão largo que abre ou estende uma lista.
 *
 * Existe extraído porque três lugares desta tela o usam — a grade de livros e
 * as duas listas de pessoas — e três cópias da mesma `className` de sete
 * classes é a receita para uma delas ficar diferente sem ninguém notar.
 */
function BotaoDaSecao({
  onClick,
  testid,
  children,
}: {
  onClick: () => void;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-white/10 active:bg-white/15"
      data-testid={testid}
    >
      {children}
    </button>
  );
}

/**
 * A grade de livros da editora, que começa curta e cresce a pedido.
 *
 * 🚨 **A alternativa era travar o celular.** `BookGrid` monta um cartão por
 * livro, cada um com a sua capa; a maior editora do acervo tem 1.448, e montar
 * 1.448 de uma vez congela a tela por segundos antes de a primeira aparecer.
 * Rolagem infinita resolveria também, mas custa um observador de rolagem e um
 * caso a mais para quem for mexer aqui — e o botão tem uma vantagem que ela não
 * tem: diz **quantos faltam**, que numa editora de mil títulos é a informação
 * mais útil da tela.
 */
function GradeQueCresce({ books }: { books: Book[] }) {
  const [mostrando, setMostrando] = useState(LIVROS_POR_VEZ);
  const visiveis = useMemo(() => books.slice(0, mostrando), [books, mostrando]);
  const faltam = books.length - visiveis.length;

  return (
    <div className="space-y-4">
      <BookGrid books={visiveis} showAuthor />
      {faltam > 0 && (
        <BotaoDaSecao
          onClick={() => setMostrando((quantos) => proximoLote(quantos, TETO_DE_CAPAS_POR_TOQUE))}
          testid="button-more-publisher-books"
        >
          Mostrar mais{" "}
          {faltam === 1
            ? "1 título"
            : `${emNumero(Math.min(faltam, mostrando, TETO_DE_CAPAS_POR_TOQUE))} títulos`}
          <span className="ml-1 text-white/40">
            ({emNumero(visiveis.length)} de {emNumero(books.length)})
          </span>
        </BotaoDaSecao>
      )}
    </div>
  );
}

/**
 * Autores ou narradores da editora — a fileira que sabe virar lista inteira.
 *
 * 🚨 **O cabeçalho da seção anuncia o total, então a tela tem de entregar o
 * total.** A primeira versão cortava em 24 e deixava o "49 autores" escrito
 * acima: quem arrastava até o fim da fileira não chegava aos outros 25 e não
 * havia nada dizendo que eles existiam. Número que promete o que a tela não dá
 * é beco sem saída — e o Matheus achou isso na Camelot Editora no mesmo dia.
 *
 * **Duas formas, e a lista escolhe entre elas pelo tamanho:**
 *
 * - **até 24, fileira** que rola de lado, como sempre foi. É a maioria absoluta:
 *   das 660 editoras, só 21 passam disso em autores e 15 em narradores.
 * - **acima disso, fileira + "Ver os 49 autores"**, que troca a fileira por uma
 *   **grade**. Fileira horizontal não serve para os extremos reais do acervo —
 *   663 autores na Editora Dialética, 228 narradores na Storyside: ninguém
 *   arrasta seiscentas vezes. Grade se percorre de cima para baixo, que é a
 *   rolagem que o polegar já faz.
 *
 * A grade também cresce por partes (60 por vez) e volta a fechar: aberta com
 * 663 pessoas, ela empurraria os comentários e as outras editoras para longe
 * demais de quem só queria dar uma olhada.
 */
function PessoasDaEditora({ nomes, rotulo }: { nomes: string[]; rotulo: string }) {
  const [aberta, setAberta] = useState(false);
  const [mostrando, setMostrando] = useState(PESSOAS_POR_VEZ);

  if (nomes.length <= PESSOAS_NA_FILEIRA) return <FileiraDePessoas nomes={nomes} />;

  if (!aberta) {
    return (
      <div className="space-y-3">
        <FileiraDePessoas nomes={nomes.slice(0, PESSOAS_NA_FILEIRA)} />
        <BotaoDaSecao onClick={() => setAberta(true)} testid={`button-all-${rotulo}`}>
          Ver {emNumero(nomes.length)} {rotulo}
        </BotaoDaSecao>
      </div>
    );
  }

  const visiveis = nomes.slice(0, mostrando);
  const faltam = nomes.length - visiveis.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-x-3 gap-y-4">
        {visiveis.map((nome) => (
          <CartaoDePessoa key={nome} nome={nome} />
        ))}
      </div>
      {faltam > 0 ? (
        <BotaoDaSecao
          onClick={() => setMostrando(proximoLote)}
          testid={`button-more-${rotulo}`}
        >
          Mostrar mais {emNumero(Math.min(faltam, mostrando))}
          <span className="ml-1 text-white/40">
            ({emNumero(visiveis.length)} de {emNumero(nomes.length)})
          </span>
        </BotaoDaSecao>
      ) : (
        <BotaoDaSecao
          onClick={() => {
            setAberta(false);
            setMostrando(PESSOAS_POR_VEZ);
          }}
          testid={`button-collapse-${rotulo}`}
        >
          Recolher
        </BotaoDaSecao>
      )}
    </div>
  );
}

/** A fileira que rola de lado — a forma curta, para as listas que cabem nela. */
function FileiraDePessoas({ nomes }: { nomes: string[] }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {nomes.map((nome) => (
        <CartaoDePessoa key={nome} nome={nome} naFileira />
      ))}
    </div>
  );
}

/**
 * Uma pessoa, levando ao perfil dela. O mesmo cartão nas duas formas.
 *
 * ⚠️ Na fileira ele tem largura fixa e não encolhe (`w-20 shrink-0`); na grade
 * quem manda na largura é a coluna. Fora isso é o mesmo desenho, de propósito:
 * o cartão não pode mudar de cara quando a lista muda de forma.
 */
function CartaoDePessoa({ nome, naFileira = false }: { nome: string; naFileira?: boolean }) {
  const slug = personSlugOf(nome);
  const pessoa = findPerson(slug);
  return (
    <Link
      href={`/person/${slug}`}
      className={`flex flex-col items-center gap-2 text-center ${naFileira ? "w-20 shrink-0" : ""}`}
      data-testid={`link-person-${slug}`}
    >
      <PersonAvatar name={nome} photo={pessoa?.photo} size="md" />
      <span className="text-[11px] leading-snug text-white/70 line-clamp-2">{nome}</span>
    </Link>
  );
}

/** Mesmo tratamento de superfície dos cartões da tela Estatísticas. */
function Estatistica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 px-2 py-3">
      <dd className="font-display text-xl font-bold text-white">{valor}</dd>
      <dt className="mt-0.5 text-[10px] uppercase tracking-wide text-white/40">{rotulo}</dt>
    </div>
  );
}

function Secao({
  icone,
  titulo,
  contagem,
  testid,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  contagem: string;
  testid: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 px-4 pt-7" data-testid={testid}>
      <h2 className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
        {icone}
        {titulo}
        <span className="ml-auto text-xs font-normal text-white/40">{contagem}</span>
      </h2>
      {children}
    </section>
  );
}
