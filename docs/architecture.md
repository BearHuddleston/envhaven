# Architecture

Technical overview of the EnvHaven Docker image design decisions and rationale.

## Overview

EnvHaven is a Docker image that provides a Batteries-Included Agentic Environment with pre-installed AI coding tools. It extends the LinuxServer.io (LSIO) code-server image.

```
┌─────────────────────────────────────────────────────────────────┐
│                     EnvHaven Container                          │
│                                                                 │
│  /opt/envhaven/bin/    ← AI tools (mise, uv, goose, aider...)  │
│  /opt/envhaven/uv-tools/ ← Python tool virtualenvs             │
│  /mise/                ← mise data, shims, tool installs        │
│  /app/                 ← code-server, pre-installed extensions  │
│  /defaults/            ← Templates (copied on first boot)       │
│  /config/              ← User data (VOLUME - mounted by user)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Base Image

EnvHaven extends `linuxserver/code-server:latest`, which provides:

- **code-server** — VS Code in the browser
- **s6-overlay** — Process supervisor and init system
- **Ubuntu 24.04** — Stable base with recent packages
- **LSIO conventions** — Standardized paths and patterns

## The Volume Mount Problem

**This is the most important architectural decision to understand.**

### LSIO Convention

LinuxServer.io images set `HOME=/config` and expect users to mount a volume there for persistence:

```bash
docker run -v /my/data:/config envhaven
```

### The Problem

Tools installed during `docker build` that land in `$HOME` (e.g., `~/.local/bin/`) get **shadowed** when the user mounts their volume:

```
Build time:  /config/.local/bin/claude  ← Tool installed here
Runtime:     /config/ mounted from host ← Empty, shadows everything
Result:      claude: command not found
```

This affected all our AI tools. The image would build successfully, but tools would be missing at runtime.

### The Solution

Install tools to `/opt/envhaven/bin/` — a path that is **never mounted over**:

```dockerfile
# Create tool directory outside /config
RUN mkdir -p /opt/envhaven/bin /opt/envhaven/uv-tools

# Install tools, then move to safe location
RUN curl https://mise.run | sh && \
    mv /config/.local/bin/mise /opt/envhaven/bin/mise
```

### PATH Priority

Users can still override any tool by installing their own version:

```
/config/.local/bin      # User overrides (first priority)
/opt/envhaven/bin       # System tools (our installations)
/mise/shims             # mise-managed tools
/usr/local/bin          # System binaries
```

## Directory Structure

| Path | Purpose | Mounted? | Mutable? |
|------|---------|----------|----------|
| `/config` | User home directory (`HOME=/config`) | **Yes** | Yes |
| `/config/.local/bin` | User tool overrides | **Yes** | Yes |
| `/opt/envhaven/bin` | Pre-installed AI tools | No | No |
| `/opt/envhaven/uv-tools` | Python tool virtualenvs | No | No |
| `/mise` | mise data, shims, installs | No | No |
| `/defaults` | Templates copied on first boot | No | No |
| `/app` | code-server and pre-installed extensions | No | No |

## Tool Installation Strategy

### Category 1: mise-managed tools

[mise](https://mise.jdx.dev/) manages language runtimes and some AI tools via backends:

```toml
# /mise/config.toml
[tools]
node = "20"
python = "3.12"
go = "1.22"
rust = "stable"
bun = "latest"
"npm:@anthropics/claude-code" = "latest"
"npm:@openai/codex" = "latest"
```

mise itself is installed to `/opt/envhaven/bin/mise` with a symlink at `/usr/local/bin/mise`.

| Path | Purpose |
|------|---------|
| `/mise/config.toml` | Tool definitions |
| `/mise/installs/` | Installed tool versions |
| `/mise/shims/` | Executable shims (in PATH) |
| `/opt/envhaven/bin/mise` | mise binary |

### Category 2: uv-managed Python tools

[uv](https://github.com/astral-sh/uv) installs Python CLI tools in isolated virtualenvs:

```dockerfile
ENV UV_TOOL_DIR="/opt/envhaven/uv-tools"
ENV UV_TOOL_BIN_DIR="/opt/envhaven/bin"

RUN uv tool install aider-chat && uv tool install mistral-vibe
```

### Category 3: Standalone installers

Some tools have their own installers that don't respect standard paths. We install them, then move to `/opt/envhaven/bin/`:

```dockerfile
# Install with env vars where supported
RUN curl -fsSL https://opencode.ai/install | INSTALL_DIR=/opt/envhaven/bin bash

# Move tools that end up in wrong locations
RUN for bin in goose kiro droid; do \
        [ -f "/config/.local/bin/$bin" ] && mv "/config/.local/bin/$bin" /opt/envhaven/bin/; \
    done
```

## s6-overlay Init System

s6-overlay runs initialization scripts after the container starts but **after** volumes are mounted. This is key — we can safely write to `/config/` in init scripts.

### Init Scripts (oneshot)

Located in `runtime/scripts/`, these run once at container startup:

| Script | Purpose |
|--------|---------|
| `init-user-config` | SSH keys, git config, shell setup |
| `init-zsh-config` | oh-my-zsh configuration |
| `init-vscode-settings` | VS Code theme and settings |
| `init-extensions` | Symlink pre-installed extensions |
| `init-agents-md` | Generate workspace AGENTS.md |

### Services (longrun)

| Script | Purpose |
|--------|---------|
| `svc-sshd` | SSH daemon for remote access |

### Execution Order

```
Container starts
    ↓
Volumes mounted (/config)
    ↓
s6-overlay runs init-adduser (LSIO creates abc user)
    ↓
Our oneshot scripts run (depend on init-adduser)
    ↓
Longrun services start (svc-sshd)
    ↓
code-server starts
```

## VS Code Extension Installation

Extensions must survive volume mounts. We use a symlink strategy:

### Build Time

```dockerfile
RUN mkdir -p /app/pre-installed-extensions && \
    /app/code-server/bin/code-server \
        --extensions-dir /app/pre-installed-extensions \
        --install-extension /tmp/envhaven.vsix
```

### Runtime (init-extensions script)

```bash
# Symlink pre-installed extensions to user's extension directory
for ext in /app/pre-installed-extensions/*; do
    ln -sf "$ext" "/config/extensions/$(basename $ext)"
done
```

Result:
```
/config/extensions/envhaven.envhaven-0.2.0 → /app/pre-installed-extensions/envhaven.envhaven-0.2.0
```

User-installed extensions go directly to `/config/extensions/` and persist normally.

## Environment Variables

Single source of truth in `/etc/environment`:

```bash
PATH="/config/.local/bin:/opt/envhaven/bin:/mise/shims:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
MISE_DATA_DIR="/mise"
MISE_CONFIG_DIR="/mise"
MISE_CACHE_DIR="/mise/cache"
MISE_STATE_DIR="/mise/state"
UV_TOOL_DIR="/opt/envhaven/uv-tools"
UV_TOOL_BIN_DIR="/opt/envhaven/bin"
```

This file is sourced by:
- SSH sessions (via `pam_env`)
- bash (via `/etc/bash.bashrc`)
- zsh (via `/etc/zsh/zshenv`)

## Adding New Tools

When adding a new AI tool to the Dockerfile:

### 1. Check if mise has a backend

```bash
mise plugins ls-remote | grep toolname
```

If yes, add to `mise.toml`:
```toml
[tools]
"npm:toolname" = "latest"
```

### 2. Check if it's a Python tool

Use uv:
```dockerfile
RUN uv tool install toolname
```

### 3. Standalone installer

```dockerfile
# Try env vars first
RUN curl -fsSL https://tool.dev/install | INSTALL_DIR=/opt/envhaven/bin bash

# Fallback: move from wrong location
RUN [ -f "/config/.local/bin/toolname" ] && mv "/config/.local/bin/toolname" /opt/envhaven/bin/
```

### 4. Verify in verification block

```dockerfile
RUN toolname --version
```

## Design Principles

| Principle | Application |
|-----------|-------------|
| **Simplicity** | One tool location (`/opt/envhaven/bin`), one user data location (`/config`) |
| **User Override** | `/config/.local/bin` has highest PATH priority — users can override any tool |
| **Survival** | All system tools survive volume mounts |
| **Transparency** | `/etc/environment` is the single source of truth for PATH and env vars |
| **LSIO Compatibility** | Respect base image conventions, don't fight them |

## Troubleshooting

### Tool not found after container start

**Cause:** Tool was installed to `/config/.local/bin/` during build and got shadowed.

**Fix:** Move the tool to `/opt/envhaven/bin/` in the Dockerfile.

### Tool works in web terminal but not via SSH

**Cause:** SSH session not picking up PATH from `/etc/environment`.

**Fix:** Ensure `/etc/environment` is sourced. Check `pam_env` configuration.

### Extension not appearing in VS Code

**Cause:** Symlink not created by init-extensions script.

**Fix:** Check `/etc/s6-overlay/s6-rc.d/init-extensions/run` logs. Extension must exist in `/app/pre-installed-extensions/`.

### mise shim not working

**Cause:** mise not in PATH or MISE_* env vars not set.

**Fix:** Verify `/etc/environment` contains correct mise configuration and is being sourced.
