import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { useAtomValue } from 'jotai';
import {
  visibleLinesAtom,
  hasOutputAtom,
  progressAtom,
  isRunningAtom,
  terminalWidthAtom,
  THEME,
  type LogLine,
} from '../state/atoms';
import { ProgressBar } from './ProgressBar';

const LOG_COLORS: Record<LogLine['type'], string | undefined> = {
  info: undefined,
  success: 'green',
  error: 'red',
  warn: 'yellow',
  command: 'cyan',
  dim: undefined,
};

const LOG_PREFIXES: Record<LogLine['type'], string> = {
  info: ' ',
  success: '✓',
  error: '✗',
  warn: '!',
  command: '$',
  dim: ' ',
};

const LogLineComponent = memo(
  function LogLineComponent({ id, type, text }: { id: string; type: LogLine['type']; text: string }) {
    const isDim = type === 'dim';
    return (
      <Box>
        <Text color={LOG_COLORS[type]} dimColor={isDim}>
          <Text dimColor>{LOG_PREFIXES[type]}</Text>
          <Text> {text}</Text>
        </Text>
      </Box>
    );
  },
  (prev, next) => prev.id === next.id
);

const EmptyState = memo(function EmptyState() {
  return (
    <Box flexDirection="column" paddingTop={3} paddingX={1}>
      <Text dimColor>Select an action to begin</Text>
      <Text> </Text>
      <Text dimColor>Use ↑↓ to navigate, ⏎ to run</Text>
      <Text dimColor>or press a shortcut key (s, b, w...)</Text>
    </Box>
  );
});

const ProgressSection = memo(function ProgressSection() {
  const progress = useAtomValue(progressAtom);
  const isRunning = useAtomValue(isRunningAtom);
  const width = useAtomValue(terminalWidthAtom);

  if (!progress || !isRunning) return null;

  return (
    <Box marginBottom={1}>
      <ProgressBar percent={progress.percent} width={Math.min(40, width - 40)} />
    </Box>
  );
});

const LogLines = memo(function LogLines() {
  const visibleLines = useAtomValue(visibleLinesAtom);

  return (
    <>
      {visibleLines.map((line) => (
        <LogLineComponent key={line.id} id={line.id} type={line.type} text={line.text} />
      ))}
    </>
  );
});

const OutputContent = memo(function OutputContent() {
  const hasOutput = useAtomValue(hasOutputAtom);
  const isRunning = useAtomValue(isRunningAtom);

  if (!hasOutput && !isRunning) return <EmptyState />;
  return <LogLines />;
});

export const Output = memo(function Output() {
  return (
    <Box
      flexDirection="column"
      paddingX={2}
      paddingY={1}
      flexGrow={1}
      backgroundColor={THEME.outputBg}
    >
      <ProgressSection />
      <OutputContent />
    </Box>
  );
});
