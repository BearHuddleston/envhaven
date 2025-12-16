import { describe, it, expect } from "bun:test";
import {
  parseSshString,
  buildSshString,
  generateSshAlias,
} from "../../src/config/store";

describe("parseSshString", () => {
  it("parses user@host", () => {
    const result = parseSshString("abc@myhost.com");
    expect(result).toEqual({ user: "abc", host: "myhost.com", port: 22 });
  });

  it("parses user@host:port", () => {
    const result = parseSshString("abc@myhost.com:2222");
    expect(result).toEqual({ user: "abc", host: "myhost.com", port: 2222 });
  });

  it("parses host-only with defaults", () => {
    const result = parseSshString("myserver.example.com");
    expect(result).toEqual({ user: "abc", host: "myserver.example.com", port: 22 });
  });

  it("expands simple hostname as managed subdomain", () => {
    const result = parseSshString("myhost");
    expect(result).toEqual({ user: "abc", host: "ssh-myhost.envhaven.app", port: 22 });
  });

  it("expands shorthand subdomain to managed domain", () => {
    const result = parseSshString("myproject-alice");
    expect(result).toEqual({ user: "abc", host: "ssh-myproject-alice.envhaven.app", port: 22 });
  });

  it("expands shorthand with trailing hyphen", () => {
    const result = parseSshString("abc-xyz-");
    expect(result).toEqual({ user: "abc", host: "ssh-abc-xyz-.envhaven.app", port: 22 });
  });

  it("does not expand if input contains dots (full hostname)", () => {
    const result = parseSshString("ssh-myproject-alice.envhaven.app");
    expect(result).toEqual({ user: "abc", host: "ssh-myproject-alice.envhaven.app", port: 22 });
  });

  it("does not expand if input contains @ (user@host format)", () => {
    const result = parseSshString("abc@myproject-alice");
    expect(result).toEqual({ user: "abc", host: "myproject-alice", port: 22 });
  });

  it("returns null for invalid input", () => {
    expect(parseSshString("")).toBeNull();
    expect(parseSshString("user@")).toBeNull();
    expect(parseSshString("@host")).toBeNull();
    expect(parseSshString("host with spaces")).toBeNull();
  });

  it("returns null for invalid port", () => {
    expect(parseSshString("user@host:0")).toBeNull();
    expect(parseSshString("user@host:99999")).toBeNull();
    expect(parseSshString("user@host:abc")).toBeNull();
  });
});

describe("buildSshString", () => {
  it("builds user@host for port 22", () => {
    expect(buildSshString({ host: "myhost.com", port: 22, user: "abc", remotePath: "/" }))
      .toBe("abc@myhost.com");
  });

  it("includes port for non-22", () => {
    expect(buildSshString({ host: "myhost.com", port: 2222, user: "abc", remotePath: "/" }))
      .toBe("abc@myhost.com -p 2222");
  });
});

describe("generateSshAlias", () => {
  it("generates consistent aliases", () => {
    const alias1 = generateSshAlias("myhost.com", 2222);
    const alias2 = generateSshAlias("myhost.com", 2222);
    expect(alias1).toBe(alias2);
    expect(alias1.startsWith("haven-")).toBe(true);
  });

  it("generates different aliases for different hosts", () => {
    const alias1 = generateSshAlias("host1.com", 22);
    const alias2 = generateSshAlias("host2.com", 22);
    expect(alias1).not.toBe(alias2);
  });

  it("generates different aliases for different ports", () => {
    const alias1 = generateSshAlias("myhost.com", 22);
    const alias2 = generateSshAlias("myhost.com", 2222);
    expect(alias1).not.toBe(alias2);
  });
});
