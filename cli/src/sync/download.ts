import { existsSync, mkdirSync, chmodSync, createWriteStream, unlinkSync } from "fs";
import { pipeline } from "stream/promises";
import { getDataDir } from "../utils/paths";

const MUTAGEN_VERSION = "0.17.6";

type Platform = "darwin" | "linux";
type Arch = "amd64" | "arm64";

function getMutagenBinDir(): string {
  return `${getDataDir()}/mutagen/bin`;
}

export function getMutagenPath(): string {
  return `${getMutagenBinDir()}/mutagen`;
}

export function getMutagenAgentPath(): string {
  return `${getMutagenBinDir()}/mutagen-agents.tar.gz`;
}

export function isMutagenInstalled(): boolean {
  return existsSync(getMutagenPath());
}

function detectPlatform(): Platform {
  const platform = process.platform;
  if (platform === "darwin") return "darwin";
  if (platform === "linux") return "linux";
  throw new Error(`Unsupported platform: ${platform}. Haven CLI supports macOS and Linux only.`);
}

function detectArch(): Arch {
  const arch = process.arch;
  if (arch === "arm64") return "arm64";
  if (arch === "x64") return "amd64";
  throw new Error(`Unsupported architecture: ${arch}. Haven CLI supports x64 and arm64 only.`);
}

function getMutagenDownloadUrl(platform: Platform, arch: Arch): string {
  return `https://github.com/mutagen-io/mutagen/releases/download/v${MUTAGEN_VERSION}/mutagen_${platform}_${arch}_v${MUTAGEN_VERSION}.tar.gz`;
}

export async function downloadMutagen(onProgress?: (message: string) => void): Promise<void> {
  const platform = detectPlatform();
  const arch = detectArch();
  const url = getMutagenDownloadUrl(platform, arch);
  const binDir = getMutagenBinDir();

  onProgress?.("Setting up file sync (one-time)...");

  if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download Mutagen: ${response.statusText}`);
  }

  const tempFile = `${binDir}/mutagen.tar.gz`;
  const fileStream = createWriteStream(tempFile);
  
  await pipeline(
    response.body as unknown as NodeJS.ReadableStream,
    fileStream
  );

  onProgress?.("Installing...");

  const proc = Bun.spawn(["tar", "-xzf", tempFile, "-C", binDir], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`Failed to extract Mutagen: ${stderr}`);
  }

  unlinkSync(tempFile);

  const mutagenPath = getMutagenPath();
  if (existsSync(mutagenPath)) {
    chmodSync(mutagenPath, 0o755);
  }

  onProgress?.("File sync ready");
}

export async function ensureMutagenInstalled(onProgress?: (message: string) => void): Promise<string> {
  if (isMutagenInstalled()) {
    return getMutagenPath();
  }

  await downloadMutagen(onProgress);
  return getMutagenPath();
}
