#!/bin/zsh
# Sobe o servidor do AllBook (http://localhost:3000).
#
# Por que este arquivo existe: o servidor precisa rodar num terminal SEU, e não
# dentro de uma sessão do Claude Code. Quando o Claude sobe o servidor, o
# processo fica no mesmo grupo da sessão dele — aí, ao fechar/reiniciar o
# Claude, o sistema mata o grupo inteiro e o servidor cai junto. Rodando por
# aqui, o dono do processo é o Terminal, e ele sobrevive a isso.
#
# Uso: dê um duplo clique no arquivo, ou rode `zsh scripts/servidor.sh`.

cd "$(dirname "$0")/.." || exit 1
echo "AllBook — subindo o servidor em http://localhost:3000"
echo "Para parar: Ctrl+C. Para fechar: feche esta janela."
echo ""
exec npm run dev
