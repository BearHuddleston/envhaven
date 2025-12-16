import { describe, it, expect } from "bun:test";
import { parseDuration, formatDuration, formatDurationVerbose } from "../../src/utils/duration";

describe("parseDuration", () => {
  it("parses minutes", () => {
    expect(parseDuration("30m")).toBe(30 * 60 * 1000);
    expect(parseDuration("5m")).toBe(5 * 60 * 1000);
  });

  it("parses hours", () => {
    expect(parseDuration("1h")).toBe(60 * 60 * 1000);
    expect(parseDuration("2h")).toBe(2 * 60 * 60 * 1000);
  });

  it("parses combined hours and minutes", () => {
    expect(parseDuration("2h30m")).toBe((2 * 60 + 30) * 60 * 1000);
    expect(parseDuration("1h15m")).toBe((1 * 60 + 15) * 60 * 1000);
  });

  it("parses seconds", () => {
    expect(parseDuration("30s")).toBe(30 * 1000);
  });

  it("parses 0 as disabled", () => {
    expect(parseDuration("0")).toBe(0);
  });

  it("returns null for invalid input", () => {
    expect(parseDuration("invalid")).toBeNull();
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
  });

  it("handles whitespace", () => {
    expect(parseDuration("  30m  ")).toBe(30 * 60 * 1000);
  });
});

describe("formatDuration", () => {
  it("formats hours", () => {
    expect(formatDuration(60 * 60 * 1000)).toBe("1h");
    expect(formatDuration(2 * 60 * 60 * 1000)).toBe("2h");
  });

  it("formats minutes", () => {
    expect(formatDuration(30 * 60 * 1000)).toBe("30m");
  });

  it("formats combined", () => {
    expect(formatDuration((2 * 60 + 30) * 60 * 1000)).toBe("2h30m");
  });

  it("formats 0", () => {
    expect(formatDuration(0)).toBe("0");
  });

  it("includes seconds for short durations", () => {
    expect(formatDuration(90 * 1000)).toBe("1m30s");
  });
});

describe("formatDurationVerbose", () => {
  it("formats verbosely", () => {
    expect(formatDurationVerbose(60 * 60 * 1000)).toBe("1 hour");
    expect(formatDurationVerbose(2 * 60 * 60 * 1000)).toBe("2 hours");
    expect(formatDurationVerbose((2 * 60 + 34) * 60 * 1000)).toBe("2 hours 34 minutes");
  });

  it("formats 0 as disabled", () => {
    expect(formatDurationVerbose(0)).toBe("disabled");
  });
});
