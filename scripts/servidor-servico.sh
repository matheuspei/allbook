#!/bin/zsh
# Gerencia o servidor do AllBook como um SERVIÇO do macOS (launchd).
#
# Por que existe: o servidor vivia caindo. A causa (ver CLAUDE.md) é o processo
# ficar preso a um terminal ou à sessão do Claude Code — ao fechar a tampa, o
# terminal ou o Claude, o sistema matava o grupo e o servidor ia junto. Um
# serviço launchd resolve de vez: quem passa a ser dono do processo é o próprio
# sistema. Ele sobe sozinho ao ligar o Mac (RunAtLoad) e se reergue sozinho se
# cair (KeepAlive). É o mesmo mecanismo que já roda o voicemode nesta máquina.
#
# Uso:
#   zsh scripts/servidor-servico.sh instalar     # cria e liga o serviço (sobe agora)
#   zsh scripts/servidor-servico.sh status       # diz se está carregado e se a porta 3000 responde
#   zsh scripts/servidor-servico.sh logs         # mostra o log ao vivo (Ctrl+C para sair)
#   zsh scripts/servidor-servico.sh parar        # para agora (volta a subir ao reiniciar o Mac)
#   zsh scripts/servidor-servico.sh iniciar      # sobe de novo depois de um 'parar'
#   zsh scripts/servidor-servico.sh reiniciar    # derruba e sobe de novo (após mexer no código do servidor)
#   zsh scripts/servidor-servico.sh desinstalar  # remove o serviço de vez

set -e

LABEL="com.allbook.devserver"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/allbook-devserver.log"
PROJ="$(cd "$(dirname "$0")/.." && pwd)"
NPM="$(command -v npm || echo /opt/homebrew/bin/npm)"
BINDIR="$(dirname "$NPM")"
DOMAIN="gui/$(id -u)"

gerar_plist() {
  mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
  cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NPM</string>
        <string>run</string>
        <string>dev</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJ</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$BINDIR:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>HOME</key>
        <string>$HOME</string>
        <key>NODE_ENV</key>
        <string>development</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ProcessType</key>
    <string>Interactive</string>
    <key>StandardOutPath</key>
    <string>$LOG</string>
    <key>StandardErrorPath</key>
    <string>$LOG</string>
</dict>
</plist>
PLISTEOF
}

case "${1:-}" in
  instalar)
    gerar_plist
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    launchctl enable "$DOMAIN/$LABEL"
    launchctl kickstart -k "$DOMAIN/$LABEL"
    echo "Serviço instalado e iniciado."
    echo "  Log:   $LOG"
    echo "  App:   http://localhost:3000  (leva alguns segundos para subir)"
    ;;
  reiniciar)
    launchctl kickstart -k "$DOMAIN/$LABEL"
    echo "Serviço reiniciado."
    ;;
  iniciar)
    launchctl bootstrap "$DOMAIN" "$PLIST" 2>/dev/null || true
    launchctl kickstart -k "$DOMAIN/$LABEL"
    echo "Serviço iniciado."
    ;;
  parar)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    echo "Serviço parado. Volta a subir ao reiniciar o Mac, ou rode 'iniciar'."
    ;;
  desinstalar)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Serviço removido de vez."
    ;;
  status)
    if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
      echo "Serviço: CARREGADO."
    else
      echo "Serviço: não carregado (rode 'instalar')."
    fi
    curl -s -o /dev/null -w "Porta 3000: HTTP %{http_code}\n" --max-time 4 http://localhost:3000/ \
      || echo "Porta 3000: sem resposta"
    ;;
  logs)
    echo "Log ao vivo ($LOG) — Ctrl+C para sair:"
    touch "$LOG"
    tail -f "$LOG"
    ;;
  *)
    echo "Uso: zsh scripts/servidor-servico.sh {instalar|status|logs|reiniciar|parar|iniciar|desinstalar}"
    exit 1
    ;;
esac
