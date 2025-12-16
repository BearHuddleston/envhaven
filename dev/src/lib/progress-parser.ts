import type { ProgressState } from '../state/atoms';

export function parseDockerBuildProgress(line: string): ProgressState | null {
  const bracketMatch = line.match(/\[(\d+)\/(\d+)\]/);
  if (bracketMatch) {
    const step = parseInt(bracketMatch[1], 10);
    const total = parseInt(bracketMatch[2], 10);
    return { step, total, percent: Math.round((step / total) * 100) };
  }

  const stepMatch = line.match(/Step (\d+)\/(\d+)/i);
  if (stepMatch) {
    const step = parseInt(stepMatch[1], 10);
    const total = parseInt(stepMatch[2], 10);
    return { step, total, percent: Math.round((step / total) * 100) };
  }

  return null;
}
