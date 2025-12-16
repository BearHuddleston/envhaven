#!/usr/bin/env bun

import { $ } from "bun";

const TARGETS = [
  { target: "bun-darwin-arm64", output: "haven-darwin-arm64" },
  { target: "bun-darwin-x64", output: "haven-darwin-x64" },
  { target: "bun-linux-x64", output: "haven-linux-x64" },
  { target: "bun-linux-arm64", output: "haven-linux-arm64" },
] as const;

async function build(): Promise<void> {
  const { mkdirSync, existsSync } = await import("fs");
  const distDir = "./dist";

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  console.log("Building Haven CLI...\n");

  const currentTarget = TARGETS.find((t) => {
    const platform = process.platform === "darwin" ? "darwin" : "linux";
    const arch = process.arch === "arm64" ? "arm64" : "x64";
    return t.target.includes(platform) && t.target.includes(arch);
  });

  if (process.argv.includes("--all")) {
    for (const { target, output } of TARGETS) {
      console.log(`Building ${output}...`);
      
      await $`bun build ./src/index.ts --compile --target=${target} --outfile=${distDir}/${output}`.quiet();
      
      console.log(`  ✓ ${output}`);
    }
  } else if (currentTarget) {
    console.log(`Building for current platform (${currentTarget.output})...`);
    
    await $`bun build ./src/index.ts --compile --outfile=${distDir}/haven`.quiet();
    
    console.log(`  ✓ dist/haven`);
  } else {
    console.log("Building development version...");
    
    await $`bun build ./src/index.ts --compile --outfile=${distDir}/haven`.quiet();
    
    console.log(`  ✓ dist/haven`);
  }

  console.log("\nBuild complete!");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
