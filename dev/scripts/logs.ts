#!/usr/bin/env bun
import { spawn } from 'bun';
import { loadConfig, log, isContainerRunning } from './lib';

const config = loadConfig();

const tailArg = process.argv.find(arg => arg.startsWith('--tail='));
const tail = tailArg ? tailArg.split('=')[1] : '50';

if (!await isContainerRunning(config.containerName)) {
  log.warn(`Container '${config.containerName}' is not running`);
  process.exit(1);
}

log.info(`Streaming logs from ${config.containerName}...`);
log.dim('Press Ctrl+C to stop');

const proc = spawn(['docker', 'logs', '-f', '--tail', tail, config.containerName], {
  stdout: 'inherit',
  stderr: 'inherit',
});

process.on('SIGINT', () => {
  proc.kill();
  process.exit(0);
});

const exitCode = await proc.exited;
process.exit(exitCode);
