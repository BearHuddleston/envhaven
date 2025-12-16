import { spawn } from 'bun';
import { join } from 'path';
import type { Config } from '../lib/config';
import { DEV_ROOT } from '../lib/config';
import { readProcessStreams, raceWithAbort } from '../lib/stream';

type AddLog = (type: 'info' | 'success' | 'error' | 'warn' | 'command' | 'dim', text: string) => void;
type SetProcess = (proc: { kill: () => void } | null) => void;

async function runScript(
  scriptName: string,
  args: string[],
  addLog: AddLog,
  setProcess: SetProcess,
  signal?: AbortSignal
): Promise<void> {
  const scriptPath = join(DEV_ROOT, `scripts/${scriptName}`);
  
  const proc = spawn(['bun', scriptPath, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  setProcess({ kill: () => proc.kill() });

  await raceWithAbort(
    readProcessStreams(proc.stdout, proc.stderr, (line) => {
      if (line.startsWith('✓') || line.includes('✓')) addLog('success', line);
      else if (line.startsWith('✗') || line.includes('✗')) addLog('error', line);
      else if (line.startsWith('━━━')) addLog('info', line);
      else if (line.startsWith('→')) addLog('info', line.slice(2));
      else if (line.startsWith('!')) addLog('warn', line.slice(2));
      else addLog('dim', line);
    }, signal),
    signal,
    () => proc.kill()
  );

  const exitCode = await proc.exited;
  if (exitCode === 0) addLog('success', 'Tests passed!');
  else if (!signal?.aborted) addLog('error', `Tests failed (exit code ${exitCode})`);
}

export async function runTestImage(
  config: Config,
  addLog: AddLog,
  setProcess: SetProcess,
  signal?: AbortSignal
): Promise<void> {
  addLog('info', `Testing image: ${config.image}`);
  await runScript('test-image.ts', [], addLog, setProcess, signal);
}

export async function runTestCli(
  config: Config,
  addLog: AddLog,
  setProcess: SetProcess,
  signal?: AbortSignal
): Promise<void> {
  addLog('info', 'Running Haven CLI tests...');
  await runScript('test-cli.ts', ['--ci'], addLog, setProcess, signal);
}

export async function runTestExtension(
  config: Config,
  addLog: AddLog,
  setProcess: SetProcess,
  signal?: AbortSignal
): Promise<void> {
  addLog('info', 'Testing extension build...');
  await runScript('test-extension.ts', [], addLog, setProcess, signal);
}

export async function runTestAiTools(
  config: Config,
  addLog: AddLog,
  setProcess: SetProcess,
  signal?: AbortSignal
): Promise<void> {
  addLog('info', 'Verifying AI coding tools...');
  await runScript('test-ai-tools.ts', [], addLog, setProcess, signal);
}
