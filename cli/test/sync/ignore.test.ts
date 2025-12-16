import { describe, it, expect } from "bun:test";
import {
  getDefaultIgnorePatterns,
  buildMutagenIgnoreArgs,
} from "../../src/sync/ignore";

describe("getDefaultIgnorePatterns", () => {
  it("includes common patterns", () => {
    const patterns = getDefaultIgnorePatterns();
    
    expect(patterns).toContain("node_modules/");
    expect(patterns).toContain(".git/");
    expect(patterns).toContain("__pycache__/");
    expect(patterns).toContain(".DS_Store");
    expect(patterns).toContain("*.swp");
  });
});

describe("buildMutagenIgnoreArgs", () => {
  it("builds ignore args", () => {
    const args = buildMutagenIgnoreArgs(["node_modules/", ".git/"]);
    
    expect(args).toContain("--ignore-vcs");
    expect(args).toContain("--ignore");
    expect(args).toContain("node_modules/");
    expect(args).toContain(".git/");
  });

  it("includes --ignore-vcs first", () => {
    const args = buildMutagenIgnoreArgs([]);
    expect(args[0]).toBe("--ignore-vcs");
  });
});
