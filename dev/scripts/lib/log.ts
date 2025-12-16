const isTTY = process.stdout.isTTY ?? false;

const colors = {
  reset: isTTY ? '\x1b[0m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  red: isTTY ? '\x1b[31m' : '',
  green: isTTY ? '\x1b[32m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
};

export const log = {
  info: (msg: string) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}!${colors.reset} ${msg}`),
  dim: (msg: string) => console.log(`${colors.dim}${msg}${colors.reset}`),
  command: (msg: string) => console.log(`${colors.dim}$ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}`),
  plain: (msg: string) => console.log(msg),
  newline: () => console.log(''),
};

export function formatTestSummary(passed: number, failed: number): void {
  log.newline();
  log.header('Test Summary');
  log.plain(`Passed: ${colors.green}${passed}${colors.reset}`);
  log.plain(`Failed: ${colors.red}${failed}${colors.reset}`);
  log.newline();
  
  if (failed === 0) {
    log.success('All tests passed!');
  } else {
    log.error(`${failed} test(s) failed`);
  }
}
