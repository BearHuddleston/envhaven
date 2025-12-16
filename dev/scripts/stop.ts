#!/usr/bin/env bun
import { loadConfig, log, getContainerStatus, removeContainer } from './lib';

const config = loadConfig();

const status = await getContainerStatus(config.containerName);

if (status === 'not_found') {
  log.info(`Container '${config.containerName}' not found`);
  process.exit(0);
}

log.info(`Stopping ${config.containerName}...`);
const removed = await removeContainer(config.containerName);

if (removed) {
  log.success(`Container '${config.containerName}' removed`);
  process.exit(0);
} else {
  log.error(`Failed to remove container '${config.containerName}'`);
  process.exit(1);
}
