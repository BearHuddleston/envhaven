import React, { memo, useState, useEffect, useRef } from 'react';
import { Box, Text, Spacer } from 'ink';
import { useAtomValue } from 'jotai';
import {
  isContainerRunningAtom,
  configAtom,
  isRunningAtom,
  operationAtom,
  terminalWidthAtom,
  containerStaleAtom,
  THEME,
} from '../state/atoms';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const SpinnerIndicator = memo(function SpinnerIndicator() {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 180);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return <Text color="yellow">{SPINNER_FRAMES[frameIndex]}</Text>;
});

const ContainerIndicator = memo(function ContainerIndicator() {
  const isRunning = useAtomValue(isContainerRunningAtom);
  return (
    <Text color={isRunning ? 'green' : undefined} dimColor={!isRunning}>
      {isRunning ? '●' : '○'}
    </Text>
  );
});

const HeaderStatus = memo(function HeaderStatus() {
  const isOperationRunning = useAtomValue(isRunningAtom);
  return isOperationRunning ? <SpinnerIndicator /> : <ContainerIndicator />;
});

const HeaderOperation = memo(function HeaderOperation() {
  const operation = useAtomValue(operationAtom);
  if (!operation) return null;
  return (
    <>
      <Text dimColor> · </Text>
      <Text color="yellow">{operation}</Text>
    </>
  );
});

const HeaderContainerName = memo(function HeaderContainerName() {
  const config = useAtomValue(configAtom);
  const isStale = useAtomValue(containerStaleAtom);
  const isRunning = useAtomValue(isContainerRunningAtom);
  
  return (
    <>
      <Text dimColor> {config?.containerName ?? 'envhaven-test'}</Text>
      {isRunning && isStale && <Text color="yellow"> ⟳</Text>}
    </>
  );
});

export const Header = memo(function Header() {
  const width = useAtomValue(terminalWidthAtom);

  return (
    <Box
      flexDirection="column"
      width={width}
      paddingX={1}
      paddingY={1}
      height={3}
      flexShrink={0}
      backgroundColor={THEME.headerBg}
    >
      <Box paddingX={1}>
        <Text bold>eh</Text>
        <HeaderOperation />
        <Spacer />
        <HeaderStatus />
        <HeaderContainerName />
      </Box>
    </Box>
  );
});
