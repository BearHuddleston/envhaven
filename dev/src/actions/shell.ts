import { spawnSync } from 'bun';
import type { Config } from '../lib/config';
import { isContainerRunning } from '../lib/docker';
import { exitFullscreen } from '../lib/terminal';

type ExitApp = () => void;

export async function runShell(
  config: Config,
  exitApp: ExitApp
): Promise<void> {
  const running = await isContainerRunning(config.containerName);
  
  if (!running) {
    return;
  }

  exitFullscreen();
  exitApp();

  await Bun.sleep(100);

  spawnSync([
    'ssh',
    '-o', 'StrictHostKeyChecking=accept-new',
    '-p', String(config.sshPort),
    `abc@${config.host}`,
  ], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
}
