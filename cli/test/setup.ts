import { afterEach } from "bun:test";
import { rmSync, existsSync } from "fs";

const TEST_TEMP_DIR = "/tmp/haven-test";

export function getTestTempDir(): string {
  return TEST_TEMP_DIR;
}

afterEach(() => {
  if (existsSync(TEST_TEMP_DIR)) {
    rmSync(TEST_TEMP_DIR, { recursive: true, force: true });
  }
});
