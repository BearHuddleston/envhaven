export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === "0") {
    return 0;
  }

  // Regex for: 30m, 1h, 2h30m, 1h30m, 30s
  const regex = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
  const match = trimmed.match(regex);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);

  if (hours === 0 && minutes === 0 && seconds === 0 && !/^0[hms]$/.test(trimmed)) {
    return null;
  }

  return (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}

export function formatDuration(ms: number): string {
  if (ms === 0) {
    return "0";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes}m`);
  }
  if (remainingSeconds > 0 && hours === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join("") || "0s";
}

export function formatDurationVerbose(ms: number): string {
  if (ms === 0) {
    return "disabled";
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`);
  }
  if (remainingSeconds > 0 && hours === 0 && minutes < 5) {
    parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`);
  }

  return parts.join(" ") || "0 seconds";
}

export function getElapsed(startTime: number): number {
  return Date.now() - startTime;
}

export function formatElapsed(startTime: number): string {
  return formatDuration(getElapsed(startTime));
}
