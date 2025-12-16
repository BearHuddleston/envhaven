import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { dirname } from "path";
import { getConfigDir, canonicalPath } from "../utils/paths";

export interface ConnectionConfig {
  host: string;
  port: number;
  user: string;
  remotePath: string;
  sshAlias?: string;
  lastConnected?: number;
}

export interface SessionState {
  connected: boolean;
  startTime: number;
  mutagenSessionId?: string;
  idleTimeout?: number;
}

export type ConnectionStore = Record<string, ConnectionConfig>;

function getConnectionsPath(): string {
  return `${getConfigDir()}/connections.json`;
}

function getSessionPath(localPath: string): string {
  const hash = simpleHash(canonicalPath(localPath));
  return `${getConfigDir()}/sessions/${hash}.json`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const sessionsDir = `${dir}/sessions`;
  if (!existsSync(sessionsDir)) {
    mkdirSync(sessionsDir, { recursive: true });
  }
}

export function loadConnections(): ConnectionStore {
  const path = getConnectionsPath();
  try {
    const data = readFileSync(path, "utf-8");
    return JSON.parse(data) as ConnectionStore;
  } catch {
    return {};
  }
}

export function saveConnections(store: ConnectionStore): void {
  ensureConfigDir();
  const path = getConnectionsPath();
  writeFileSync(path, JSON.stringify(store, null, 2));
}

export function getConnection(localPath: string): ConnectionConfig | null {
  const store = loadConnections();
  const canonical = canonicalPath(localPath);
  return store[canonical] ?? null;
}

export function saveConnection(localPath: string, config: ConnectionConfig): void {
  const store = loadConnections();
  const canonical = canonicalPath(localPath);
  store[canonical] = config;
  saveConnections(store);
}

export function deleteConnection(localPath: string): boolean {
  const store = loadConnections();
  const canonical = canonicalPath(localPath);
  if (canonical in store) {
    delete store[canonical];
    saveConnections(store);
    return true;
  }
  return false;
}

export function findConnection(startPath: string): { localPath: string; config: ConnectionConfig } | null {
  const store = loadConnections();
  let current = canonicalPath(startPath);
  const root = "/";

  while (current !== root) {
    if (current in store) {
      return { localPath: current, config: store[current]! };
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  if (root in store) {
    return { localPath: root, config: store[root]! };
  }

  return null;
}

export function loadSession(localPath: string): SessionState | null {
  const path = getSessionPath(localPath);
  try {
    const data = readFileSync(path, "utf-8");
    return JSON.parse(data) as SessionState;
  } catch {
    return null;
  }
}

export function saveSession(localPath: string, state: SessionState): void {
  ensureConfigDir();
  const path = getSessionPath(localPath);
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(state, null, 2));
}

export function deleteSession(localPath: string): void {
  const path = getSessionPath(localPath);
  try {
    unlinkSync(path);
  } catch {
    // Intentionally ignored: file may not exist
  }
}

export function generateSshAlias(host: string, port: number): string {
  const hash = simpleHash(`${host}:${port}`);
  return `haven-${hash}`;
}

export function buildSshString(config: ConnectionConfig): string {
  const portPart = config.port !== 22 ? ` -p ${config.port}` : "";
  return `${config.user}@${config.host}${portPart}`;
}

export function parseSshString(input: string): { user: string; host: string; port: number } | null {
  const DEFAULT_USER = "abc";
  const DEFAULT_PORT = 22;

  const fullMatch = input.match(/^([^@]+)@([^:]+)(?::(\d+))?$/);
  if (fullMatch) {
    const [, user, host, portStr] = fullMatch;
    const port = portStr ? parseInt(portStr, 10) : DEFAULT_PORT;

    if (!user || !host || isNaN(port) || port < 1 || port > 65535) {
      return null;
    }

    return { user, host, port };
  }

  // Shorthand: no @, no :, no dots → managed domain subdomain
  // e.g. "myproject-alice" → "ssh-myproject-alice.envhaven.app"
  if (!input.includes("@") && !input.includes(":") && !input.includes(".")) {
    // Must be a valid subdomain pattern (alphanumeric + hyphens)
    if (/^[a-zA-Z0-9-]+$/.test(input) && input.length > 0) {
      const host = `ssh-${input}.envhaven.app`;
      return { user: DEFAULT_USER, host, port: DEFAULT_PORT };
    }
  }

  const hostOnlyMatch = input.match(/^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/);
  if (hostOnlyMatch) {
    return { user: DEFAULT_USER, host: input, port: DEFAULT_PORT };
  }

  return null;
}
