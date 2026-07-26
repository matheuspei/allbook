#!/bin/zsh
#
# Endereço público temporário para mostrar o AllBook a alguém distante.
#
# Cria um "túnel" da Cloudflare: um endereço https que qualquer pessoa, em
# qualquer lugar, abre no navegador — e que chega no app rodando NESTA máquina,
# na porta 3000. Não precisa de conta e não publica nada em lugar nenhum.
#
# COMO USAR
#   zsh scripts/tunel.sh
#   → ele imprime um endereço tipo https://algo-aleatorio.trycloudflare.com
#   Mande esse endereço para a pessoa. Deixe esta janela do Terminal ABERTA.
#   Ctrl+C encerra o túnel e o endereço morre na hora.
#
# O QUE ESPERAR
#   - O endereço é NOVO a cada vez que você roda. Não dá para guardar.
#   - Só funciona com este computador ligado, o servidor no ar e este comando
#     rodando. Fechou o Terminal, acabou.
#   - Quem tiver o endereço entra. Não há senha. Por isso: mande para quem você
#     quer, e encerre quando terminar a demonstração.
#   - Para um link permanente, que funciona com o computador desligado, o
#     caminho é publicar o site (Vercel/Netlify/Cloudflare Pages) — outra
#     conversa, e exige conta sua.
#
# ARMADILHA JÁ VIVIDA (26/07): em rede que filtra DNS — a desta máquina é uma
# delas —, o PRÓPRIO dono do link não consegue abri-lo, porque o nome
# `trycloudflare.com` não é resolvido ali dentro. Isso NÃO quer dizer que está
# quebrado: quem está fora dessa rede abre normalmente. Para conferir com os
# próprios olhos, use o celular em dados móveis (4G/5G, Wi-Fi desligado).

set -uo pipefail

PORTA=3000

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared não está instalado. Instale uma vez com:"
  echo "  brew install cloudflared"
  exit 1
fi

if ! curl -s -o /dev/null --max-time 3 "http://localhost:$PORTA/"; then
  echo "O app não está respondendo em http://localhost:$PORTA"
  echo "Suba o servidor primeiro:  zsh scripts/servidor-servico.sh status"
  exit 1
fi

echo "Criando o endereço público… (pode levar alguns segundos)"
echo "Para encerrar, aperte Ctrl+C nesta janela."
echo

exec cloudflared tunnel --url "http://localhost:$PORTA" --no-autoupdate
