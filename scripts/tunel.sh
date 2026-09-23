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
#    celular só existe em acesso local (localhost), como diz o CLAUDE.md. O
#    áudio toca sem conta desde 22/09 (§4.166): o link basta para ouvir.
#
# ⚠️ O processo nasce em SESSÃO PRÓPRIA (start_new_session). Sem isso ele ficaria
#    no grupo de processos da janela do Claude e morreria junto com ela ou ao
#    fechar a tampa — a mesma armadilha que fez o servidor virar LaunchAgent.
#    `setsid` não existe no macOS; por isso o python3.
#
# ## O que 23/09 acrescentou (§4.167), e por quê
#
# Ele mandou o link para alguém e no dia seguinte o link não abria. O Mac dormiu
# às 4h34 e o `cloudflared` ficou VIVO tentando reconectar para sempre, sem
# endereço — e o `situacao` dizia "NO AR" porque olhava só se o processo existia.
# Três consertos, nesta ordem de importância:
#
# 1. **`situacao` e `link` testam o ENDEREÇO**, não o processo. Script que mente
#    sobre o próprio estado é pior que script que não existe.
# 2. **O Mac não dorme enquanto o link está valendo** (`caffeinate`, preso à
#    sessão do túnel). Mac dormindo derruba tudo: o túnel e o servidor que ele
#    serve. ⚠️ Fechar a TAMPA dorme assim mesmo — aí não há o que fazer.
# 3. **Um vigia religa o túnel sozinho** (LaunchAgent `com.allbook.tunel`, de
#    minuto em minuto) quando o endereço morre mesmo assim. 🚨 O endereço novo é
#    OUTRO — o link antigo não ressuscita, e o vigia avisa na tela do Mac. Só um
#    endereço fixo resolveria isso, e endereço fixo exige conta e domínio.
# ─────────────────────────────────────────────────────────────────────────────

set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

PROJETO="${0:A:h:h}"
LOG="$HOME/Library/Logs/allbook-tunel.log"
PIDF="$HOME/.allbook-tunel.pid"
# A sessão está aberta? É o que separa "o túnel caiu, religue" de "ele fechou
# o túnel de propósito" — sem esta marca o vigia reabriria o que foi fechado.
MARCA="$HOME/.allbook-tunel-ligado"
ENDF="$HOME/.allbook-tunel-endereco"
CAFF="$HOME/.allbook-tunel-caffeinate.pid"
ROTULO=com.allbook.tunel
PLIST="$HOME/Library/LaunchAgents/$ROTULO.plist"
PORTA=3000

# ── peças pequenas ───────────────────────────────────────────────────────────

processo_vivo() {
  [[ -f "$PIDF" ]] || return 1
  local pid; pid=$(cat "$PIDF" 2>/dev/null)
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

endereco_do_log() {
  [[ -f "$LOG" ]] || return 1
  grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | tail -1
}

# O endereço responde de verdade? 🚨 É esta pergunta que vale, não "o processo
# existe": em 23/09 o processo estava vivo havia 5 horas sem endereço nenhum.
endereco_responde() {
  local url="${1:-}"
  [[ -n "$url" ]] || return 1
  curl -sf -o /dev/null --max-time 15 "$url/api/banco/saude" && return 0

  # 🚨 **O resolvedor do macOS não enxerga o nome recém-criado** (apurado em
  # 23/09): `dig` respondia o IP e o `curl` dizia "Could not resolve host" no
  # mesmo segundo — é o cache do mDNSResponder, não o túnel. Sem esta segunda
  # tentativa o vigia daria o túnel por morto e ficaria criando um atrás do
  # outro, cada um com um endereço novo. Quem abre o link de fora usa o DNS
  # dele e nunca viu esse problema.
  local host=${url#https://} ip
  ip=$(dig +short @1.1.1.1 "$host" 2>/dev/null | grep -E '^[0-9.]+$' | head -1)
  [[ -n "$ip" ]] || return 1
  curl -sf -o /dev/null --max-time 15 --resolve "$host:443:$ip" "$url/api/banco/saude"
}

# 🚨 **O endereço aparece no log ANTES de a Cloudflare começar a atender por
# ele** — medido em 23/09: o `cloudflared` imprime a URL em ~6s e a borda só
# responde uns 10 a 30s depois. Quem entrega o link sem esperar isto entrega um
# endereço que dá erro na cara de quem abrir.
esperar_o_ar() {
  local url="$1" i
  for i in {1..30}; do
    endereco_responde "$url" && return 0
    sleep 3
  done
  return 1
}

servidor_no_ar() {
  curl -s -o /dev/null --max-time 5 "http://localhost:$PORTA/"
}

# Nasce fora do grupo de processos de quem chamou — ver o cabeçalho.
solta_da_sessao() {
  python3 -c "
import subprocess, sys
p = subprocess.Popen(sys.argv[1:], stdout=subprocess.DEVNULL,
                     stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL,
                     start_new_session=True)
print(p.pid)
" "$@"
}

# Enquanto o link vale, o Mac fica acordado. `-i` idle, `-m` disco, `-s` sistema
# na tomada; o monitor pode apagar (sem `-d`), que isso não derruba rede.
acordar_o_mac() {
  dormir_de_novo
  solta_da_sessao caffeinate -ims > "$CAFF"
}

dormir_de_novo() {
  [[ -f "$CAFF" ]] || return 0
  local pid; pid=$(cat "$CAFF" 2>/dev/null)
  [[ -n "$pid" ]] && kill -TERM "$pid" 2>/dev/null
  rm -f "$CAFF"
  return 0
}

avisar_na_tela() {
  osascript -e "display notification \"$1\" with title \"AllBook — túnel\"" 2>/dev/null || true
}

# ── levantar o cloudflared e esperar o endereço aparecer ─────────────────────

levantar() {
  command -v cloudflared >/dev/null || { echo "cloudflared não instalado (brew install cloudflared)."; return 1; }

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
}

derrubar() {
  if processo_vivo; then
    local pid; pid=$(cat "$PIDF")
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
  fi
  rm -f "$PIDF"
}

# ── o vigia (LaunchAgent) ────────────────────────────────────────────────────

instalar_vigia() {
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
        <string>$PROJETO/scripts/tunel.sh</string>
        <string>vigiar</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJETO</string>
    <key>RunAtLoad</key>
    <true/>
    <key>StartInterval</key>
    <integer>60</integer>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/allbook-tunel-vigia.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/allbook-tunel-vigia.log</string>
</dict>
</plist>
PLISTFIM
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST"
}

remover_vigia() {
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
}

vigiar() {
  # Túnel fechado de propósito não se reabre.
  [[ -f "$MARCA" ]] || exit 0

  local atual; atual=$(cat "$ENDF" 2>/dev/null || true)
  endereco_responde "$atual" && exit 0

  # ⚠️ Segunda chance antes de trocar o endereço: uma falha de rede de 10s não
  # pode custar o link que ele já mandou para alguém.
  sleep 10
  endereco_responde "$atual" && exit 0

  # Sem servidor local não adianta túnel nenhum — e quem cuida dele é o
  # LaunchAgent com.allbook.devserver. Espera a próxima passada.
  if ! servidor_no_ar; then
    echo "[$(date '+%F %T')] servidor fora do ar — nada a religar"
    exit 0
  fi

  echo "[$(date '+%F %T')] endereço morto ($atual) — religando"
  derrubar
  local novo; novo=$(levantar) || { echo "[$(date '+%F %T')] falhou ao religar"; exit 1; }
  print -r -- "$novo" > "$ENDF"

  if esperar_o_ar "$novo"; then
    echo "[$(date '+%F %T')] endereço novo, já atendendo: $novo"
    avisar_na_tela "O link caiu e foi religado. O endereço MUDOU — mande o novo: $novo"
  else
    # Fica gravado assim mesmo: a próxima passada confere e, se ainda estiver
    # morto, religa de novo. Avisar um endereço que não atende seria pior.
    echo "[$(date '+%F %T')] religado, mas $novo não atendeu em 90s"
  fi
}

# ── os comandos ──────────────────────────────────────────────────────────────

case "${1:-situacao}" in

  abrir)
    # ⚠️ **Túnel que já está de pé é ADOTADO, nunca trocado.** O endereço pode
    # já estar na mão de alguém; levantar outro por descuido mata o link dele.
    if processo_vivo; then
      atual=$(cat "$ENDF" 2>/dev/null || endereco_do_log || true)
      if endereco_responde "$atual"; then
        echo "Já havia um túnel de pé (pid $(cat "$PIDF")) — mantido."
        print -r -- "$atual" > "$ENDF"
        : > "$MARCA"
        acordar_o_mac
        instalar_vigia
        print -r -- "$atual"
        exit 0
      fi
      echo "Havia um túnel de pé, mas o endereço não responde — trocando."
      derrubar
    fi

    if ! servidor_no_ar; then
      echo "O servidor não responde em localhost:$PORTA."
      echo "Suba-o com: zsh scripts/servidor-servico.sh iniciar"
      exit 1
    fi

    novo=$(levantar) || exit 1
    print -r -- "$novo" > "$ENDF"
    : > "$MARCA"
    acordar_o_mac
    instalar_vigia
    esperar_o_ar "$novo" || echo "⚠️ o endereço ainda não atende — espere um minuto e rode: zsh scripts/tunel.sh link"
    print -r -- "$novo"
    echo "(o Mac fica acordado e o túnel religa sozinho até você fechar;"
    echo " fechar a TAMPA ainda derruba tudo)"
    ;;

  link)
    atual=$(cat "$ENDF" 2>/dev/null || endereco_do_log) || { echo "Nenhum endereço."; exit 1; }
    if endereco_responde "$atual"; then
      print -r -- "$atual"
    else
      echo "O endereço $atual NÃO responde — reabra com: zsh scripts/tunel.sh abrir"
      exit 1
    fi
    ;;

  situacao)
    atual=$(cat "$ENDF" 2>/dev/null || endereco_do_log || true)
    if [[ -n "$atual" ]] && endereco_responde "$atual"; then
      echo "Túnel NO AR → $atual"
    elif processo_vivo; then
      echo "Túnel MORTO por fora: o processo está vivo (pid $(cat "$PIDF")), mas"
      echo "$atual não responde. Reabra com: zsh scripts/tunel.sh abrir"
    else
      echo "Túnel fechado."
    fi
    linha=$(launchctl list | grep "$ROTULO" || true)
    [[ -n "$linha" ]] && echo "Vigia ligado (religa sozinho de minuto em minuto)."
    [[ -f "$CAFF" ]] && kill -0 "$(cat "$CAFF")" 2>/dev/null && echo "Mac segurado acordado enquanto o link valer."
    ;;

  fechar)
    remover_vigia
    rm -f "$MARCA" "$ENDF"
    dormir_de_novo
    if ! processo_vivo; then echo "Já estava fechado."; rm -f "$PIDF"; exit 0; fi
    derrubar
    echo "Túnel fechado — o endereço anterior não vale mais."
    ;;

  vigiar)  vigiar ;;

  logs)
    tail -40 "$LOG"
    echo "--- vigia:"
    tail -20 "$HOME/Library/Logs/allbook-tunel-vigia.log" 2>/dev/null || echo "(sem registro)"
    ;;

  *)
    echo "uso: zsh scripts/tunel.sh abrir | link | situacao | fechar | logs"
    exit 1
    ;;
esac
