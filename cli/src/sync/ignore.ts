import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const DEFAULT_IGNORE_PATTERNS = [
  ".git/",
  "node_modules/",
  ".pnpm-store/",
  "__pycache__/",
  "*.pyc",
  ".pytest_cache/",
  ".mypy_cache/",
  "dist/",
  "build/",
  ".next/",
  ".nuxt/",
  ".output/",
  "target/",
  ".gradle/",
  ".idea/",
  "*.log",
  "*.tmp",
  "*.swp",
  "*.swo",
  ".DS_Store",
  ".haven/",
];

const HAVENIGNORE_FILE = ".havenignore";

export function getDefaultIgnorePatterns(): readonly string[] {
  return DEFAULT_IGNORE_PATTERNS;
}

export function loadProjectIgnorePatterns(projectRoot: string): string[] {
  const ignoreFile = resolve(projectRoot, HAVENIGNORE_FILE);
  
  if (!existsSync(ignoreFile)) {
    return [];
  }

  const content = readFileSync(ignoreFile, "utf-8");
  return parseIgnoreFile(content);
}

function parseIgnoreFile(content: string): string[] {
  return content
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith("#"));
}

export function getAllIgnorePatterns(projectRoot: string): string[] {
  const defaultPatterns = [...DEFAULT_IGNORE_PATTERNS];
  const projectPatterns = loadProjectIgnorePatterns(projectRoot);
  
  const combined = new Set([...defaultPatterns, ...projectPatterns]);
  return Array.from(combined);
}

export function buildMutagenIgnoreArgs(patterns: readonly string[]): string[] {
  const args: string[] = [];
  
  args.push("--ignore-vcs");
  
  for (const pattern of patterns) {
    args.push("--ignore", pattern);
  }
  
  return args;
}
