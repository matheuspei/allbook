# Agente de enriquecimento do AllBook

Este pacote completa as fichas de audiolivros: o ano da obra e o ano da
gravação (separados), os créditos que faltam, tradutor, título original,
série, idade, prateleira — e monta o perfil de autores, narradores e editoras,
com biografia e foto. Tudo com prova: cada dado vem com o endereço da página e a
frase de onde saiu.

## O que precisa

- **Node** 18 ou mais novo (`node --version`).
- **Claude Code** instalado e logado (`claude --version`). Ele roda em modo
  seguro: não lê configuração da máquina nem arquivo nenhum, só pesquisa na web.

## Como rodar

```sh
node rodar.mjs                 # tudo o que ainda não tem resultado
node rodar.mjs --paralelo 4    # quatro tarefas ao mesmo tempo
node conferir.mjs              # os avisos que dá para achar sem consultar nada
```

Opções do `rodar.mjs`: `--modelo` (padrão `opus`), `--esforco` (padrão `high`;
`max` para o mais forte), `--so livro|pessoa|editora`, `--tarefa <nome>`,
`--limite <n>`, `--teto-usd <n>` (corte por tarefa, padrão 6) e `--minutos <n>`
(corte por tarefa, padrão 30).

**Pode parar e voltar quando quiser.** Cada tarefa pronta vira um arquivo em
`resultados/` e não é refeita. Se a cota da conta acabar, o programa para
sozinho (código 75) sem estragar nada: espere a cota voltar e rode de novo.

## O que há aqui

| | |
|---|---|
| `tarefas/` | um arquivo por item (livro, pessoa, editora) — a entrada |
| `resultados/` | um arquivo por item pronto — **é isto que volta** |
| `erros/` | tarefas que falharam, com o motivo; apague o arquivo para tentar de novo |
| `registro.jsonl` | tempo e custo de cada tarefa |
| `instrucoes-*.md` | o que o agente recebe como instrução |
| `formatos.mjs` | o formato obrigatório de cada resposta |
| `prateleiras.json` | as prateleiras do app que o agente pode escolher |

## Ao terminar

Devolva a pasta `resultados/` (e o `registro.jsonl`). A importação no AllBook
confere tudo de novo antes de gravar qualquer coisa.
