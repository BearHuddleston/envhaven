import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { useAtomValue } from 'jotai';
import { submenuIndexAtom, THEME, TEST_SUBMENU } from '../state/atoms';

const SUBMENU_WIDTH = 36;

export const TestSubmenu = memo(function TestSubmenu(): React.ReactElement {
  const selectedIndex = useAtomValue(submenuIndexAtom);

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} backgroundColor={THEME.outputBg}>
      <Box marginBottom={1}>
        <Text bold>Select a test:</Text>
      </Box>
      <Box height={1} />

      {TEST_SUBMENU.map((item, index) => {
        const isSelected = index === selectedIndex;
        const prefix = '  ';
        const suffix = `  ${item.shortcut} `;
        const padding = Math.max(0, SUBMENU_WIDTH - prefix.length - item.label.length - suffix.length);
        const fullText = `${prefix}${item.label}${' '.repeat(padding)}${suffix}`;

        if (isSelected) {
          return (
            <Box key={item.key} width={SUBMENU_WIDTH}>
              <Text backgroundColor={THEME.selectionBg} color={THEME.selectionFg}>
                {fullText}
              </Text>
            </Box>
          );
        }

        return (
          <Box key={item.key}>
            <Text>
              {prefix}
              {item.label}
              {' '.repeat(padding)}
              <Text dimColor>{item.shortcut}</Text>
              {'  '}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={2}>
        <Text dimColor>↑↓ select · ⏎ run · esc back</Text>
      </Box>
    </Box>
  );
});
