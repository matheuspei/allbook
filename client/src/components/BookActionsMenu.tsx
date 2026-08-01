import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Download, Library as LibraryIcon, Megaphone, Mic, Play, Plus, Share2, User } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { catalog, findGenreBySlug, slugify } from "@/lib/books";
import { findPerson } from "@/lib/people";
import { isRecommended as estaRecomendado, toggleRecommendation } from "@/lib/recommendations";
import {
  addDownload,
  addToLibrary as salvarNaBiblioteca,
  isDownloaded as estaBaixado,
  isInLibrary,
  removeFromLibrary,
} from "@/lib/library";

/**
 * O menu "Mais" (os três pontinhos) de um livro.
 *
 * Nasceu dentro do `BookDetails` e virou componente porque a Início precisava
 * do mesmo menu: lá os três pontinhos do cartão de "Continuar ouvindo" existiam
 * mas **não faziam nada** — botão que não responde ensina a pessoa a desconfiar
 * do resto da tela.
 *
 * Quem usa passa só o id do livro; o menu descobre sozinho o que já está
 * baixado, na lista e recomendado. `acoesExtras` deixa cada tela acrescentar o
 * que só faz sentido nela — é por ali que a Início põe "Tirar de Continuar
 * ouvindo".
 */

/** Uma linha do menu. Fecha a folha ao ser tocada — menos quando desabilitada,
 *  porque aí nada aconteceu e fechar confundiria. */
export function AcaoDoMenu({
  icone: Icone,
  rotulo,
  aoClicar,
  desabilitado = false,
}: {
  icone: React.ComponentType<{ className?: string }>;
  rotulo: string;
  aoClicar: () => void;
  desabilitado?: boolean;
}) {
  const botao = (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      className="flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left text-[15px] text-white transition-colors hover:bg-white/5 active:bg-white/10 disabled:opacity-40"
      data-testid={`menu-action-${rotulo}`}
    >
      <Icone className="h-5 w-5 shrink-0 text-white/60" />
      {rotulo}
    </button>
  );

  return desabilitado ? botao : <DrawerClose asChild>{botao}</DrawerClose>;
}

export interface AcaoExtra {
  icone: React.ComponentType<{ className?: string }>;
  rotulo: string;
  aoClicar: () => void;
}

export default function BookActionsMenu({
  bookId,
  legenda,
  acoesExtras = [],
  children,
}: {
  bookId: number | string;
  /** Segunda linha do cabeçalho da folha. Sem ela, mostra o autor. */
  legenda?: string;
  acoesExtras?: AcaoExtra[];
  /** O que abre o menu. Sem isso, os três pontinhos padrão. */
  children: React.ReactNode;
}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // A URL do livro usa o id como texto; a lista e os downloads (lib/library.ts)
  // trabalham com o id em número.
  const id = String(bookId);
  const idNumerico = Number(bookId);
  const book = catalog.find((item) => String(item.id) === id);

  const [isAdded, setIsAdded] = useState(() => isInLibrary(idNumerico));
  const [isDownloaded, setIsDownloaded] = useState(() => estaBaixado(idNumerico));
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecommended, setIsRecommended] = useState(() => estaRecomendado(Number(bookId)));

  // Um livro fora do catálogo não tem o que oferecer.
  if (!book) return <>{children}</>;

  // Só entram os atalhos que levam a algum lugar de verdade.
  const autor = findPerson(slugify(book.author));
  const narrador = findPerson(slugify(book.narrator));
  const genero = findGenreBySlug(slugify(book.genre));

  function addToLibrary() {
    if (isAdded) {
      removeFromLibrary(idNumerico);
      setIsAdded(false);
      toast({ title: "Removido", description: "O livro saiu da sua biblioteca." });
      return;
    }

    salvarNaBiblioteca(idNumerico);
    setIsAdded(true);
    toast({ title: "Adicionado!", description: `${book!.title} agora está na sua biblioteca.` });
  }

  /**
   * O "download" é encenado: não existe arquivo de áudio para baixar ainda.
   * O que ele faz de real é gravar o id em `allbook_downloads`, que a tela
   * Downloads lê.
   */
  function handleDownload() {
    if (isDownloaded || isDownloading) return;
    setIsDownloading(true);

    setTimeout(() => {
      addDownload(idNumerico);
      setIsDownloading(false);
      setIsDownloaded(true);
      toast({
        title: "Download concluído",
        description: "O livro ficou disponível na tela Downloads.",
      });
    }, 1500);
  }

  function toggleRecomendar() {
    const proximos = toggleRecommendation(Number(bookId));
    const agora = proximos.includes(Number(bookId));
    setIsRecommended(agora);
    toast({
      title: agora ? "Recomendado!" : "Removido das recomendações",
      description: agora
        ? `${book!.title} agora aparece no seu perfil.`
        : `${book!.title} saiu do seu perfil.`,
    });
  }

  /**
   * `navigator.share` abre a folha nativa, mas só existe em celular e em
   * contexto seguro. No computador caímos para copiar o link.
   */
  async function compartilhar() {
    const url = `${window.location.origin}/book/${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: book!.title,
          text: `${book!.title}, de ${book!.author}, no AllBook.`,
          url,
        });
      } catch {
        // A pessoa fechou a folha nativa. Não é erro, não avisa nada.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado", description: "Agora é só colar onde quiser." });
    } catch {
      toast({ title: "Não consegui copiar o link", description: url });
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      {/*
        A folha é desenhada num portal, fora da moldura de celular da prévia,
        então sem limite ela ocuparia a largura toda da janela. O teto de 480px
        não afeta celular nenhum (o mais largo tem 440px).
      */}
      <DrawerContent className="mx-auto max-w-[480px] border-white/10 bg-[#1a1a1a]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-display tracking-tight text-white">{book.title}</DrawerTitle>
          <DrawerDescription className="text-white/50">{legenda ?? book.author}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-0.5 px-4 pb-8">
          <AcaoDoMenu
            icone={Play}
            rotulo="Ouvir agora"
            aoClicar={() => setLocation(`/player/${book.id}`)}
          />
          <AcaoDoMenu
            icone={isAdded ? Check : Plus}
            rotulo={isAdded ? "Tirar da Minha lista" : "Adicionar à Minha lista"}
            aoClicar={addToLibrary}
          />
          <AcaoDoMenu
            icone={Download}
            rotulo={
              isDownloaded
                ? "Já baixado"
                : isDownloading
                  ? "Baixando…"
                  : "Baixar para ouvir offline"
            }
            aoClicar={handleDownload}
            desabilitado={isDownloaded || isDownloading}
          />
          <AcaoDoMenu
            icone={isRecommended ? Check : Megaphone}
            rotulo={isRecommended ? "Deixar de recomendar" : "Recomendar para a comunidade"}
            aoClicar={toggleRecomendar}
          />
          <AcaoDoMenu icone={Share2} rotulo="Compartilhar" aoClicar={compartilhar} />

          {(autor || narrador || acoesExtras.length > 0) && (
            <div className="my-2 h-px bg-white/10" />
          )}

          {autor && (
            <AcaoDoMenu
              icone={User}
              rotulo={`Ver perfil de ${book.author}`}
              aoClicar={() => setLocation(`/person/${autor.slug}`)}
            />
          )}
          {narrador && (
            <AcaoDoMenu
              icone={Mic}
              rotulo={`Ver perfil de ${book.narrator}`}
              aoClicar={() => setLocation(`/person/${narrador.slug}`)}
            />
          )}
          {genero && (
            <AcaoDoMenu
              icone={LibraryIcon}
              rotulo={`Ver mais de ${genero}`}
              aoClicar={() => setLocation(`/category/${slugify(genero)}`)}
            />
          )}

          {acoesExtras.map((acao) => (
            <AcaoDoMenu
              key={acao.rotulo}
              icone={acao.icone}
              rotulo={acao.rotulo}
              aoClicar={acao.aoClicar}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
