const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL = 50;

export interface Spinner {
  start: () => void;
  stop: () => void;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  update: (text: string) => void;
}

export function createSpinner(text: string): Spinner {
  let frameIndex = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let currentText = text;

  const isTTY = process.stdout.isTTY;

  const render = () => {
    if (!isTTY) return;
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    process.stdout.write(`\r${frame} ${currentText}`);
    frameIndex++;
  };

  const clearLine = () => {
    if (!isTTY) return;
    process.stdout.write("\r\x1b[K");
  };

  return {
    start() {
      if (!isTTY) {
        console.log(`  ${currentText}...`);
        return;
      }
      render();
      intervalId = setInterval(render, SPINNER_INTERVAL);
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      clearLine();
    },

    succeed(finalText?: string) {
      this.stop();
      console.log(`✓ ${finalText ?? currentText}`);
    },

    fail(finalText?: string) {
      this.stop();
      console.log(`✗ ${finalText ?? currentText}`);
    },

    update(newText: string) {
      currentText = newText;
      if (!isTTY) {
        console.log(`  ${currentText}...`);
      }
    },
  };
}

export function success(text: string): void {
  console.log(`✓ ${text}`);
}

export function error(text: string): void {
  console.error(`✗ ${text}`);
}

export function warn(text: string): void {
  console.log(`⚠ ${text}`);
}

export function info(text: string): void {
  console.log(`  ${text}`);
}

export function blank(): void {
  console.log();
}

export function bullet(text: string): void {
  console.log(`  • ${text}`);
}

export function connected(host: string): void {
  console.log(`● ${host}`);
}

export function disconnected(): void {
  console.log(`○ Not connected`);
}
