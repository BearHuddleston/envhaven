const ESC = '\x1b';

export const ANSI = {
  enterAlternateScreen: `${ESC}[?1049h`,
  exitAlternateScreen: `${ESC}[?1049l`,
  hideCursor: `${ESC}[?25l`,
  showCursor: `${ESC}[?25h`,
  clearScreen: `${ESC}[2J`,
  moveToTopLeft: `${ESC}[H`,
  enableLineWrap: `${ESC}[?7h`,
  disableMouseEvents: `${ESC}[?1000l${ESC}[?1002l${ESC}[?1003l`,
};

export function enterFullscreen(): void {
  const stdout = process.stdout;
  if (!stdout.isTTY) return;

  stdout.write(ANSI.enterAlternateScreen);
  stdout.write(ANSI.hideCursor);
  stdout.write(ANSI.clearScreen);
  stdout.write(ANSI.moveToTopLeft);
  stdout.write(ANSI.disableMouseEvents);
}

export function exitFullscreen(): void {
  const stdout = process.stdout;
  if (!stdout.isTTY) return;

  stdout.write(ANSI.showCursor);
  stdout.write(ANSI.enableLineWrap);
  stdout.write(ANSI.exitAlternateScreen);
}

export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

export function setupCleanupHandlers(cleanup: () => void): void {
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  process.on('uncaughtException', (err) => {
    cleanup();
    console.error('Uncaught exception:', err);
    process.exit(1);
  });
}
