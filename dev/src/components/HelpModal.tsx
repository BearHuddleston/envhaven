import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { MENU_ITEMS, THEME } from '../state/atoms';

interface HelpModalProps {
  width: number;
  height: number;
}

export const HelpModal = memo(function HelpModal({ width, height }: HelpModalProps): React.ReactElement {
  const modalWidth = Math.min(56, width - 4);

  const left = Math.floor((width - modalWidth) / 2);
  const top = Math.floor((height - 16) / 2);

  return (
    <Box
      position="absolute"
      marginLeft={left}
      marginTop={top}
      width={modalWidth}
      flexDirection="column"
      borderStyle="round"
      borderColor={THEME.divider}
      backgroundColor={THEME.menuBg}
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold>Keyboard Shortcuts</Text>
      </Box>

      {MENU_ITEMS.map((item) => (
        <Box key={item.key}>
          <Text bold color="cyan">
            {item.shortcut}
          </Text>
          <Text>{'  '}</Text>
          <Text>{item.label.padEnd(20)}</Text>
          <Text dimColor>{item.hint}</Text>
        </Box>
      ))}

      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(modalWidth - 6)}</Text>
      </Box>

      <Box justifyContent="space-between">
        <Text dimColor>↑↓ navigate · ⏎ select · q quit</Text>
        <Text dimColor>esc close</Text>
      </Box>
    </Box>
  );
});
