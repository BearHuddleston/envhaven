#!/usr/bin/env bun
import { $ } from 'bun';
import { loadConfig, log, formatTestSummary, dockerExec, isContainerRunning } from './lib';

const config = loadConfig();

// AI tools with their verification commands
// These must match the tools installed in the Dockerfile
const AI_TOOLS = [
  { name: 'OpenCode', cmd: 'opencode --version' },
  { name: 'Claude Code', cmd: 'claude --version' },
  { name: 'Aider', cmd: 'aider --version' },
  { name: 'Codex', cmd: 'codex --version' },
  { name: 'Gemini CLI', cmd: 'gemini --version' },
  { name: 'Goose', cmd: 'goose --version' },
  { name: 'Vibe', cmd: 'vibe --version' },
  { name: 'Qwen', cmd: 'qwen --version' },
  { name: 'Kiro CLI', cmd: 'kiro-cli --version' },
  { name: 'Factory Droid', cmd: 'droid --version' },
  { name: 'Amp', cmd: 'amp --version' },
  { name: 'Auggie', cmd: 'auggie --version' },
];

async function runTests() {
  log.header('AI Coding Tools Verification');

  if (!await isContainerRunning(config.containerName)) {
    log.error(`Container '${config.containerName}' not running`);
    log.info('Start it with: bun dev/scripts/start.ts');
    process.exit(1);
  }

  log.info(`Testing container: ${config.containerName}`);
  log.info(`Total tools to verify: ${AI_TOOLS.length}\n`);

  let passed = 0;
  let failed = 0;

  for (const tool of AI_TOOLS) {
    const result = await dockerExec(config.containerName, tool.cmd);
    if (result.success) {
      const version = result.output.split('\n')[0]?.trim() || 'OK';
      log.success(`${tool.name}: ${version}`);
      passed++;
    } else {
      log.error(`${tool.name}: MISSING or broken`);
      failed++;
    }
  }

  formatTestSummary(passed, failed);
  process.exit(failed === 0 ? 0 : 1);
}

await runTests();
