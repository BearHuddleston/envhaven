import { buildRemoteCommand } from "./quote";
import type { ConnectionConfig } from "../config/store";
import { mapLocalToRemote, canonicalPath } from "../utils/paths";

export interface ExecOptions {
  cwd?: string;
  inheritStdio?: boolean;
}

export async function runRemote(
  sshAlias: string,
  config: ConnectionConfig,
  localProjectRoot: string,
  args: readonly string[],
  options: ExecOptions = {}
): Promise<number> {
  const localCwd = options.cwd ? canonicalPath(options.cwd) : process.cwd();
  const remoteCwd = mapLocalToRemote(localProjectRoot, config.remotePath, localCwd);

  const remoteCommand = buildRemoteCommand(remoteCwd, args);

  // Allocate a pseudo-terminal if we're in an interactive session
  // This is required for interactive programs like opencode, vim, htop, etc.
  const isInteractive =
    options.inheritStdio !== false &&
    process.stdin.isTTY &&
    process.stdout.isTTY;

  const sshArgs = isInteractive
    ? ["-t", sshAlias, remoteCommand]
    : [sshAlias, remoteCommand];

  const proc = Bun.spawn(["ssh", ...sshArgs], {
    stdin: options.inheritStdio !== false ? "inherit" : "pipe",
    stdout: options.inheritStdio !== false ? "inherit" : "pipe",
    stderr: options.inheritStdio !== false ? "inherit" : "pipe",
  });

  return await proc.exited;
}

export async function runRemoteQuiet(
  sshAlias: string,
  config: ConnectionConfig,
  localProjectRoot: string,
  args: readonly string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const remoteCwd = config.remotePath;
  const remoteCommand = buildRemoteCommand(remoteCwd, args);

  const proc = Bun.spawn(["ssh", sshAlias, remoteCommand], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
}
