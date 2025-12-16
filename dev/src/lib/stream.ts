type LineHandler = (line: string, isStderr: boolean) => void;

export async function readProcessStreams(
  stdout: ReadableStream<Uint8Array> | null,
  stderr: ReadableStream<Uint8Array> | null,
  onLine: LineHandler,
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  
  const readStream = async (stream: ReadableStream<Uint8Array> | null, isStderr: boolean) => {
    if (!stream) return;
    const reader = stream.getReader();
    let buffer = '';

    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) onLine(trimmed, isStderr);
      }
    }

    if (buffer.trim() && !signal?.aborted) {
      onLine(buffer.trim(), isStderr);
    }
  };

  await Promise.all([
    readStream(stdout, false),
    readStream(stderr, true),
  ]);
}

export function raceWithAbort<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
  onAbort?: () => void
): Promise<T | void> {
  if (!signal) return promise;
  
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => {
        onAbort?.();
        resolve();
      });
    }),
  ]);
}
