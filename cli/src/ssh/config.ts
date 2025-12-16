import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { getSshDir } from "../utils/paths";
import { getAllKeyPaths } from "./keys";

const HAVEN_CONFIG_FILE = "config.d/haven.conf";

export function getHavenConfigPath(): string {
  return `${getSshDir()}/${HAVEN_CONFIG_FILE}`;
}

function ensureConfigDDir(): void {
  const configD = `${getSshDir()}/config.d`;
  if (!existsSync(configD)) {
    mkdirSync(configD, { recursive: true, mode: 0o700 });
  }
}

export function generateHostConfig(alias: string, host: string, port: number, user: string): string {
  const keyPaths = getAllKeyPaths();
  const identityLines = keyPaths.map(p => `  IdentityFile ${p}`).join("\n");
  const identitySection = identityLines ? `${identityLines}\n` : "";

  return `Host ${alias}
  HostName ${host}
  Port ${port}
  User ${user}
${identitySection}  ForwardAgent no
  ForwardX11 no
  StrictHostKeyChecking accept-new
  ServerAliveInterval 5
  ServerAliveCountMax 3
`;
}

export function writeHostConfig(alias: string, host: string, port: number, user: string): void {
  ensureConfigDDir();

  const configPath = getHavenConfigPath();
  const newConfig = generateHostConfig(alias, host, port, user);

  let existingContent = "";
  if (existsSync(configPath)) {
    existingContent = readFileSync(configPath, "utf-8");
  }

  const hostPattern = new RegExp(`^Host ${alias}\\n[\\s\\S]*?(?=^Host |$)`, "gm");
  const updatedContent = existingContent.replace(hostPattern, "");

  const finalContent = (updatedContent.trim() + "\n\n" + newConfig).trim() + "\n";
  writeFileSync(configPath, finalContent, { mode: 0o600 });
}

export function removeHostConfig(alias: string): void {
  const configPath = getHavenConfigPath();
  if (!existsSync(configPath)) {
    return;
  }

  const existingContent = readFileSync(configPath, "utf-8");
  const hostPattern = new RegExp(`^Host ${alias}\\n[\\s\\S]*?(?=^Host |$)`, "gm");
  const updatedContent = existingContent.replace(hostPattern, "").trim();

  if (updatedContent) {
    writeFileSync(configPath, updatedContent + "\n", { mode: 0o600 });
  } else {
    unlinkSync(configPath);
  }
}

export function hasIncludeDirective(): boolean {
  const mainConfig = `${getSshDir()}/config`;
  if (!existsSync(mainConfig)) {
    return false;
  }

  const content = readFileSync(mainConfig, "utf-8");
  return /^\s*Include\s+.*config\.d\/\*/.test(content) || 
         /^\s*Include\s+~\/\.ssh\/config\.d\/\*/.test(content);
}

export function getIncludeDirective(): string {
  return "Include ~/.ssh/config.d/*";
}

export async function removeHostKey(host: string, port: number): Promise<void> {
  const knownHostsPath = `${getSshDir()}/known_hosts`;
  if (!existsSync(knownHostsPath)) {
    return;
  }

  const hostEntry = port === 22 ? host : `[${host}]:${port}`;

  const proc = Bun.spawn([
    "ssh-keygen",
    "-R", hostEntry,
    "-f", knownHostsPath,
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  await proc.exited;
}

export async function testConnection(alias: string): Promise<{ success: boolean; error?: string }> {
  const proc = Bun.spawn([
    "ssh",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=10",
    alias,
    "echo", "ok",
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;

  if (exitCode === 0) {
    return { success: true };
  }

  const stderr = await new Response(proc.stderr).text();
  return { success: false, error: stderr.trim() };
}

export async function getRemoteEnv(alias: string, varName: string): Promise<string | null> {
  const proc = Bun.spawn([
    "ssh",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=10",
    alias,
    "printenv", varName,
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;

  if (exitCode === 0) {
    const stdout = await new Response(proc.stdout).text();
    return stdout.trim() || null;
  }

  return null;
}

export function closeControlMaster(alias: string): void {
  Bun.spawn([
    "ssh",
    "-O", "exit",
    alias,
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });
}
