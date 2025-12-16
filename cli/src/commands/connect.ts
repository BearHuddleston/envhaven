import { createInterface } from "readline";
import {
  getConnection,
  saveConnection,
  findConnection,
  saveSession,
  generateSshAlias,
  parseSshString,
  type ConnectionConfig,
} from "../config/store";
import { canonicalPath, contractPath, isDirectory, baseName } from "../utils/paths";
import { ensureKeyExists, getPublicKeys, hasHavenKey, getHavenPublicKey, generateHavenKey } from "../ssh/keys";
import { writeHostConfig, hasIncludeDirective, getIncludeDirective, testConnection, getRemoteEnv, removeHostKey } from "../ssh/config";
import { startSync } from "../sync/mutagen";
import { parseDuration, formatDuration } from "../utils/duration";
import { createSpinner, success, error, info, warn, blank, bullet } from "../utils/spinner";

function getWorkspaceUrl(target: string | undefined): string | undefined {
  if (!target) return undefined;
  
  if (!target.includes('@') && !target.includes('.')) {
    return `https://${target}.envhaven.app`;
  }
  
  if (target.endsWith('.envhaven.app') && target.startsWith('ssh-')) {
    const subdomain = target.replace('ssh-', '').replace('.envhaven.app', '');
    return `https://${subdomain}.envhaven.app`;
  }
  
  return undefined;
}

function formatKeyInstructions(workspaceUrl?: string): string {
  if (workspaceUrl) {
    return `Add key: ${workspaceUrl} → Remote Access`;
  }
  return `Add key in your workspace (open in browser) → Remote Access`;
}

export interface ConnectOptions {
  idleTimeout?: string | undefined;
  resetHostKey?: boolean | undefined;
  target?: string | undefined;
}

async function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const suffix = defaultValue ? ` [${defaultValue}]` : "";

  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

async function ensureSshKeys(workspaceUrl?: string): Promise<void> {
  const result = await ensureKeyExists();

  if (result.generated) {
    const key = result.keys[0]!;
    blank();
    console.log("🔑 No SSH keys found. Generated a new key for Haven.");
    success(`Created ${contractPath(key.privateKeyPath)}`);
    blank();
    console.log("━".repeat(60));
    console.log("");
    console.log("  Copy this public key:");
    console.log("");
    console.log(`  ${key.publicKey}`);
    console.log("");
    console.log("━".repeat(60));
    blank();
    info(formatKeyInstructions(workspaceUrl));
    blank();
    await prompt("Press Enter when ready...");
  }
}

function checkSshConfig(): void {
  if (!hasIncludeDirective()) {
    warn("SSH config may not include Haven configuration.");
    info("Add this line to the TOP of your ~/.ssh/config:");
    blank();
    console.log(`   ${getIncludeDirective()}`);
    blank();
  }
}

function showSshKeyHelp(workspaceUrl?: string): void {
  const havenKey = getHavenPublicKey();
  
  if (havenKey) {
    console.log("━".repeat(60));
    console.log("");
    console.log("  Your Haven public key (copy this):");
    console.log("");
    console.log(`  ${havenKey}`);
    console.log("");
    console.log("━".repeat(60));
    blank();
    info(formatKeyInstructions(workspaceUrl));
    blank();
  } else {
    info("Run 'haven connect' again to generate a Haven key.");
    blank();
  }
}

async function handlePassphraseKeyFlow(workspaceUrl?: string): Promise<{ retry: boolean; key?: import("../ssh/keys").SshKeyInfo }> {
  const existingKeys = getPublicKeys();
  const hasExisting = existingKeys.length > 0;
  
  blank();
  warn("SSH authentication failed. This usually means:");
  console.log("   • Your key isn't authorized on the workspace, OR");
  console.log("   • Your key is passphrase-protected without ssh-agent");
  blank();
  
  console.log("Recommended:");
  console.log("  [1] Generate a Haven key");
  console.log("      One-time setup, no passphrase, works everywhere");
  blank();
  console.log("Advanced:");
  if (hasExisting) {
    console.log("  [2] Use an existing key (if you have a passphrase-less key ready)");
    console.log("  [3] Set up ssh-agent (if your keys require a passphrase)");
  } else {
    console.log("  [2] Set up ssh-agent (if your keys require a passphrase)");
  }
  blank();
  console.log("Not sure? Haven key works for everyone.");
  blank();
  
  const choice = await prompt("Choice", "1");
  
  if (choice === "1") {
    return generateAndShowHavenKey(workspaceUrl);
  }
  
  if (hasExisting && choice === "2") {
    return showExistingKeysFlow(existingKeys, workspaceUrl);
  }
  
  blank();
  info("Add your key to ssh-agent:");
  blank();
  console.log("   eval \"$(ssh-agent -s)\"");
  console.log("   ssh-add");
  blank();
  info("Then run 'haven connect' again.");
  return { retry: false };
}

async function showExistingKeysFlow(keys: string[], workspaceUrl?: string): Promise<{ retry: boolean }> {
  blank();
  console.log("━".repeat(60));
  console.log("");
  console.log("  Your existing public key(s):");
  console.log("");
  for (const key of keys) {
    console.log(`  ${key}`);
    console.log("");
  }
  console.log("━".repeat(60));
  blank();
  info(formatKeyInstructions(workspaceUrl));
  blank();
  await prompt("Press Enter when ready...");
  return { retry: true };
}

async function generateAndShowHavenKey(workspaceUrl?: string): Promise<{ retry: boolean; key: import("../ssh/keys").SshKeyInfo }> {
  blank();
  const spinner = createSpinner("Generating Haven key...");
  spinner.start();
  
  const key = await generateHavenKey();
  spinner.succeed(`Created ${contractPath(key.privateKeyPath)}`);
  
  blank();
  console.log("━".repeat(60));
  console.log("");
  console.log("  Copy this public key:");
  console.log("");
  console.log(`  ${key.publicKey}`);
  console.log("");
  console.log("━".repeat(60));
  blank();
  info(formatKeyInstructions(workspaceUrl));
  blank();
  await prompt("Press Enter when ready...");
  
  return { retry: true, key };
}

function parseConnectionFromTarget(target: string, localPath: string): ConnectionConfig | null {
  const parsed = parseSshString(target);
  if (!parsed) {
    return null;
  }

  const remotePath = `/config/workspace/${baseName(localPath)}`;
  const sshAlias = generateSshAlias(parsed.host, parsed.port);

  return {
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    remotePath,
    sshAlias,
  };
}

async function promptForConnection(localPath: string): Promise<ConnectionConfig> {
  blank();
  console.log("No remote target configured for this directory.");
  blank();

  const sshInput = await prompt("SSH connection (host or user@host[:port])");
  const parsed = parseSshString(sshInput);
  
  if (!parsed) {
    throw new Error("Invalid connection format. Expected: host, user@host, or user@host:port");
  }

  const defaultRemotePath = `/config/workspace/${baseName(localPath)}`;
  const remotePath = await prompt("Remote path", defaultRemotePath);

  const sshAlias = generateSshAlias(parsed.host, parsed.port);

  return {
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    remotePath,
    sshAlias,
  };
}

export async function connect(pathArg: string | undefined, options: ConnectOptions): Promise<void> {
  let localPath: string;
  let config: ConnectionConfig | null = null;

  if (pathArg) {
    localPath = canonicalPath(pathArg);
    
    if (!isDirectory(localPath)) {
      error(`Path does not exist or is not a directory: ${pathArg}`);
      process.exit(1);
    }
    
    config = getConnection(localPath);
  } else {
    const found = findConnection(process.cwd());
    
    if (found) {
      localPath = found.localPath;
      config = found.config;
    } else {
    error("No path specified and no parent directory is connected.");
    info("Usage: haven connect <path>");
    info("       haven connect . <host>");
      process.exit(1);
    }
  }

  const workspaceUrl = getWorkspaceUrl(options.target);
  
  await ensureSshKeys(workspaceUrl);
  checkSshConfig();

  if (options.target) {
    const parsed = parseConnectionFromTarget(options.target, localPath);
  if (!parsed) {
    error("Invalid connection format. Expected: host, user@host, or user@host:port");
    process.exit(1);
  }
    config = parsed;
  }

  if (!config) {
    config = await promptForConnection(localPath);
  }

  const sshAlias = config.sshAlias ?? generateSshAlias(config.host, config.port);
  config.sshAlias = sshAlias;

  if (options.resetHostKey) {
    const spinner = createSpinner("Removing old host key...");
    spinner.start();
    await removeHostKey(config.host, config.port);
    spinner.succeed("Host key removed");
  }

  writeHostConfig(sshAlias, config.host, config.port, config.user);

  const connSpinner = createSpinner("Testing connection...");
  connSpinner.start();

  const connResult = await testConnection(sshAlias);

  if (!connResult.success) {
    connSpinner.fail("Connection failed");
    blank();
    error(`Cannot connect to ${config.host}:${config.port}`);
    blank();
    bullet("Workspace may be stopped");
    bullet("Network/firewall blocking port");
    bullet("SSH key not added to workspace");
    blank();
    info("Check your workspace subdomain at https://envhaven.com/dashboard");
    blank();

    if (connResult.error?.includes("Host key verification failed")) {
      info("Host key may have changed. Try: haven connect --reset-host-key");
      process.exit(1);
    }
    
    if (!hasHavenKey()) {
      const result = await handlePassphraseKeyFlow(workspaceUrl);
      if (result.retry) {
        writeHostConfig(sshAlias, config.host, config.port, config.user);
        const retrySpinner = createSpinner("Retrying connection...");
        retrySpinner.start();
        
        const retryResult = await testConnection(sshAlias);
        if (!retryResult.success) {
          retrySpinner.fail("Connection still failed");
          blank();
          showSshKeyHelp(workspaceUrl);
          process.exit(1);
        }
        retrySpinner.succeed("SSH connection successful");
      } else {
        process.exit(1);
      }
    } else {
      showSshKeyHelp(workspaceUrl);
      blank();
      info("If using passphrase-protected keys, ensure ssh-agent is running:");
      console.log("   eval \"$(ssh-agent -s)\" && ssh-add");
      process.exit(1);
    }
  }

  connSpinner.succeed("SSH connection successful");

  let idleTimeout: number | undefined;
  
  if (options.idleTimeout) {
    idleTimeout = parseDuration(options.idleTimeout) ?? undefined;
  } else {
    const remoteTimeout = await getRemoteEnv(sshAlias, "HAVEN_IDLE_TIMEOUT");
    if (remoteTimeout) {
      idleTimeout = parseDuration(remoteTimeout) ?? undefined;
    }
  }

  const syncSpinner = createSpinner("Starting sync...");
  syncSpinner.start();

  try {
    await startSync(localPath, sshAlias, config, (msg) => syncSpinner.update(msg));
    syncSpinner.succeed("Sync started");
  } catch (err) {
    syncSpinner.fail("Sync failed");
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  config.lastConnected = Date.now();
  saveConnection(localPath, config);

  const sessionState: import("../config/store").SessionState = {
    connected: true,
    startTime: Date.now(),
  };
  if (idleTimeout !== undefined) {
    sessionState.idleTimeout = idleTimeout;
  }
  saveSession(localPath, sessionState);

  blank();
  success(`Connected to ${config.host}:${config.port}`);
  info(`Local:  ${contractPath(localPath)}`);
  info(`Remote: ${config.remotePath}`);
  
  if (idleTimeout !== undefined && idleTimeout > 0) {
    info(`Idle timeout: ${formatDuration(idleTimeout)}`);
  }
  
  blank();
  info("Try: haven opencode");
}
