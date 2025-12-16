import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { useAtomValue } from 'jotai';
import { configAtom, settingsIndexAtom, THEME, SETTINGS_FIELDS } from '../state/atoms';
import { REPO_ROOT } from '../lib/config';

const SETTINGS_WIDTH = 44;

export const SettingsEditor = memo(function SettingsEditor() {
  const config = useAtomValue(configAtom);
  const selectedIndex = useAtomValue(settingsIndexAtom);

  if (!config) {
    return (
      <Box paddingX={2} paddingY={1} backgroundColor={THEME.outputBg}>
        <Text dimColor>Loading configuration...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1} backgroundColor={THEME.outputBg}>
      <Box marginBottom={1}>
        <Text bold>Settings</Text>
        <Text dimColor> (read-only)</Text>
      </Box>
      <Box height={1} />

      {SETTINGS_FIELDS.map((field, index) => {
        const isSelected = index === selectedIndex;
        const rawValue = config[field.key];
        const value = rawValue !== undefined ? String(rawValue) : '';
        const displayValue = field.mask ? '••••' : value;

        const prefix = '  ';
        const label = field.label.padEnd(14);
        const padding = Math.max(0, SETTINGS_WIDTH - prefix.length - label.length - displayValue.length);
        const fullText = `${prefix}${label}${displayValue}${' '.repeat(padding)}`;

        if (isSelected) {
          return (
            <Box key={field.key} width={SETTINGS_WIDTH}>
              <Text backgroundColor={THEME.selectionBg} color={THEME.selectionFg}>
                {fullText}
              </Text>
            </Box>
          );
        }

        return (
          <Box key={field.key}>
            <Text>
              {prefix}
              {label}
              <Text dimColor>{displayValue}</Text>
            </Text>
          </Box>
        );
      })}

      <Box marginTop={2} flexDirection="column">
        <Text dimColor>Config: dev/.env.dev</Text>
        <Text dimColor>Root: {REPO_ROOT}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>↑↓ select · esc back</Text>
      </Box>
    </Box>
  );
});
