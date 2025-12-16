#!/usr/bin/env bun

const MUTAGEN_VERSION = "0.17.6";

const PLATFORMS = [
  { platform: "darwin", arch: "arm64" },
  { platform: "darwin", arch: "amd64" },
  { platform: "linux", arch: "amd64" },
  { platform: "linux", arch: "arm64" },
] as const;

async function downloadMutagen(platform: string, arch: string): Promise<void> {
  const { mkdirSync, existsSync, createWriteStream } = await import("fs");
  const { pipeline } = await import("stream/promises");

  const assetsDir = "./assets/mutagen";
  
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  const url = `https://github.com/mutagen-io/mutagen/releases/download/v${MUTAGEN_VERSION}/mutagen_${platform}_${arch}_v${MUTAGEN_VERSION}.tar.gz`;
  const outputFile = `${assetsDir}/mutagen-${platform}-${arch}.tar.gz`;

  if (existsSync(outputFile)) {
    console.log(`  ⏭ ${platform}/${arch} already exists`);
    return;
  }

  console.log(`  ⬇ ${platform}/${arch}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const fileStream = createWriteStream(outputFile);
  await pipeline(response.body as unknown as NodeJS.ReadableStream, fileStream);

  console.log(`  ✓ ${platform}/${arch}`);
}

async function main(): Promise<void> {
  console.log(`Downloading Mutagen v${MUTAGEN_VERSION} binaries...\n`);

  for (const { platform, arch } of PLATFORMS) {
    await downloadMutagen(platform, arch);
  }

  console.log("\nDone! Mutagen binaries are in ./assets/mutagen/");
  console.log("Note: These are .tar.gz archives. The CLI extracts them at runtime.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
