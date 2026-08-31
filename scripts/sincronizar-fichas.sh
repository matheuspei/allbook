#!/bin/zsh
#
# O que o baixalivro corrigir na ficha chega ao AllBook sozinho (31/08, §4.148).
#
# ## Por que existe
#
# O acervo do `baixalivro` continua sendo corrigido depois de o livro já ter
# entrado aqui — hoje o caso concreto é a **editora**, que falta em ~9% dos
# livros e que um agente de lá ainda vai atrás. Sem isto, a correção feita lá
# só chegaria ao app de duas formas: reimportando os 13.917 livros (caro: copia
# capa, relê capítulo, mede com ffprobe) ou alguém lembrando de rodar um
# comando.
#
# 🚨 **A segunda não é uma opção.** Foi o próprio Matheus quem apontou: "eu
# tenho medo de esquecer de rodar esse comando". Comando que depende de memória
# humana é comando que não roda, e o app ficaria mostrando editora velha sem
# ninguém perceber. Por isso isto é um **serviço do sistema**, como a cópia de
# segurança do banco (`backup-banco.sh`) já é: roda uma vez por dia, sozinho.
#
# Uso:
#   zsh scripts/sincronizar-fichas.sh agora        # sincroniza na hora
#   zsh scripts/sincronizar-fichas.sh instalar     # agenda o diário (uma vez só)
#   zsh scripts/sincronizar-fichas.sh situacao     # o serviço está no ar?
#   zsh scripts/sincronizar-fichas.sh logs         # o que a última passada fez
#   zsh scripts/sincronizar-fichas.sh desinstalar
#
# ⚠️ **Ele NÃO importa livro novo.** Livro que ainda não está no AllBook entra
# pelo `npm run acervo importar`, que é a operação cara e que se quer ver
# rodar. Este aqui só reconcilia o que já entrou — e por isso pode rodar todo
# dia sem ninguém olhar.

set -euo pipefail

# O `launchd` roda com um PATH mínimo, sem o Homebrew dentro. Sem esta linha o
# `npm` não é encontrado e o serviço falha calado, todo dia, para sempre.
export PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

PROJETO="${0:A:h:h}"
ROTULO=com.allbook.fichas
PLIST="$HOME/Library/LaunchAgents/$ROTULO.plist"
LOG="$HOME/Library/Logs/allbook-fichas.log"
# O mesmo padrão de `script/importar-acervo.ts`: o acervo mora num disco
# externo, e o caminho pode ser trocado pelo .env.
ACERVO="${ACERVO_RAIZ:-$HOME/Acervo}"

agora() {
  cd "$PROJETO"

  # O acervo mora num disco externo. Desmontado, não há o que sincronizar — e
  # sair em silêncio é o certo: um serviço diário que grita quando o disco não
  # está plugado vira barulho que se aprende a ignorar.
  if [[ ! -f "$ACERVO/_catalogo/catalogo.sqlite" ]]; then
    echo "[$(date '+%F %T')] acervo fora do ar ($ACERVO) — nada a fazer"
    return 0
  fi

  echo "[$(date '+%F %T')] sincronizando as fichas do acervo"
  npm run --silent acervo fichas
  echo "[$(date '+%F %T')] fim"
}

instalar() {
  mkdir -p "$HOME/Library/LaunchAgents" "$(dirname "$LOG")"
  cat > "$PLIST" <<PLISTFIM
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$ROTULO</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/zsh</string>
        <string>$PROJETO/scripts/sincronizar-fichas.sh</string>
        <string>agora</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJETO</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key><integer>5</integer>
        <key>Minute</key><integer>30</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$LOG</string>
    <key>StandardErrorPath</key>
    <string>$LOG</string>
</dict>
</plist>
PLISTFIM

  # ⚠️ Sem `RunAtLoad`, ao contrário do backup: a varredura lê 14 mil arquivos
  # do disco externo, e disparar isso a cada login (ou a cada reinstalação do
  # serviço) é trabalho pesado na hora em que a máquina está mais ocupada. Se o
  # Mac estiver dormindo às 5h30, o launchd roda assim que ele acordar.
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST"
  echo "Serviço $ROTULO instalado — roda todo dia às 5h30."
  echo "Registro em $LOG"
}

desinstalar() {
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Serviço $ROTULO removido."
}

situacao() {
  # ⚠️ A linha é guardada numa variável em vez de `launchctl list | grep -q`:
  # com `pipefail`, o `grep -q` fecha o cano assim que acha, o `launchctl`
  # morre de SIGPIPE e o pipeline inteiro é dado como falho — o serviço no ar
  # aparecia como "fora do ar".
  local linha
  linha=$(launchctl list | grep "$ROTULO" || true)
  if [[ -n "$linha" ]]; then
    echo "no ar:"
    echo "$linha"
  else
    echo "fora do ar — instale com: zsh scripts/sincronizar-fichas.sh instalar"
  fi
  if [[ -f "$LOG" ]]; then
    echo
    echo "última passada:"
    tail -12 "$LOG"
  fi
}

case "${1:-agora}" in
  agora)       agora ;;
  instalar)    instalar ;;
  desinstalar) desinstalar ;;
  situacao)    situacao ;;
  logs)        tail -60 "$LOG" ;;
  *) echo "uso: zsh scripts/sincronizar-fichas.sh [agora|instalar|situacao|logs|desinstalar]"; exit 1 ;;
esac
