import { spawn } from 'bun';
import { join } from 'path';
import type { Config } from '../lib/config';
import { DEV_ROOT } from '../lib/config';
import { readProcessStreams, raceWithAbort } from '../lib/stream';

type AddLog = (type: 'info' | 'success' | 'error' | 'warn' | 'command' | 'dim', text: string) => void;
type SetProcess = (proc: { kill: () => void } | null) => void;

export async function runLogs(
  config: Config,
  addLog: AddLog,
  setProcess: SetProcess,
  signal?: AbortSignal
): Promise<void> {
  const scriptPath = join(DEV_ROOT, 'scripts/logs.ts');

  addLog('info', `Streaming logs from ${config.containerName}...`);
  addLog('dim', 'Press Escape to stop');

  const proc = spawn(['bun', scriptPath], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  setProcess({ kill: () => proc.kill() });

  await raceWithAbort(
    readProcessStreams(proc.stdout, proc.stderr, (line, isStderr) => {
      if (line.startsWith('✓')) addLog('success', line.slice(2));
      else if (line.startsWith('✗')) addLog('error', line.slice(2));
      else if (line.startsWith('→')) addLog('info', line.slice(2));
      else if (line.startsWith('!')) addLog('warn', line.slice(2));
      else {
        const type = isStderr || line.toLowerCase().includes('error') ? 'warn' : 'dim';
        addLog(type, line);
      }
    }, signal),
    signal,
    () => proc.kill()
  );
}
