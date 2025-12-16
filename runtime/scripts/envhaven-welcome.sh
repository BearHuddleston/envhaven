#!/usr/bin/env bash
# EnvHaven Welcome - compact, informative design
# - Safe (never prints secrets, only checks env var presence)
# - Offline (no network calls)
# - Fast (minimal subprocesses)
# - Works when sourced from bash OR zsh

[[ $- != *i* ]] && return 2>/dev/null

WELCOME_SHOWN="/config/.envhaven-welcome-shown"

if [[ -f "$WELCOME_SHOWN" && "${ENVHAVEN_WELCOME_FORCE:-0}" != "1" ]]; then
  return 0 2>/dev/null
fi

IS_UTF8=0
case "${LC_ALL:-${LANG:-}}" in
  *UTF-8*|*utf8*) IS_UTF8=1 ;;
esac

USE_COLOR=0
if [[ -z "${NO_COLOR:-}" && -t 1 && "${TERM:-}" != "dumb" ]]; then
  USE_COLOR=1
fi

if [[ "$USE_COLOR" == "1" ]]; then
  BOLD=$'\033[1m'
  DIM=$'\033[2m'
  CYAN=$'\033[36m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  RESET=$'\033[0m'
  G1=$'\033[38;5;183m'
  G2=$'\033[38;5;141m'
  G3=$'\033[38;5;135m'
  G4=$'\033[38;5;99m'
  VIOLET=$'\033[38;5;99m'
else
  BOLD=""; DIM=""; CYAN=""; GREEN=""; YELLOW=""; RESET=""
  G1=""; G2=""; G3=""; G4=""
  VIOLET=""
fi

if [[ "$IS_UTF8" == "1" ]]; then
  SEP="────────────────────────────────────────────────────────────────────────"
  CIRCLE_FILLED="●"
  CIRCLE_EMPTY="○"
  ARROW="→"
  PIPE="│"
else
  SEP="------------------------------------------------------------------------"
  CIRCLE_FILLED="*"
  CIRCLE_EMPTY="o"
  ARROW="->"
  PIPE="|"
fi

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

has_any_env() {
  local _val
  while [[ $# -gt 0 ]]; do
    eval "_val=\"\${$1:-}\""
    [[ -n "$_val" ]] && return 0
    shift
  done
  return 1
}

get_version() {
  local cmd="$1"
  command_exists "$cmd" && "$cmd" --version 2>/dev/null | head -n1 | grep -oE '[0-9]+\.[0-9]+' | head -n1
}

tool_indicator() {
  local name="$1" configured="$2" width="${3:-9}"
  if [[ "$configured" == "1" ]]; then
    printf "%s%s%s %-${width}s" "$GREEN" "$CIRCLE_FILLED" "$RESET" "$name"
  else
    printf "%s%s%s %-${width}s" "$YELLOW" "$CIRCLE_EMPTY" "$RESET" "$name"
  fi
}

PUBLIC_URL="${ENVHAVEN_PUBLIC_URL:-}"
WORKSPACE_DIR="${DEFAULT_WORKSPACE:-/config/workspace}"

get_ssh_string() {
  local host="${ENVHAVEN_SSH_HOST:-}"
  local port="${ENVHAVEN_SSH_PORT:-$([[ "${ENVHAVEN_MANAGED:-}" == "true" ]] && echo 22 || echo 2222)}"
  [[ -z "$host" ]] && host="<host>"
  [[ "$port" == "22" ]] && echo "abc@${host}" || echo "abc@${host} -p ${port}"
}

get_haven_string() {
  local host="${ENVHAVEN_SSH_HOST:-}"
  if [[ "${ENVHAVEN_MANAGED:-}" == "true" && -n "$host" ]]; then
    local subdomain="${host#ssh-}"
    subdomain="${subdomain%.envhaven.app}"
    echo "$subdomain"
    return
  fi
  local port="${ENVHAVEN_SSH_PORT:-2222}"
  [[ -z "$host" ]] && host="<host>"
  [[ "$port" == "22" ]] && echo "abc@${host}" || echo "abc@${host}:${port}"
}

SSH_CONN_STR=$(get_ssh_string)
HAVEN_CONN_STR=$(get_haven_string)
SSH_HOST_CONFIGURED=1
[[ -z "${ENVHAVEN_SSH_HOST:-}" ]] && SSH_HOST_CONFIGURED=0

NODE_V=$(get_version node)
PYTHON_V=$(get_version python3)
GO_V=$(go version 2>/dev/null | grep -oE 'go[0-9]+\.[0-9]+' | sed 's/go//')
RUST_V=$(get_version rustc)
BUN_V=$(get_version bun)

SSH_RUNNING=0
command_exists pgrep && pgrep -x sshd >/dev/null 2>&1 && SSH_RUNNING=1

SSH_KEY_COUNT=0
AUTH_KEYS="/config/.ssh/authorized_keys"
if [[ -f "$AUTH_KEYS" ]]; then
  SSH_KEY_COUNT=$(grep '^ssh-' "$AUTH_KEYS" 2>/dev/null | wc -l | tr -d ' ')
fi

# Tool configuration detection (12 tools)
OPENCODE_CFG=0; has_any_env ANTHROPIC_API_KEY OPENAI_API_KEY GEMINI_API_KEY GOOGLE_API_KEY && OPENCODE_CFG=1
CLAUDE_CFG=0;   has_any_env ANTHROPIC_API_KEY && CLAUDE_CFG=1
AIDER_CFG=0;    has_any_env ANTHROPIC_API_KEY OPENAI_API_KEY GEMINI_API_KEY OPENROUTER_API_KEY && AIDER_CFG=1
CODEX_CFG=0;    has_any_env OPENAI_API_KEY && CODEX_CFG=1
GEMINI_CFG=0;   has_any_env GEMINI_API_KEY GOOGLE_API_KEY && GEMINI_CFG=1
GOOSE_CFG=0;    has_any_env ANTHROPIC_API_KEY OPENAI_API_KEY && GOOSE_CFG=1
VIBE_CFG=0;     has_any_env MISTRAL_API_KEY && VIBE_CFG=1
AMP_CFG=0;      has_any_env AMP_API_KEY && AMP_CFG=1
AUGGIE_CFG=0;   command_exists auggie && auggie tokens print >/dev/null 2>&1 && AUGGIE_CFG=1
KIRO_CFG=0;     # Kiro uses browser auth, no env var check
DROID_CFG=0;    has_any_env FACTORY_API_KEY && DROID_CFG=1
QWEN_CFG=0;     has_any_env QWEN_API_KEY OPENAI_API_KEY && QWEN_CFG=1

echo ""

if [[ "$USE_COLOR" == "1" ]]; then
  printf '%s' "$G1"
  cat << 'LOGO'
              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 
            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    
LOGO
  printf '%s' "$G2"
  cat << 'LOGO'
   ▓▓▓▓▓▓▓▓██                    
  ▓▓▓▓▓▓▓▓▓▓██                   
 █▓▓▓▓▓▓▓▓▓▓▓████████████▓▓▓▓▓▓▓▓
             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
LOGO
  printf '%s' "$G3"
  cat << 'LOGO'
            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  
           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   
   ███████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    
  ▓▓▓▓▓▓▓▓▓██                    
LOGO
  printf '%s' "$G4"
  cat << 'LOGO'
 █▓▓▓▓▓▓▓▓▓▓▓█                   
██▓▓▓▓▓▓▓▓▓▓▓▓█████████▓▓▓▓▓▓▓▓▓▓
             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 
            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  
           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 
LOGO
  printf '%s' "$RESET"
else
  printf "%s%sEnvHaven%s  %sself-hosted%s\n" "$BOLD" "" "$RESET" "$DIM" "$RESET"
fi

echo ""
printf "%s%s%s\n" "$DIM" "$SEP" "$RESET"

if [[ "${ENVHAVEN_MANAGED:-}" == "true" ]]; then
  printf "  Mode:       %s%sManaged%s\n" "$GREEN" "$BOLD" "$RESET"
else
  printf "  Mode:       %sSelf-hosted%s\n" "$CYAN" "$RESET"
fi
printf "  Workspace:  %s\n" "$WORKSPACE_DIR"

if [[ "$SSH_KEY_COUNT" != "0" && -n "$SSH_KEY_COUNT" ]]; then
  printf "  SSH:        %s%s ready%s  %sssh %s%s\n" "$GREEN" "$CIRCLE_FILLED" "$RESET" "$DIM" "$SSH_CONN_STR" "$RESET"
  printf "  Keys:       %s%s authorized%s\n" "$GREEN" "$SSH_KEY_COUNT" "$RESET"
else
  printf "  SSH:        %s%s not ready%s  %sssh %s%s\n" "$YELLOW" "$CIRCLE_EMPTY" "$RESET" "$DIM" "$SSH_CONN_STR" "$RESET"
  printf "  Keys:       %snone (add via sidebar)%s\n" "$YELLOW" "$RESET"
fi
if [[ "$SSH_HOST_CONFIGURED" == "0" ]]; then
  printf "  %s%s%s Set ENVHAVEN_SSH_HOST for correct SSH command%s\n" "$DIM" "$YELLOW" "$ARROW" "$RESET"
fi

if [[ -n "$PUBLIC_URL" ]]; then
  printf "  URL:        %s%s%s\n" "$BOLD" "$PUBLIC_URL" "$RESET"
fi

printf "%s%s%s\n" "$DIM" "$SEP" "$RESET"

printf "\n%s%sRuntimes%s\n" "$VIOLET" "$BOLD" "$RESET"
RUNTIMES=()
[[ -n "$NODE_V" ]] && RUNTIMES+=("Node $NODE_V")
[[ -n "$PYTHON_V" ]] && RUNTIMES+=("Python $PYTHON_V")
[[ -n "$GO_V" ]] && RUNTIMES+=("Go $GO_V")
[[ -n "$RUST_V" ]] && RUNTIMES+=("Rust $RUST_V")
[[ -n "$BUN_V" ]] && RUNTIMES+=("Bun $BUN_V")
RUNTIME_STR=""
first=1
for rt in "${RUNTIMES[@]}"; do
  [[ $first -eq 0 ]] && RUNTIME_STR+=" $PIPE "
  RUNTIME_STR+="$rt"
  first=0
done
printf "  %s\n" "$RUNTIME_STR"

printf "\n%s%sAI Tools%s  %s(%s ready  %s needs key)%s\n" \
  "$VIOLET" "$BOLD" "$RESET" "$DIM" "$CIRCLE_FILLED" "$CIRCLE_EMPTY" "$RESET"
# Row 1
printf "  "
tool_indicator "OpenCode" "$OPENCODE_CFG" 9
tool_indicator "Claude" "$CLAUDE_CFG" 9
tool_indicator "Aider" "$AIDER_CFG" 9
tool_indicator "Codex" "$CODEX_CFG" 0
printf "\n"
# Row 2
printf "  "
tool_indicator "Gemini" "$GEMINI_CFG" 9
tool_indicator "Goose" "$GOOSE_CFG" 9
tool_indicator "Vibe" "$VIBE_CFG" 9
tool_indicator "Amp" "$AMP_CFG" 0
printf "\n"
# Row 3
printf "  "
tool_indicator "Auggie" "$AUGGIE_CFG" 9
tool_indicator "Kiro" "$KIRO_CFG" 9
tool_indicator "Droid" "$DROID_CFG" 9
tool_indicator "Qwen" "$QWEN_CFG" 0
printf "\n"

printf "\n%s%sQuick Start%s\n" "$VIOLET" "$BOLD" "$RESET"
printf "  opencode %s(or claude, aider)%s\n" "$DIM" "$RESET"

printf "\n%s%s%s\n" "$DIM" "$SEP" "$RESET"
printf "%s%sPrefer your local editor?%s\n" "$VIOLET" "$BOLD" "$RESET"
printf "  Edit in nvim/emacs while AI runs here.\n"
printf "  %s Install:  %scurl -fsSL https://envhaven.com/install.sh | sh%s\n" "$ARROW" "$DIM" "$RESET"
printf "  %s Connect:  %shaven connect . %s%s\n" "$ARROW" "$DIM" "$HAVEN_CONN_STR" "$RESET"
printf "  %s Run:      %shaven opencode%s\n" "$ARROW" "$DIM" "$RESET"
if [[ "$SSH_KEY_COUNT" == "0" || -z "$SSH_KEY_COUNT" ]]; then
  printf "\n  %s%s First: Add your SSH key via the EnvHaven sidebar%s\n" "$YELLOW" "$ARROW" "$RESET"
fi
printf "%s%s%s\n" "$DIM" "$SEP" "$RESET"
echo ""

touch "$WELCOME_SHOWN" 2>/dev/null || true
