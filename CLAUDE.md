# AllBook

App de audiolivros em PT-BR, com a cara do Audible/Storytel (catálogo e player)
e a descoberta do Netflix. A ideia de longo prazo é narrar sob demanda o livro
que ainda não existe em áudio, mas **o lançamento sai sem isso** (§4.171): não
proponha botão nem fluxo de "pedir narração".

O Matheus tem pouca experiência em programação: linguagem simples, e termo
técnico explicado em uma frase. A interface é toda em PT-BR.

## Rodar

- O servidor é o LaunchAgent `com.allbook.devserver` (http://localhost:3000):
  `zsh scripts/servidor-servico.sh status | iniciar | reiniciar | logs`. Mexeu em
  `server/`, `reiniciar`; o frontend recarrega sozinho.
- Não rode `npm run dev` solto na sessão (morre junto com a janela) nem junto
  com `scripts/servidor.sh` (os dois brigam pela porta 3000).
- `npm run check` (erros de tipo), `npm run build`, `npm run audio`; o resto
  está no `package.json`.

## Antes de mexer, leia o que for do assunto

- **Tela, cor ou tema** → `docs/IDENTIDADE-VISUAL.md`. Nunca escreva cor
  literal: só tokens (`bg-background`, `text-primary`, `border-border`).
- **Catálogo, acervo, capítulos, editora/autor/narrador, gêneros, prateleiras,
  busca, banco no app, áudio, rotas, prévia de celular** → `docs/ARMADILHAS.md`,
  uma seção por assunto.
- **Banco, backend ou contas** → `docs/BANCO-DE-DADOS.md`.
- Decisões em vigor: `docs/ROTEIRO.md` (histórico em `docs/ROTEIRO-ARQUIVO.md`).
  Decisão de rumo ou ideia descartada vai para lá na hora, com o motivo.

## Onde ficam as coisas

- Telas em `client/src/pages/` (rotas no `App.tsx`), layout em
  `client/src/components/layout/`, estado em `client/src/lib/`, servidor Express
  em `server/`, schema Drizzle em `shared/schema/`.
- `client/public/_*.html` são folhas de proposta: ele decide clicando, e elas
  respondem em `/api/folha/respostas`. Ficam fora do git — não apague.
- Atalhos: `@/` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.

## Duas janelas

Na primeira tarefa da sessão, antes de editar, leia `docs/COORDENACAO.md` e
registre-se numa faixa livre (sozinho, assuma a Janela A). Nunca edite arquivo
que a outra janela declarou.

## Git

- Commit só dos seus arquivos (`git add <caminho>`); nunca `git add -A`, `git add .`
  nem `git commit -a`. `git pull --rebase` antes.
- O hook `.githooks/post-commit` publica no GitHub a cada commit
  (`matheuspei/allbook`, `main`).
- Terminou uma tela ou etapa: commit e uma frase dizendo o que foi salvo.

## Limites

A prioridade é o frontend. Não reescreva tela que funciona sem pedido e não
reorganize as pastas.
