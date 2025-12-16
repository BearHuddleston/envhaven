import { homedir } from "os";
import { resolve, dirname, basename } from "path";
import { existsSync, statSync } from "fs";

export function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return resolve(homedir(), path.slice(2));
  }
  if (path === "~") {
    return homedir();
  }
  return resolve(path);
}

export function contractPath(path: string): string {
  const home = homedir();
  if (path === home) {
    return "~";
  }
  if (path.startsWith(home + "/")) {
    return "~" + path.slice(home.length);
  }
  return path;
}

export function canonicalPath(path: string): string {
  return resolve(expandPath(path));
}

export function isDirectory(path: string): boolean {
  try {
    return statSync(expandPath(path)).isDirectory();
  } catch {
    return false;
  }
}

export function pathExists(path: string): boolean {
  return existsSync(expandPath(path));
}

export function parentDir(path: string): string {
  return dirname(expandPath(path));
}

export function baseName(path: string): string {
  return basename(expandPath(path));
}

export function findUpward(
  startPath: string,
  predicate: (dir: string) => boolean
): string | null {
  let current = canonicalPath(startPath);
  const root = resolve("/");

  while (current !== root) {
    if (predicate(current)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  if (predicate(root)) {
    return root;
  }

  return null;
}

export function getDataDir(): string {
  const xdgData = process.env["XDG_DATA_HOME"];
  if (xdgData) {
    return resolve(xdgData, "haven");
  }
  return expandPath("~/.local/share/haven");
}

export function getConfigDir(): string {
  const xdgConfig = process.env["XDG_CONFIG_HOME"];
  if (xdgConfig) {
    return resolve(xdgConfig, "haven");
  }
  return expandPath("~/.config/haven");
}

export function getSshDir(): string {
  return expandPath("~/.ssh");
}

export function getRelativePath(projectRoot: string, localPath: string): string {
  const absRoot = canonicalPath(projectRoot);
  const absPath = canonicalPath(localPath);

  if (absPath === absRoot) {
    return ".";
  }

  if (absPath.startsWith(absRoot + "/")) {
    return absPath.slice(absRoot.length + 1);
  }

  return absPath;
}

export function mapLocalToRemote(
  localProjectRoot: string,
  remoteProjectRoot: string,
  localPath: string
): string {
  const relativePath = getRelativePath(localProjectRoot, localPath);
  if (relativePath === ".") {
    return remoteProjectRoot;
  }
  return resolve(remoteProjectRoot, relativePath);
}
