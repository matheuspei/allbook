#!/bin/zsh
# ─────────────────────────────────────────────────────────────────────────────
# Túnel temporário — mostra o AllBook desta máquina para alguém de longe.
#
#   zsh scripts/tunel.sh abrir | link | situacao | fechar | logs
#
# `abrir` levanta um túnel do Cloudflare apontado para o localhost:3000 e
# devolve um endereço https público, que vale ENQUANTO o túnel estiver de pé:
# fechou, o endereço morre e o próximo é outro (é túnel anônimo, sem conta).
#
# ⚠️ Quem tiver o link entra no app sem senha, e vê o app inteiro — a moldura de
#    celular só existe em acesso local (localhost), como diz o CLAUDE.md.
#
# ⚠️ O processo nasce em SESSÃO PRÓPRIA (start_new_session). Sem isso ele ficaria
#    no grupo de processos da janela do Claude e morreria junto com ela ou ao
#    fechar a tampa — a mesma armadilha que fez o servidor virar LaunchAgent.
#    `setsid` não existe no macOS; por isso o python3.
# ─────────────────────────────────────────────────────────────────────────────

set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

LOG="$HOME/Library/Logs/allbook-tunel.log"
PIDF="$HOME/.allbook-tunel.pid"
PORTA=3000

no_ar() {
  [[ -f "$PIDF" ]] || return 1
  local pid; pid=$(cat "$PIDF" 2>/dev/null)
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

endereco() {
  [[ -f "$LOG" ]] || return 1
  grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -1
}

case "${1:-situacao}" in

  abrir)
    if no_ar; then
      echo "Já havia um túnel de pé (pid $(cat "$PIDF"))."
      endereco
      exit 0
    fi
    if ! curl -s -o /dev/null --max-time 5 "http://localhost:$PORTA/"; then
      echo "O servidor não responde em localhost:$PORTA."
      echo "Suba-o com: zsh scripts/servidor-servico.sh iniciar"
      exit 1
    fi
    command -v cloudflared >/dev/null || { echo "cloudflared não instalado (brew install cloudflared)."; exit 1; }

    python3 - "$LOG" "$PIDF" "$PORTA" <<'PY'
import re, subprocess, sys, time

log, pidf, porta = sys.argv[1], sys.argv[2], sys.argv[3]
open(log, "w").close()
saida = open(log, "ab")
p = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", f"http://localhost:{porta}"],
    stdout=saida, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
    start_new_session=True,           # desgruda da sessão do Claude
)
open(pidf, "w").write(str(p.pid))

alvo = re.compile(rb"https://[a-z0-9-]+\.trycloudflare\.com")
limite = time.time() + 45
while time.time() < limite:
    if p.poll() is not None:
        print("o cloudflared saiu sozinho — veja o log", file=sys.stderr)
        sys.exit(1)
    achado = alvo.search(open(log, "rb").read())
    if achado:
        print(achado.group().decode())
        sys.exit(0)
    time.sleep(0.5)
print("o endereço não apareceu em 45s — veja o log", file=sys.stderr)
sys.exit(1)
PY
    ;;

  link)
    endereco || { echo "Nenhum endereço no log."; exit 1; }
    ;;

  situacao)
    if no_ar; then
      echo "Túnel NO AR (pid $(cat "$PIDF")) → $(endereco)"
    else
      echo "Túnel fechado."
    fi
    ;;

  fechar)
    if ! no_ar; then echo "Já estava fechado."; rm -f "$PIDF"; exit 0; fi
    pid=$(cat "$PIDF")
    # sessão própria ⇒ o pid é o líder do grupo; mata o grupo inteiro
    kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
    # ⚠️ Não basta mandar o sinal: o cloudflared leva um instante para sair, e
    # sem esperar o script dizia "fechado" com o processo ainda de pé.
    python3 -c "
import os, sys, time
pid = int(sys.argv[1])
for _ in range(24):            # até 6s
    try: os.kill(pid, 0)
    except ProcessLookupError: sys.exit(0)
    time.sleep(0.25)
try: os.kill(pid, 9)           # não saiu no bem: KILL
except ProcessLookupError: pass
" "$pid"
    rm -f "$PIDF"
    echo "Túnel fechado — o endereço anterior não vale mais."
    ;;

  logs)
    tail -40 "$LOG"
    ;;

  *)
    echo "uso: zsh scripts/tunel.sh abrir | link | situacao | fechar | logs"
    exit 1
    ;;
esac
