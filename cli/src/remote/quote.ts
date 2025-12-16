function needsQuoting(arg: string): boolean {
  if (arg.length === 0) return true;
  return /[^a-zA-Z0-9_\-.,/:=@]/.test(arg);
}

export function posixQuote(arg: string): string {
  if (!needsQuoting(arg)) {
    return arg;
  }
  // Single-quote escaping: 'foo'\''bar' → foo'bar
  return `'${arg.replace(/'/g, "'\"'\"'")}'`;
}

export function posixQuoteArgs(args: readonly string[]): string {
  return args.map(posixQuote).join(" ");
}

export function buildRemoteCommand(cwd: string, args: readonly string[]): string {
  const quotedCwd = posixQuote(cwd);
  const quotedArgs = posixQuoteArgs(args);
  return `mkdir -p ${quotedCwd} && cd ${quotedCwd} && ${quotedArgs}`;
}

export function escapeForShellVar(value: string): string {
  return `"${value.replace(/[\\"$`]/g, "\\$&")}"`;
}
