import { spawn } from 'bun';
import { join } from 'path';
import type { Config } from '../lib/config';
import { DEV_ROOT } from '../lib/config';
import type { ProgressState } from '../state/atoms';
import { parseDockerBuildProgress } from '../lib/progress-parser';
import { readProcessStreams, raceWithAbort } from '../lib/stream';

type AddLog = (type: 'info' | 'success' | 'error' | 'warn' | 'command' | 'dim', text: string) => void;
type SetProcess = (proc: { kill: () => void } | null) => void;
type SetProgress = (progress: ProgressState | null) => void;

export async function runBuild(
  config: Config,
  addLog: AddLog,
  setProcess: SetProcess,
  setProgress?: SetProgress,
  noCache: boolean = false,
  signal?: AbortSignal
): Promise<void> {
  const scriptPath = join(DEV_ROOT, 'scripts/build.ts');
  const args = [scriptPath];
  if (noCache) args.push('--no-cache');

  addLog('command', `bun ${args.join(' ')}`);

  const proc = spawn(['bun', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  setProcess({ kill: () => proc.kill() });

  await raceWithAbort(
    readProcessStreams(proc.stdout, proc.stderr, (line, isStderr) => {
      const progress = parseDockerBuildProgress(line);
      if (progress && setProgress) setProgress(progress);
      
      if (line.startsWith('✓')) addLog('success', line.slice(2));
      else if (line.startsWith('✗')) addLog('error', line.slice(2));
      else if (line.startsWith('→')) addLog('info', line.slice(2));
      else if (line.startsWith('$')) addLog('command', line.slice(2));
      else addLog(isStderr ? 'warn' : 'dim', line);
    }, signal),
    signal,
    () => proc.kill()
  );

  const exitCode = await proc.exited;
  if (setProgress) setProgress(null);

  if (exitCode !== 0 && !signal?.aborted) {
    addLog('error', `Build failed with exit code ${exitCode}`);
  }
}
