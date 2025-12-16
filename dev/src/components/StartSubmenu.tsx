import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { useAtomValue } from 'jotai';
import { submenuIndexAtom, containerStatusAtom, THEME, START_SUBMENU } from '../state/atoms';

const SUBMENU_WIDTH = 36;

export const StartSubmenu = memo(function StartSubmenu(): React.ReactElement {
  const selectedIndex = useAtomValue(submenuIndexAtom);
  const containerStatus = useAtomValue(containerStatusAtom);

  const statusText = containerStatus === 'running' 
    ? 'Container is running' 
    : containerStatus === 'stopped' 
      ? 'Container exists (stopped)' 
      : 'No container found';

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} backgroundColor={THEME.outputBg}>
      <Box marginBottom={1}>
        <Text bold>Container: </Text>
        {containerStatus === 'running' && <Text color="green">{statusText}</Text>}
        {containerStatus === 'stopped' && <Text color="yellow">{statusText}</Text>}
        {containerStatus === 'not_found' && <Text dimColor>{statusText}</Text>}
      </Box>
      <Box height={1} />

      {START_SUBMENU.map((item, index) => {
        const isSelected = index === selectedIndex;
        const label = item.key === 'start-normal' && containerStatus === 'running'
          ? 'Restart Container'
          : item.label;
        const prefix = '  ';
        const suffix = `  ${item.shortcut} `;
        const padding = Math.max(0, SUBMENU_WIDTH - prefix.length - label.length - suffix.length);
        const fullText = `${prefix}${label}${' '.repeat(padding)}${suffix}`;

        const noContainer = containerStatus === 'not_found';
        const isDisabled = (item.key === 'start-delete' || item.key === 'start-recreate') && noContainer;

        if (isSelected && !isDisabled) {
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
            <Text dimColor={isDisabled}>
              {prefix}
              {label}
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
