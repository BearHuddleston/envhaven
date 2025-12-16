import { describe, it, expect } from "bun:test";
import { homedir } from "os";
import {
  expandPath,
  contractPath,
  canonicalPath,
  getRelativePath,
  mapLocalToRemote,
  findUpward,
} from "../../src/utils/paths";

describe("expandPath", () => {
  it("expands ~ to home directory", () => {
    expect(expandPath("~")).toBe(homedir());
    expect(expandPath("~/foo")).toBe(`${homedir()}/foo`);
    expect(expandPath("~/foo/bar")).toBe(`${homedir()}/foo/bar`);
  });

  it("returns absolute paths unchanged", () => {
    expect(expandPath("/foo/bar")).toBe("/foo/bar");
  });

  it("resolves relative paths", () => {
    const result = expandPath("./foo");
    expect(result.startsWith("/")).toBe(true);
    expect(result.endsWith("/foo")).toBe(true);
  });
});

describe("contractPath", () => {
  it("contracts home directory to ~", () => {
    expect(contractPath(homedir())).toBe("~");
    expect(contractPath(`${homedir()}/foo`)).toBe("~/foo");
  });

  it("returns non-home paths unchanged", () => {
    expect(contractPath("/foo/bar")).toBe("/foo/bar");
  });
});

describe("canonicalPath", () => {
  it("expands and resolves paths", () => {
    expect(canonicalPath("~")).toBe(homedir());
    expect(canonicalPath("~/foo/../bar")).toBe(`${homedir()}/bar`);
  });
});

describe("getRelativePath", () => {
  it("returns . for same path", () => {
    expect(getRelativePath("/foo/bar", "/foo/bar")).toBe(".");
  });

  it("returns relative path for child", () => {
    expect(getRelativePath("/foo/bar", "/foo/bar/baz")).toBe("baz");
    expect(getRelativePath("/foo/bar", "/foo/bar/baz/qux")).toBe("baz/qux");
  });

  it("returns absolute path for non-child", () => {
    expect(getRelativePath("/foo/bar", "/other/path")).toBe("/other/path");
  });
});

describe("mapLocalToRemote", () => {
  it("maps project root correctly", () => {
    expect(mapLocalToRemote("/local/project", "/remote/project", "/local/project")).toBe("/remote/project");
  });

  it("maps child paths correctly", () => {
    expect(mapLocalToRemote("/local/project", "/remote/project", "/local/project/src")).toBe("/remote/project/src");
    expect(mapLocalToRemote("/local/project", "/remote/project", "/local/project/src/foo.ts")).toBe("/remote/project/src/foo.ts");
  });
});

describe("findUpward", () => {
  it("finds matching parent directory", () => {
    const result = findUpward("/foo/bar/baz", (dir) => dir === "/foo");
    expect(result).toBe("/foo");
  });

  it("returns null when no match", () => {
    const result = findUpward("/foo/bar", () => false);
    expect(result).toBeNull();
  });

  it("returns start path if it matches", () => {
    const result = findUpward("/foo/bar", (dir) => dir === "/foo/bar");
    expect(result).toBe("/foo/bar");
  });
});
