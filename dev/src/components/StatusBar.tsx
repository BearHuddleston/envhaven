import React, { memo } from 'react';
import { Box, Text, Spacer } from 'ink';
import { useAtomValue } from 'jotai';
import {
  isRunningAtom,
  isSubmenuAtom,
  isSettingsAtom,
  isHelpAtom,
  terminalWidthAtom,
  THEME,
} from '../state/atoms';

export const StatusBar = memo(function StatusBar(): React.ReactElement {
  const isRunning = useAtomValue(isRunningAtom);
  const activeSubmenu = useAtomValue(isSubmenuAtom);
  const isSettings = useAtomValue(isSettingsAtom);
  const isHelp = useAtomValue(isHelpAtom);
  const width = useAtomValue(terminalWidthAtom);

  const showBack = activeSubmenu !== null || isSettings;
  const showCancel = isRunning;

  return (
    <Box
      flexDirection="column"
      width={width}
      paddingX={1}
      paddingY={1}
      height={3}
      flexShrink={0}
      backgroundColor={THEME.footerBg}
    >
      <Box paddingX={1}>
        <Text dimColor>↑↓ select</Text>
        <Text dimColor> · </Text>
        <Text dimColor>⏎ run</Text>
        <Text dimColor> · </Text>
        {showBack ? <Text dimColor>esc back</Text> : <Text dimColor>? help</Text>}

        <Spacer />

        {showCancel && (
          <>
            <Text dimColor>esc cancel</Text>
            <Text dimColor> · </Text>
          </>
        )}
        {isHelp ? <Text dimColor>esc close</Text> : <Text dimColor>q quit</Text>}
      </Box>
    </Box>
  );
});
