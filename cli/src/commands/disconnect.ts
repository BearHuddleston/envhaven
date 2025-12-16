import { findConnection, loadSession, deleteSession } from "../config/store";
import { closeControlMaster } from "../ssh/config";
import { stopSync, flushSync } from "../sync/mutagen";
import { formatDuration } from "../utils/duration";
import { createSpinner, success, info, error, blank } from "../utils/spinner";
import { canonicalPath } from "../utils/paths";

export async function disconnect(pathArg?: string): Promise<void> {
  let localPath: string;

  if (pathArg) {
    localPath = canonicalPath(pathArg);
  } else {
    const found = findConnection(process.cwd());
    if (!found) {
      error("Not connected to any workspace.");
      info("Run 'haven connect <path>' to connect first.");
      process.exit(1);
    }
    localPath = found.localPath;
  }

  const found = findConnection(localPath);
  if (!found) {
    error("No connection found for this directory.");
    process.exit(1);
  }

  const { config } = found;
  const session = loadSession(localPath);

  const flushSpinner = createSpinner("Flushing pending changes...");
  flushSpinner.start();

  try {
    await flushSync(localPath);
    flushSpinner.succeed("Changes flushed");
  } catch {
    flushSpinner.fail("Flush failed (continuing anyway)");
  }

  const stopSpinner = createSpinner("Stopping sync...");
  stopSpinner.start();

  try {
    await stopSync(localPath);
    stopSpinner.succeed("Sync stopped");
  } catch {
    stopSpinner.fail("Stop sync failed (continuing anyway)");
  }

  if (config.sshAlias) {
    closeControlMaster(config.sshAlias);
  }

  deleteSession(localPath);

  blank();
  success("Disconnected");

  if (session?.startTime) {
    const duration = Date.now() - session.startTime;
    info(`Session: ${formatDuration(duration)}`);
  }
}
