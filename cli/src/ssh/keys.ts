import { existsSync, readFileSync, mkdirSync, chmodSync } from "fs";
import { getSshDir } from "../utils/paths";

const DEFAULT_KEY_NAMES = [
  "id_ed25519",
  "id_rsa",
  "id_ecdsa",
];

const HAVEN_KEY_NAME = "haven_ed25519";

export interface SshKeyInfo {
  privateKeyPath: string;
  publicKeyPath: string;
  publicKey: string;
}

export function findExistingKeys(sshDirOverride?: string): SshKeyInfo[] {
  const sshDir = sshDirOverride ?? getSshDir();
  const keys: SshKeyInfo[] = [];

  const keyNames = [...DEFAULT_KEY_NAMES, HAVEN_KEY_NAME];

  for (const keyName of keyNames) {
    const privateKeyPath = `${sshDir}/${keyName}`;
    const publicKeyPath = `${privateKeyPath}.pub`;

    if (existsSync(privateKeyPath) && existsSync(publicKeyPath)) {
      try {
        const publicKey = readFileSync(publicKeyPath, "utf-8").trim();
        if (publicKey) {
          keys.push({ privateKeyPath, publicKeyPath, publicKey });
        }
      } catch {
        continue;
      }
    }
  }

  return keys;
}

export function getAllKeyPaths(sshDirOverride?: string): string[] {
  return findExistingKeys(sshDirOverride).map(k => k.privateKeyPath);
}

export function getPublicKeys(sshDirOverride?: string): string[] {
  return findExistingKeys(sshDirOverride).map(k => k.publicKey);
}

export function hasExistingKeys(sshDirOverride?: string): boolean {
  return findExistingKeys(sshDirOverride).length > 0;
}

export function getHavenKeyPath(sshDirOverride?: string): string {
  const sshDir = sshDirOverride ?? getSshDir();
  return `${sshDir}/${HAVEN_KEY_NAME}`;
}

export function hasHavenKey(sshDirOverride?: string): boolean {
  const keyPath = getHavenKeyPath(sshDirOverride);
  return existsSync(keyPath) && existsSync(`${keyPath}.pub`);
}

export function getHavenPublicKey(sshDirOverride?: string): string | null {
  const pubKeyPath = `${getHavenKeyPath(sshDirOverride)}.pub`;
  if (!existsSync(pubKeyPath)) return null;
  try {
    return readFileSync(pubKeyPath, "utf-8").trim();
  } catch {
    return null;
  }
}

export async function generateHavenKey(sshDirOverride?: string): Promise<SshKeyInfo> {
  const sshDir = sshDirOverride ?? getSshDir();
  if (!existsSync(sshDir)) {
    mkdirSync(sshDir, { recursive: true, mode: 0o700 });
  }

  const privateKeyPath = getHavenKeyPath(sshDirOverride);
  const publicKeyPath = `${privateKeyPath}.pub`;

  const proc = Bun.spawn([
    "ssh-keygen",
    "-t", "ed25519",
    "-f", privateKeyPath,
    "-N", "",
    "-C", "haven-cli",
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`ssh-keygen failed: ${stderr}`);
  }

  chmodSync(privateKeyPath, 0o600);
  chmodSync(publicKeyPath, 0o644);

  const publicKey = readFileSync(publicKeyPath, "utf-8").trim();
  return { privateKeyPath, publicKeyPath, publicKey };
}

export async function ensureKeyExists(sshDirOverride?: string): Promise<{ keys: SshKeyInfo[]; generated: boolean }> {
  const existing = findExistingKeys(sshDirOverride);
  if (existing.length > 0) {
    return { keys: existing, generated: false };
  }

  const generated = await generateHavenKey(sshDirOverride);
  return { keys: [generated], generated: true };
}
