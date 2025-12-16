#!/usr/bin/env bun
import { $ } from 'bun';
import { loadConfig, log, isContainerRunning } from './lib';

const config = loadConfig();

if (!await isContainerRunning(config.containerName)) {
  log.error(`Container '${config.containerName}' is not running`);
  process.exit(1);
}

log.info('Packaging extension...');

const cmd = `cd /extension && npx --yes @vscode/vsce package --out /extension/envhaven.vsix 2>&1 && /app/code-server/bin/code-server --extensions-dir /config/extensions --install-extension /extension/envhaven.vsix --force 2>&1`;

try {
  await $`docker exec ${config.containerName} bash -c ${cmd}`.quiet();
  log.success('Extension installed');
  process.exit(0);
} catch {
  log.error('Extension install failed');
  process.exit(1);
}
