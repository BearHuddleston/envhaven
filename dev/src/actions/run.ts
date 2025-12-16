import { spawn } from 'bun';
import { join } from 'path';
import type { Config } from '../lib/config';
import { DEV_ROOT } from '../lib/config';
import { readProcessStreams, raceWithAbort } from '../lib/stream';

type AddLog = (type: 'info' | 'success' | 'error' | 'warn' | 'command' | 'dim', text: string) => void;

export async function runContainer(
  config: Config,
  addLog: AddLog,
  refreshStatus: () => Promise<void>,
  options: { fresh?: boolean; mountExt?: boolean } = {}
): Promise<void> {
  const scriptPath = join(DEV_ROOT, 'scripts/start.ts');
  const args = [scriptPath];
  if (options.fresh) args.push('--fresh');
  if (options.mountExt) args.push('--mount-ext');

  addLog('command', `bun ${args.join(' ')}`);

  const proc = spawn(['bun', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  await raceWithAbort(
    readProcessStreams(proc.stdout, proc.stderr, (line) => {
      if (line.startsWith('✓')) addLog('success', line.slice(2));
      else if (line.startsWith('✗')) addLog('error', line.slice(2));
      else if (line.startsWith('→')) addLog('info', line.slice(2));
      else if (line.startsWith('!')) addLog('warn', line.slice(2));
      else if (line.startsWith('$')) addLog('command', line.slice(2));
      else addLog('dim', line);
    }),
    undefined,
    () => proc.kill()
  );

  await proc.exited;
  await refreshStatus();
}
