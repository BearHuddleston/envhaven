import React, { memo } from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
  percent: number;
  width?: number;
}

export const ProgressBar = memo(function ProgressBar({ percent, width = 30 }: ProgressBarProps): React.ReactElement {
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clampedPercent / 100) * width);
  const empty = width - filled;

  return (
    <Box>
      <Text>
        <Text>{'█'.repeat(filled)}</Text>
        <Text dimColor>{'░'.repeat(empty)}</Text>
      </Text>
      <Text dimColor> {Math.round(clampedPercent)}%</Text>
    </Box>
  );
});
