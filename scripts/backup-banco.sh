#!/bin/zsh
#
# Cópia de segurança do banco `allbook`.
#
# Por que existe (08/08, §4.126): desde a §4.121 o banco guarda **dado de gente**
# — biblioteca, progresso, notas, marcações e trechos escritos pela pessoa. Ele
# roda só nesta máquina, e até agora **não havia cópia nenhuma**: um disco com
# problema apagaria tudo, que é literalmente o medo que fez o
# `docs/BANCO-DE-DADOS.md` existir.
#
# Uso:
#   zsh scripts/backup-banco.sh agora       # tira uma cópia na hora
#   zsh scripts/backup-banco.sh listar      # mostra as cópias que existem
#   zsh scripts/backup-banco.sh restaurar <arquivo.dump> [banco]
#   zsh scripts/backup-banco.sh instalar    # agenda a cópia diária (uma vez só)
#   zsh scripts/backup-banco.sh desinstalar
#
# ⚠️ **As cópias ficam FORA do repositório**, em ~/AllBook-backups. Dado de
# pessoa não entra no git — um `git push` distraído publicaria a biblioteca e as
# notas de alguém no GitHub.

set -euo pipefail

PG=/opt/homebrew/opt/postgresql@17/bin
BANCO=allbook
DESTINO="$HOME/AllBook-backups"
# Quantas cópias guardar. 14 dias cobre "só notei o problema na semana passada"
# sem o disco encher: cada dump do catálogo + contas dá alguns megabytes.
MANTER=14
ROTULO=com.allbook.backup
PLIST="$HOME/Library/LaunchAgents/$ROTULO.plist"

agora() {
  mkdir -p "$DESTINO"
  local carimbo
  carimbo=$(date +%Y-%m-%d_%H%M)
  local arquivo="$DESTINO/allbook_$carimbo.dump"

  # Formato `custom` (-Fc), não SQL puro: ele é comprimido e o `pg_restore`
  # consegue restaurar tabela por tabela, o que importa no dia em que só uma
  # coisa se perdeu.
  "$PG/pg_dump" -Fc -d "$BANCO" -f "$arquivo"

  local tamanho
  tamanho=$(du -h "$arquivo" | cut -f1)
  echo "cópia feita: $arquivo ($tamanho)"

  # Rotação: apaga as mais antigas além do limite.
  local sobrando
  sobrando=$(ls -1t "$DESTINO"/allbook_*.dump 2>/dev/null | tail -n +$((MANTER + 1)) || true)
  if [[ -n "$sobrando" ]]; then
    echo "$sobrando" | while read -r velho; do
      rm -f "$velho"
      echo "  apagada a mais antiga: $(basename "$velho")"
    done
  fi
}

listar() {
  if [[ ! -d "$DESTINO" ]]; then
    echo "nenhuma cópia ainda. Rode: zsh scripts/backup-banco.sh agora"
    return
  fi
  echo "cópias em $DESTINO:"
  ls -1lht "$DESTINO"/allbook_*.dump 2>/dev/null | awk '{print "  " $9 "  " $5}' || echo "  (vazio)"
}

# ⚠️ **Restaurar é a metade que ninguém testa** — e cópia não testada não é
# cópia. Por isso restaura para um banco COM OUTRO NOME por padrão: dá para
# conferir que o conteúdo está lá sem passar por cima do banco que está em uso.
restaurar() {
  local arquivo="${1:?diga qual arquivo restaurar}"
  local alvo="${2:-allbook_restaurado}"

  if [[ ! -f "$arquivo" ]]; then
    echo "não achei o arquivo: $arquivo" >&2
    exit 1
  fi

  echo "restaurando '$arquivo' no banco '$alvo'…"
  "$PG/dropdb" --if-exists "$alvo"
  "$PG/createdb" "$alvo"
  "$PG/pg_restore" -d "$alvo" "$arquivo"
  echo "pronto. Para olhar:  $PG/psql -d $alvo"
}

instalar() {
  mkdir -p "$HOME/Library/LaunchAgents" "$DESTINO"
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
        <string>$PWD/scripts/backup-banco.sh</string>
        <string>agora</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PWD</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key><integer>13</integer>
        <key>Minute</key><integer>0</integer>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/allbook-backup.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/allbook-backup.log</string>
</dict>
</plist>
PLISTFIM

  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST"
  echo "agendado: uma cópia por dia, às 13h."
  echo "⚠️ Se o Mac estiver desligado na hora, o launchd roda assim que ele voltar."
}

desinstalar() {
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "agendamento removido. As cópias já feitas continuam em $DESTINO."
}

#
# ⚠️ **`limpar-testes` existe por causa de um erro de verdade** (08/08, §4.126).
#
# Eu rodei `delete from contas` para simular um desastre e testar a restauração,
# **sem olhar o que havia na tabela** — e apaguei a conta real do Matheus, criada
# minutos antes. Deu para devolver porque a cópia tinha acabado de ser feita; a
# lição é que o comando cego não pode existir.
#
# Este apaga **só** contas de teste (`@teste.com`, `@allbook.com.br`) e **mostra
# o que vai apagar antes**. Conta de gente de verdade nunca casa com o filtro.
#
limpar_testes() {
  local filtro="email like '%@teste.com' or email like '%@allbook.com.br'"

  echo "estas contas seriam apagadas:"
  "$PG/psql" -d "$BANCO" -tAc "select '  - ' || nome || ' <' || email || '>' from contas where $filtro"

  local reais
  reais=$("$PG/psql" -d "$BANCO" -tAc "select count(*) from contas where not ($filtro)")
  echo "contas que NÃO serão tocadas: $reais"

  if [[ "${2:-}" != "--confirmo" ]]; then
    echo
    # `$0` dentro de função, no zsh, vira o nome da FUNÇÃO — daí o caminho fixo.
    echo "nada foi apagado. Para apagar de fato:"
    echo "  zsh scripts/backup-banco.sh limpar-testes --confirmo"
    return
  fi

  "$PG/psql" -d "$BANCO" -q -c "delete from contas where $filtro"
  # Sessão não tem chave estrangeira para conta: as órfãs precisam sair na mão.
  "$PG/psql" -d "$BANCO" -q -c "delete from session where expire < now()"
  echo "contas de teste apagadas. Restam $("$PG/psql" -d "$BANCO" -tAc 'select count(*) from contas') conta(s)."
}

case "${1:-agora}" in
  agora) agora ;;
  listar) listar ;;
  restaurar) shift; restaurar "$@" ;;
  instalar) instalar ;;
  desinstalar) desinstalar ;;
  limpar-testes) limpar_testes "$@" ;;
  *) echo "uso: $0 {agora|listar|restaurar <arquivo> [banco]|instalar|desinstalar|limpar-testes}" >&2; exit 1 ;;
esac
